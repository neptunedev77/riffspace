import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../lib/persistence/repository.ts'
import { createMemoryStorage, type KeyValueStorage } from '../lib/persistence/storage.ts'
import { renderApp } from './renderApp.tsx'

/** Entra no editor a partir da página do perfil, como um utilizador. */
function openEditor(storage: KeyValueStorage = createMemoryStorage()) {
  const utils = renderApp(storage)
  fireEvent.click(screen.getByRole('link', { name: 'edit profile' }))
  return utils
}

const form = () => within(document.getElementById('editor-panel')!)
// O cabeçalho do editor é o que contém o h1 (os cards também têm <header>).
const header = () => within(screen.getByRole('heading', { level: 1 }).closest('header')!)
const preview = () => within(screen.getByRole('complementary', { name: 'card preview' }))
const previewName = () => preview().getByRole('heading', { level: 2 })

function goToTab(name: string) {
  const tablist = screen.getByRole('tablist', { name: 'editor sections' })
  fireEvent.click(within(tablist).getByRole('tab', { name: new RegExp(`^${name}`) }))
}

function save() {
  fireEvent.click(header().getByRole('button', { name: 'save' }))
}

function section(title: RegExp) {
  return within(form().getByRole('heading', { name: title }).closest('section')!)
}

function rankingNames() {
  return section(/your ranking/)
    .queryAllByRole('listitem')
    .map((item) => item.textContent?.replace(/^\d+/, '').replace('custom', '').trim())
}

describe('página de edição', () => {
  it('abre numa rota própria com secções e pré-visualização', () => {
    const { router } = openEditor()
    expect(router.state.location.pathname).toBe('/edit')
    expect(screen.getByRole('heading', { level: 1, name: 'demo profile' })).toBeInTheDocument()
    const tabs = within(screen.getByRole('tablist', { name: 'editor sections' })).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'profile',
      'appearance',
      'track',
      'socials',
      'bands',
      'albums',
      'genres',
      'rig',
      'settings',
    ])
    expect(screen.getByRole('tablist', { name: 'editor sections' })).toHaveAttribute('aria-orientation', 'vertical')
    expect(previewName()).toHaveTextContent('Nocturne')
  })

  it('entrar diretamente em /edit também funciona', () => {
    renderApp(createMemoryStorage(), '/edit')
    expect(form().getByLabelText('nickname')).toHaveValue('nocturne')
  })
})

