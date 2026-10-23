import { describe, expect, it } from 'vitest'
import { DEMO_ALBUMS, DEMO_BANDS } from '../data/demo-bands.ts'
import { DEMO_PROFILE } from '../data/demo-profile.ts'
import { buildSignalChain, type GearItem } from './gear.ts'
import { resolveByIds } from './profile.ts'
import { getThemeMeta, isThemeId, THEME_IDS } from './theme.ts'

const gear = (id: string, type: GearItem['type']): GearItem => ({ id, type, brand: 'B', model: id, tags: [] })
const ids = (items: GearItem[]) => items.map((item) => item.id)

describe('buildSignalChain', () => {
  it('ordena por estágio: instrumento → pedais → amp → cabinet', () => {
    const rig = [gear('cab', 'cabinet'), gear('p1', 'pedal'), gear('amp', 'amp'), gear('gtr', 'guitar'), gear('p2', 'pedal')]
    expect(ids(buildSignalChain(rig))).toEqual(['gtr', 'p1', 'p2', 'amp', 'cab'])
  })

  it('mantém a ordem da rig dentro do mesmo estágio', () => {
    const rig = [gear('p3', 'pedal'), gear('p1', 'pedal'), gear('p2', 'pedal')]
    expect(ids(buildSignalChain(rig))).toEqual(['p3', 'p1', 'p2'])
  })

  it('exclui interfaces e outros', () => {
    const rig = [gear('i', 'interface'), gear('o', 'other'), gear('g', 'guitar')]
    expect(ids(buildSignalChain(rig))).toEqual(['g'])
  })

  it('não altera a rig original', () => {
    const rig = [gear('amp', 'amp'), gear('gtr', 'guitar')]
    buildSignalChain(rig)
    expect(ids(rig)).toEqual(['amp', 'gtr'])
  })
})

describe('resolveByIds', () => {
  it('preserva a ordem dos IDs e ignora IDs desconhecidos', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(resolveByIds(['c', 'x', 'a'], items)).toEqual([{ id: 'c' }, { id: 'a' }])
  })
})

describe('tema', () => {
  it('isThemeId valida apenas temas conhecidos', () => {
    expect(THEME_IDS.every(isThemeId)).toBe(true)
    expect(isThemeId('neon')).toBe(false)
    expect(isThemeId(undefined)).toBe(false)
  })

  it('getThemeMeta devolve os metadados do tema', () => {
    expect(getThemeMeta('blood-moon').label).toBe('Blood Moon')
  })
})

describe('dados de demonstração', () => {
  it('todas as referências do perfil demo existem no catálogo', () => {
    expect(resolveByIds(DEMO_PROFILE.favoriteBandIds, DEMO_BANDS)).toHaveLength(DEMO_PROFILE.favoriteBandIds.length)
    expect(resolveByIds(DEMO_PROFILE.favoriteAlbumIds, DEMO_ALBUMS)).toHaveLength(DEMO_PROFILE.favoriteAlbumIds.length)
  })

  it('todos os álbuns apontam para bandas existentes e os IDs são únicos', () => {
    const bandIds = new Set(DEMO_BANDS.map((band) => band.id))
    expect(DEMO_ALBUMS.every((album) => bandIds.has(album.bandId))).toBe(true)
    expect(new Set(DEMO_ALBUMS.map((album) => album.id)).size).toBe(DEMO_ALBUMS.length)
    expect(bandIds.size).toBe(DEMO_BANDS.length)
    expect(new Set(DEMO_PROFILE.rig.map((item) => item.id)).size).toBe(DEMO_PROFILE.rig.length)
  })

  it('o perfil demo está marcado como demonstração', () => {
    expect(DEMO_PROFILE.isDemo).toBe(true)
  })
})
