import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts'
import { searchOfficialBands } from '../../lib/music/bandSearch.ts'
import type { ArtistResult } from '../../lib/music/musicbrainz.ts'

/** Mínimo de caracteres antes de pesquisar: com menos, a lista fica vazia. */
export const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 400

export type ArtistSearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; query: string; results: ArtistResult[] }
  | { status: 'error'; query: string }

type Response = { query: string; results: ArtistResult[] } | { query: string; error: true }

/**
 * Pesquisa bandas oficiais (MusicBrainz + Wikidata) enquanto se escreve: espera
 * uma pausa, cancela pedidos obsoletos e só mostra a resposta da pesquisa
 * atual. O estado de "a carregar" é derivado (não há setState síncrono no
 * efeito). `retry` repete a mesma pesquisa depois de um erro.
 */
export function useArtistSearch(query: string): { state: ArtistSearchState; retry: () => void } {
  const term = query.trim()
  const debounced = useDebouncedValue(term, DEBOUNCE_MS)
  const [response, setResponse] = useState<Response>()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (debounced.length < MIN_QUERY_LENGTH) return
    const controller = new AbortController()
    searchOfficialBands(debounced, { signal: controller.signal })
      .then((results) => setResponse({ query: debounced, results }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setResponse({ query: debounced, error: true })
      })
    return () => controller.abort()
  }, [debounced, attempt])

  const retry = () => {
    setResponse(undefined)
    setAttempt((n) => n + 1)
  }

  if (term.length < MIN_QUERY_LENGTH) return { state: { status: 'idle' }, retry }
  if (term !== debounced || response?.query !== term) return { state: { status: 'loading' }, retry }
  return {
    state: 'error' in response ? { status: 'error', query: term } : { status: 'done', query: term, results: response.results },
    retry,
  }
}
