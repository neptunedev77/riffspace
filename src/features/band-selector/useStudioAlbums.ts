import { useEffect, useState } from 'react'
import type { Album } from '../../domain/album.ts'
import { mbidOf, type Band } from '../../domain/band.ts'
import { musicBrainz } from '../../lib/music/musicbrainz.ts'

export type StudioAlbumsState =
  | { status: 'none' }
  | { status: 'loading' }
  | { status: 'done'; albums: Album[] }
  | { status: 'error' }

type Response = { bandId: string; albums: Album[] } | { bandId: string; error: true }

/**
 * Álbuns de estúdio da banda escolhida, pedidos à MusicBrainz só quando a
 * banda é selecionada (e guardados em cache pelo cliente). Bandas criadas à
 * mão não têm lista: devolve `none`. `retry` volta a pedir depois de um erro.
 */
export function useStudioAlbums(band: Band | undefined): { state: StudioAlbumsState; retry: () => void } {
  const [response, setResponse] = useState<Response>()
  const [attempt, setAttempt] = useState(0)
  const searchable = band && mbidOf(band) ? band : undefined

  useEffect(() => {
    if (!searchable) return
    const controller = new AbortController()
    musicBrainz
      .listStudioAlbums(searchable, { signal: controller.signal })
      .then((albums) => setResponse({ bandId: searchable.id, albums }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setResponse({ bandId: searchable.id, error: true })
      })
    return () => controller.abort()
  }, [searchable, attempt])

  const retry = () => {
    setResponse(undefined)
    setAttempt((n) => n + 1)
  }

  if (!searchable) return { state: { status: 'none' }, retry }
  if (response?.bandId !== searchable.id) return { state: { status: 'loading' }, retry }
  return { state: 'error' in response ? { status: 'error' } : { status: 'done', albums: response.albums }, retry }
}
