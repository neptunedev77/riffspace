import { describe, expect, it } from 'vitest'
import { createDemoProfile } from '../data/demo-profile.ts'
import { STORAGE_KEY } from '../lib/persistence/repository.ts'
import { createMemoryStorage } from '../lib/persistence/storage.ts'
import { makeProfile, storageWithProfile, storageWithRaw } from '../tests/fixtures.ts'
import { createAppStore } from './createAppStore.ts'

describe('profileStore', () => {
  it('arranca com o perfil demo quando não há dados', () => {
    const store = createAppStore(createMemoryStorage())
    const state = store.getState()
    expect(state.profile).toEqual(createDemoProfile())
    expect(state.hasSavedData).toBe(false)
    expect(state.saveStatus).toEqual({ state: 'idle' })
    expect(state.notice).toBeNull()
  })

  it('não grava nada só por arrancar', () => {
    const storage = createMemoryStorage()
    createAppStore(storage)
    expect(storage.snapshot()).toEqual({})
  })

  it('setTheme persiste e sobrevive a um refresh', () => {
    const storage = createMemoryStorage()
    createAppStore(storage).getState().setTheme('blood-moon')

    const afterRefresh = createAppStore(storage).getState()
    expect(afterRefresh.profile.theme).toBe('blood-moon')
    expect(afterRefresh.hasSavedData).toBe(true)
    expect(afterRefresh.saveStatus.state).toBe('saved')
  })

  it('updateProfile valida, normaliza e atualiza updatedAt', () => {
    const store = createAppStore(createMemoryStorage())
    const before = store.getState().profile.updatedAt
    const result = store.getState().updateProfile((profile) => ({
      ...profile,
      tagline: '  Nova tagline  ',
      favoriteBandIds: ['opeth', 'opeth'],
    }))
    expect(result).toEqual({ ok: true })
    const profile = store.getState().profile
    expect(profile.tagline).toBe('Nova tagline')
    expect(profile.favoriteBandIds).toEqual(['opeth'])
    expect(profile.updatedAt).not.toBe(before)
  })

  it('rejeita alterações inválidas sem mexer no estado nem no storage', () => {
    const storage = storageWithProfile()
    const store = createAppStore(storage)
    const before = store.getState().profile
    const rawBefore = storage.getItem(STORAGE_KEY)

    const result = store.getState().updateProfile((profile) => ({ ...profile, nickname: 'x' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0]?.path).toBe('nickname')
    expect(store.getState().profile).toBe(before)
    expect(storage.getItem(STORAGE_KEY)).toBe(rawBefore)
  })

  it('resetToDemo apaga os dados guardados e repõe o demo', () => {
    const storage = storageWithProfile(makeProfile({ theme: 'frozen-abyss', bio: 'Personalizado' }))
    const store = createAppStore(storage)
    expect(store.getState().profile.bio).toBe('Personalizado')

    store.getState().resetToDemo()
    expect(store.getState().profile).toEqual(createDemoProfile())
    expect(store.getState().hasSavedData).toBe(false)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(createAppStore(storage).getState().profile).toEqual(createDemoProfile())
  })

  it('o perfil reposto não partilha referências com o demo original', () => {
    const store = createAppStore(createMemoryStorage())
    store.getState().resetToDemo()
    store.getState().profile.rig.pop()
    expect(createDemoProfile().rig.length).toBeGreaterThan(store.getState().profile.rig.length)
  })

  it('dados corrompidos geram aviso e o aviso pode ser fechado', () => {
    const store = createAppStore(storageWithRaw('{"app":"riffspace"'))
    expect(store.getState().notice).toEqual({ kind: 'recovered', reason: 'json', backupSaved: true })
    store.getState().dismissNotice()
    expect(store.getState().notice).toBeNull()
  })

  it('reload relê o storage (sincronização entre separadores)', () => {
    const storage = createMemoryStorage()
    const store = createAppStore(storage)
    createAppStore(storage).getState().setTheme('frozen-abyss')
    expect(store.getState().profile.theme).toBe('obsidian')
    store.getState().reload()
    expect(store.getState().profile.theme).toBe('frozen-abyss')
  })

  it('reporta falhas de escrita no saveStatus', () => {
    const storage = {
      ...createMemoryStorage(),
      setItem: () => {
        throw new DOMException('cheio', 'QuotaExceededError')
      },
    }
    const store = createAppStore(storage)
    store.getState().setTheme('blood-moon')
    expect(store.getState().saveStatus).toEqual({ state: 'error', error: 'quota' })
  })
})

describe('profileStore — rascunho do editor', () => {
  it('startEditing cria uma cópia independente do perfil', () => {
    const store = createAppStore(createMemoryStorage())
    store.getState().startEditing()
    const { draft, profile, draftDirty } = store.getState()
    expect(draft).toEqual(profile)
    expect(draft).not.toBe(profile)
    expect(draftDirty).toBe(false)
  })

  it('updateDraft não toca no perfil nem no storage', () => {
    const storage = createMemoryStorage()
    const store = createAppStore(storage)
    store.getState().startEditing()
    store.getState().updateDraft((d) => ({ ...d, nickname: 'x' }))
    expect(store.getState().draft?.nickname).toBe('x')
    expect(store.getState().draftDirty).toBe(true)
    expect(store.getState().profile.nickname).toBe('nocturne')
    expect(storage.snapshot()).toEqual({})
  })

  it('saveDraft inválido mantém o rascunho aberto e devolve os problemas', () => {
    const store = createAppStore(createMemoryStorage())
    store.getState().startEditing()
    store.getState().updateDraft((d) => ({ ...d, nickname: 'x' }))
    const result = store.getState().saveDraft()
    expect(result.ok).toBe(false)
    expect(store.getState().draft).not.toBeNull()
    expect(store.getState().profile.nickname).toBe('nocturne')
  })

  it('saveDraft válido persiste, tira a etiqueta de demo e fecha o editor', () => {
    const storage = createMemoryStorage()
    const store = createAppStore(storage)
    store.getState().startEditing()
    store.getState().updateDraft((d) => ({ ...d, nickname: 'Lamina', tagline: 'Nova' }))
    expect(store.getState().saveDraft()).toEqual({ ok: true })

    const state = store.getState()
    expect(state.draft).toBeNull()
    expect(state.profile).toMatchObject({ nickname: 'lamina', tagline: 'Nova', isDemo: false })
    expect(createAppStore(storage).getState().profile).toMatchObject({ nickname: 'lamina', isDemo: false })
  })

  it('discardDraft descarta sem gravar', () => {
    const storage = createMemoryStorage()
    const store = createAppStore(storage)
    store.getState().startEditing()
    store.getState().updateDraft((d) => ({ ...d, tagline: 'Descartada' }))
    store.getState().discardDraft()
    expect(store.getState().draft).toBeNull()
    expect(store.getState().profile.tagline).not.toBe('Descartada')
    expect(storage.snapshot()).toEqual({})
  })

  it('startEditing("blank") começa um perfil vazio, novo e não-demo', () => {
    const store = createAppStore(createMemoryStorage())
    store.getState().setTheme('frozen-abyss')
    store.getState().startEditing('blank')
    const draft = store.getState().draft!
    expect(draft).toMatchObject({ nickname: '', favoriteBandIds: [], rig: [], isDemo: false, theme: 'frozen-abyss' })
    expect(draft.id).not.toBe(store.getState().profile.id)
    expect(store.getState().draftDirty).toBe(true)
  })

  it('setTheme com o editor aberto aplica-se ao perfil e ao rascunho', () => {
    const store = createAppStore(createMemoryStorage())
    store.getState().startEditing()
    store.getState().setTheme('blood-moon')
    expect(store.getState().draft?.theme).toBe('blood-moon')
    expect(store.getState().profile.theme).toBe('blood-moon')
  })

  it('resetToDemo fecha o editor', () => {
    const store = createAppStore(createMemoryStorage())
    store.getState().startEditing()
    store.getState().resetToDemo()
    expect(store.getState().draft).toBeNull()
  })
})
