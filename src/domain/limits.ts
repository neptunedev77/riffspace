/**
 * Limites e formatos do modelo de domínio. São a fonte única usada pelos
 * schemas de validação (lib/validation) e, a partir da Etapa 3, pelo editor.
 */
export const LIMITS = {
  id: { max: 64 },
  nickname: { min: 3, max: 24 },
  displayName: { max: 40 },
  tagline: { max: 120 },
  bio: { max: 500 },
  location: { max: 60 },
  url: { max: 2048 },
  subgenre: { max: 40 },
  subgenres: { max: 8 },
  favoriteBands: { max: 20 },
  favoriteAlbums: { max: 24 },
  bandName: { max: 60 },
  albumTitle: { max: 80 },
  year: { min: 1950 },
  rig: { max: 40 },
  gearBrand: { max: 40 },
  gearModel: { max: 60 },
  gearNickname: { max: 40 },
  gearNotes: { max: 300 },
  gearTags: { max: 8 },
  gearTag: { max: 24 },
  socials: { max: 8 },
  trackText: { max: 200 },
  /** Nome de ficheiro da Commons e textos de atribuição (autor, licença). */
  imageFile: { max: 240 },
  imageCredit: { max: 200 },
  /** Número de barras da forma de onda da música em destaque. */
  peaks: { min: 16, max: 256 },
} as const

/** IDs estáveis: minúsculas, dígitos, "-" e "_", a começar por letra ou dígito. */
export const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

/**
 * Nickname: minúsculas, dígitos, ".", "_" e "-"; não pode começar nem acabar
 * em separador. É único no contexto local (há um único perfil por browser).
 */
export const NICKNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/

/** Código de país ISO 3166-1 alfa-2. */
export const COUNTRY_PATTERN = /^[A-Z]{2}$/

/** Ano máximo aceite: o próximo ano, para lançamentos anunciados. */
export function maxYear(now: Date = new Date()): number {
  return now.getFullYear() + 1
}
