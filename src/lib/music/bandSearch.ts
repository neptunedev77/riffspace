import { mbidOf } from '../../domain/band.ts'
import { musicBrainz, type ArtistResult, type MusicBrainzClient } from './musicbrainz.ts'
import { fetchImageCredits, fetchWikidataArtists, type WikidataArtist, type WikiFetch } from './wikidata.ts'

/** Nome comparável: sem acentos, maiúsculas nem espaços à volta. */
const nameKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/** Tributos e bandas de covers não são "oficiais", mesmo que tenham o nome certo. */
const TRIBUTE = /\b(tribute|tributo|cover band|covers?\b|homenaje|hommage)/i

/** Abaixo disto, um resultado é ruído mesmo estando na Wikidata (p. ex. membros da banda). */
export const MIN_SCORE = 60
/** Sem entrada na Wikidata, só se aceita um resultado quase exato. */
export const UNLINKED_MIN_SCORE = 90

/**
 * Fica só com resultados "oficiais":
 * - sem tributos nem covers;
 * - com entrada na Wikidata, ou então uma correspondência quase exata;
 * - entre homónimos, o que está na Wikidata (ou, sem nenhum, o mais relevante).
 * Sem dados da Wikidata (`linked` null, p. ex. sem rede), usa só a relevância.
 */
export function officialResults(results: readonly ArtistResult[], linked: ReadonlySet<string> | null): ArtistResult[] {
  const isLinked = (result: ArtistResult) => {
    const mbid = mbidOf(result.band)
    return linked !== null && mbid !== undefined && linked.has(mbid)
  }
  const candidates = results.filter((result) => {
    if (TRIBUTE.test(result.band.name) || TRIBUTE.test(result.disambiguation ?? '')) return false
    if (result.score < MIN_SCORE) return false
    return isLinked(result) || result.score >= UNLINKED_MIN_SCORE
  })
  const byName = new Map<string, ArtistResult>()
  for (const result of candidates) {
    const key = nameKey(result.band.name)
    const kept = byName.get(key)
    if (!kept || (!isLinked(kept) && isLinked(result))) byName.set(key, result)
  }
  // Mantém a ordem de relevância original.
  return candidates.filter((result) => byName.get(nameKey(result.band.name)) === result)
}

let wikiFetch: WikiFetch | undefined
const wikidataCache = new Map<string, WikidataArtist | null>()

/** Permite aos testes substituir o acesso à Wikidata/Commons (e limpa a cache). */
export function configureWiki(options: { fetchFn?: WikiFetch } = {}) {
  wikiFetch = options.fetchFn
  wikidataCache.clear()
}

async function wikidataFor(mbids: string[], signal?: AbortSignal): Promise<Map<string, WikidataArtist | null>> {
  const missing = mbids.filter((mbid) => !wikidataCache.has(mbid))
  if (missing.length > 0) {
    const found = await fetchWikidataArtists(missing, { fetchFn: wikiFetch, signal })
    for (const mbid of missing) wikidataCache.set(mbid, found.get(mbid) ?? null)
  }
  return new Map(mbids.map((mbid) => [mbid, wikidataCache.get(mbid) ?? null]))
}

/**
 * Pesquisa de bandas para o editor: MusicBrainz para os dados, Wikidata para
 * separar o oficial do resto e trazer a fotografia, Commons para a atribuição.
 * Se a Wikidata ou a Commons falharem, os resultados chegam na mesma (sem
 * fotografias e com o filtro só por relevância).
 */
export async function searchOfficialBands(
  query: string,
  { signal, client = musicBrainz }: { signal?: AbortSignal; client?: MusicBrainzClient } = {},
): Promise<ArtistResult[]> {
  const results = await client.searchArtists(query, { signal })
  const mbids = results.flatMap((result) => mbidOf(result.band) ?? [])

  let wikidata: Map<string, WikidataArtist | null> | null = null
  try {
    wikidata = await wikidataFor(mbids, signal)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  const linked = wikidata ? new Set([...wikidata].flatMap(([mbid, entry]) => (entry ? [mbid] : []))) : null
  const official = officialResults(results, linked)

  const files = official.flatMap((result) => {
    const mbid = mbidOf(result.band)
    return (mbid && wikidata?.get(mbid)?.image) || []
  })
  let credits = new Map<string, { file: string; author?: string; license?: string }>()
  try {
    credits = await fetchImageCredits(files, { fetchFn: wikiFetch, signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }

  return official.map((result) => {
    const mbid = mbidOf(result.band)
    const file = mbid ? wikidata?.get(mbid)?.image : undefined
    // Sem autor/licença não há atribuição possível: a fotografia não é usada.
    const image = file ? credits.get(file) : undefined
    return image?.author && image.license ? { ...result, band: { ...result.band, image } } : result
  })
}
