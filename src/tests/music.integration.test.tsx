import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Band } from '../domain/band.ts'
import { musicBrainz, type MusicFetch } from '../lib/music/musicbrainz.ts'
import { STORAGE_KEY } from '../lib/persistence/repository.ts'
import { createMemoryStorage } from '../lib/persistence/storage.ts'
import { MB_ARTIST, makeProfile, storageWithProfile } from './fixtures.ts'
import { renderApp } from './renderApp.tsx'

const form = () => within(document.getElementById('editor-panel')!)
const header = () => within(screen.getByRole('heading', { level: 1 }).closest('header')!)
const preview = () => within(screen.getByRole('complementary', { name: 'card preview' }))

const json = (body: unknown) => new Response(JSON.stringify(body))
const GOJIRA_MBID = '1c5efd53-d6b6-4d63-9d22-a15025cf5f07'
const FROM_MARS_MBID = 'c64e38e7-ea8d-3cda-ba62-1f4b9f899419'

/** Discografia simulada da Gojira: 10 álbuns de estúdio (inclui o do perfil demo) e um ao vivo. */
const GOJIRA_ALBUMS = {
  'release-groups': [
    ...['Terra Incognita', 'The Link', 'The Way of All Flesh', "L'Enfant sauvage", 'Magma', 'Fortitude', 'Demo I', 'Demo II'].map(
      (title, i) => ({
        id: `00000000-0000-4000-8000-00000000000${i}`,
        title,
        'primary-type': 'Album',
        'secondary-types': [],
        'first-release-date': String(2001 + i),
      }),
    ),
    { id: FROM_MARS_MBID, title: 'From Mars to Sirius', 'primary-type': 'Album', 'first-release-date': '2005-09-27' },
    { id: '00000000-0000-4000-8000-000000000099', title: 'Les Enfants sauvages', 'primary-type': 'Album', 'first-release-date': '2014', 'secondary-types': ['Live'] },
    { id: '00000000-0000-4000-8000-000000000098', title: 'Zeitgeist', 'primary-type': 'Album', 'first-release-date': '2023' },
  ],
}

/** MusicBrainz simulada: pesquisa de artistas por termo e discografias por MBID. */
function stubMusicBrainz({ artists = {}, albums = {} }: { artists?: Record<string, unknown[]>; albums?: Record<string, unknown> } = {}) {
  const fetchFn = vi.fn<MusicFetch>(async (url) => {
    const parsed = new URL(url)
    if (parsed.pathname.endsWith('/artist')) {
      const term = /^\((.*)\) OR /.exec(parsed.searchParams.get('query') ?? '')?.[1] ?? ''
      return json({ artists: artists[term] ?? [] })
    }
    const body = albums[parsed.searchParams.get('artist') ?? '']
    if (!body) throw new TypeError('Failed to fetch')
    return json(body)
  })
  musicBrainz.reset({ fetchFn, minIntervalMs: 0 })
  return fetchFn
}

function openTab(name: string, storage = createMemoryStorage()) {
  const utils = renderApp(storage, '/edit')
  fireEvent.click(within(screen.getByRole('tablist', { name: 'editor sections' })).getByRole('tab', { name: new RegExp(`^${name}`) }))
  return utils
}

function rankingNames() {
  return within(form().getByRole('list', { name: 'your ranking' }))
    .queryAllByRole('listitem')
    .map((item) => item.querySelector('[class*=rankName]')?.textContent?.replace('custom', '').trim())
}

