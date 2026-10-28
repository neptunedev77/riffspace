import { z } from 'zod'
import { LIMITS } from '../../domain/limits.ts'
import type { BandImage } from '../../domain/band.ts'

/**
 * Wikidata e Wikimedia Commons, ambos sem chave e com CORS aberto.
 *
 * - A Wikidata liga cada MBID da MusicBrainz (propriedade P434) a uma entrada:
 *   ter entrada é um bom sinal de que o artista é "real" (os tributos, covers e
 *   homónimos obscuros não têm). Da mesma entrada vem a fotografia (P18).
 * - As fotografias estão na Commons com licenças livres; o autor e a licença
 *   vêm da API da Commons e são guardados para a atribuição no card.
 */
export const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql'
export const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

export type WikiFetch = (input: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<Response>

export interface WikidataArtist {
  qid: string
  /** Nome do ficheiro da fotografia na Commons (sem "File:"), quando existe. */
  image?: string
}

const bindingSchema = z.object({
  mbid: z.object({ value: z.string() }),
  item: z.object({ value: z.string() }),
  image: z.object({ value: z.string() }).optional(),
})
const sparqlSchema = z.object({ results: z.object({ bindings: z.array(z.unknown()) }) })

const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Nome de ficheiro a partir de um URL Special:FilePath da Commons. */
function fileFromFilePath(url: string): string | undefined {
  const marker = 'Special:FilePath/'
  const index = url.indexOf(marker)
  if (index < 0) return undefined
  try {
    return decodeURIComponent(url.slice(index + marker.length))
  } catch {
    return undefined
  }
}

/** Entradas da Wikidata (e fotografia) para vários MBIDs, numa única consulta. */
export async function fetchWikidataArtists(
  mbids: readonly string[],
  { fetchFn = fetch, signal }: { fetchFn?: WikiFetch; signal?: AbortSignal } = {},
): Promise<Map<string, WikidataArtist>> {
  const valid = mbids.filter((mbid) => MBID.test(mbid))
  const result = new Map<string, WikidataArtist>()
  if (valid.length === 0) return result
  const query = `SELECT ?mbid ?item ?image WHERE { VALUES ?mbid { ${valid.map((m) => `"${m}"`).join(' ')} } ?item wdt:P434 ?mbid . OPTIONAL { ?item wdt:P18 ?image } }`
  const response = await fetchFn(`${WIKIDATA_SPARQL}?format=json&query=${encodeURIComponent(query)}`, {
    signal,
    headers: { Accept: 'application/sparql-results+json' },
  })
  if (!response.ok) throw new Error(`Wikidata HTTP ${response.status}`)
  const parsed = sparqlSchema.safeParse(await response.json())
  if (!parsed.success) throw new Error('unexpected Wikidata response')
  for (const raw of parsed.data.results.bindings) {
    const row = bindingSchema.safeParse(raw)
    if (!row.success) continue
    const mbid = row.data.mbid.value
    const current = result.get(mbid)
    const image = row.data.image ? fileFromFilePath(row.data.image.value) : undefined
    // Uma entrada pode ter várias fotografias: fica a primeira.
    if (!current) result.set(mbid, { qid: row.data.item.value.split('/').pop() ?? '', ...(image && { image }) })
    else if (!current.image && image) current.image = image
  }
  return result
}

const imageInfoSchema = z.object({
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          title: z.string().optional(),
          imageinfo: z
            .array(
              z.object({
                extmetadata: z
                  .object({
                    Artist: z.object({ value: z.string() }).optional(),
                    LicenseShortName: z.object({ value: z.string() }).optional(),
                  })
                  .optional(),
              }),
            )
            .optional(),
        }),
      ),
      normalized: z.array(z.object({ from: z.string(), to: z.string() })).optional(),
    })
    .optional(),
})

/** Texto simples a partir do HTML que a Commons usa no campo do autor. */
function plainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

const clip = (value: string | undefined, max: number) => (value ? value.slice(0, max).trim() || undefined : undefined)

/** Autor e licença de vários ficheiros da Commons, numa única chamada. */
export async function fetchImageCredits(
  files: readonly string[],
  { fetchFn = fetch, signal }: { fetchFn?: WikiFetch; signal?: AbortSignal } = {},
): Promise<Map<string, BandImage>> {
  const result = new Map<string, BandImage>()
  const unique = [...new Set(files)].slice(0, 50)
  if (unique.length === 0) return result
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'imageinfo',
    iiprop: 'extmetadata',
    iiextmetadatafilter: 'Artist|LicenseShortName',
    titles: unique.map((file) => `File:${file}`).join('|'),
  })
  const response = await fetchFn(`${COMMONS_API}?${params.toString()}`, { signal })
  if (!response.ok) throw new Error(`Commons HTTP ${response.status}`)
  const parsed = imageInfoSchema.safeParse(await response.json())
  if (!parsed.success || !parsed.data.query) return result
  // A Commons normaliza títulos (p. ex. "_" → " "); volta-se ao nome pedido.
  const requested = new Map(unique.map((file) => [`File:${file}`, file]))
  for (const { from, to } of parsed.data.query.normalized ?? []) {
    const file = requested.get(from)
    if (file) requested.set(to, file)
  }
  for (const page of Object.values(parsed.data.query.pages)) {
    const file = page.title ? requested.get(page.title) : undefined
    const meta = page.imageinfo?.[0]?.extmetadata
    if (!file || !meta) continue
    result.set(file, {
      file,
      ...(meta.Artist && { author: clip(plainText(meta.Artist.value), LIMITS.imageCredit.max) }),
      ...(meta.LicenseShortName && { license: clip(plainText(meta.LicenseShortName.value), LIMITS.imageCredit.max) }),
    })
  }
  return result
}
