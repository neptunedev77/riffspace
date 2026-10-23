import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BACKUP_KEY, STORAGE_KEY } from '../lib/persistence/repository.ts'
import { createMemoryStorage } from '../lib/persistence/storage.ts'
import { makeProfile, storageWithProfile, storageWithRaw } from './fixtures.ts'
import { renderApp } from './renderApp.tsx'

describe('persistência na App', () => {
  it('o tema escolhido sobrevive a um refresh', () => {
    const storage = createMemoryStorage()
    renderApp(storage)
    fireEvent.click(screen.getByRole('radio', { name: 'Blood Moon' }))
    expect(screen.getByText(/Guardado apenas neste browser/)).toBeInTheDocument()

    cleanup()
    document.documentElement.dataset.theme = 'obsidian'
    renderApp(storage)
    expect(document.documentElement.dataset.theme).toBe('blood-moon')
    expect(screen.getByRole('radio', { name: 'Blood Moon' })).toHaveAttribute('aria-checked', 'true')
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
    expect(alert).toHaveTextContent('Não foi possível ler o perfil guardado')
    expect(alert).toHaveTextContent(BACKUP_KEY)
    expect(storage.getItem(BACKUP_KEY)).toContain('não é json')

    fireEvent.click(within(alert).getByRole('button', { name: 'Fechar aviso' }))
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

describe('repor dados de demonstração', () => {
  it('pede confirmação e cancelar não altera nada', () => {
    const storage = storageWithProfile(makeProfile({ displayName: 'Lâmina' }))
    renderApp(storage)

    fireEvent.click(screen.getByRole('button', { name: 'Repor dados de demonstração' }))
    const dialog = screen.getByRole('dialog', { name: 'Repor dados de demonstração?' })
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Lâmina' })).toBeInTheDocument()
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('confirmar apaga os dados guardados e repõe o demo', () => {
    const storage = storageWithProfile(makeProfile({ displayName: 'Lâmina', theme: 'frozen-abyss' }))
    renderApp(storage)

    fireEvent.click(screen.getByRole('button', { name: 'Repor dados de demonstração' }))
    act(() => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Repor' }))
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Nocturne' })).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('obsidian')
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.getByText(/Sem dados guardados/)).toBeInTheDocument()
  })

  it('Esc fecha o diálogo sem repor', () => {
    const storage = storageWithProfile(makeProfile({ displayName: 'Lâmina' }))
    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Repor dados de demonstração' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()
  })
})
