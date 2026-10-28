/** Hash FNV-1a de 32 bits: a mesma string gera sempre a mesma seed. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export interface Rng {
  /** Número em [0, 1). */
  next(): number
  /** Número em [min, max). */
  range(min: number, max: number): number
  /** Inteiro em [min, max]. */
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
}

/** PRNG mulberry32 determinístico, para arte generativa reproduzível. */
export function createRng(seed: string | number): Rng {
  let state = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() needs at least one item')
      return items[Math.floor(next() * items.length)]!
    },
  }
}
