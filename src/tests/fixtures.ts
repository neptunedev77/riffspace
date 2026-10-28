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