describe('editor — identidade', () => {
  it('a pré-visualização atualiza enquanto se escreve, sem guardar', () => {
    const storage = createMemoryStorage()
    openEditor(storage)
    fireEvent.change(form().getByLabelText('display name (optional)'), { target: { value: 'Lâmina' } })
    fireEvent.change(form().getByLabelText('tagline'), { target: { value: 'Riffs ao vivo' } })

    expect(previewName()).toHaveTextContent('Lâmina')
    expect(preview().getByText('Riffs ao vivo')).toBeInTheDocument()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(header().getByText('Unsaved changes.')).toBeInTheDocument()
  })

  it('o nickname é convertido para minúsculas e validado depois de sair do campo', () => {
    openEditor()
    const nickname = form().getByLabelText('nickname')
    fireEvent.change(nickname, { target: { value: 'AB' } })
    expect(nickname).toHaveValue('ab')
    expect(nickname).not.toHaveAttribute('aria-invalid')
    fireEvent.blur(nickname)
    expect(nickname).toHaveAttribute('aria-invalid', 'true')
    expect(nickname).toHaveAccessibleDescription(expect.stringContaining('at least 3 characters'))
  })

  it('guardar com erros é bloqueado e volta à secção com erro', () => {
    const storage = createMemoryStorage()
    const { router } = openEditor(storage)
    fireEvent.change(form().getByLabelText('nickname'), { target: { value: '_mau_' } })
    goToTab('bands')
    save()

    expect(header().getByRole('alert')).toHaveTextContent('Fix 1 field before saving.')
    expect(screen.getByRole('tab', { name: /^profile/ })).toHaveAttribute('aria-selected', 'true')
    expect(form().getByLabelText('nickname')).toHaveAttribute('aria-invalid', 'true')
    expect(router.state.location.pathname).toBe('/edit')
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('guardar persiste, volta ao perfil sem etiqueta de demo e sobrevive a um refresh', () => {
    const storage = createMemoryStorage()
    const { router } = openEditor(storage)
    fireEvent.change(form().getByLabelText('nickname'), { target: { value: 'lamina' } })
    fireEvent.change(form().getByLabelText('display name (optional)'), { target: { value: 'Lâmina' } })
    fireEvent.change(form().getByLabelText('bio'), { target: { value: 'Toco desde 2010.' } })
    save()

    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Lâmina' })).toBeInTheDocument()
    expect(screen.queryByText('demo')).not.toBeInTheDocument()

    cleanup()
    renderApp(storage)
    expect(screen.getByRole('heading', { level: 1, name: 'Lâmina' })).toBeInTheDocument()
    expect(screen.getByText('@lamina')).toBeInTheDocument()
    expect(screen.getByText('Toco desde 2010.')).toBeInTheDocument()
  })

  it('avatar por URL inválido mostra o erro ao guardar', () => {
    openEditor()
    fireEvent.click(form().getByLabelText(/image from a link/))
    fireEvent.change(form().getByLabelText('image url'), { target: { value: 'javascript:alert(1)' } })
    save()
    expect(form().getByLabelText('image url')).toHaveAccessibleDescription(expect.stringContaining('http'))
  })

  it('avatar com imagem quebrada mostra o sigilo gerado', () => {
    openEditor()
    fireEvent.click(form().getByLabelText(/image from a link/))
    fireEvent.change(form().getByLabelText('image url'), { target: { value: 'https://example.invalid/x.png' } })
    const img = form().getByRole('img', { name: 'avatar preview' })
    expect(img.tagName).toBe('IMG')
    fireEvent.error(img)
    expect(form().getByRole('img', { name: 'avatar preview' }).tagName).toBe('svg')
  })
})

describe('editor — sair', () => {
  it('cancelar sem alterações volta logo ao perfil', () => {
    const { router, store } = openEditor()
    fireEvent.click(header().getByRole('button', { name: 'cancel' }))
    expect(router.state.location.pathname).toBe('/')
    expect(store.getState().draft).toBeNull()
  })

  it('sair com alterações pede confirmação; continuar mantém o rascunho', () => {
    const { router } = openEditor()
    fireEvent.change(form().getByLabelText('display name (optional)'), { target: { value: 'Temporário' } })
    fireEvent.click(header().getByRole('button', { name: 'cancel' }))

    const confirm = screen.getByRole('dialog', { name: 'Discard changes?' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'keep editing' }))
    expect(router.state.location.pathname).toBe('/edit')
    expect(previewName()).toHaveTextContent('Temporário')
  })

  it('descartar sai para o perfil sem guardar', () => {
    const storage = createMemoryStorage()
    const { router } = openEditor(storage)
    fireEvent.change(form().getByLabelText('display name (optional)'), { target: { value: 'Temporário' } })
    fireEvent.click(header().getByRole('link', { name: /profile/ }))

    fireEvent.click(within(screen.getByRole('dialog', { name: 'Discard changes?' })).getByRole('button', { name: 'discard' }))
    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Nocturne' })).toBeInTheDocument()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('"voltar" do browser com alterações também é bloqueado', async () => {
    const { router } = openEditor()
    fireEvent.change(form().getByLabelText('tagline'), { target: { value: 'Mudada' } })
    await act(() => router.navigate(-1))
    expect(await screen.findByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/edit')
  })

  it('"Começar do zero" cria um perfil vazio que exige nickname', () => {
    const storage = createMemoryStorage()
    openEditor(storage)
    fireEvent.click(screen.getByRole('button', { name: 'start from scratch' }))

    expect(form().getByLabelText('nickname')).toHaveValue('')
    expect(previewName()).toHaveTextContent('unnamed')
    save()
    expect(header().getByRole('alert')).toBeInTheDocument()

    fireEvent.change(form().getByLabelText('nickname'), { target: { value: 'novato' } })
    save()
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).profile).toMatchObject({
      nickname: 'novato',
      rig: [],
      socials: [],
      isDemo: false,
    })
  })
})

