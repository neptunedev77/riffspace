import { describe, expect, it } from 'vitest'
import { DEMO_ALBUMS, DEMO_BANDS } from '../data/demo-bands.ts'
import { DEMO_PROFILE } from '../data/demo-profile.ts'
import { createId, isValidId } from './id.ts'

describe('createId', () => {
  it('gera IDs válidos com o prefixo pedido', () => {
    const id = createId('gear')
    expect(id).toMatch(/^gear-[0-9a-f-]+$/)
    expect(isValidId(id)).toBe(true)
  })

  it('gera IDs únicos', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId('band')))
    expect(ids.size).toBe(1000)
  })

  it('rejeita prefixos inválidos', () => {
    expect(() => createId('')).toThrow()
    expect(() => createId('Gear')).toThrow()
    expect(() => createId('gear-x')).toThrow()
  })

  it('rejeita um gerador que produza caracteres inválidos', () => {
    expect(() => createId('gear', () => 'não válido!')).toThrow()
  })
})

describe('isValidId', () => {
  it('aceita os IDs dos dados de demonstração', () => {
    const ids = [DEMO_PROFILE.id, ...DEMO_BANDS.map((b) => b.id), ...DEMO_ALBUMS.map((a) => a.id), ...DEMO_PROFILE.rig.map((g) => g.id)]
    expect(ids.every(isValidId)).toBe(true)
  })

  it.each(['', '-abc', 'ABC', 'a b', 'a'.repeat(65), 42, null])('rejeita %j', (value) => {
    expect(isValidId(value)).toBe(false)
  })
})
