import type { Album } from '../../domain/album.ts'
import type { Band } from '../../domain/band.ts'
import type { Profile } from '../../domain/profile.ts'

export interface Catalog {
  bands: readonly Band[]
  albums: readonly Album[]
}

export interface NormalizeResult {
  profile: Profile
  /** Descrição das reparações feitas; vazio quando o perfil já era consistente. */
  repairs: string[]
}

function uniqueBy<T>(items: readonly T[], key: (item: T) => string): { items: T[]; removed: number } {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const k = key(item)
    if (seen.has(k)) continue
    seen.add(k)
    result.push(item)
  }
  return { items: result, removed: items.length - result.length }
}

/**
 * Repõe as invariantes entre entidades de um perfil já validado pelo schema.
 * Repara em vez de rejeitar: dados guardados com referências partidas
 * (p. ex. uma banda que saiu do catálogo) não devem impedir o arranque.
 * É uma função pura; não altera o perfil recebido.
 */
export function normalizeProfile(input: Profile, catalog: Catalog): NormalizeResult {
  const repairs: string[] = []
  const catalogBandIds = new Set(catalog.bands.map((band) => band.id))

  // Bandas personalizadas: sempre isCustom, sem IDs repetidos nem colisões com o catálogo.
  const customBandsUnique = uniqueBy(
    input.customBands.filter((band) => !catalogBandIds.has(band.id)),
    (band) => band.id,
  )
  const droppedCustomBands = input.customBands.length - customBandsUnique.items.length
  if (droppedCustomBands > 0) repairs.push(`${droppedCustomBands} banda(s) personalizada(s) com ID repetido removida(s).`)
  const customBands = customBandsUnique.items.map((band) => (band.isCustom ? band : { ...band, isCustom: true }))

  const bandIds = new Set([...catalogBandIds, ...customBands.map((band) => band.id)])
  const catalogAlbumIds = new Set(catalog.albums.map((album) => album.id))

  // Álbuns personalizados: banda existente, ID único e sem colidir com o catálogo.
  const customAlbumsUnique = uniqueBy(
    input.customAlbums.filter((album) => bandIds.has(album.bandId) && !catalogAlbumIds.has(album.id)),
    (album) => album.id,
  )
  const droppedCustomAlbums = input.customAlbums.length - customAlbumsUnique.items.length
  if (droppedCustomAlbums > 0) repairs.push(`${droppedCustomAlbums} álbum(ns) personalizado(s) inválido(s) removido(s).`)
  const customAlbums = customAlbumsUnique.items
  const albumIds = new Set([...catalogAlbumIds, ...customAlbums.map((album) => album.id)])

  const favoriteBands = uniqueBy(
    input.favoriteBandIds.filter((id) => bandIds.has(id)),
    (id) => id,
  ).items
  if (favoriteBands.length !== input.favoriteBandIds.length) {
    repairs.push('Bandas favoritas repetidas ou inexistentes removidas.')
  }

  const favoriteAlbums = uniqueBy(
    input.favoriteAlbumIds.filter((id) => albumIds.has(id)),
    (id) => id,
  ).items
  if (favoriteAlbums.length !== input.favoriteAlbumIds.length) {
    repairs.push('Álbuns favoritos repetidos ou inexistentes removidos.')
  }

  const subgenres = uniqueBy(input.subgenres, (genre) => genre.toLowerCase())
  if (subgenres.removed > 0) repairs.push('Subgéneros repetidos removidos.')

  const rig = uniqueBy(input.rig, (item) => item.id)
  if (rig.removed > 0) repairs.push(`${rig.removed} peça(s) da rig com ID repetido removida(s).`)

  return {
    profile: {
      ...input,
      customBands,
      customAlbums,
      favoriteBandIds: favoriteBands,
      favoriteAlbumIds: favoriteAlbums,
      subgenres: subgenres.items,
      rig: rig.items,
    },
    repairs,
  }
}
