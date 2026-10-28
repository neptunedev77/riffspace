import { describe, expect, it } from 'vitest'
import { DEMO_PROFILE } from '../data/demo-profile.ts'
import { buildSignalChain, type GearItem } from './gear.ts'
import { albumCoverUrl } from './album.ts'
import { mbidOf, musicBrainzEntityId } from './band.ts'
import { findBand } from './profile.ts'
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

describe('IDs da MusicBrainz', () => {
  const mbid = '1c5efd53-d6b6-4d63-9d22-a15025cf5f07'

  it('mbidOf só devolve o MBID de entidades da MusicBrainz com um UUID válido', () => {
    expect(mbidOf({ id: musicBrainzEntityId(mbid), source: 'musicbrainz' })).toBe(mbid)
    expect(mbidOf({ id: musicBrainzEntityId(mbid), source: 'custom' })).toBeUndefined()
    expect(mbidOf({ id: 'mb-not-a-uuid', source: 'musicbrainz' })).toBeUndefined()
  })

  it('a capa é derivada do MBID (nunca de um URL guardado) e só existe para a MusicBrainz', () => {
    const album = { id: musicBrainzEntityId(mbid), bandId: 'x', title: 'T', source: 'musicbrainz' as const }
    expect(albumCoverUrl(album)).toBe(`https://coverartarchive.org/release-group/${mbid}/front-250`)
    expect(albumCoverUrl(album, 500)).toMatch(/front-500$/)
    expect(albumCoverUrl({ ...album, source: 'custom' })).toBeUndefined()
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
  it('as bandas e os álbuns do demo vêm da MusicBrainz e cada álbum pertence a uma banda do perfil', () => {
    const { bands, albums } = DEMO_PROFILE
    expect(bands.every((band) => band.source === 'musicbrainz' && mbidOf(band))).toBe(true)
    expect(albums.every((album) => findBand(DEMO_PROFILE, album.bandId) && mbidOf(album))).toBe(true)
  })

  it('os IDs são únicos', () => {
    expect(new Set(DEMO_PROFILE.bands.map((band) => band.id)).size).toBe(DEMO_PROFILE.bands.length)
    expect(new Set(DEMO_PROFILE.albums.map((album) => album.id)).size).toBe(DEMO_PROFILE.albums.length)
    expect(new Set(DEMO_PROFILE.rig.map((item) => item.id)).size).toBe(DEMO_PROFILE.rig.length)
  })

  it('o perfil demo está marcado como demonstração', () => {
    expect(DEMO_PROFILE.isDemo).toBe(true)
  })
})
