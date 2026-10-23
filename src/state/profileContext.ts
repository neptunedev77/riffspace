import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { ProfileState, ProfileStore } from './profileStore.ts'

export const ProfileStoreContext = createContext<ProfileStore | null>(null)

/** Lê um valor da store do perfil. Usar seletores de um único valor para evitar re-renders. */
export function useProfileStore<T>(selector: (state: ProfileState) => T): T {
  const store = useContext(ProfileStoreContext)
  if (!store) throw new Error('useProfileStore tem de ser usado dentro de <ProfileStoreProvider>.')
  return useStore(store, selector)
}
