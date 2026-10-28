import { createDemoProfile } from '../data/demo-profile.ts'
import type { Profile } from '../domain/profile.ts'
import { serializeDocument } from '../lib/persistence/document.ts'
import { STORAGE_KEY } from '../lib/persistence/repository.ts'
import { createMemoryStorage } from '../lib/persistence/storage.ts'

/** Perfil válido e independente, com alterações opcionais. */
export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return { ...createDemoProfile(), ...overrides }
}

/** Storage em memória já com um perfil guardado. */
export function storageWithProfile(profile: Profile = makeProfile()) {
  return createMemoryStorage({ [STORAGE_KEY]: serializeDocument(profile, new Date('2026-10-23T12:00:00.000Z')) })
}

/** Storage em memória com conteúdo arbitrário na chave do perfil. */
export function storageWithRaw(raw: string) {
  return createMemoryStorage({ [STORAGE_KEY]: raw })
}

/** Resultado bruto da iTunes Search API, como a API o devolve. */
export const ITUNES_SONG = {
  kind: 'song',
  trackId: 213374170,
  trackName: 'Flying Whales',
  artistName: 'Gojira',
  collectionName: 'From Mars to Sirius',
  artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/x/cover.jpg/100x100bb.jpg',
  previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a',
  trackViewUrl: 'https://music.apple.com/us/album/flying-whales/213374112?i=213374170',
  trackTimeMillis: 464453,
}

/** Artista como a pesquisa da MusicBrainz o devolve (resumido). */
export const MB_ARTIST = {
  id: '9e0d2a13-6e59-4f60-8b16-2b3c5d6e7f80',
  type: 'Group',
  score: 100,
  name: 'Sepultura',
  country: 'BR',
  disambiguation: 'Brazilian metal band',
  'life-span': { begin: '1984', ended: null },
  tags: [
    { count: 2, name: 'death metal' },
    { count: 7, name: 'thrash metal' },
    { count: 4, name: 'groove metal' },
    { count: 3, name: 'brazilian' },
  ],
}

/** Release groups de um artista na MusicBrainz: um álbum, um ao vivo, um single e outro álbum. */
export const MB_RELEASE_GROUPS = {
  'release-group-count': 4,
  'release-groups': [
    { id: 'a1a1a1a1-0000-4000-8000-000000000001', title: 'Arise', 'primary-type': 'Album', 'secondary-types': [], 'first-release-date': '1991-03-25' },
    { id: 'a1a1a1a1-0000-4000-8000-000000000002', title: 'Under a Pale Grey Sky', 'primary-type': 'Album', 'secondary-types': ['Live'], 'first-release-date': '2002' },
    { id: 'a1a1a1a1-0000-4000-8000-000000000003', title: 'Refuse/Resist', 'primary-type': 'Single', 'secondary-types': [], 'first-release-date': '1994' },
    { id: 'a1a1a1a1-0000-4000-8000-000000000004', title: 'Schizophrenia', 'primary-type': 'Album', 'secondary-types': [], 'first-release-date': '1987-10-30' },
  ],
}
