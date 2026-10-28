import { z } from 'zod'
import { LIMITS } from '../../domain/limits.ts'
import { isHttpsOnHosts, TRACK_HOSTS, type FeaturedTrack } from '../../domain/track.ts'

/**
 * Cliente mínimo da iTunes Search API (pública, sem chave, com CORS aberto).
 * Só se usam metadados, a pré-visualização oficial de ~30 s e a capa; o áudio
 * é analisado em memória para obter os picos e nunca é guardado.
 */
export const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'

/** Barras da forma de onda guardadas por música. */
export const PEAK_COUNT = 120

export interface TrackResult {
  trackId: number
  title: string
  artist: string
  album?: string
  artworkUrl?: string
  previewUrl: string
  trackUrl?: string
  durationMs?: number
}

const resultSchema = z.object({
  kind: z.string().optional(),
  trackId: z.number().int().positive(),
  trackName: z.string().min(1),
  artistName: z.string().min(1),
  collectionName: z.string().optional(),
  artworkUrl100: z.string().optional(),
  previewUrl: z.string().optional(),
  trackViewUrl: z.string().optional(),
  trackTimeMillis: z.number().optional(),
})

const responseSchema = z.object({
  results: z.array(z.unknown()),
})

export type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>

export class TrackError extends Error {
  readonly code: 'search' | 'audio' | 'no-preview'
  constructor(code: TrackError['code'], message: string = code) {
    super(message)
    this.name = 'TrackError'
    this.code = code
  }
}

const clip = (value: string) => value.trim().slice(0, LIMITS.trackText.max)

/** Capa em 300×300 em vez de 100×100 (o servidor da Apple gera o tamanho pedido). */
export function largerArtwork(url: string): string {
  return url.replace(/\/(\d+)x(\d+)bb\./, '/300x300bb.')
}

/** Converte um resultado bruto num TrackResult, ou null se faltarem dados ou os URLs não forem oficiais. */
export function toTrackResult(raw: unknown): TrackResult | null {
  const parsed = resultSchema.safeParse(raw)
  if (!parsed.success) return null
  const r = parsed.data
  if (r.kind !== undefined && r.kind !== 'song') return null
  if (!r.previewUrl || !isHttpsOnHosts(r.previewUrl, TRACK_HOSTS.preview)) return null
  const artwork = r.artworkUrl100 ? largerArtwork(r.artworkUrl100) : undefined
  return {
    trackId: r.trackId,
    title: clip(r.trackName),
    artist: clip(r.artistName),
    album: r.collectionName ? clip(r.collectionName) || undefined : undefined,
    artworkUrl: artwork && isHttpsOnHosts(artwork, TRACK_HOSTS.artwork) ? artwork : undefined,
    previewUrl: r.previewUrl,
    trackUrl: r.trackViewUrl && isHttpsOnHosts(r.trackViewUrl, TRACK_HOSTS.page) ? r.trackViewUrl : undefined,
    durationMs:
      r.trackTimeMillis && Number.isInteger(r.trackTimeMillis) && r.trackTimeMillis > 0 ? r.trackTimeMillis : undefined,
  }
}

/** Pesquisa músicas no catálogo. Lança TrackError('search') se o pedido ou a resposta falharem. */
export async function searchTracks(
  term: string,
  { fetchFn = fetch, signal, limit = 10 }: { fetchFn?: FetchLike; signal?: AbortSignal; limit?: number } = {},
): Promise<TrackResult[]> {
  const params = new URLSearchParams({ term: term.trim(), media: 'music', entity: 'song', limit: String(limit) })
  let body: unknown
  try {
    const response = await fetchFn(`${ITUNES_SEARCH_URL}?${params.toString()}`, { signal })
    if (!response.ok) throw new TrackError('search', `HTTP ${response.status}`)
    body = await response.json()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw error instanceof TrackError ? error : new TrackError('search')
  }
  const parsed = responseSchema.safeParse(body)
  if (!parsed.success) throw new TrackError('search', 'unexpected response')
  const seen = new Set<number>()
  return parsed.data.results.flatMap((raw) => {
    const result = toTrackResult(raw)
    if (!result || seen.has(result.trackId)) return []
    seen.add(result.trackId)
    return [result]
  })
}

/** O que a análise precisa de um AudioBuffer (permite simular nos testes). */
export interface DecodedAudio {
  numberOfChannels: number
  length: number
  getChannelData(channel: number): Float32Array
}

export type DecodeAudio = (data: ArrayBuffer) => Promise<DecodedAudio>

/**
 * Descodifica com um OfflineAudioContext: não abre o dispositivo de áudio nem
 * precisa de um gesto do utilizador.
 */
export const decodeWithWebAudio: DecodeAudio = async (data) => {
  const Offline = globalThis.OfflineAudioContext
  if (!Offline) throw new TrackError('audio', 'Web Audio unavailable')
  const context = new Offline(1, 1, 44100)
  return context.decodeAudioData(data)
}

/**
 * Picos normalizados (0–1): RMS de cada bloco, misturando os canais, divididos
 * pelo maior. RMS dá uma forma mais fiel ao volume percebido do que o máximo.
 */
export function computePeaks(audio: DecodedAudio, bars = PEAK_COUNT): number[] {
  const channels = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i))
  const length = audio.length
  if (channels.length === 0 || length === 0) return Array.from({ length: bars }, () => 0)
  const block = length / bars
  const rms: number[] = []
  for (let bar = 0; bar < bars; bar++) {
    const start = Math.floor(bar * block)
    const end = Math.max(start + 1, Math.floor((bar + 1) * block))
    let sum = 0
    let count = 0
    for (let i = start; i < end && i < length; i++) {
      let sample = 0
      for (const data of channels) sample += data[i] ?? 0
      sample /= channels.length
      sum += sample * sample
      count++
    }
    rms.push(count > 0 ? Math.sqrt(sum / count) : 0)
  }
  const max = Math.max(...rms)
  if (!(max > 0)) return rms.map(() => 0)
  return rms.map((value) => Math.round(Math.min(1, value / max) * 1000) / 1000)
}

/** Faz download da pré-visualização e calcula os picos. Lança TrackError('audio') em qualquer falha. */
export async function analysePreview(
  previewUrl: string,
  { fetchFn = fetch, decode = decodeWithWebAudio, signal }: { fetchFn?: FetchLike; decode?: DecodeAudio; signal?: AbortSignal } = {},
): Promise<number[]> {
  if (!isHttpsOnHosts(previewUrl, TRACK_HOSTS.preview)) throw new TrackError('no-preview')
  try {
    const response = await fetchFn(previewUrl, { signal })
    if (!response.ok) throw new TrackError('audio', `HTTP ${response.status}`)
    const audio = await decode(await response.arrayBuffer())
    const peaks = computePeaks(audio)
    if (!peaks.some((peak) => peak > 0)) throw new TrackError('audio', 'silent preview')
    return peaks
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw error instanceof TrackError ? error : new TrackError('audio')
  }
}

export function toFeaturedTrack(result: TrackResult, peaks: number[]): FeaturedTrack {
  return {
    source: 'itunes',
    trackId: result.trackId,
    title: result.title,
    artist: result.artist,
    ...(result.album && { album: result.album }),
    ...(result.artworkUrl && { artworkUrl: result.artworkUrl }),
    previewUrl: result.previewUrl,
    ...(result.trackUrl && { trackUrl: result.trackUrl }),
    ...(result.durationMs && { durationMs: result.durationMs }),
    peaks,
  }
}
