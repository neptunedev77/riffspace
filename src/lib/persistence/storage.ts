/** Subconjunto da Web Storage API de que a persistência precisa. Injetável nos testes. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Devolve o localStorage se for utilizável. Em modo privado, com cookies
 * bloqueados ou sem DOM, o acesso pode lançar exceções — nesse caso devolve null.
 */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const storage = window.localStorage
    const probe = '__riffspace_probe__'
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

/** Storage em memória: fallback quando o localStorage não está disponível e base dos testes. */
export function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  snapshot(): Record<string, string>
} {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, String(value))
    },
    removeItem: (key) => {
      data.delete(key)
    },
    snapshot: () => Object.fromEntries(data),
  }
}