describe('editor — bandas (MusicBrainz)', () => {
  it('a pesquisa começa vazia e só consulta a API a partir de 2 letras', async () => {
    const fetchFn = stubMusicBrainz({ artists: { sepultura: [MB_ARTIST] } })
    openTab('bands')
    expect(form().queryByRole('list', { name: 'search results' })).not.toBeInTheDocument()

    const search = form().getByLabelText('band name')
    fireEvent.change(search, { target: { value: 's' } })
    fireEvent.change(search, { target: { value: 'sepultura' } })
    expect(await form().findByRole('button', { name: 'add Sepultura to favourites' })).toBeInTheDocument()
    expect(form().getByText('Brazil · 1984 · Brazilian metal band')).toBeInTheDocument()
    expect(form().getByText('Thrash Metal, Groove Metal, Death Metal')).toBeInTheDocument()
    // Uma pausa ao escrever = um pedido; "s" sozinho nunca chega à API.
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('adicionar, ordenar e remover atualiza o ranking e a pré-visualização', async () => {
    stubMusicBrainz({ artists: { sepultura: [MB_ARTIST] } })
    openTab('bands')
    fireEvent.change(form().getByLabelText('band name'), { target: { value: 'sepultura' } })
    fireEvent.click(await form().findByRole('button', { name: 'add Sepultura to favourites' }))
    const results = within(form().getByRole('list', { name: 'search results' }))
    expect(results.getByRole('button', { name: 'remove Sepultura from favourites' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(form().getByRole('button', { name: 'move Sepultura up' }))
    fireEvent.click(within(form().getByRole('list', { name: 'your ranking' })).getByRole('button', { name: 'remove Opeth from favourites' }))
    expect(rankingNames()).toEqual(['Gojira', 'Moonspell', 'At the Gates', 'Mastodon', 'Sepultura', 'Meshuggah'])

    fireEvent.click(preview().getByRole('tab', { name: /^music/ }))
    const names = within(preview().getByRole('region', { name: 'favourite bands' }))
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent)
    expect(names).toEqual(['Gojira', 'Moonspell', 'At the Gates', 'Mastodon', 'Sepultura', 'Meshuggah'])
    // Remover a Opeth tirou também o álbum dela.
    expect(within(preview().getByRole('region', { name: 'favourite albums' })).queryByText('Blackwater Park')).not.toBeInTheDocument()
  })

  it('sem resultados oferece criar a banda à mão com o nome escrito', async () => {
    stubMusicBrainz()
    openTab('bands')
    fireEvent.change(form().getByLabelText('band name'), { target: { value: 'Garagem Negra' } })
    expect(await form().findByText('No band matches “Garagem Negra”.')).toBeInTheDocument()
    fireEvent.click(form().getByRole('button', { name: 'add “Garagem Negra” as a custom band' }))
    expect(form().getByLabelText('Band name')).toHaveValue('Garagem Negra')
  })

  it('se a MusicBrainz falhar, explica e deixa adicionar à mão', async () => {
    musicBrainz.reset({ minIntervalMs: 0, fetchFn: async () => new Response('', { status: 503 }) })
    openTab('bands')
    fireEvent.change(form().getByLabelText('band name'), { target: { value: 'sepultura' } })
    expect(await form().findByRole('alert')).toHaveTextContent('MusicBrainz could not be reached')
    expect(form().getByRole('button', { name: 'add “sepultura” as a custom band' })).toBeInTheDocument()

    // Com o serviço de volta, "try again" repete a mesma pesquisa.
    stubMusicBrainz({ artists: { sepultura: [MB_ARTIST] } })
    fireEvent.click(form().getByRole('button', { name: 'try again' }))
    expect(await form().findByRole('button', { name: 'add Sepultura to favourites' })).toBeInTheDocument()
  })

  it('cria e edita uma banda à mão; persiste depois de guardar', () => {
    const storage = createMemoryStorage()
    openTab('bands', storage)
    fireEvent.click(form().getByRole('button', { name: 'add a band manually' }))
    fireEvent.change(form().getByLabelText('Band name'), { target: { value: 'Garagem Negra' } })
    fireEvent.change(form().getByLabelText('country (optional)'), { target: { value: 'PT' } })
    fireEvent.change(form().getByLabelText('formed in (optional)'), { target: { value: '2019' } })
    fireEvent.click(form().getByRole('button', { name: 'add band' }))
    expect(rankingNames().at(-1)).toBe('Garagem Negra')
    expect(form().getByText('Portugal · 2019')).toBeInTheDocument()

    fireEvent.click(form().getByRole('button', { name: 'edit Garagem Negra' }))
    fireEvent.change(form().getByLabelText('Band name'), { target: { value: 'Garagem Branca' } })
    fireEvent.click(form().getByRole('button', { name: 'save band' }))
    // As bandas da MusicBrainz não têm botão de editar.
    expect(form().queryByRole('button', { name: 'edit Gojira' })).not.toBeInTheDocument()

    fireEvent.click(header().getByRole('button', { name: 'save' }))
    const bands = JSON.parse(storage.getItem(STORAGE_KEY)!).profile.bands as Band[]
    expect(bands.at(-1)).toMatchObject({ name: 'Garagem Branca', country: 'PT', formedYear: 2019, source: 'custom' })
  })

  it('uma banda à mão com um nome que já está no perfil é recusada', () => {
    openTab('bands')
    fireEvent.click(form().getByRole('button', { name: 'add a band manually' }))
    fireEvent.change(form().getByLabelText('Band name'), { target: { value: 'opeth' } })
    fireEvent.click(form().getByRole('button', { name: 'add band' }))
    expect(form().getByRole('alert')).toHaveTextContent('A band with that name already exists')
  })
})

describe('editor — álbuns', () => {
  it('mostra só álbuns de estúdio da banda escolhida, com limite inicial e filtro', async () => {
    stubMusicBrainz({ albums: { [GOJIRA_MBID]: GOJIRA_ALBUMS } })
    openTab('albums')
    const list = await form().findByRole('list', { name: 'albums by Gojira' })
    // 10 de estúdio (o ao vivo fica de fora); mostram-se 8 de cada vez.
    expect(within(list).getAllByRole('listitem')).toHaveLength(8)
    expect(form().queryByText('Les Enfants sauvages')).not.toBeInTheDocument()
    expect(form().getByRole('button', { name: 'remove From Mars to Sirius from favourites' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(form().getByRole('button', { name: 'show all 10 albums' }))
    expect(within(form().getByRole('list', { name: 'albums by Gojira' })).getAllByRole('listitem')).toHaveLength(10)

    fireEvent.change(form().getByLabelText('filter albums'), { target: { value: 'magma' } })
    expect(within(form().getByRole('list', { name: 'albums by Gojira' })).getAllByRole('listitem')).toHaveLength(1)
    fireEvent.click(form().getByRole('button', { name: 'add Magma to favourites' }))

    fireEvent.click(preview().getByRole('tab', { name: /^music/ }))
    expect(within(preview().getByRole('region', { name: 'favourite albums' })).getByText('Magma')).toBeInTheDocument()
  })

  it('escolher outra banda pede a discografia dela; um erro pode ser repetido', async () => {
    const fetchFn = stubMusicBrainz({ albums: { [GOJIRA_MBID]: GOJIRA_ALBUMS } })
    openTab('albums')
    await form().findByRole('list', { name: 'albums by Gojira' })
    fireEvent.click(form().getByRole('button', { name: 'Opeth' }))
    expect(await form().findByRole('alert')).toHaveTextContent('could not be loaded')

    fetchFn.mockResolvedValueOnce(json(GOJIRA_ALBUMS))
    fireEvent.click(form().getByRole('button', { name: 'try again' }))
    expect(await form().findByRole('list', { name: 'albums by Opeth' })).toBeInTheDocument()
  })

  it('bandas criadas à mão não têm discografia: o álbum escreve-se à mão', () => {
    const fetchFn = stubMusicBrainz()
    const band: Band = { id: 'band-garagem', name: 'Garagem', subgenres: [], source: 'custom' }
    openTab('albums', storageWithProfile(makeProfile({ bands: [band], albums: [] })))
    expect(form().getByText(/no discography to browse/)).toBeInTheDocument()

    fireEvent.click(form().getByRole('button', { name: 'album missing? add it manually' }))
    fireEvent.change(form().getByLabelText('title'), { target: { value: 'Demo Tape' } })
    fireEvent.change(form().getByLabelText('year (optional)'), { target: { value: '2019' } })
    fireEvent.click(form().getByRole('button', { name: 'add album' }))
    expect(form().getByRole('button', { name: 'remove Demo Tape' })).toBeInTheDocument()
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('sem bandas explica que é preciso escolhê-las primeiro', () => {
    openTab('albums', storageWithProfile(makeProfile({ bands: [], albums: [] })))
    expect(form().getByText('Add favourite bands first; their albums show up here.')).toBeInTheDocument()
  })
})
