import { describe, expect, it } from 'vitest'
import { COMMON_SUBGENRES } from '../../data/subgenres.ts'
import type { Album } from '../../domain/album.ts'
import type { Band } from '../../domain/band.ts'
import { LIMITS } from '../../domain/limits.ts'
import { makeProfile } from '../../tests/fixtures.ts'
import { matchesSearch, normalizeSearch } from './search.ts'
import {
  addBand,
  addCustomAlbum,
  addCustomBand,
  moveBand,
  removeAlbum,
  removeBand,
  suggestSubgenres,
  toggleAlbum,
  toggleSubgenre,
  updateCustomBand,
} from './selection.ts'

const sepultura: Band = {
  id: 'mb-5d0b6c5e-8a7a-4e5e-9d7f-1a2b3c4d5e6f',
  name: 'Sepultura',
  country: 'BR',
  formedYear: 1984,
  subgenres: ['Thrash Metal', 'Groove Metal'],
  source: 'musicbrainz',
}

const arise: Album = {
  id: 'mb-0e0b6c5e-8a7a-4e5e-9d7f-1a2b3c4d5e6f',
  bandId: sepultura.id,
  title: 'Arise',
  year: 1991,
  source: 'musicbrainz',
}

const empty = () => makeProfile({ bands: [], albums: [], subgenres: [] })

describe('pesquisa', () => {
  it('ignora acentos, maiúsculas e espaços', () => {
    expect(normalizeSearch('  Ångström Métal ')).toBe('angstrom metal')
    expect(matchesSearch('Século X.X.', 'seculo')).toBe(true)
    expect(matchesSearch('Roots', '')).toBe(true)
    expect(matchesSearch('Roots', 'arise')).toBe(false)
  })
})

describe('bandas', () => {
  it('adiciona ao fim do ranking e não duplica', () => {
    const first = addBand(empty(), sepultura)
    expect(first.ok && first.profile.bands).toEqual([sepultura])
    const again = first.ok ? addBand(first.profile, sepultura) : first
    expect(again.ok && again.profile.bands).toHaveLength(1)
  })

  it('respeita o limite de bandas', () => {
    const full = makeProfile({
      bands: Array.from({ length: LIMITS.favoriteBands.max }, (_, i) => ({ ...sepultura, id: `b${i}` })),
      albums: [],
    })
    expect(addBand(full, sepultura)).toEqual({ ok: false, error: `You can pick up to ${LIMITS.favoriteBands.max} favourite bands.` })
  })

  it('valida a banda vinda da API antes de a aceitar', () => {
    const result = addBand(empty(), { ...sepultura, id: 'Inválido' })
    expect(result.ok).toBe(false)
  })

  it('remover uma banda remove também os seus álbuns', () => {
    const profile = makeProfile()
    const gojira = profile.bands[0]!
    const next = removeBand(profile, gojira.id)
    expect(next.bands.some((band) => band.id === gojira.id)).toBe(false)
    expect(next.albums.some((album) => album.bandId === gojira.id)).toBe(false)
    expect(next.albums).toHaveLength(profile.albums.length - 1)
  })

  it('move no ranking e ignora movimentos fora dos limites', () => {
    const profile = makeProfile()
    const [gojira, opeth] = profile.bands
    expect(moveBand(profile, opeth!.id, -1).bands.slice(0, 2)).toEqual([opeth, gojira])
    expect(moveBand(profile, gojira!.id, -1)).toBe(profile)
  })
})

