import type { Profile } from '../domain/profile.ts'
import type { ThemeId } from '../domain/theme.ts'
import { createId } from '../lib/id.ts'

/**
 * Perfil vazio para "Começar do zero". O nickname fica em branco de propósito:
 * o editor obriga a preenchê-lo antes de guardar.
 */
export function createBlankProfile(theme: ThemeId, now: Date = new Date()): Profile {
  const timestamp = now.toISOString()
  return {
    id: createId('profile'),
    nickname: '',
    avatar: { kind: 'generated' },
    tagline: '',
    bio: '',
    favoriteBandIds: [],
    favoriteAlbumIds: [],
    subgenres: [],
    customBands: [],
    customAlbums: [],
    rig: [],
    theme,
    isDemo: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
