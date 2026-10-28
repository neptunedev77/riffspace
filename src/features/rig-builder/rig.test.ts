import { describe, expect, it } from 'vitest'
import { buildSignalChain, type GearItem } from '../../domain/gear.ts'
import { LIMITS } from '../../domain/limits.ts'
import { parseProfile } from '../../lib/validation/parse.ts'
import { makeProfile } from '../../tests/fixtures.ts'
import { addGear, groupRig, moveGear, parseTags, removeGear, rigGroup, updateGear, type GearInput } from './rig.ts'

const pedal = (overrides: Partial<GearInput> = {}): GearInput => ({
  type: 'pedal',
  brand: 'Boss',
  model: 'DS-1',
  tags: [],
  ...overrides,
})

const gear = (id: string, type: GearItem['type']): GearItem => ({ id, type, brand: 'B', model: id, tags: [] })
const ids = (items: readonly GearItem[]) => items.map((item) => item.id)
const emptyRig = () => makeProfile({ rig: [] })

describe('parseTags', () => {
  it('separa por vírgulas, apara e remove vazios e repetidos', () => {
    expect(parseTags(' Drop C, boost ,, drop c,  ')).toEqual(['Drop C', 'boost'])
    expect(parseTags('')).toEqual([])
  })
})

describe('addGear', () => {
  it('adiciona uma peça válida com campos normalizados', () => {
    const result = addGear(
      emptyRig(),
      pedal({ brand: ' Boss ', model: 'DS-1', nickname: '  ', notes: 'Laranja.', imageUrl: '  ', favorite: false }),
      'gear-1',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({ id: 'gear-1', type: 'pedal', brand: 'Boss', model: 'DS-1', notes: 'Laranja.', tags: [] })
    expect(parseProfile(result.profile).ok).toBe(true)
  })

  it('aceita equipamento personalizado que não está em nenhum catálogo', () => {
    const result = addGear(emptyRig(), pedal({ brand: 'DIY', model: 'Fuzz da garagem', type: 'other' }))
    expect(result.ok && result.value.id).toMatch(/^gear-/)
  })

  it.each([
    ['marca vazia', pedal({ brand: '  ' }), /Brand is required/],
    ['modelo vazio', pedal({ model: '' }), /Model is required/],
    ['notas longas', pedal({ notes: 'x'.repeat(LIMITS.gearNotes.max + 1) }), /up to 300 characters/],
    ['URL inválido', pedal({ imageUrl: 'ftp://x' }), /http/],
    ['etiqueta longa', pedal({ tags: ['x'.repeat(LIMITS.gearTag.max + 1)] }), /up to 24 characters/],
    ['demasiadas etiquetas', pedal({ tags: Array.from({ length: LIMITS.gearTags.max + 1 }, (_, i) => `t${i}`) }), /Up to 8 tags/],
  ])('rejeita %s', (_, input, message) => {
    const result = addGear(emptyRig(), input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(message)
  })

  it('respeita o limite de peças', () => {
    const full = makeProfile({ rig: Array.from({ length: LIMITS.rig.max }, (_, i) => gear(`g${i}`, 'pedal')) })
    expect(addGear(full, pedal())).toEqual({ ok: false, error: `You can add up to ${LIMITS.rig.max} items.` })
  })

  it('a peça nova fica no fim do seu estágio na cadeia', () => {
    const profile = makeProfile({ rig: [gear('gtr', 'guitar'), gear('p1', 'pedal'), gear('amp', 'amp')] })
    const result = addGear(profile, pedal(), 'p2')
    expect(result.ok && ids(buildSignalChain(result.profile.rig))).toEqual(['gtr', 'p1', 'p2', 'amp'])
  })
})

describe('updateGear / removeGear', () => {
  it('edita mantendo o ID e a posição', () => {
    const profile = makeProfile({ rig: [gear('a', 'pedal'), gear('b', 'pedal')] })
    const result = updateGear(profile, 'a', pedal({ model: 'Novo', favorite: true }))
    expect(result.ok && ids(result.profile.rig)).toEqual(['a', 'b'])
    expect(result.ok && result.profile.rig[0]).toMatchObject({ id: 'a', model: 'Novo', favorite: true })
  })

  it('mudar o tipo move a peça para outro estágio da cadeia', () => {
    const profile = makeProfile({ rig: [gear('gtr', 'guitar'), gear('x', 'pedal'), gear('amp', 'amp')] })
    const result = updateGear(profile, 'x', pedal({ type: 'cabinet' }))
    expect(result.ok && ids(buildSignalChain(result.profile.rig))).toEqual(['gtr', 'amp', 'x'])
  })

  it('recusa editar uma peça inexistente ou com dados inválidos', () => {
    const profile = makeProfile({ rig: [gear('a', 'pedal')] })
    expect(updateGear(profile, 'nada', pedal()).ok).toBe(false)
    expect(updateGear(profile, 'a', pedal({ brand: '' })).ok).toBe(false)
  })

  it('remove sem tocar nas restantes', () => {
    const profile = makeProfile({ rig: [gear('a', 'pedal'), gear('b', 'amp')] })
    expect(ids(removeGear(profile, 'a').rig)).toEqual(['b'])
    expect(ids(profile.rig)).toEqual(['a', 'b'])
  })
})

describe('moveGear', () => {
  // Rig intercalada de propósito: a ordem dentro de cada grupo é que conta.
  const rig = [gear('p1', 'pedal'), gear('gtr', 'guitar'), gear('p2', 'pedal'), gear('amp', 'amp'), gear('p3', 'pedal')]

  it('troca com a vizinha do mesmo grupo, saltando peças de outros grupos', () => {
    const moved = moveGear(makeProfile({ rig }), 'p3', -1)
    expect(ids(moved.rig)).toEqual(['p1', 'gtr', 'p3', 'amp', 'p2'])
    expect(ids(buildSignalChain(moved.rig))).toEqual(['gtr', 'p1', 'p3', 'p2', 'amp'])
  })

  it('a cadeia visual reflete a ordem escolhida', () => {
    let profile = makeProfile({ rig })
    profile = moveGear(profile, 'p1', 1)
    profile = moveGear(profile, 'p1', 1)
    expect(ids(buildSignalChain(profile.rig))).toEqual(['gtr', 'p2', 'p3', 'p1', 'amp'])
  })

  it('não faz nada nos limites do grupo nem para IDs desconhecidos', () => {
    const profile = makeProfile({ rig })
    expect(moveGear(profile, 'p1', -1)).toBe(profile)
    expect(moveGear(profile, 'p3', 1)).toBe(profile)
    expect(moveGear(profile, 'gtr', 1)).toBe(profile)
    expect(moveGear(profile, 'nada', 1)).toBe(profile)
  })

  it('não altera o perfil original', () => {
    const profile = makeProfile({ rig })
    moveGear(profile, 'p3', -1)
    expect(ids(profile.rig)).toEqual(ids(rig))
  })
})

describe('grupos', () => {
  it('rigGroup classifica todos os tipos', () => {
    expect(rigGroup({ type: 'guitar' })).toBe('instrument')
    expect(rigGroup({ type: 'bass' })).toBe('instrument')
    expect(rigGroup({ type: 'pedal' })).toBe('pedal')
    expect(rigGroup({ type: 'amp' })).toBe('amp')
    expect(rigGroup({ type: 'cabinet' })).toBe('cabinet')
    expect(rigGroup({ type: 'interface' })).toBe('offchain')
    expect(rigGroup({ type: 'other' })).toBe('offchain')
  })

  it('groupRig agrupa pela ordem da cadeia e omite grupos vazios', () => {
    const groups = groupRig([gear('i', 'interface'), gear('p', 'pedal'), gear('g', 'guitar')])
    expect(groups.map((g) => [g.group, ids(g.items)])).toEqual([
      ['instrument', ['g']],
      ['pedal', ['p']],
      ['offchain', ['i']],
    ])
  })
})
