import { describe, expect, it, vi } from 'vitest'
import {
  artistQuery,
  createMusicBrainzClient,
  escapeLucene,
  genresFromTags,
  MUSICBRAINZ_API,
  MusicError,
  toArtistResult,
  toStudioAlbum,
  yearFrom,
  type MusicFetch,
} from './musicbrainz.ts'
import { MB_ARTIST, MB_RELEASE_GROUPS } from '../../tests/fixtures.ts'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('conversão de dados', () => {
  it('converte um artista numa banda com país, ano e géneros', () => {
    expect(toArtistResult(MB_ARTIST)).toEqual({
      band: {
        id: `mb-${MB_ARTIST.id}`,
        name: 'Sepultura',
        country: 'BR',
        formedYear: 1984,
        subgenres: ['Thrash Metal', 'Groove Metal', 'Death Metal'],
        source: 'musicbrainz',
      },
      disambiguation: 'Brazilian metal band',
      score: 100,
    })
    expect(toArtistResult({ name: 'sem id' })).toBeNull()
  })

  it('só aproveita etiquetas que parecem géneros, por votos', () => {
    const genres = genresFromTags([
      { name: 'seen live', count: 9 },
      { name: 'post-metal', count: 1 },
      { name: 'brazilian', count: 5 },
      { name: 'groove metal', count: 3 },
      { name: 'Groove Metal', count: 2 },
      { name: 'death metal', count: 0 },
    ])
    expect(genres).toEqual(['Groove Metal', 'Post-Metal'])
  })

  it('anos fora dos limites do domínio são ignorados', () => {
    expect(yearFrom('1984-01-01')).toBe(1984)
    expect(yearFrom('1890')).toBeUndefined()
    expect(yearFrom(undefined)).toBeUndefined()
  })

  it('aceita só álbuns de estúdio (sem singles, ao vivo nem compilações)', () => {
    const [album, live, single] = MB_RELEASE_GROUPS['release-groups']
    expect(toStudioAlbum(album, 'band-x')).toMatchObject({ title: 'Arise', year: 1991, bandId: 'band-x', source: 'musicbrainz' })
    expect(toStudioAlbum(live, 'band-x')).toBeNull()
    expect(toStudioAlbum(single, 'band-x')).toBeNull()
  })

  it('escapa a sintaxe da pesquisa e aceita palavras incompletas', () => {
    expect(escapeLucene('AC/DC: (live)!')).toBe('AC\\/DC\\: \\(live\\)\\!')
    expect(artistQuery('  iron   maid ')).toBe('(iron AND maid) OR (iron AND maid*)')
    expect(artistQuery('slipk')).toBe('(slipk) OR (slipk*)')
  })
})

describe('cliente', () => {
  it('pesquisa artistas e lista álbuns de estúdio por ordem cronológica', async () => {
    const fetchFn = vi.fn<MusicFetch>(async (url) =>
      url.includes('/artist?') ? json({ artists: [MB_ARTIST, MB_ARTIST] }) : json(MB_RELEASE_GROUPS),
    )
    const client = createMusicBrainzClient({ fetchFn, minIntervalMs: 0 })
    const results = await client.searchArtists(' sepultura ')
    expect(results).toHaveLength(1)
    expect(fetchFn.mock.calls[0]![0]).toBe(
      `${MUSICBRAINZ_API}/artist?query=${encodeURIComponent('(sepultura) OR (sepultura*)')}&limit=10&fmt=json`,
    )

    const albums = await client.listStudioAlbums(results[0]!.band)
    expect(albums.map((album) => album.title)).toEqual(['Schizophrenia', 'Arise'])
    expect(fetchFn.mock.calls[1]![0]).toContain(`release-group?artist=${MB_ARTIST.id}&type=album`)
  })

  it('bandas criadas à mão não fazem pedidos', async () => {
    const fetchFn = vi.fn<MusicFetch>()
    const client = createMusicBrainzClient({ fetchFn, minIntervalMs: 0 })
    expect(await client.listStudioAlbums({ id: 'band-x', name: 'X', subgenres: [], source: 'custom' })).toEqual([])
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('guarda respostas em cache, mas não guarda falhas', async () => {
    const fetchFn = vi
      .fn<MusicFetch>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(json({ artists: [MB_ARTIST] }))
    const client = createMusicBrainzClient({ fetchFn, minIntervalMs: 0 })
    await expect(client.searchArtists('sepultura')).rejects.toMatchObject({ code: 'network' })
    await client.searchArtists('sepultura')
    await client.searchArtists('sepultura')
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('perante um 503 (limite de pedidos) espera e tenta mais uma vez', async () => {
    const fetchFn = vi
      .fn<MusicFetch>()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(json({ artists: [MB_ARTIST] }))
    const client = createMusicBrainzClient({ fetchFn, minIntervalMs: 1 })
    expect(await client.searchArtists('sepultura')).toHaveLength(1)

    const busy = createMusicBrainzClient({ fetchFn: async () => new Response('', { status: 503 }), minIntervalMs: 1 })
    const error = await busy.searchArtists('x').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(MusicError)
    expect(error).toMatchObject({ code: 'unavailable' })
  })

  it('cancelar um pedido partilhado não estraga a resposta para os outros (StrictMode)', async () => {
    const fetchFn = vi.fn<MusicFetch>(async () => json({ artists: [MB_ARTIST] }))
    const client = createMusicBrainzClient({ fetchFn, minIntervalMs: 0 })
    const first = new AbortController()
    const cancelled = client.searchArtists('sepultura', { signal: first.signal })
    first.abort()
    const second = client.searchArtists('sepultura', { signal: new AbortController().signal })
    await expect(cancelled).rejects.toMatchObject({ name: 'AbortError' })
    expect(await second).toHaveLength(1)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('respostas com outra forma dão MusicError("unexpected")', async () => {
    const client = createMusicBrainzClient({ fetchFn: async () => json({ nope: true }), minIntervalMs: 0 })
    await expect(client.searchArtists('x')).rejects.toMatchObject({ code: 'unexpected' })
  })

  it('respeita o intervalo mínimo entre pedidos', async () => {
    const starts: number[] = []
    const fetchFn: MusicFetch = async () => {
      starts.push(Date.now())
      return json({ artists: [] })
    }
    const client = createMusicBrainzClient({ fetchFn, minIntervalMs: 60 })
    await Promise.all([client.searchArtists('a1'), client.searchArtists('a2'), client.searchArtists('a3')])
    expect(starts[1]! - starts[0]!).toBeGreaterThanOrEqual(55)
    expect(starts[2]! - starts[1]!).toBeGreaterThanOrEqual(55)
  })
})
