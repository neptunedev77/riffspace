import { useCallback, useSyncExternalStore } from 'react'

/** Estado de uma media query, atualizado quando muda. Sem matchMedia (SSR, testes) devolve `fallback`. */
export function useMediaQuery(query: string, fallback = false): boolean {
  const getMql = useCallback(
    () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null),
    [query],
  )
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = getMql()
      if (!mql) return () => {}
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [getMql],
  )
  return useSyncExternalStore(
    subscribe,
    () => getMql()?.matches ?? fallback,
    () => fallback,
  )
}
