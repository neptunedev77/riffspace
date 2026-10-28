import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SETTINGS_KEY } from '../lib/persistence/settings.ts'
import { createMemoryStorage } from '../lib/persistence/storage.ts'
import { renderApp } from './renderApp.tsx'

describe('idioma', () => {
  it('a interface começa em inglês', () => {
    renderApp()
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByRole('link', { name: 'customise' })).toBeInTheDocument()
  })

  it('mudar para português aplica-se logo, sem guardar o perfil, e persiste após um refresh', () => {
    const storage = createMemoryStorage()
    renderApp(storage, '/edit')
    fireEvent.click(within(screen.getByRole('tablist', { name: 'editor sections' })).getByRole('tab', { name: /^settings/ }))
    fireEvent.change(screen.getByLabelText('interface language'), { target: { value: 'pt' } })

    expect(screen.getByRole('tablist', { name: 'secções do editor' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^definições/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('idioma da interface')).toHaveValue('pt')
    expect(document.documentElement.lang).toBe('pt')
    expect(JSON.parse(storage.getItem(SETTINGS_KEY)!)).toEqual({ locale: 'pt' })
    // O idioma é uma preferência do browser: não cria alterações no perfil.
    expect(screen.getByText('Sem alterações.')).toBeInTheDocument()

    cleanup()
    renderApp(storage)
    expect(screen.getByRole('link', { name: 'personalizar' })).toBeInTheDocument()
    expect(within(screen.getByRole('article')).getByRole('tab', { name: 'identidade' })).toBeInTheDocument()
  })

  it('as mensagens de validação também mudam de idioma', () => {
    const storage = createMemoryStorage({ [SETTINGS_KEY]: JSON.stringify({ locale: 'pt' }) })
    renderApp(storage, '/edit')
    const nickname = screen.getByLabelText('nickname')
    fireEvent.change(nickname, { target: { value: 'ab' } })
    fireEvent.blur(nickname)
    expect(nickname).toHaveAccessibleDescription(expect.stringContaining('pelo menos 3 caracteres'))
  })
})
