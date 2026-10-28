/**
 * Origem de uma banda ou álbum: a MusicBrainz (dados abertos, CC0) ou uma
 * entrada criada à mão pelo utilizador quando a API não a tem ou falha.
 */
export type MusicSource = 'musicbrainz' | 'custom'

/** Prefixo dos IDs de entidades da MusicBrainz: `mb-<mbid>`. */
export const MUSICBRAINZ_ID_PREFIX = 'mb-'

const MBID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/**
 * Fotografia da banda na Wikimedia Commons (licença livre). Guarda-se o nome
 * do ficheiro — o URL é derivado — e o autor/licença para a atribuição.
 */
export interface BandImage {
  file: string
  author?: string
  license?: string
}

export interface Band {
  id: string
  name: string
  /** Código de país ISO 3166-1 alfa-2, quando conhecido. */
  country?: string
  formedYear?: number
  /** Géneros (na MusicBrainz, as etiquetas mais votadas pela comunidade). */
  subgenres: string[]
  source: MusicSource
  image?: BandImage
}

/** URL de uma miniatura do ficheiro na Commons (a Commons redimensiona e serve a imagem). */
export function commonsImageUrl(file: string, width = 160): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`
}

/** Página do ficheiro na Commons, onde estão o autor e a licença completos. */
export function commonsFilePage(file: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`
}

export function musicBrainzEntityId(mbid: string): string {
  return `${MUSICBRAINZ_ID_PREFIX}${mbid}`
}

/** MBID de uma entidade vinda da MusicBrainz, ou undefined para entradas personalizadas. */
export function mbidOf(entity: { id: string; source: MusicSource }): string | undefined {
  if (entity.source !== 'musicbrainz' || !entity.id.startsWith(MUSICBRAINZ_ID_PREFIX)) return undefined
  const mbid = entity.id.slice(MUSICBRAINZ_ID_PREFIX.length)
  return MBID_PATTERN.test(mbid) ? mbid : undefined
}
