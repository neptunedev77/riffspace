import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { ProfileState, ProfileStore } from './profileStore.ts'

export const ProfileStoreContext = createContext<ProfileStore | null>(null)

/** A store em si, para ler o estado atual fora do ciclo de render (p. ex. num blocker de navegação). */
export function useProfileStoreApi(): ProfileStore {
  const store = useContext(ProfileStoreContext)
  if (!store) throw new Error('useProfileStore must be used inside <ProfileStoreProvider>.')
  return store
}

/** Lê um valor da store do perfil. Usar seletores de um único valor para evitar re-renders. */
export function useProfileStore<T>(selector: (state: ProfileState) => T): T {
  return useStore(useProfileStoreApi(), selector)
}
