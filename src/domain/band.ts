export interface Band {
  id: string
  name: string
  /** Código de país ISO 3166-1 alfa-2, quando conhecido. */
  country?: string
  formedYear?: number
  subgenres: string[]
  /** true quando foi adicionada pelo utilizador e não pertence ao catálogo. */
  isCustom: boolean
}
