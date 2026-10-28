import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeProfile, storageWithProfile } from './fixtures.ts'
import { renderApp } from './renderApp.tsx'

function card() {
  return screen.getByRole('article', { name: 'Nocturne' })
}

function openFace(name: 'identity' | 'music' | 'rig') {
  fireEvent.click(within(card()).getByRole('tab', { name: new RegExp(`^${name}`) }))
}

describe('profile page — card', () => {
  it('apresenta o perfil num card e assinala-o como demonstração', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: 'Nocturne' })).toBeInTheDocument()
    expect(within(card()).getByText('demo')).toBeInTheDocument()
    expect(within(card()).getByText('@nocturne')).toBeInTheDocument()
  })

  it('tem três faces e começa na Identidade', () => {
    renderApp()
    const tabs = within(card()).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['identity', 'music6', 'rig8'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(within(card()).getByText(/Garage guitarist/)).toBeInTheDocument()
  })

  it('a face Música mostra as bandas pela ordem do ranking e os álbuns', () => {
    renderApp()
    openFace('music')
    const bands = within(screen.getByRole('region', { name: 'favourite bands' }))
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent)
    expect(bands).toEqual(['Gojira', 'Opeth', 'Moonspell', 'At the Gates', 'Mastodon', 'Meshuggah'])
    expect(within(screen.getByRole('region', { name: 'favourite albums' })).getByText('Blackwater Park')).toBeInTheDocument()
  })

  it('os destaques da Identidade levam às outras faces', () => {
    renderApp()
    fireEvent.click(within(card()).getByRole('button', { name: /top band/ }))
    expect(within(card()).getByRole('tab', { name: /^music/ })).toHaveAttribute('aria-selected', 'true')
    openFace('identity')
    fireEvent.click(within(card()).getByRole('button', { name: /featured guitar/ }))
    expect(within(card()).getByRole('tab', { name: /^rig/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('as faces navegam com as setas do teclado', () => {
    renderApp()
    const identity = within(card()).getByRole('tab', { name: 'identity' })
    fireEvent.keyDown(identity, { key: 'ArrowRight' })
    expect(within(card()).getByRole('tab', { name: /^music/ })).toHaveFocus()
    expect(within(card()).getByRole('tab', { name: /^music/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('the "customise" link in the app bar points to the editor', () => {
    renderApp()
    expect(screen.getByRole('link', { name: 'customise' })).toHaveAttribute('href', '/edit')
  })

  it('mostra estatísticas reais e a data de criação', () => {
    renderApp()
    const stats = within(card()).getByRole('contentinfo')
    expect(stats).toHaveTextContent('bands6')
    expect(stats).toHaveTextContent('gear8')
    expect(stats).toHaveTextContent('since October 2026')
  })
})

describe('face music com muitas bandas', () => {
  function profileWithBands(count: number) {
    const base = makeProfile()
    const bands = Array.from({ length: count }, (_, i) => ({ ...base.bands[0]!, id: `band-${i}`, name: `Banda ${i + 1}` }))
    return makeProfile({ bands, albums: [] })
  }

  it('mostra as 10 primeiras e um botão para as restantes', () => {
    renderApp(storageWithProfile(profileWithBands(12)))
    openFace('music')
    const region = () => within(screen.getByRole('region', { name: 'favourite bands' }))
    expect(region().getAllByRole('heading', { level: 4 })).toHaveLength(10)
    fireEvent.click(region().getByRole('button', { name: 'show all 12 bands' }))
    expect(region().getAllByRole('heading', { level: 4 }).at(-1)).toHaveTextContent('Banda 12')
    fireEvent.click(region().getByRole('button', { name: 'show less' }))
    expect(region().getAllByRole('heading', { level: 4 })).toHaveLength(10)
  })

  it('com 10 ou menos não há botão', () => {
    renderApp(storageWithProfile(profileWithBands(10)))
    openFace('music')
    expect(within(screen.getByRole('region', { name: 'favourite bands' })).queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('imagens e destaques', () => {
  it('as bandas com fotografia mostram-na e os créditos indicam autor e licença', () => {
    renderApp()
    openFace('music')
    const firstBand = within(screen.getByRole('region', { name: 'favourite bands' })).getAllByRole('listitem')[0]!
    expect(firstBand.querySelector('img')?.getAttribute('src')).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//)
    const credits = within(card()).getByText('photo credits').closest('details')!
    expect(within(credits).getByRole('link', { name: 'Gojira' })).toHaveAttribute('href', expect.stringContaining('commons.wikimedia.org/wiki/File:'))
    expect(credits).toHaveTextContent('SuperVirtual · CC BY-SA 4.0')
  })

  it('o álbum favorito indica de que banda é, mesmo que não seja a banda n.º 1', () => {
    const base = makeProfile()
    const opethAlbum = base.albums[1]!
    renderApp(storageWithProfile(makeProfile({ albums: [opethAlbum, base.albums[0]!] })))
    const highlight = within(card()).getByRole('button', { name: /favourite album/ })
    expect(highlight).toHaveTextContent('Blackwater Park')
    expect(highlight).toHaveTextContent('Opeth · 2001')
  })
})

describe('socials no card', () => {
  it('no perfil demo os links são ilustrativos e não clicáveis', () => {
    renderApp()
    const list = within(card()).getByRole('list', { name: 'links' })
    expect(within(list).getByText('Instagram')).toBeInTheDocument()
    expect(within(list).queryAllByRole('link')).toHaveLength(0)
  })

  it('num perfil do utilizador os links abrem numa nova janela, sem referrer', () => {
    renderApp(
      storageWithProfile(
        makeProfile({
          isDemo: false,
          socials: [{ id: 'social-1', platform: 'bandcamp', url: 'https://lamina.bandcamp.com' }],
        }),
      ),
    )
    const link = screen.getByRole('link', { name: /Bandcamp: lamina\.bandcamp\.com/ })
    expect(link).toHaveAttribute('href', 'https://lamina.bandcamp.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('sem links não mostra a lista', () => {
    renderApp(storageWithProfile(makeProfile({ socials: [] })))
    expect(screen.queryByRole('list', { name: 'links' })).not.toBeInTheDocument()
  })
})

describe('tema na página do perfil', () => {
  it('aplica o tema guardado a <html>', () => {
    renderApp(storageWithProfile(makeProfile({ theme: 'blood-moon' })))
    expect(document.documentElement.dataset.theme).toBe('blood-moon')
  })

  it('não tem controlos de personalização: tudo vive no editor', () => {
    renderApp()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'customise' })).toBeInTheDocument()
  })
})

describe('face Rig', () => {
  it('seleciona uma peça da cadeia e mostra os detalhes', () => {
    renderApp()
    openFace('rig')
    const chain = screen.getByRole('list', { name: 'signal chain' })
    const buttons = within(chain).getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')

    const amp = within(chain).getByRole('button', { name: /Peavey 6505\+/ })
    fireEvent.click(amp)
    expect(amp).toHaveAttribute('aria-pressed', 'true')
    const detail = document.getElementById('rig-detail')!
    expect(within(detail).getByRole('heading', { level: 3 })).toHaveTextContent('Peavey 6505+')
    expect(detail).toHaveTextContent('position 6 of 7 in the chain')
  })

  it('off-chain gear is listed under "off the chain"', () => {
    renderApp()
    openFace('rig')
    expect(screen.getByRole('heading', { name: 'off the chain' })).toBeInTheDocument()
    expect(screen.getByText('Focusrite Scarlett 2i2')).toBeInTheDocument()
  })
})

describe('rotas', () => {
  it('um endereço desconhecido mostra a página 404 com link para o perfil', () => {
    renderApp(undefined, '/nao-existe')
    expect(screen.getByRole('heading', { level: 1, name: '404 — dead air' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'back to the profile' })).toHaveAttribute('href', '/')
  })

  it('/@nickname mostra o perfil público, sem controlos de edição no card', () => {
    renderApp(undefined, '/@nocturne')
    expect(screen.getByRole('heading', { level: 1, name: 'Nocturne' })).toBeInTheDocument()
    expect(within(card()).queryByRole('link', { name: /customise|edit/ })).not.toBeInTheDocument()
  })

  it('um @nickname que não existe neste browser diz isso mesmo, sem fingir que o encontrou', () => {
    renderApp(undefined, '/@outra.pessoa')
    expect(screen.getByRole('heading', { level: 1, name: '@outra.pessoa not found' })).toBeInTheDocument()
    expect(screen.getByText(/only live in this browser/)).toBeInTheDocument()
  })

  it('um segmento sem @ continua a ser 404', () => {
    renderApp(undefined, '/nocturne')
    expect(screen.getByRole('heading', { level: 1, name: '404 — dead air' })).toBeInTheDocument()
  })
})
