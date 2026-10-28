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

export type EditMode = 'current' | 'blank'

export interface ProfileState {
  profile: Profile
  /**
   * Rascunho do editor. Enquanto existe, a página mostra-o como pré-visualização;
   * só `saveDraft` o valida e persiste. null quando o editor está fechado.
   */
  draft: Profile | null
  /** true quando o rascunho tem alterações por guardar. */
  draftDirty: boolean
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
  /** Abre o editor sobre o perfil atual ou sobre um perfil em branco. */
  startEditing: (mode?: EditMode) => void
  /** Altera o rascunho sem validar nem persistir (estados intermédios são permitidos). */
  updateDraft: (updater: (draft: Profile) => Profile) => void
  /** Valida o rascunho; se for válido guarda-o como perfil do utilizador e fecha o editor. */
  saveDraft: () => UpdateResult
  discardDraft: () => void
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
  /** Perfil vazio para "Começar do zero"; recebe o tema atual para o manter. */
  createBlankProfile: (theme: ThemeId) => Profile
  /** Ajustes ao guardar o perfil demo como perfil do utilizador (p. ex. remover links ilustrativos). */
  claimDemoProfile?: (profile: Profile) => Profile
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

    /** Valida, normaliza e persiste. Devolve os problemas se o candidato for inválido. */
    const commit = (candidate: Profile): UpdateResult => {
      const parsed = parseProfile({ ...candidate, updatedAt: now().toISOString() })
      if (!parsed.ok) return { ok: false, issues: parsed.issues }
      persist(normalizeProfile(parsed.value, options.catalog).profile)
      return { ok: true }
    }

    return {
      profile: initial.profile,
      draft: null,
      draftDirty: false,
      persistent,
      hasSavedData: initial.fromStorage,
      saveStatus: initial.savedAt ? { state: 'saved', at: initial.savedAt } : { state: 'idle' },
      notice: options.initialNotice ?? initial.notice ?? null,

      updateProfile: (updater) => commit(updater(get().profile)),

      setTheme: (theme) => {
        const { profile, draft } = get()
        // O tema é uma preferência imediata: aplica-se ao perfil e também ao rascunho aberto.
        if (draft && draft.theme !== theme) set({ draft: { ...draft, theme } })
        if (profile.theme !== theme) get().updateProfile((current) => ({ ...current, theme }))
      },

      startEditing: (mode = 'current') => {
        const { profile } = get()
        const draft = mode === 'blank' ? options.createBlankProfile(profile.theme) : structuredClone(profile)
        set({ draft, draftDirty: mode === 'blank' })
      },

      updateDraft: (updater) => {
        const { draft } = get()
        if (!draft) return
        set({ draft: updater(draft), draftDirty: true })
      },

      saveDraft: () => {
        const { draft } = get()
        if (!draft) return { ok: true }
        // Guardar o editor transforma o perfil no perfil do utilizador.
        const claimed = draft.isDemo && options.claimDemoProfile ? options.claimDemoProfile(draft) : draft
        const result = commit({ ...claimed, isDemo: false })
        if (result.ok) set({ draft: null, draftDirty: false })
        return result
      },

      discardDraft: () => set({ draft: null, draftDirty: false }),

      resetToDemo: () => {
        options.repository.clear()
        set({
          profile: options.createDemoProfile(),
          draft: null,
          draftDirty: false,
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
