import type { Band } from '../../domain/band.ts'

/** Normaliza para pesquisa: sem acentos, minúsculas e sem espaços à volta. */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export interface BandSearch {
  query: string
  /** Subgénero exato para filtrar; vazio ou undefined para todos. */
  subgenre?: string
}

/**
 * Pesquisa bandas por nome (substring, sem acentos nem maiúsculas) e,
 * opcionalmente, por subgénero. Os nomes que começam pela pesquisa vêm primeiro;
 * o resto mantém a ordem original.
 */
export function searchBands(bands: readonly Band[], { query, subgenre }: BandSearch): Band[] {
  const q = normalizeSearch(query)
  const genre = subgenre ? normalizeSearch(subgenre) : ''

  const matches = bands.filter((band) => {
    if (genre && !band.subgenres.some((g) => normalizeSearch(g) === genre)) return false
    return q === '' || normalizeSearch(band.name).includes(q)
  })

  if (q === '') return matches
  const prefix = matches.filter((band) => normalizeSearch(band.name).startsWith(q))
  const rest = matches.filter((band) => !normalizeSearch(band.name).startsWith(q))
  return [...prefix, ...rest]
}

/** Lista ordenada e sem repetidos de todos os subgéneros conhecidos. */
export function collectSubgenres(...sources: ReadonlyArray<readonly string[]>): string[] {
  const seen = new Map<string, string>()
  for (const source of sources) {
    for (const genre of source) {
      const key = normalizeSearch(genre)
      if (key && !seen.has(key)) seen.set(key, genre)
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'pt'))
}
