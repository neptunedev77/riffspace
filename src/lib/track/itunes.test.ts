import { describe, expect, it, vi } from 'vitest'
import {
  analysePreview,
  computePeaks,
  largerArtwork,
  PEAK_COUNT,
  searchTracks,
  toFeaturedTrack,
  toTrackResult,
  TrackError,
  type DecodedAudio,
  type FetchLike,
} from './itunes.ts'
import { ITUNES_SONG as RAW_SONG } from '../../tests/fixtures.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Áudio simulado: um canal com a amplitude indicada em cada metade. */
function fakeAudio(first: number, second: number, length = 1200): DecodedAudio {
  const data = new Float32Array(length).map((_, i) => (i < length / 2 ? first : second) * (i % 2 ? 1 : -1))
  return { numberOfChannels: 1, length, getChannelData: () => data }
}

describe('toTrackResult', () => {
  it('normaliza um resultado e pede a capa em 300×300', () => {
    expect(toTrackResult(RAW_SONG)).toEqual({
      trackId: 213374170,
      title: 'Flying Whales',
      artist: 'Gojira',
      album: 'From Mars to Sirius',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/x/cover.jpg/300x300bb.jpg',
      previewUrl: RAW_SONG.previewUrl,
      trackUrl: RAW_SONG.trackViewUrl,
      durationMs: 464453,
    })
    expect(largerArtwork('https://a.mzstatic.com/x/60x60bb.jpg')).toBe('https://a.mzstatic.com/x/300x300bb.jpg')
  })

  it('descarta resultados sem pré-visualização oficial ou que não são músicas', () => {
    expect(toTrackResult({ ...RAW_SONG, previewUrl: undefined })).toBeNull()
    expect(toTrackResult({ ...RAW_SONG, previewUrl: 'https://example.com/a.m4a' })).toBeNull()
    expect(toTrackResult({ ...RAW_SONG, kind: 'music-video' })).toBeNull()
    expect(toTrackResult({ trackName: 'sem id' })).toBeNull()
  })

  it('ignora capa ou página fora dos domínios oficiais', () => {
    const result = toTrackResult({ ...RAW_SONG, artworkUrl100: 'https://evil.example/c.jpg', trackViewUrl: 'http://x' })
    expect(result?.artworkUrl).toBeUndefined()
    expect(result?.trackUrl).toBeUndefined()
  })
})

describe('searchTracks', () => {
  it('pesquisa músicas e remove duplicados', async () => {
    const fetchFn = vi.fn<FetchLike>(async () => json({ results: [RAW_SONG, RAW_SONG, { kind: 'song' }] }))
    const results = await searchTracks('  gojira  ', { fetchFn })
    expect(results.map((r) => r.title)).toEqual(['Flying Whales'])
    const url = new URL(fetchFn.mock.calls[0]![0])
    expect(url.origin + url.pathname).toBe('https://itunes.apple.com/search')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ term: 'gojira', media: 'music', entity: 'song' })
  })

  it('falhas de rede, HTTP ou respostas inesperadas dão TrackError("search")', async () => {
    const failing: FetchLike[] = [
      async () => {
        throw new TypeError('Failed to fetch')
      },
      async () => json({}, 503),
      async () => json({ nope: true }),
    ]
    for (const fetchFn of failing) {
      await expect(searchTracks('x', { fetchFn })).rejects.toMatchObject({ name: 'TrackError', code: 'search' })
    }
  })
})

describe('computePeaks', () => {
  it('devolve PEAK_COUNT picos normalizados pelo maior', () => {
    const peaks = computePeaks(fakeAudio(0.25, 0.5))
    expect(peaks).toHaveLength(PEAK_COUNT)
    expect(Math.max(...peaks)).toBe(1)
    expect(peaks[0]).toBeCloseTo(0.5)
    expect(peaks.at(-1)).toBe(1)
  })

  it('silêncio dá zeros em vez de NaN', () => {
    expect(computePeaks(fakeAudio(0, 0), 16)).toEqual(Array.from({ length: 16 }, () => 0))
    expect(computePeaks({ numberOfChannels: 0, length: 0, getChannelData: () => new Float32Array() }, 4)).toEqual([0, 0, 0, 0])
  })
})

describe('analysePreview', () => {
  const preview = RAW_SONG.previewUrl

  it('descarrega a pré-visualização, descodifica e calcula os picos', async () => {
    const fetchFn = vi.fn<FetchLike>(async () => new Response(new ArrayBuffer(8)))
    const decode = vi.fn(async () => fakeAudio(0.2, 0.8))
    const peaks = await analysePreview(preview, { fetchFn, decode })
    expect(fetchFn).toHaveBeenCalledWith(preview, expect.anything())
    expect(decode).toHaveBeenCalledOnce()
    expect(peaks).toHaveLength(PEAK_COUNT)
  })

  it('recusa URLs não oficiais sem fazer pedidos', async () => {
    const fetchFn = vi.fn<FetchLike>()
    await expect(analysePreview('https://example.com/a.m4a', { fetchFn })).rejects.toMatchObject({ code: 'no-preview' })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('falhas de download, de descodificação ou áudio silencioso dão TrackError("audio")', async () => {
    const ok: FetchLike = async () => new Response(new ArrayBuffer(8))
    const cases = [
      { fetchFn: (async () => new Response(null, { status: 404 })) as FetchLike, decode: async () => fakeAudio(1, 1) },
      { fetchFn: ok, decode: async () => Promise.reject(new DOMException('bad', 'EncodingError')) },
      { fetchFn: ok, decode: async () => fakeAudio(0, 0) },
    ]
    for (const options of cases) {
      const error = await analysePreview(preview, options).catch((caught: unknown) => caught)
      expect(error).toBeInstanceOf(TrackError)
      expect(error).toMatchObject({ code: 'audio' })
    }
  })
})

describe('toFeaturedTrack', () => {
  it('omite campos opcionais ausentes', () => {
    const result = toTrackResult({ ...RAW_SONG, collectionName: undefined, artworkUrl100: undefined })!
    const track = toFeaturedTrack(result, [0.5, 1])
    expect(track).not.toHaveProperty('album')
    expect(track).not.toHaveProperty('artworkUrl')
    expect(track).toMatchObject({ source: 'itunes', trackId: 213374170, peaks: [0.5, 1] })
  })
})
