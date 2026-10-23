import { describe, expect, it } from 'vitest'
import { DEMO_ALBUMS, DEMO_BANDS } from '../../data/demo-bands.ts'
import { LIMITS } from '../../domain/limits.ts'
import { parseProfile } from '../../lib/validation/parse.ts'
import { makeProfile } from '../../tests/fixtures.ts'
import { collectSubgenres, normalizeSearch, searchBands } from './search.ts'
import {
  addCustomAlbum,
  addCustomBand,
  addFavoriteBand,
  moveFavoriteBand,
  removeCustomAlbum,
  removeCustomBand,
  removeFavoriteBand,
  toggleFavoriteAlbum,
  toggleSubgenre,
  updateCustomAlbum,
  updateCustomBand,
} from './selection.ts'

const catalog = { bands: DEMO_BANDS, albums: DEMO_ALBUMS }
const empty = () => makeProfile({ favoriteBandIds: [], favoriteAlbumIds: [], subgenres: [] })
const names = (bands: { name: string }[]) => bands.map((b) => b.name)

describe('searchBands', () => {
  it('sem pesquisa devolve todo o catálogo pela ordem original', () => {
    expect(searchBands(DEMO_BANDS, { query: '' })).toEqual(DEMO_BANDS)
  })

  it('pesquisa por substring sem distinguir maiúsculas nem acentos', () => {
    expect(names(searchBands(DEMO_BANDS, { query: 'GOJ' }))).toEqual(['Gojira'])
    expect(names(searchBands(DEMO_BANDS, { query: 'gâtes' }))).toEqual(['At the Gates'])
  })

  it('ordena primeiro os nomes que começam pela pesquisa', () => {
    // "e" aparece em várias bandas, mas só "Emperor" (7.ª no catálogo) começa por "e".
    const result = names(searchBands(DEMO_BANDS, { query: 'e' }))
    expect(result[0]).toBe('Emperor')
    expect(result).toContain('Opeth')
  })

  it('filtra por subgénero', () => {
    const result = searchBands(DEMO_BANDS, { query: '', subgenre: 'Melodic Death Metal' })
    expect(names(result)).toEqual(['At the Gates', 'Insomnium'])
  })

  it('combina pesquisa e subgénero', () => {
    expect(names(searchBands(DEMO_BANDS, { query: 'ins', subgenre: 'Melodic Death Metal' }))).toEqual(['Insomnium'])
    expect(searchBands(DEMO_BANDS, { query: 'gojira', subgenre: 'Black Metal' })).toEqual([])
  })

  it('sem correspondências devolve lista vazia', () => {
    expect(searchBands(DEMO_BANDS, { query: 'zzzz' })).toEqual([])
  })

  it('normalizeSearch remove acentos, espaços e maiúsculas', () => {
    expect(normalizeSearch('  Ëmpéror ')).toBe('emperor')
  })

  it('collectSubgenres junta, remove repetidos e ordena', () => {
    expect(collectSubgenres(['Doom', 'Black'], ['doom', 'Ambient'])).toEqual(['Ambient', 'Black', 'Doom'])
  })
})

describe('bandas favoritas', () => {
  it('adiciona no fim e ignora repetidos', () => {
    const first = addFavoriteBand(empty(), 'opeth')
    expect(first.ok && first.profile.favoriteBandIds).toEqual(['opeth'])
    const again = first.ok ? addFavoriteBand(first.profile, 'opeth') : first
    expect(again.ok && again.profile.favoriteBandIds).toEqual(['opeth'])
  })

  it('respeita o limite de favoritas', () => {
    const full = makeProfile({ favoriteBandIds: Array.from({ length: LIMITS.favoriteBands.max }, (_, i) => `b${i}`) })
    const result = addFavoriteBand(full, 'opeth')
    expect(result.ok).toBe(false)
  })

  it('remove sem alterar a ordem das restantes', () => {
    const profile = makeProfile({ favoriteBandIds: ['a', 'b', 'c'] })
    expect(removeFavoriteBand(profile, 'b').favoriteBandIds).toEqual(['a', 'c'])
    expect(profile.favoriteBandIds).toEqual(['a', 'b', 'c'])
  })

  it('move para cima e para baixo e ignora movimentos fora dos limites', () => {
    const profile = makeProfile({ favoriteBandIds: ['a', 'b', 'c'] })
    expect(moveFavoriteBand(profile, 'c', -1).favoriteBandIds).toEqual(['a', 'c', 'b'])
    expect(moveFavoriteBand(profile, 'a', 1).favoriteBandIds).toEqual(['b', 'a', 'c'])
    expect(moveFavoriteBand(profile, 'a', -1)).toBe(profile)
    expect(moveFavoriteBand(profile, 'c', 1)).toBe(profile)
    expect(moveFavoriteBand(profile, 'x', 1)).toBe(profile)
  })
})