describe('bandas criadas à mão', () => {
  it('cria com origem custom e recusa nomes que já estão no perfil', () => {
    const created = addCustomBand(empty(), { name: '  Garagem Negra ', country: 'pt', formedYear: 2019 }, 'band-garagem')
    expect(created.ok && created.value).toEqual({
      id: 'band-garagem',
      name: 'Garagem Negra',
      country: 'PT',
      formedYear: 2019,
      subgenres: [],
      source: 'custom',
    })
    const profile = makeProfile()
    expect(addCustomBand(profile, { name: 'GOJIRA' })).toEqual({ ok: false, error: 'A band with that name already exists.' })
    expect(addCustomBand(profile, { name: '' }).ok).toBe(false)
  })

  it('só bandas custom são editáveis', () => {
    const created = addCustomBand(empty(), { name: 'Garagem' }, 'band-garagem')
    if (!created.ok) throw new Error(created.error)
    const updated = updateCustomBand(created.profile, 'band-garagem', { name: 'Garagem Branca' })
    expect(updated.ok && updated.value.name).toBe('Garagem Branca')
    const profile = makeProfile()
    expect(updateCustomBand(profile, profile.bands[0]!.id, { name: 'X' })).toEqual({ ok: false, error: 'Band not found.' })
  })
})

describe('álbuns', () => {
  const withSepultura = () => {
    const result = addBand(empty(), sepultura)
    if (!result.ok) throw new Error(result.error)
    return result.profile
  }

  it('alterna um álbum de uma banda do perfil', () => {
    const added = toggleAlbum(withSepultura(), arise)
    expect(added.ok && added.value).toBe(true)
    expect(added.ok && added.profile.albums).toEqual([arise])
    const removed = added.ok ? toggleAlbum(added.profile, arise) : added
    expect(removed.ok && removed.profile.albums).toEqual([])
  })

  it('recusa álbuns de bandas que não estão no perfil', () => {
    expect(toggleAlbum(empty(), arise)).toEqual({ ok: false, error: 'Pick a band.' })
  })

  it('respeita o limite de álbuns', () => {
    const profile = withSepultura()
    const full = {
      ...profile,
      albums: Array.from({ length: LIMITS.favoriteAlbums.max }, (_, i) => ({ ...arise, id: `a${i}` })),
    }
    expect(toggleAlbum(full, { ...arise, id: 'outro' }).ok).toBe(false)
  })

  it('cria álbuns à mão e recusa títulos repetidos na mesma banda', () => {
    const profile = withSepultura()
    const created = addCustomAlbum(profile, { bandId: sepultura.id, title: 'Demo 1984', year: 1984 }, 'album-demo')
    expect(created.ok && created.value).toEqual({
      id: 'album-demo',
      bandId: sepultura.id,
      title: 'Demo 1984',
      year: 1984,
      source: 'custom',
    })
    const withArise = toggleAlbum(profile, arise)
    if (!withArise.ok) throw new Error(withArise.error)
    expect(addCustomAlbum(withArise.profile, { bandId: sepultura.id, title: 'ARISE' })).toEqual({
      ok: false,
      error: 'That band already has an album with that title.',
    })
    expect(addCustomAlbum(profile, { bandId: 'fantasma', title: 'X' }).ok).toBe(false)
  })

  it('removeAlbum tira só esse álbum', () => {
    const profile = makeProfile()
    const first = profile.albums[0]!
    expect(removeAlbum(profile, first.id).albums).toEqual(profile.albums.slice(1))
  })
})

describe('subgéneros', () => {
  it('alterna sem distinguir maiúsculas e respeita o limite', () => {
    const added = toggleSubgenre(empty(), 'Doom Metal')
    if (!added.ok) throw new Error(added.error)
    const removed = toggleSubgenre(added.profile, 'doom metal')
    expect(removed.ok && removed.profile.subgenres).toEqual([])
    const full = makeProfile({ subgenres: Array.from({ length: LIMITS.subgenres.max }, (_, i) => `G${i}`) })
    expect(toggleSubgenre(full, 'Outro')).toEqual({ ok: false, error: `You can pick up to ${LIMITS.subgenres.max} subgenres.` })
  })

  it('sugere primeiro os géneros mais comuns entre as bandas do perfil, sem o genérico "Metal"', () => {
    const suggestions = suggestSubgenres(makeProfile(), COMMON_SUBGENRES)
    expect(suggestions[0]).toBe('Progressive Metal')
    expect(suggestions).not.toContain('Metal')
    expect(new Set(suggestions.map(normalizeSearch)).size).toBe(suggestions.length)
    expect(suggestSubgenres(empty(), COMMON_SUBGENRES)).toEqual([...COMMON_SUBGENRES])
  })
})
