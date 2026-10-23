import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../lib/persistence/repository.ts'
import { createMemoryStorage } from '../lib/persistence/storage.ts'
import { renderApp } from './renderApp.tsx'

function openEditor() {
  fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
  return screen.getByRole('dialog', { name: /Editar perfil|Novo perfil|@/ })
}

function goToTab(editor: HTMLElement, name: string) {
  fireEvent.click(within(editor).getByRole('tab', { name: new RegExp(`^${name}`) }))
}

function heroHeading() {
  return screen.getByRole('heading', { level: 1 })
}

function section(editor: HTMLElement, title: RegExp) {
  return within(within(editor).getByRole('heading', { name: title }).closest('section')!)
}

function rankingNames(editor: HTMLElement) {
  return section(editor, /O teu ranking/)
    .queryAllByRole('listitem')
    .map((item) => item.textContent?.replace(/^\d+/, '').replace('Personalizada', '').trim())
}

describe('editor — identidade', () => {
  it('a pré-visualização atualiza enquanto se escreve, sem guardar', () => {
    const storage = createMemoryStorage()
    renderApp(storage)
    const editor = openEditor()

    fireEvent.change(within(editor).getByLabelText('Nome de apresentação (opcional)'), { target: { value: 'Lâmina' } })
    fireEvent.change(within(editor).getByLabelText('Tagline'), { target: { value: 'Riffs ao vivo' } })

    expect(heroHeading()).toHaveTextContent('Lâmina')
    expect(screen.getByText('Riffs ao vivo')).toBeInTheDocument()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(within(editor).getByText('Alterações por guardar.')).toBeInTheDocument()
  })

  it('o nickname é convertido para minúsculas e validado', () => {
    renderApp()
    const editor = openEditor()
    const nickname = within(editor).getByLabelText('Nickname')

    fireEvent.change(nickname, { target: { value: 'AB' } })
    expect(nickname).toHaveValue('ab')
    // O erro só aparece depois de sair do campo.
    expect(nickname).not.toHaveAttribute('aria-invalid')
    fireEvent.blur(nickname)
    expect(nickname).toHaveAttribute('aria-invalid', 'true')
    expect(nickname).toHaveAccessibleDescription(expect.stringContaining('pelo menos 3 caracteres'))
  })

  it('guardar com erros é bloqueado, mostra o resumo e volta ao separador com erro', () => {
    const storage = createMemoryStorage()
    renderApp(storage)
    const editor = openEditor()
    fireEvent.change(within(editor).getByLabelText('Nickname'), { target: { value: '_mau_' } })
    goToTab(editor, 'Bandas')

    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar' }))
    expect(within(editor).getByRole('alert')).toHaveTextContent('Corrige 1 campo antes de guardar.')
    expect(within(editor).getByRole('tab', { name: /^Perfil/ })).toHaveAttribute('aria-selected', 'true')
    expect(within(editor).getByLabelText('Nickname')).toHaveAttribute('aria-invalid', 'true')
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('guardar persiste, tira a etiqueta de demo e sobrevive a um refresh', () => {
    const storage = createMemoryStorage()
    renderApp(storage)
    const editor = openEditor()
    fireEvent.change(within(editor).getByLabelText('Nickname'), { target: { value: 'lamina' } })
    fireEvent.change(within(editor).getByLabelText('Nome de apresentação (opcional)'), { target: { value: 'Lâmina' } })
    fireEvent.change(within(editor).getByLabelText('Bio'), { target: { value: 'Toco desde 2010.' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Perfil de demonstração')).not.toBeInTheDocument()

    cleanup()
    renderApp(storage)
    expect(heroHeading()).toHaveTextContent('Lâmina')
    expect(screen.getByText('@lamina')).toBeInTheDocument()
    expect(screen.getByText('Toco desde 2010.')).toBeInTheDocument()
  })

  it('avatar por URL inválido não pode ser guardado', () => {
    renderApp()
    const editor = openEditor()
    fireEvent.click(within(editor).getByLabelText(/Imagem por URL/))
    fireEvent.change(within(editor).getByLabelText('URL da imagem'), { target: { value: 'javascript:alert(1)' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar' }))
    expect(within(editor).getByLabelText('URL da imagem')).toHaveAccessibleDescription(expect.stringContaining('http'))
  })

  it('avatar com imagem quebrada mostra o sigilo gerado', () => {
    renderApp()
    const editor = openEditor()
    fireEvent.click(within(editor).getByLabelText(/Imagem por URL/))
    fireEvent.change(within(editor).getByLabelText('URL da imagem'), { target: { value: 'https://example.invalid/x.png' } })
    const preview = within(editor).getByRole('img', { name: 'Pré-visualização do avatar' })
    expect(preview.tagName).toBe('IMG')
    fireEvent.error(preview)
    expect(within(editor).getByRole('img', { name: 'Pré-visualização do avatar' }).tagName).toBe('svg')
  })
})

describe('editor — cancelar e começar do zero', () => {
  it('cancelar sem alterações fecha logo', () => {
    renderApp()
    const editor = openEditor()
    fireEvent.click(within(editor).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cancelar com alterações pede confirmação e descartar repõe a pré-visualização', () => {
    renderApp()
    const editor = openEditor()
    fireEvent.change(within(editor).getByLabelText('Nome de apresentação (opcional)'), { target: { value: 'Temporário' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Cancelar' }))

    const confirm = screen.getByRole('dialog', { name: 'Descartar alterações?' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Continuar a editar' }))
    expect(heroHeading()).toHaveTextContent('Temporário')

    fireEvent.click(within(editor).getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Descartar alterações?' })).getByRole('button', { name: 'Descartar' }))
    expect(heroHeading()).toHaveTextContent('Nocturne')
  })

  it('"Começar do zero" cria um perfil vazio que exige nickname', () => {
    const storage = createMemoryStorage()
    renderApp(storage)
    const editor = openEditor()
    fireEvent.click(within(editor).getByRole('button', { name: 'Começar do zero' }))

    expect(within(editor).getByLabelText('Nickname')).toHaveValue('')
    expect(screen.getByText('Ainda não há bandas favoritas.')).toBeInTheDocument()
    expect(screen.getByText('Ainda não há equipamento na cadeia de sinal.')).toBeInTheDocument()

    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar' }))
    expect(within(editor).getByRole('alert')).toBeInTheDocument()

    fireEvent.change(within(editor).getByLabelText('Nickname'), { target: { value: 'novato' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).profile).toMatchObject({ nickname: 'novato', rig: [], isDemo: false })
  })
})

describe('editor — bandas', () => {
  it('pesquisa por nome e filtra por subgénero', () => {
    renderApp()
    const editor = openEditor()
    goToTab(editor, 'Bandas')

    fireEvent.change(within(editor).getByLabelText('Nome'), { target: { value: 'ins' } })
    expect(within(editor).getByText('1 resultado')).toBeInTheDocument()
    expect(within(editor).getByRole('button', { name: 'Adicionar Insomnium às favoritas' })).toBeInTheDocument()

    fireEvent.change(within(editor).getByLabelText('Nome'), { target: { value: '' } })
    fireEvent.change(within(editor).getByLabelText('Subgénero'), { target: { value: 'Black Metal' } })
    expect(within(editor).getByText('1 resultado')).toBeInTheDocument()
    expect(within(editor).getByRole('button', { name: 'Adicionar Emperor às favoritas' })).toBeInTheDocument()
  })

  it('pesquisa sem resultados mostra estado vazio com atalho para banda personalizada', () => {
    renderApp()
    const editor = openEditor()
    goToTab(editor, 'Bandas')
    fireEvent.change(within(editor).getByLabelText('Nome'), { target: { value: 'Garagem Negra' } })

    expect(within(editor).getByText('0 resultados')).toBeInTheDocument()
    expect(within(editor).getByText('Nenhuma banda corresponde a “Garagem Negra”.')).toBeInTheDocument()
    fireEvent.click(within(editor).getByRole('button', { name: 'Adicionar “Garagem Negra” como banda personalizada' }))
    expect(within(editor).getByLabelText('Nome da banda')).toHaveValue('Garagem Negra')
  })

  it('adicionar, ordenar e remover favoritas atualiza a pré-visualização', () => {
    renderApp()
    const editor = openEditor()
    goToTab(editor, 'Bandas')

    fireEvent.click(within(editor).getByRole('button', { name: 'Adicionar Emperor às favoritas' }))
    expect(rankingNames(editor).at(-1)).toBe('Emperor')
    fireEvent.click(within(editor).getByRole('button', { name: 'Subir Emperor' }))
    expect(rankingNames(editor).slice(-2)).toEqual(['Emperor', 'Meshuggah'])

    fireEvent.click(within(editor).getByRole('button', { name: 'Subir Gojira' }))
    expect(within(editor).getByRole('button', { name: 'Subir Gojira' })).toBeDisabled()
    fireEvent.click(within(editor).getByRole('button', { name: 'Descer Gojira' }))
    expect(rankingNames(editor).slice(0, 2)).toEqual(['Opeth', 'Gojira'])

    fireEvent.click(section(editor, /O teu ranking/).getByRole('button', { name: 'Remover Opeth das favoritas' }))
    expect(rankingNames(editor)[0]).toBe('Gojira')

    const preview = screen.getByRole('region', { name: 'Bandas favoritas' })
    const previewNames = within(preview).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(previewNames).toEqual(['Gojira', 'Moonspell', 'At the Gates', 'Mastodon', 'Emperor', 'Meshuggah'])
  })

  it('cria, edita e apaga uma banda personalizada; persiste depois de guardar', () => {
    const storage = createMemoryStorage()
    renderApp(storage)
    const editor = openEditor()
    goToTab(editor, 'Bandas')

    fireEvent.click(within(editor).getByRole('button', { name: 'Nova banda' }))
    fireEvent.change(within(editor).getByLabelText('Nome da banda'), { target: { value: 'Garagem Negra' } })
    fireEvent.change(within(editor).getByLabelText('País (opcional)'), { target: { value: 'PT' } })
    fireEvent.change(within(editor).getByLabelText('Ano de formação (opcional)'), { target: { value: '2019' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Doom Metal' }))
    fireEvent.click(within(editor).getByRole('button', { name: 'Adicionar banda' }))

    expect(rankingNames(editor).at(-1)).toBe('Garagem Negra')
    expect(section(editor, /Bandas personalizadas/).getByText('Portugal · 2019 · Doom Metal')).toBeInTheDocument()

    fireEvent.click(within(editor).getByRole('button', { name: 'Editar Garagem Negra' }))
    fireEvent.change(within(editor).getByLabelText('Nome da banda'), { target: { value: 'Garagem Branca' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar banda' }))
    expect(rankingNames(editor).at(-1)).toBe('Garagem Branca')

    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar' }))
    cleanup()
    renderApp(storage)
    expect(screen.getByRole('heading', { level: 3, name: 'Garagem Branca' })).toBeInTheDocument()

    const reopened = openEditor()
    goToTab(reopened, 'Bandas')
    fireEvent.click(within(reopened).getByRole('button', { name: 'Apagar Garagem Branca' }))
    expect(within(reopened).getByText('Ainda não adicionaste bandas fora do catálogo.')).toBeInTheDocument()
    fireEvent.click(within(reopened).getByRole('button', { name: 'Guardar' }))
    expect(screen.queryByRole('heading', { level: 3, name: 'Garagem Branca' })).not.toBeInTheDocument()
  })

  it('banda personalizada com nome repetido é recusada com mensagem', () => {
    renderApp()
    const editor = openEditor()
    goToTab(editor, 'Bandas')
    fireEvent.click(within(editor).getByRole('button', { name: 'Nova banda' }))
    fireEvent.change(within(editor).getByLabelText('Nome da banda'), { target: { value: 'opeth' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Adicionar banda' }))
    expect(within(editor).getByRole('alert')).toHaveTextContent('Já existe uma banda com esse nome')
  })
})

describe('editor — álbuns e subgéneros', () => {
  it('alterna álbuns favoritos e cria um álbum personalizado', () => {
    renderApp()
    const editor = openEditor()
    goToTab(editor, 'Álbuns')

    const magma = within(editor).getByRole('button', { name: /Magma/ })
    expect(magma).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(magma)
    expect(magma).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('region', { name: 'Álbuns favoritos' })).getByText('Magma')).toBeInTheDocument()

    fireEvent.click(within(editor).getByRole('button', { name: 'Adicionar álbum de Gojira' }))
    fireEvent.change(within(editor).getByLabelText('Título'), { target: { value: 'Terra Incognita' } })
    fireEvent.change(within(editor).getByLabelText('Ano (opcional)'), { target: { value: '2001' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Adicionar álbum' }))

    expect(within(editor).getByRole('button', { name: /^Terra Incognita/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(editor).getByRole('button', { name: 'Apagar Terra Incognita' })).toBeInTheDocument()
  })

  it('escolhe subgéneros, adiciona um personalizado e respeita o limite', () => {
    renderApp()
    const editor = openEditor()
    goToTab(editor, 'Géneros')

    fireEvent.click(within(editor).getByRole('button', { name: 'Doom Metal' }))
    expect(within(editor).getByRole('button', { name: 'Doom Metal' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.change(within(editor).getByLabelText('Outro subgénero'), { target: { value: 'Blackgaze' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Adicionar' }))
    expect(within(editor).getByRole('button', { name: 'Blackgaze' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('list', { name: 'Subgéneros favoritos' })).getByText('Blackgaze')).toBeInTheDocument()

    // Demo tem 4 + 2 = 6; mais 2 chega ao limite de 8 e o seguinte é recusado.
    fireEvent.click(within(editor).getByRole('button', { name: 'Black Metal' }))
    fireEvent.click(within(editor).getByRole('button', { name: 'Death Metal' }))
    fireEvent.click(within(editor).getByRole('button', { name: 'Sludge Metal' }))
    expect(within(editor).getByRole('alert')).toHaveTextContent('Podes escolher até 8 subgéneros.')
  })
})
