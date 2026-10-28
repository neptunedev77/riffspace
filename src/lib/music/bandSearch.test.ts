import { afterEach, describe, expect, it, vi } from 'vitest'
import { MB_ARTIST } from '../../tests/fixtures.ts'
import { configureWiki, officialResults, searchOfficialBands } from './bandSearch.ts'
import { createMusicBrainzClient, toArtistResult, type ArtistResult, type MusicFetch } from './musicbrainz.ts'
import type { WikiFetch } from './wikidata.ts'

const json = (body: unknown) => new Response(JSON.stringify(body))

let n = 0
/** Artista da MusicBrainz com MBID único. */
function artist(name: string, score: number, disambiguation?: string) {
  n += 1
  return { ...MB_ARTIST, id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, name, score, disambiguation }
}
const asResult = (raw: unknown) => toArtistResult(raw) as ArtistResult
const mbid = (raw: { id: string }) => raw.id

afterEach(() => configureWiki({ fetchFn: () => Promise.reject(new TypeError('Network disabled in tests')) }))

describe('officialResults', () => {
  // O caso real de "slipknot" na MusicBrainz (outubro de 2026).
  const real = artist('Slipknot', 100, 'US metal band')
  const punk = artist('Slipknot', 79, "Late-80's punk band")
  const jp = artist('Slipknot杉並', 67, 'Slipknot Tribute Band')
  const tribute = artist('Slipknot Tribute Band', 62)
  const dj = artist('DJ J. Slipknot', 61)
  const bassist = artist('Paul Gray', 46, 'Slipknot bassist')
  const cover = artist('Disasterpieces', 46, 'Slipknot cover')
  const all = [real, punk, jp, tribute, dj, bassist, cover]

  it('com a Wikidata, fica só a banda oficial', () => {
    const linked = new Set([mbid(real), mbid(bassist)])
    expect(officialResults(all.map(asResult), linked).map((r) => r.disambiguation)).toEqual(['US metal band'])
  })

  it('entre homónimos prefere o que está na Wikidata, mesmo que venha depois', () => {
    const trance = artist('The Ocean', 95, 'late 90s trance from Spain')
    const metal = artist('The Ocean', 92, 'German metal band')
    const results = officialResults([asResult(trance), asResult(metal)], new Set([mbid(metal)]))
    expect(results.map((r) => r.disambiguation)).toEqual(['German metal band'])
  })

  it('sem Wikidata usa só a relevância e continua a tirar tributos e homónimos', () => {
    expect(officialResults(all.map(asResult), null).map((r) => r.band.name)).toEqual(['Slipknot'])
  })

  it('uma banda pequena sem Wikidata aparece se a pesquisa for (quase) exata', () => {
    const underground = artist('Garagem Negra', 100)
    expect(officialResults([asResult(underground)], new Set())).toHaveLength(1)
  })
})

describe('searchOfficialBands', () => {
  function mbClient(artists: unknown[]) {
    const fetchFn: MusicFetch = async () => json({ artists })
    return createMusicBrainzClient({ fetchFn, minIntervalMs: 0 })
  }

  it('junta a fotografia da Commons com autor e licença às bandas oficiais', async () => {
    const real = artist('Slipknot', 100, 'US metal band')
    const wikiFetch = vi.fn<WikiFetch>(async (url) => {
      if (url.startsWith('https://query.wikidata.org/')) {
        return json({
          results: {
            bindings: [
              {
                mbid: { value: real.id },
                item: { value: 'http://www.wikidata.org/entity/Q254138' },
                image: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Slipknot%20at%20Roskilde%20Festival%202013.jpg' },
              },
            ],
          },
        })
      }
      return json({
        query: {
          pages: {
            '1': {
              title: 'File:Slipknot at Roskilde Festival 2013.jpg',
              imageinfo: [{ extmetadata: { Artist: { value: '<a href="//x">Bill Ebbesen</a>' }, LicenseShortName: { value: 'CC BY 3.0' } } }],
            },
          },
        },
      })
    })
    configureWiki({ fetchFn: wikiFetch })
    const results = await searchOfficialBands('slipknot', { client: mbClient([real, artist('Slipknot', 79, 'punk')]) })
    expect(results).toHaveLength(1)
    expect(results[0]!.band.image).toEqual({
      file: 'Slipknot at Roskilde Festival 2013.jpg',
      author: 'Bill Ebbesen',
      license: 'CC BY 3.0',
    })
    // Uma consulta à Wikidata e uma à Commons, para todos os resultados de uma vez.
    expect(wikiFetch).toHaveBeenCalledTimes(2)
  })

  it('se a Wikidata falhar, os resultados chegam na mesma, sem fotografias', async () => {
    configureWiki({ fetchFn: async () => new Response('', { status: 500 }) })
    const results = await searchOfficialBands('slipknot', { client: mbClient([artist('Slipknot', 100)]) })
    expect(results).toHaveLength(1)
    expect(results[0]!.band.image).toBeUndefined()
  })

  it('sem autor ou licença a fotografia não é usada (não há atribuição possível)', async () => {
    const real = artist('Slipknot', 100)
    configureWiki({
      fetchFn: async (url) =>
        url.startsWith('https://query.wikidata.org/')
          ? json({
              results: {
                bindings: [
                  {
                    mbid: { value: real.id },
                    item: { value: 'http://www.wikidata.org/entity/Q1' },
                    image: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/X.jpg' },
                  },
                ],
              },
            })
          : json({ query: { pages: { '1': { title: 'File:X.jpg', imageinfo: [{ extmetadata: {} }] } } } }),
    })
    const results = await searchOfficialBands('slipknot', { client: mbClient([real]) })
    expect(results[0]!.band.image).toBeUndefined()
  })
})
