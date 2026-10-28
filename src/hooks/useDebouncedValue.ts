import { useEffect, useState } from 'react'

/** Devolve `value` só depois de ficar `delay` ms sem mudar (p. ex. para pesquisar enquanto se escreve). */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
