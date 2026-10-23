import { createStore } from 'zustand/vanilla'
import type { Profile } from '../domain/profile.ts'
import type { ThemeId } from '../domain/theme.ts'
import type { LoadNotice, ProfileRepository } from '../lib/persistence/repository.ts'
import type { Catalog } from '../lib/validation/normalize.ts'
import { normalizeProfile } from '../lib/validation/normalize.ts'
import { parseProfile, type ValidationIssue } from '../lib/validation/parse.ts'

export type SaveStatus =
  | { state: 'idle' }
  | { state: 'saved'; at: string }
  | { state: 'error'; error: 'quota' | 'unavailable' }

export type UpdateResult = { ok: true } | { ok: false; issues: ValidationIssue[] }

export interface ProfileState {
  profile: Profile
  /** false quando não há localStorage utilizável: as alterações vivem só em memória. */
  persistent: boolean
  /** true quando o perfil atual veio do storage (e não do fallback demo). */
  hasSavedData: boolean
  saveStatus: SaveStatus
  notice: LoadNotice | null

  /**
   * Aplica uma alteração ao perfil. O resultado é validado e normalizado antes
   * de ser aceite e guardado; uma alteração inválida é rejeitada sem mexer no estado.
   */
  updateProfile: (updater: (profile: Profile) => Profile) => UpdateResult
  setTheme: (theme: ThemeId) => void
  /** Apaga os dados guardados e repõe o perfil de demonstração. */
  resetToDemo: () => void
  /** Relê o storage (p. ex. quando outro separador alterou os dados). */
  reload: () => void
  dismissNotice: () => void
}

export interface ProfileStoreOptions {
  repository: ProfileRepository
  catalog: Catalog
  createDemoProfile: () => Profile
  persistent?: boolean
  now?: () => Date
  /** Aviso inicial extra (p. ex. storage indisponível detetado antes de criar a store). */
  initialNotice?: LoadNotice
}

export function createProfileStore(options: ProfileStoreOptions) {
  const now = options.now ?? (() => new Date())
  const persistent = options.persistent ?? true
  const initial = options.repository.load()

  return createStore<ProfileState>()((set, get) => {
    const persist = (profile: Profile) => {
      const result = options.repository.save(profile)
      set({
        profile,
        hasSavedData: result.ok || get().hasSavedData,
        saveStatus: result.ok ? { state: 'saved', at: result.savedAt } : { state: 'error', error: result.error },
      })
    }

    return {
      profile: initial.profile,
      persistent,
      hasSavedData: initial.fromStorage,
      saveStatus: initial.savedAt ? { state: 'saved', at: initial.savedAt } : { state: 'idle' },
      notice: options.initialNotice ?? initial.notice ?? null,

      updateProfile: (updater) => {
        const candidate = { ...updater(get().profile), updatedAt: now().toISOString() }
        const parsed = parseProfile(candidate)
        if (!parsed.ok) return { ok: false, issues: parsed.issues }
        persist(normalizeProfile(parsed.value, options.catalog).profile)
        return { ok: true }
      },

      setTheme: (theme) => {
        if (get().profile.theme === theme) return
        get().updateProfile((profile) => ({ ...profile, theme }))
      },

      resetToDemo: () => {
        options.repository.clear()
        set({
          profile: options.createDemoProfile(),
          hasSavedData: false,
          saveStatus: { state: 'idle' },
          notice: null,
        })
      },

      reload: () => {
        const result = options.repository.load()
        set({
          profile: result.profile,
          hasSavedData: result.fromStorage,
          saveStatus: result.savedAt ? { state: 'saved', at: result.savedAt } : { state: 'idle' },
          notice: result.notice ?? null,
        })
      },

      dismissNotice: () => set({ notice: null }),
    }
  })
}

export type ProfileStore = ReturnType<typeof createProfileStore>