describe('editor — bandas', () => {
  it('pesquisa por nome e filtra por subgénero', () => {
    openEditor()
    goToTab('bands')
    fireEvent.change(form().getByLabelText('name'), { target: { value: 'ins' } })
    expect(form().getByText('1 result')).toBeInTheDocument()
    expect(form().getByRole('button', { name: 'add Insomnium to favourites' })).toBeInTheDocument()

    fireEvent.change(form().getByLabelText('name'), { target: { value: '' } })
    fireEvent.change(form().getByLabelText('subgenre'), { target: { value: 'Black Metal' } })
    expect(form().getByText('1 result')).toBeInTheDocument()
    expect(form().getByRole('button', { name: 'add Emperor to favourites' })).toBeInTheDocument()
  })

  it('pesquisa sem resultados mostra estado vazio com atalho para banda personalizada', () => {
    openEditor()
    goToTab('bands')
    fireEvent.change(form().getByLabelText('name'), { target: { value: 'Garagem Negra' } })
    expect(form().getByText('0 results')).toBeInTheDocument()
    expect(form().getByText('No band matches “Garagem Negra”.')).toBeInTheDocument()
    fireEvent.click(form().getByRole('button', { name: 'add “Garagem Negra” as a custom band' }))
    expect(form().getByLabelText('Band name')).toHaveValue('Garagem Negra')
  })

  it('adicionar, ordenar e remover favoritas atualiza a pré-visualização', () => {
    openEditor()
    goToTab('bands')
    fireEvent.click(form().getByRole('button', { name: 'add Emperor to favourites' }))
    expect(rankingNames().at(-1)).toBe('Emperor')
    fireEvent.click(form().getByRole('button', { name: 'move Emperor up' }))
    expect(rankingNames().slice(-2)).toEqual(['Emperor', 'Meshuggah'])

    expect(form().getByRole('button', { name: 'move Gojira up' })).toBeDisabled()
    fireEvent.click(form().getByRole('button', { name: 'move Gojira down' }))
    expect(rankingNames().slice(0, 2)).toEqual(['Opeth', 'Gojira'])
    fireEvent.click(section(/your ranking/).getByRole('button', { name: 'remove Opeth from favourites' }))

    fireEvent.click(preview().getByRole('tab', { name: /^music/ }))
    const names = within(preview().getByRole('region', { name: 'favourite bands' }))
      .getAllByRole('heading', { level: 4 })
      .map((h) => h.textContent)
    expect(names).toEqual(['Gojira', 'Moonspell', 'At the Gates', 'Mastodon', 'Emperor', 'Meshuggah'])
  })

  it('cria, edita e apaga uma banda personalizada; persiste depois de guardar', () => {
    const storage = createMemoryStorage()
    openEditor(storage)
    goToTab('bands')
    fireEvent.click(form().getByRole('button', { name: 'new band' }))
    fireEvent.change(form().getByLabelText('Band name'), { target: { value: 'Garagem Negra' } })
    fireEvent.change(form().getByLabelText('country (optional)'), { target: { value: 'PT' } })
    fireEvent.change(form().getByLabelText('formed in (optional)'), { target: { value: '2019' } })
    fireEvent.click(form().getByRole('button', { name: 'Doom Metal' }))
    fireEvent.click(form().getByRole('button', { name: 'add band' }))

    expect(rankingNames().at(-1)).toBe('Garagem Negra')
    expect(section(/custom bands/).getByText('Portugal · 2019 · Doom Metal')).toBeInTheDocument()

    fireEvent.click(form().getByRole('button', { name: 'edit Garagem Negra' }))
    fireEvent.change(form().getByLabelText('Band name'), { target: { value: 'Garagem Branca' } })
    fireEvent.click(form().getByRole('button', { name: 'save band' }))
    expect(rankingNames().at(-1)).toBe('Garagem Branca')
    save()

    cleanup()
    openEditor(storage)
    goToTab('bands')
    fireEvent.click(form().getByRole('button', { name: 'delete Garagem Branca' }))
    expect(form().getByText('You have not added any bands outside the catalogue yet.')).toBeInTheDocument()
    save()
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).profile.customBands).toEqual([])
  })

  it('banda personalizada com nome repetido é recusada com mensagem', () => {
    openEditor()
    goToTab('bands')
    fireEvent.click(form().getByRole('button', { name: 'new band' }))
    fireEvent.change(form().getByLabelText('Band name'), { target: { value: 'opeth' } })
    fireEvent.click(form().getByRole('button', { name: 'add band' }))
    expect(form().getByRole('alert')).toHaveTextContent('A band with that name already exists')
  })
})

