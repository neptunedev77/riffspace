import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BACKUP_KEY, STORAGE_KEY } from '../lib/persistence/repository.ts'
import { createMemoryStorage } from '../lib/persistence/storage.ts'
import { makeProfile, storageWithProfile, storageWithRaw } from './fixtures.ts'
import { renderApp } from './renderApp.tsx'

const editorHeader = () => within(screen.getByRole('heading', { level: 1 }).closest('header')!)

function openSection(name: string) {
  const tablist = screen.getByRole('tablist', { name: 'editor sections' })
  fireEvent.click(within(tablist).getByRole('tab', { name: new RegExp(`^${name}`) }))
}

describe('persistência na App', () => {
  it('o tema escolhido no editor sobrevive a um refresh', () => {
    const storage = createMemoryStorage()
    renderApp(storage, '/edit')
    openSection('appearance')
    fireEvent.click(screen.getByRole('radio', { name: 'Blood Moon' }))
    // Pré-visualização imediata, mas nada guardado até "Guardar".
    expect(document.documentElement.dataset.theme).toBe('blood-moon')
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    fireEvent.click(editorHeader().getByRole('button', { name: 'save' }))

    cleanup()
    document.documentElement.dataset.theme = 'obsidian'
    renderApp(storage)
    expect(document.documentElement.dataset.theme).toBe('blood-moon')
    expect(screen.getByRole('article')).toHaveTextContent('Blood Moon')
  })

  it('cancelar o editor reverte o tema pré-visualizado', () => {
    const storage = createMemoryStorage()
    renderApp(storage, '/edit')
    openSection('appearance')
    fireEvent.click(screen.getByRole('radio', { name: 'Frozen Abyss' }))
    fireEvent.click(editorHeader().getByRole('button', { name: 'cancel' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Discard changes?' })).getByRole('button', { name: 'discard' }))
    expect(document.documentElement.dataset.theme).toBe('obsidian')
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('mostra o perfil guardado em vez do demo', () => {
    renderApp(storageWithProfile(makeProfile({ displayName: 'Lâmina', tagline: 'Riffs guardados.' })))
    expect(screen.getByRole('heading', { level: 1, name: 'Lâmina' })).toBeInTheDocument()
    expect(screen.getByText('Riffs guardados.')).toBeInTheDocument()
  })

  it('dados corrompidos não bloqueiam o arranque e são assinalados', () => {
    const storage = storageWithRaw('{"isto": não é json')
    renderApp(storage)
    expect(screen.getByRole('heading', { level: 1, name: 'Nocturne' })).toBeInTheDocument()
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('The saved profile could not be read')
    expect(alert).toHaveTextContent(BACKUP_KEY)
    expect(storage.getItem(BACKUP_KEY)).toContain('não é json')

    fireEvent.click(within(alert).getByRole('button', { name: 'dismiss notice' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('perfil de uma versão futura é assinalado sem ser apagado', () => {
    const raw = JSON.stringify({ app: 'riffspace', schemaVersion: 7, savedAt: '2030-01-01T00:00:00.000Z', profile: {} })
    const storage = storageWithRaw(raw)
    renderApp(storage)
    expect(screen.getByRole('alert')).toHaveTextContent('schema v7')
    expect(storage.getItem(STORAGE_KEY)).toBe(raw)
  })
})

describe('repor dados de demonstração (secção Dados do editor)', () => {
  it('pede confirmação e cancelar não altera nada', () => {
    const storage = storageWithProfile(makeProfile({ displayName: 'Lâmina' }))
    renderApp(storage, '/edit')
    openSection('settings')
    expect(screen.getByText(/Saved in this browser/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'reset demo data' }))
    const dialog = screen.getByRole('dialog', { name: 'Reset demo data?' })
    expect(within(dialog).getByRole('button', { name: 'cancel' })).toHaveFocus()

    fireEvent.click(within(dialog).getByRole('button', { name: 'cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('confirmar apaga os dados guardados, repõe o demo e volta ao perfil', () => {
    const storage = storageWithProfile(makeProfile({ displayName: 'Lâmina', theme: 'frozen-abyss' }))
    const { router } = renderApp(storage, '/edit')
    openSection('settings')

    fireEvent.click(screen.getByRole('button', { name: 'reset demo data' }))
    act(() => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'reset' }))
    })

    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Nocturne' })).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('obsidian')
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('Esc fecha o diálogo sem repor', () => {
    const storage = storageWithProfile(makeProfile({ displayName: 'Lâmina' }))
    renderApp(storage, '/edit')
    openSection('settings')
    fireEvent.click(screen.getByRole('button', { name: 'reset demo data' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()
  })
})