describe('álbuns favoritos e subgéneros', () => {
  it('toggleFavoriteAlbum alterna e respeita o limite', () => {
    const on = toggleFavoriteAlbum(empty(), 'opeth-blackwater-park')
    expect(on.ok && on.value).toBe(true)
    const off = on.ok ? toggleFavoriteAlbum(on.profile, 'opeth-blackwater-park') : on
    expect(off.ok && off.profile.favoriteAlbumIds).toEqual([])

    const full = makeProfile({ favoriteAlbumIds: Array.from({ length: LIMITS.favoriteAlbums.max }, (_, i) => `a${i}`) })
    expect(toggleFavoriteAlbum(full, 'novo').ok).toBe(false)
  })

  it('toggleSubgenre compara sem maiúsculas, valida e respeita o limite', () => {
    const on = toggleSubgenre(empty(), '  Doom Metal ')
    expect(on.ok && on.profile.subgenres).toEqual(['Doom Metal'])
    const off = on.ok ? toggleSubgenre(on.profile, 'doom metal') : on
    expect(off.ok && off.profile.subgenres).toEqual([])
    expect(toggleSubgenre(empty(), '   ').ok).toBe(false)
    expect(toggleSubgenre(empty(), 'x'.repeat(LIMITS.subgenre.max + 1)).ok).toBe(false)
    const full = makeProfile({ subgenres: Array.from({ length: LIMITS.subgenres.max }, (_, i) => `G${i}`) })
    expect(toggleSubgenre(full, 'Novo').ok).toBe(false)
  })
})

