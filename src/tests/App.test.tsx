import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../app/App.tsx'

describe('App — perfil de demonstração', () => {
  it('apresenta o perfil e assinala-o como demonstração', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Nocturne' })).toBeInTheDocument()
    expect(screen.getByText('Perfil de demonstração')).toBeInTheDocument()
  })

  it('mostra as bandas favoritas pela ordem do ranking', () => {
    render(<App />)
    const section = screen.getByRole('region', { name: 'Bandas favoritas' })
    const names = within(section)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(names).toEqual(['Gojira', 'Opeth', 'Moonspell', 'At the Gates', 'Mastodon', 'Meshuggah'])
  })

  it('o botão de edição está identificado como indisponível', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Editar perfil (em breve)' })).toBeDisabled()
  })
})

describe('App — temas', () => {
  it('aplica o tema inicial a <html>', () => {
    render(<App />)
    expect(document.documentElement.dataset.theme).toBe('obsidian')
    expect(screen.getByRole('radio', { name: 'Obsidian' })).toHaveAttribute('aria-checked', 'true')
  })

  it('trocar de tema por clique altera data-theme', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: 'Frozen Abyss' }))
    expect(document.documentElement.dataset.theme).toBe('frozen-abyss')
    expect(screen.getByRole('radio', { name: 'Frozen Abyss' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Obsidian' })).toHaveAttribute('aria-checked', 'false')
  })

  it('as setas do teclado percorrem os temas (roving tabindex)', () => {
    render(<App />)
    const obsidian = screen.getByRole('radio', { name: 'Obsidian' })
    expect(obsidian).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(obsidian, { key: 'ArrowRight' })
    const bloodMoon = screen.getByRole('radio', { name: 'Blood Moon' })
    expect(document.documentElement.dataset.theme).toBe('blood-moon')
    expect(bloodMoon).toHaveFocus()
    expect(bloodMoon).toHaveAttribute('tabindex', '0')
    expect(obsidian).toHaveAttribute('tabindex', '-1')

    // Volta ao início e dá a volta até ao último tema.
    fireEvent.keyDown(bloodMoon, { key: 'ArrowLeft' })
    fireEvent.keyDown(obsidian, { key: 'ArrowLeft' })
    expect(document.documentElement.dataset.theme).toBe('frozen-abyss')
  })
})

describe('App — rig', () => {
  it('seleciona uma peça da cadeia e mostra os seus detalhes', () => {
    render(<App />)
    const chain = screen.getByRole('list', { name: 'Cadeia de sinal' })
    const buttons = within(chain).getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')

    const amp = within(chain).getByRole('button', { name: /Peavey 6505\+/ })
    fireEvent.click(amp)
    expect(amp).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')

    const detail = document.getElementById('rig-detail')
    expect(detail).not.toBeNull()
    expect(within(detail!).getByRole('heading', { level: 3 })).toHaveTextContent('Peavey 6505+')
    expect(detail).toHaveTextContent('posição 6 de 7 na cadeia')
  })

  it('equipamento fora da cadeia aparece em "Também na rig"', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Também na rig' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Focusrite Scarlett 2i2' })).toBeInTheDocument()
  })
})
