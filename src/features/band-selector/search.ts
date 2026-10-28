/** Normaliza para pesquisa: sem acentos, minúsculas e sem espaços à volta. */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/** true quando `text` contém `query` (sem acentos nem maiúsculas); uma pesquisa vazia aceita tudo. */
export function matchesSearch(text: string, query: string): boolean {
  const q = normalizeSearch(query)
  return q === '' || normalizeSearch(text).includes(q)
}