describe('bandas personalizadas', () => {
  it('cria, valida e junta às favoritas', () => {
    const result = addCustomBand(empty(), { name: ' Garagem Negra ', country: 'pt', formedYear: 2019, subgenres: ['Doom Metal'] }, catalog, 'band-1')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({
      id: 'band-1',
      name: 'Garagem Negra',
      country: 'PT',
      formedYear: 2019,
      subgenres: ['Doom Metal'],
      isCustom: true,
    })
    expect(result.profile.favoriteBandIds).toEqual(['band-1'])
    expect(parseProfile(result.profile).ok).toBe(true)
  })

  it('gera um ID válido por omissão', () => {
    const result = addCustomBand(empty(), { name: 'Nova', subgenres: [] }, catalog)
    expect(result.ok && result.value.id).toMatch(/^band-/)
  })

  it('rejeita nomes vazios, demasiado longos ou já existentes', () => {
    expect(addCustomBand(empty(), { name: '  ', subgenres: [] }, catalog)).toMatchObject({ ok: false })
    expect(addCustomBand(empty(), { name: 'x'.repeat(LIMITS.bandName.max + 1), subgenres: [] }, catalog).ok).toBe(false)
    const dup = addCustomBand(empty(), { name: 'gojira', subgenres: [] }, catalog)
    expect(dup).toEqual({ ok: false, error: 'Já existe uma banda com esse nome. Procura-a na lista.' })
  })

  it('rejeita anos e países inválidos', () => {
    expect(addCustomBand(empty(), { name: 'A', formedYear: 1800, subgenres: [] }, catalog).ok).toBe(false)
    expect(addCustomBand(empty(), { name: 'A', country: 'Portugal', subgenres: [] }, catalog).ok).toBe(false)
  })

  it('não junta às favoritas quando estão cheias, mas cria a banda', () => {
    const full = makeProfile({ favoriteBandIds: DEMO_BANDS.slice(0, 11).map((b) => b.id) })
    const profile = { ...full, favoriteBandIds: [...full.favoriteBandIds, ...Array.from({ length: 9 }, (_, i) => `x${i}`)] }
    const result = addCustomBand(profile, { name: 'Sem Lugar', subgenres: [] }, catalog, 'band-x')
    expect(result.ok && result.profile.customBands.map((b) => b.id)).toEqual(['band-x'])
    expect(result.ok && result.profile.favoriteBandIds.includes('band-x')).toBe(false)
  })

  it('edita mantendo o ID e recusa nomes de outras bandas', () => {
    const created = addCustomBand(empty(), { name: 'Antiga', subgenres: [] }, catalog, 'band-1')
    if (!created.ok) throw new Error('setup')
    const edited = updateCustomBand(created.profile, 'band-1', { name: 'Renomeada', subgenres: ['Djent'] }, catalog)
    expect(edited.ok && edited.profile.customBands).toEqual([
      { id: 'band-1', name: 'Renomeada', subgenres: ['Djent'], isCustom: true },
    ])
    // Mudar só detalhes, mantendo o próprio nome, é permitido.
    expect(updateCustomBand(created.profile, 'band-1', { name: 'Antiga', subgenres: [] }, catalog).ok).toBe(true)
    expect(updateCustomBand(created.profile, 'band-1', { name: 'Opeth', subgenres: [] }, catalog).ok).toBe(false)
    expect(updateCustomBand(created.profile, 'nao-existe', { name: 'X', subgenres: [] }, catalog).ok).toBe(false)
  })

  it('apagar remove a banda, os seus álbuns e as referências nos favoritos', () => {
    const band = addCustomBand(empty(), { name: 'Efémera', subgenres: [] }, catalog, 'band-1')
    if (!band.ok) throw new Error('setup')
    const album = addCustomAlbum(band.profile, { bandId: 'band-1', title: 'Demo' }, catalog, 'album-1')
    if (!album.ok) throw new Error('setup')
    expect(album.profile.favoriteAlbumIds).toEqual(['album-1'])

    const removed = removeCustomBand(album.profile, 'band-1')
    expect(removed.customBands).toEqual([])
    expect(removed.customAlbums).toEqual([])
    expect(removed.favoriteBandIds).toEqual([])
    expect(removed.favoriteAlbumIds).toEqual([])
  })
})

describe('álbuns personalizados', () => {
  it('cria para bandas do catálogo e marca como favorito', () => {
    const result = addCustomAlbum(empty(), { bandId: 'gojira', title: 'Terra Incognita', year: 2001 }, catalog, 'album-1')
    expect(result.ok && result.value).toEqual({ id: 'album-1', bandId: 'gojira', title: 'Terra Incognita', year: 2001 })
    expect(result.ok && result.profile.favoriteAlbumIds).toEqual(['album-1'])
  })

  it('rejeita bandas inexistentes, títulos vazios e duplicados na mesma banda', () => {
    expect(addCustomAlbum(empty(), { bandId: 'fantasma', title: 'X' }, catalog).ok).toBe(false)
    expect(addCustomAlbum(empty(), { bandId: 'gojira', title: '  ' }, catalog).ok).toBe(false)
    expect(addCustomAlbum(empty(), { bandId: 'gojira', title: 'magma' }, catalog)).toEqual({
      ok: false,
      error: 'Essa banda já tem um álbum com esse título.',
    })
    // O mesmo título noutra banda é permitido.
    expect(addCustomAlbum(empty(), { bandId: 'opeth', title: 'Magma' }, catalog).ok).toBe(true)
  })

  it('edita e apaga', () => {
    const created = addCustomAlbum(empty(), { bandId: 'gojira', title: 'Terra Incognita' }, catalog, 'album-1')
    if (!created.ok) throw new Error('setup')
    const edited = updateCustomAlbum(created.profile, 'album-1', { bandId: 'gojira', title: 'Terra Incognita', year: 2001 }, catalog)
    expect(edited.ok && edited.profile.customAlbums[0]?.year).toBe(2001)
    const removed = removeCustomAlbum(created.profile, 'album-1')
    expect(removed.customAlbums).toEqual([])
    expect(removed.favoriteAlbumIds).toEqual([])
  })
})
