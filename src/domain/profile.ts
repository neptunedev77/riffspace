import type { Album } from './album.ts'
import type { Band } from './band.ts'
import type { GearItem } from './gear.ts'
import type { SocialLink } from './social.ts'
import type { FeaturedTrack } from './track.ts'
import type { ThemeId } from './theme.ts'

export type AvatarSpec = { kind: 'generated' } | { kind: 'url'; url: string }

/**
 * Perfil RIFFSPACE (schema v3).
 *
 * Invariantes — garantidas por lib/validation ao ler e ao atualizar:
 * - `id` e todos os IDs internos seguem ID_PATTERN; os IDs da rig são únicos.
 * - Textos respeitam LIMITS e chegam sem espaços à volta.
 * - `bands` não tem IDs repetidos; a ordem é o ranking.
 * - `albums` não tem IDs repetidos e cada álbum pertence a uma banda de `bands`
 *   (remover uma banda remove os seus álbuns).
 * - Entidades da MusicBrainz têm IDs `mb-<mbid>`; as personalizadas, IDs gerados.
 * - `subgenres` não tem repetidos (comparação sem distinção de maiúsculas).
 * - Cada link social é http(s), pertence a um domínio da sua plataforma e não
 *   há links repetidos (mesmo URL).
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
  /** Bandas favoritas, guardadas no próprio perfil; a posição é o ranking. */
  bands: Band[]
  /** Álbuns favoritos, de bandas que estão em `bands`. */
  albums: Album[]
  subgenres: string[]
  /** Ordem da rig = ordem de apresentação. */
  rig: GearItem[]
  /** Links para redes e plataformas, pela ordem de apresentação. */
  socials: SocialLink[]
  /** Música em destaque (opcional). */
  featuredTrack?: FeaturedTrack
  theme: ThemeId
  /** Perfis de demonstração são sempre assinalados como tal na UI. */
  isDemo: boolean
  createdAt: string
  updatedAt: string
}

/** Banda do perfil com o ID indicado. */
export function findBand(profile: Profile, id: string): Band | undefined {
  return profile.bands.find((band) => band.id === id)
}
