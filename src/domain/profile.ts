import type { Album } from './album.ts'
import type { Band } from './band.ts'
import type { GearItem } from './gear.ts'
import type { ThemeId } from './theme.ts'

export type AvatarSpec = { kind: 'generated' } | { kind: 'url'; url: string }

/**
 * Perfil RIFFSPACE (schema v1).
 *
 * Invariantes — garantidas por lib/validation ao ler e ao atualizar:
 * - `id` e todos os IDs internos seguem ID_PATTERN; os IDs da rig são únicos.
 * - Textos respeitam LIMITS e chegam sem espaços à volta.
 * - `favoriteBandIds` não tem repetidos e só referencia bandas do catálogo ou
 *   de `customBands`; o mesmo para `favoriteAlbumIds` com álbuns.
 * - Cada álbum de `customAlbums` pertence a uma banda existente.
 * - Bandas personalizadas têm `isCustom: true` e nunca reutilizam um ID do catálogo.
 * - `subgenres` não tem repetidos (comparação sem distinção de maiúsculas).
 * - `createdAt` / `updatedAt` são datas ISO 8601.
 */
export interface Profile {
  id: string
  nickname: string
  displayName?: string
  avatar: AvatarSpec
  tagline: string
  bio: string
  location?: string
  /** IDs ordenados: a posição é o ranking. */
  favoriteBandIds: string[]
  favoriteAlbumIds: string[]
  subgenres: string[]
  /** Bandas adicionadas pelo utilizador que não existem no catálogo. */
  customBands: Band[]
  /** Álbuns adicionados pelo utilizador (de bandas do catálogo ou personalizadas). */
  customAlbums: Album[]
  /** Ordem da rig = ordem de apresentação. */
  rig: GearItem[]
  theme: ThemeId
  /** Perfis de demonstração são sempre assinalados como tal na UI. */
  isDemo: boolean
  createdAt: string
  updatedAt: string
}

/** Resolve IDs em entidades preservando a ordem e ignorando IDs desconhecidos. */
export function resolveByIds<T extends { id: string }>(ids: readonly string[], items: readonly T[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  return ids.flatMap((id) => {
    const item = byId.get(id)
    return item ? [item] : []
  })
}

/** Catálogo efetivo do perfil: catálogo local + entradas personalizadas. */
export function allBands(profile: Profile, catalog: readonly Band[]): Band[] {
  return [...catalog, ...profile.customBands]
}

export function allAlbums(profile: Profile, catalog: readonly Album[]): Album[] {
  return [...catalog, ...profile.customAlbums]
}

export function favoriteBands(profile: Profile, catalog: readonly Band[]): Band[] {
  return resolveByIds(profile.favoriteBandIds, allBands(profile, catalog))
}

export function favoriteAlbums(profile: Profile, catalog: readonly Album[]): Album[] {
  return resolveByIds(profile.favoriteAlbumIds, allAlbums(profile, catalog))
}
