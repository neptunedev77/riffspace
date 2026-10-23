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
