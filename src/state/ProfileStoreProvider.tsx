import { useEffect, type ReactNode } from 'react'
import { STORAGE_KEY } from '../lib/persistence/repository.ts'
import { ProfileStoreContext } from './profileContext.ts'
import type { ProfileStore } from './profileStore.ts'

interface ProfileStoreProviderProps {
  store: ProfileStore
  children: ReactNode
}

export function ProfileStoreProvider({ store, children }: ProfileStoreProviderProps) {
  // Sincroniza separadores: outro separador gravou ou apagou o perfil.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) store.getState().reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [store])

  return <ProfileStoreContext.Provider value={store}>{children}</ProfileStoreContext.Provider>
}
