import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '../domain/profile.ts'
import { STORAGE_KEY } from '../lib/persistence/repository.ts'
import { ITUNES_SONG, makeProfile, storageWithProfile } from './fixtures.ts'
import { renderApp } from './renderApp.tsx'

const LABEL = 'Flying Whales — Gojira'

const form = () => within(document.getElementById('editor-panel')!)
const preview = () => within(screen.getByRole('complementary', { name: 'card preview' }))
const header = () => within(screen.getByRole('heading', { level: 1 }).closest('header')!)

/** Rede simulada: a pesquisa devolve uma música e a pré-visualização uns bytes. */
function stubNetwork({ search = 'ok', audio = 'ok' }: { search?: 'ok' | 'fail'; audio?: 'ok' | 'fail' } = {}) {
  const fetchMock = vi.fn(async (input: string) => {
    if (input.startsWith('https://itunes.apple.com/search')) {
      if (search === 'fail') throw new TypeError('Failed to fetch')
      return new Response(JSON.stringify({ resultCount: 1, results: [ITUNES_SONG] }))
    }
    return new Response(new ArrayBuffer(16))
  })
  vi.stubGlobal('fetch', fetchMock)

  // Web Audio simulada: descodifica para um sinal com volume crescente.
  class FakeOfflineAudioContext {
    decodeAudioData(): Promise<unknown> {
      if (audio === 'fail') return Promise.reject(new DOMException('Unable to decode', 'EncodingError'))
      const data = Float32Array.from({ length: 2400 }, (_, i) => (i / 2400) * (i % 2 ? 1 : -1))
      return Promise.resolve({ numberOfChannels: 1, length: data.length, getChannelData: () => data })
    }
  }
  vi.stubGlobal('OfflineAudioContext', FakeOfflineAudioContext)
  return fetchMock
}

function openTrackTab(profile: Profile = makeProfile({ featuredTrack: undefined })) {
  const utils = renderApp(storageWithProfile(profile), '/edit')
  fireEvent.click(within(screen.getByRole('tablist', { name: 'editor sections' })).getByRole('tab', { name: /^track/ }))
  return utils
}

function search(term: string) {
  fireEvent.change(form().getByLabelText('artist or track'), { target: { value: term } })
  fireEvent.click(form().getByRole('button', { name: 'search' }))
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('editor — música em destaque', () => {
  it('pesquisa, escolhe uma música, mostra-a na pré-visualização e guarda-a com os picos reais', async () => {
    const fetchMock = stubNetwork()
    const { storage } = openTrackTab()
    expect(form().getByText('No featured track yet.')).toBeInTheDocument()
    expect(preview().queryByRole('region', { name: /featured track/ })).not.toBeInTheDocument()

    search('gojira')
    fireEvent.click(await form().findByRole('button', { name: `feature ${LABEL}` }))

    expect(await preview().findByRole('region', { name: `featured track: ${LABEL}` })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(ITUNES_SONG.previewUrl, expect.anything())
    expect(form().getByRole('button', { name: `feature ${LABEL}` })).toHaveAttribute('aria-pressed', 'true')
    expect(header().getByText('Unsaved changes.')).toBeInTheDocument()

    fireEvent.click(header().getByRole('button', { name: 'save' }))
    const saved = JSON.parse(storage.getItem(STORAGE_KEY)!).profile.featuredTrack
    expect(saved).toMatchObject({ source: 'itunes', trackId: ITUNES_SONG.trackId, title: 'Flying Whales' })
    expect(saved.peaks).toHaveLength(120)
    expect(Math.max(...saved.peaks)).toBe(1)
    // A forma de onda segue o volume crescente do sinal.
    expect(saved.peaks[0]).toBeLessThan(saved.peaks[119])
  })

  it('sem rede mostra um erro honesto e não altera o perfil', async () => {
    stubNetwork({ search: 'fail' })
    openTrackTab()
    search('gojira')
    expect(await form().findByText(/catalogue could not be reached/)).toBeInTheDocument()
    expect(header().getByText('No changes.')).toBeInTheDocument()
  })

  it('se o áudio não puder ser analisado a música não é adicionada', async () => {
    stubNetwork({ audio: 'fail' })
    openTrackTab()
    search('gojira')
    fireEvent.click(await form().findByRole('button', { name: `feature ${LABEL}` }))
    expect(await form().findByRole('alert')).toHaveTextContent('could not be analysed')
    expect(form().getByText('No featured track yet.')).toBeInTheDocument()
    expect(preview().queryByRole('region', { name: /featured track/ })).not.toBeInTheDocument()
  })

  it('pesquisa sem resultados mostra estado vazio', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ resultCount: 0, results: [] }))))
    openTrackTab()
    search('zzzz')
    expect(await form().findByText('No tracks match “zzzz”.')).toBeInTheDocument()
  })

  it('remover a música tira-a da pré-visualização e do perfil guardado', async () => {
    const { storage } = openTrackTab(makeProfile())
    expect(preview().getByRole('region', { name: /featured track/ })).toBeInTheDocument()
    fireEvent.click(form().getByRole('button', { name: 'remove track' }))
    expect(preview().queryByRole('region', { name: /featured track/ })).not.toBeInTheDocument()
    fireEvent.click(header().getByRole('button', { name: 'save' }))
    await waitFor(() => expect(JSON.parse(storage.getItem(STORAGE_KEY)!).profile).not.toHaveProperty('featuredTrack'))
  })
})
