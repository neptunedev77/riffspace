import { createBlankProfile } from '../data/blank-profile.ts'
import { claimDemoProfile, createDemoProfile } from '../data/demo-profile.ts'
import { createProfileRepository } from '../lib/persistence/repository.ts'
import { createMemoryStorage, getBrowserStorage, type KeyValueStorage } from '../lib/persistence/storage.ts'
import { createProfileStore } from './profileStore.ts'

/**
 * Cria a store da aplicação. Sem `storage` usa o localStorage do browser e,
 * se não estiver disponível, cai para memória e avisa o utilizador.
 */
export function createAppStore(storage?: KeyValueStorage) {
  const browserStorage = storage ?? getBrowserStorage()
  const persistent = browserStorage !== null
  const repository = createProfileRepository(browserStorage ?? createMemoryStorage(), {
    fallback: createDemoProfile,
  })
  return createProfileStore({
    repository,
    createDemoProfile,
    createBlankProfile,
    claimDemoProfile,
    persistent,
    initialNotice: persistent ? undefined : { kind: 'storage-unavailable' },
  })
}
