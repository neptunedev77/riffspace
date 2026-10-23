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
