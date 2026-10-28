import { z } from 'zod'
import type { Album } from '../../domain/album.ts'
import { mbidOf, musicBrainzEntityId, type Band } from '../../domain/band.ts'
import { COUNTRY_PATTERN, LIMITS, maxYear } from '../../domain/limits.ts'

/**
 * Cliente mínimo da API da MusicBrainz (dados abertos CC0, sem chave, CORS
 * aberto). A MusicBrainz limita cada cliente a ~1 pedido por segundo e
 * responde 503 quando o limite é ultrapassado: todos os pedidos passam por uma
 * fila com intervalo mínimo, e as respostas ficam em cache durante a sessão.
 */
export const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2'

const DEFAULT_MIN_INTERVAL_MS = 1100
/** Máximo de géneros guardados por banda. */
const MAX_BAND_GENRES = 4

export type MusicFetch = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>

export class MusicError extends Error {
  /** network: sem ligação; unavailable: limite ou serviço em baixo; unexpected: resposta estranha. */
  readonly code: 'network' | 'unavailable' | 'unexpected'
  constructor(code: MusicError['code'], message: string = code) {
    super(message)
    this.name = 'MusicError'
    this.code = code
  }
}

export interface ArtistResult {
  band: Band
  /** Texto da MusicBrainz para distinguir homónimos (p. ex. "US thrash band"). */
  disambiguation?: string
  /** Relevância da pesquisa (0–100) segundo a MusicBrainz. */
  score: number
}

const tagSchema = z.object({ name: z.string(), count: z.number().optional() })

const artistSchema = z.object({
  id: z.string(),
  score: z.number().optional(),
  name: z.string().min(1),
  country: z.string().optional(),
  disambiguation: z.string().optional(),
  'life-span': z.object({ begin: z.string().optional() }).optional(),
  tags: z.array(tagSchema).optional(),
})

const releaseGroupSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  'primary-type': z.string().nullish(),
  'secondary-types': z.array(z.string()).optional(),
  'first-release-date': z.string().optional(),
})

const artistSearchSchema = z.object({ artists: z.array(z.unknown()) })
const releaseGroupBrowseSchema = z.object({ 'release-groups': z.array(z.unknown()) })

/** Caracteres especiais da sintaxe Lucene usada pela pesquisa da MusicBrainz. */
export function escapeLucene(value: string): string {
  return value.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, (char) => `\\${char}`)
}

/** Só se aproveitam etiquetas que parecem géneros (as etiquetas também têm coisas como "seen live"). */
const GENRE_HINT =
  /metal|core|rock|punk|doom|sludge|djent|grind|thrash|goth|stoner|prog|drone|shoegaze|post-|folk|industrial|noise|ambient|jazz|blues|pop|electronic|hip hop|rap|wave|psychedelic|grunge|fusion|crust|speed|symphonic|viking|pagan|black|death/i

function titleCase(value: string): string {
  return value.replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase())
}

