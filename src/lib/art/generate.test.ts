import { describe, expect, it } from 'vitest'
import { COVER_PATTERNS, generateCover, generateSigil } from './generate.ts'
import { createRng, hashString } from './seed.ts'

describe('seed', () => {
  it('hashString é determinístico', () => {
    expect(hashString('gojira')).toBe(hashString('gojira'))
    expect(hashString('gojira')).not.toBe(hashString('opeth'))
  })

  it('createRng produz a mesma sequência para a mesma seed, dentro de [0, 1)', () => {
    const a = createRng('x')
    const b = createRng('x')
    const seqA = Array.from({ length: 50 }, () => a.next())
    const seqB = Array.from({ length: 50 }, () => b.next())
    expect(seqA).toEqual(seqB)
    expect(seqA.every((n) => n >= 0 && n < 1)).toBe(true)
  })

  it('int respeita os limites inclusivos', () => {
    const rng = createRng(42)
    const values = Array.from({ length: 500 }, () => rng.int(3, 7))
    expect(Math.min(...values)).toBe(3)
    expect(Math.max(...values)).toBe(7)
  })

  it('pick rejeita listas vazias', () => {
    expect(() => createRng(1).pick([])).toThrow()
  })
})

describe('generateCover', () => {
  it('a mesma seed gera a mesma arte', () => {
    expect(generateCover('album:x')).toEqual(generateCover('album:x'))
  })

  it('seeds diferentes geram arte diferente', () => {
    expect(generateCover('album:a')).not.toEqual(generateCover('album:b'))
  })

  it.each(COVER_PATTERNS)('o padrão %s gera primitivas sem NaN nem Infinity', (pattern) => {
    const spec = generateCover('teste', pattern)
    expect(spec.pattern).toBe(pattern)
    expect(spec.primitives.length).toBeGreaterThan(0)
    expect(JSON.stringify(spec)).not.toMatch(/NaN|Infinity|null/)
  })
})

describe('generateSigil', () => {
  it('é determinístico e ignora maiúsculas', () => {
    expect(generateSigil('Nocturne')).toEqual(generateSigil('nocturne'))
  })

  it('nicknames diferentes geram sigilos diferentes', () => {
    expect(generateSigil('nocturne')).not.toEqual(generateSigil('voidwalker'))
  })
})
