import type { Album } from './album.ts'
import type { Band } from './band.ts'
import type { GearItem } from './gear.ts'
import type { ThemeId } from './theme.ts'

export type AvatarSpec = { kind: 'generated' } | { kind: 'url'; url: string }

/**
 * Perfil RIFFSPACE. Tipos mínimos para a Etapa 1; a validação, os limites de
 * texto e o schema versionado chegam na Etapa 2.
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

export function favoriteBands(profile: Profile, catalog: readonly Band[]): Band[] {
  return resolveByIds(profile.favoriteBandIds, catalog)
}

export function favoriteAlbums(profile: Profile, albums: readonly Album[]): Album[] {
  return resolveByIds(profile.favoriteAlbumIds, albums)
}