export function genresFromTags(tags: readonly { name: string; count?: number }[] = []): string[] {
  const seen = new Set<string>()
  return [...tags]
    .filter((tag) => (tag.count ?? 0) > 0 && GENRE_HINT.test(tag.name) && tag.name.length <= LIMITS.subgenre.max)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .map((tag) => titleCase(tag.name.trim().toLowerCase()))
    .filter((genre) => {
      const key = genre.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_BAND_GENRES)
}

/** Ano (YYYY…) dentro dos limites do domínio, ou undefined. */
export function yearFrom(date: string | undefined): number | undefined {
  const year = date ? Number.parseInt(date.slice(0, 4), 10) : Number.NaN
  return Number.isInteger(year) && year >= LIMITS.year.min && year <= maxYear() ? year : undefined
}

const clip = (value: string, max: number) => value.trim().slice(0, max)

export function toArtistResult(raw: unknown): ArtistResult | null {
  const parsed = artistSchema.safeParse(raw)
  if (!parsed.success) return null
  const a = parsed.data
  const country = a.country && COUNTRY_PATTERN.test(a.country) ? a.country : undefined
  const formedYear = yearFrom(a['life-span']?.begin)
  return {
    band: {
      id: musicBrainzEntityId(a.id),
      name: clip(a.name, LIMITS.bandName.max),
      ...(country && { country }),
      ...(formedYear && { formedYear }),
      subgenres: genresFromTags(a.tags),
      source: 'musicbrainz',
    },
    ...(a.disambiguation && { disambiguation: a.disambiguation }),
    score: a.score ?? 0,
  }
}

/**
 * Consulta que aceita a última palavra incompleta ("slipk" → Slipknot) sem
 * perder o peso das correspondências exatas. Todas as palavras são
 * obrigatórias — senão "the ocean" também encontraria tudo o que tem "the".
 *   "slipk"     → (slipk) OR (slipk*)
 *   "the ocean" → (the AND ocean) OR (the AND ocean*)
 */
export function artistQuery(query: string): string {
  const words = query.trim().split(/\s+/).filter(Boolean).map(escapeLucene)
  const exact = words.join(' AND ')
  const prefix = [...words.slice(0, -1), `${words.at(-1) ?? ''}*`].join(' AND ')
  return `(${exact}) OR (${prefix})`
}

/** Álbum de estúdio a partir de um release group; null para singles, ao vivo, compilações, etc. */
export function toStudioAlbum(raw: unknown, bandId: string): Album | null {
  const parsed = releaseGroupSchema.safeParse(raw)
  if (!parsed.success) return null
  const rg = parsed.data
  if (rg['primary-type'] !== 'Album' || (rg['secondary-types'] ?? []).length > 0) return null
  const year = yearFrom(rg['first-release-date'])
  return {
    id: musicBrainzEntityId(rg.id),
    bandId,
    title: clip(rg.title, LIMITS.albumTitle.max),
    ...(year && { year }),
    source: 'musicbrainz',
  }
}

export interface MusicBrainzClientOptions {
  fetchFn?: MusicFetch
  minIntervalMs?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const abortError = () => new DOMException('Aborted', 'AbortError')

/** A mesma promessa, mas rejeitada com AbortError assim que `signal` for cancelado. */
function untilAborted<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(abortError())
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError())
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

export function createMusicBrainzClient(initial: MusicBrainzClientOptions = {}) {
  let fetchFn: MusicFetch | undefined = initial.fetchFn
  let minInterval = initial.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS
  let lastStart = Number.NEGATIVE_INFINITY
  let queue: Promise<unknown> = Promise.resolve()
  const cache = new Map<string, Promise<unknown>>()

  /** Executa os pedidos um de cada vez, com pelo menos `minInterval` entre inícios. */
  function schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(async () => {
      const wait = lastStart + minInterval - Date.now()
      if (wait > 0) await sleep(wait)
      lastStart = Date.now()
      return task()
    })
    queue = run.catch(() => undefined)
    return run
  }

  async function request(url: string): Promise<unknown> {
    const doFetch = fetchFn ?? ((input: string) => fetch(input))
    let response: Response
    try {
      response = await doFetch(url)
      // Limite excedido: espera e tenta mais uma vez.
      if (response.status === 503) {
        await sleep(minInterval)
        lastStart = Date.now()
        response = await doFetch(url)
      }
    } catch {
      throw new MusicError('network')
    }
    if (response.status === 503) throw new MusicError('unavailable')
    if (!response.ok) throw new MusicError('unexpected', `HTTP ${response.status}`)
    try {
      return await response.json()
    } catch {
      throw new MusicError('unexpected', 'invalid JSON')
    }
  }

  /**
   * O pedido em cache é partilhado, por isso não usa o sinal de quem o pediu:
   * se um chamador cancelar (p. ex. o efeito duplicado do StrictMode, ou uma
   * pesquisa ultrapassada), só esse deixa de esperar; os outros recebem a resposta.
   */
  function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
    const url = `${MUSICBRAINZ_API}/${path}${path.includes('?') ? '&' : '?'}fmt=json`
    let pending = cache.get(url)
    if (!pending) {
      pending = schedule(() => request(url))
      cache.set(url, pending)
      // Falhas não ficam em cache.
      pending.catch(() => cache.delete(url))
    }
    return untilAborted(pending, signal)
  }

  return {
    /** Pesquisa bandas/artistas por nome. */
    async searchArtists(query: string, { signal, limit = 10 }: { signal?: AbortSignal; limit?: number } = {}) {
      const body = await getJson(`artist?query=${encodeURIComponent(artistQuery(query))}&limit=${limit}`, signal)
      const parsed = artistSearchSchema.safeParse(body)
      if (!parsed.success) throw new MusicError('unexpected', 'unexpected artist search response')
      const seen = new Set<string>()
      return parsed.data.artists.flatMap((raw) => {
        const result = toArtistResult(raw)
        if (!result || seen.has(result.band.id)) return []
        seen.add(result.band.id)
        return [result]
      })
    },

    /** Álbuns de estúdio de uma banda da MusicBrainz, por ordem cronológica. Bandas personalizadas não têm. */
    async listStudioAlbums(band: Band, { signal }: { signal?: AbortSignal } = {}): Promise<Album[]> {
      const mbid = mbidOf(band)
      if (!mbid) return []
      const body = await getJson(`release-group?artist=${mbid}&type=album&limit=100`, signal)
      const parsed = releaseGroupBrowseSchema.safeParse(body)
      if (!parsed.success) throw new MusicError('unexpected', 'unexpected release group response')
      return parsed.data['release-groups']
        .flatMap((raw) => {
          const album = toStudioAlbum(raw, band.id)
          return album ? [album] : []
        })
        .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title))
    },

    /** Limpa a cache e, opcionalmente, muda o fetch ou o intervalo (usado nos testes). */
    reset(options: MusicBrainzClientOptions = {}) {
      cache.clear()
      lastStart = Number.NEGATIVE_INFINITY
      queue = Promise.resolve()
      fetchFn = options.fetchFn
      minInterval = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS
    },
  }
}

export type MusicBrainzClient = ReturnType<typeof createMusicBrainzClient>

/** Cliente partilhado pela aplicação: uma única fila respeita o limite da MusicBrainz. */
export const musicBrainz = createMusicBrainzClient()