describe('editor — álbuns e subgéneros', () => {
  it('alterna álbuns favoritos e cria um álbum personalizado', () => {
    openEditor()
    goToTab('albums')
    const magma = form().getByRole('button', { name: /^Magma/ })
    expect(magma).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(magma)
    expect(magma).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(form().getByRole('button', { name: 'add album by Gojira' }))
    fireEvent.change(form().getByLabelText('title'), { target: { value: 'Terra Incognita' } })
    fireEvent.change(form().getByLabelText('year (optional)'), { target: { value: '2001' } })
    fireEvent.click(form().getByRole('button', { name: 'add album' }))
    expect(form().getByRole('button', { name: /^Terra Incognita/ })).toHaveAttribute('aria-pressed', 'true')
    expect(form().getByRole('button', { name: 'delete Terra Incognita' })).toBeInTheDocument()

    fireEvent.click(preview().getByRole('tab', { name: /^music/ }))
    expect(within(preview().getByRole('region', { name: 'favourite albums' })).getByText('Terra Incognita')).toBeInTheDocument()
  })

  it('escolhe subgéneros, adiciona um personalizado e respeita o limite', () => {
    openEditor()
    goToTab('genres')
    fireEvent.click(form().getByRole('button', { name: 'Doom Metal' }))
    expect(form().getByRole('button', { name: 'Doom Metal' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.change(form().getByLabelText('other subgenre'), { target: { value: 'Blackgaze' } })
    fireEvent.click(form().getByRole('button', { name: 'add' }))
    expect(form().getByRole('button', { name: 'Blackgaze' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(preview().getByRole('list', { name: 'subgenres' })).getByText('Blackgaze')).toBeInTheDocument()

    // Demo tem 4 + 2 = 6; mais 2 chega ao limite de 8 e o seguinte é recusado.
    fireEvent.click(form().getByRole('button', { name: 'Black Metal' }))
    fireEvent.click(form().getByRole('button', { name: 'Death Metal' }))
    fireEvent.click(form().getByRole('button', { name: 'Sludge Metal' }))
    expect(form().getByRole('alert')).toHaveTextContent('You can pick up to 8 subgenres.')
  })
})

describe('editor — socials', () => {
  function addLink(platform: string, value: string) {
    fireEvent.click(form().getByRole('button', { name: 'add link' }))
    fireEvent.change(form().getByLabelText('platform'), { target: { value: platform } })
    fireEvent.change(form().getByLabelText(/^link/), { target: { value } })
    fireEvent.click(within(form().getByRole('form', { name: 'new link' })).getByRole('button', { name: 'add link' }))
  }

  it('aceita @handle, valida o domínio e mostra o link na pré-visualização', () => {
    openEditor()
    goToTab('socials')
    addLink('instagram', '@lamina.riffs')
    expect(form().getByText('instagram.com/lamina.riffs')).toBeInTheDocument()
    expect(form().getByRole('button', { name: 'add link' })).toHaveFocus()

    addLink('spotify', 'https://example.com/fake')
    expect(form().getByRole('alert')).toHaveTextContent('This link does not look like a Spotify link.')
  })

  it('links repetidos são recusados', () => {
    openEditor()
    goToTab('socials')
    addLink('website', 'https://example.org')
    addLink('website', 'example.org')
    expect(form().getByRole('alert')).toHaveTextContent('That link is already on your profile.')
  })

  it('os links de demonstração são removidos ao guardar o perfil como teu', () => {
    const storage = createMemoryStorage()
    openEditor(storage)
    goToTab('socials')
    expect(form().getAllByText('demo')).toHaveLength(4)
    expect(form().getByText(/removed when you save/)).toBeInTheDocument()
    addLink('bandcamp', 'https://lamina.bandcamp.com')
    save()

    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).profile.socials).toEqual([
      expect.objectContaining({ platform: 'bandcamp', url: 'https://lamina.bandcamp.com' }),
    ])
    expect(screen.getByRole('link', { name: /Bandcamp: lamina\.bandcamp\.com/ })).toHaveAttribute(
      'href',
      'https://lamina.bandcamp.com',
    )
  })

  it('editar, reordenar e remover links', () => {
    openEditor()
    goToTab('socials')
    fireEvent.click(form().getByRole('button', { name: 'move Instagram down' }))
    // Bandcamp passou a primeiro: o seu "Subir" fica desativado e o do Instagram ativo.
    expect(form().getByRole('button', { name: 'move Bandcamp up' })).toBeDisabled()
    expect(form().getByRole('button', { name: 'move Instagram up' })).toBeEnabled()

    fireEvent.click(form().getByRole('button', { name: 'edit Website' }))
    fireEvent.change(form().getByLabelText('link'), { target: { value: 'https://example.net' } })
    fireEvent.click(form().getByRole('button', { name: 'save link' }))
    expect(form().getByText('example.net')).toBeInTheDocument()

    fireEvent.click(form().getByRole('button', { name: 'remove Website' }))
    expect(form().queryByText('example.net')).not.toBeInTheDocument()
  })
})

describe('editor — aparência', () => {
  it('o tema muda com as setas e reflete-se logo na pré-visualização', () => {
    openEditor()
    goToTab('appearance')
    const obsidian = form().getByRole('radio', { name: 'Obsidian' })
    expect(obsidian).toHaveAttribute('aria-checked', 'true')
    expect(obsidian).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(obsidian, { key: 'ArrowRight' })
    const bloodMoon = form().getByRole('radio', { name: 'Blood Moon' })
    expect(bloodMoon).toHaveFocus()
    expect(bloodMoon).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.dataset.theme).toBe('blood-moon')
    expect(within(preview().getByRole('contentinfo')).getByText('Blood Moon')).toBeInTheDocument()
    expect(header().getByText('Unsaved changes.')).toBeInTheDocument()

    fireEvent.keyDown(bloodMoon, { key: 'ArrowLeft' })
    fireEvent.keyDown(form().getByRole('radio', { name: 'Obsidian' }), { key: 'ArrowLeft' })
    expect(form().getByRole('radio', { name: 'Frozen Abyss' })).toHaveAttribute('aria-checked', 'true')
  })
})
