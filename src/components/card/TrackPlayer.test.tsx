import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_PROFILE } from '../../data/demo-profile.ts'
import { TrackPlayer } from './TrackPlayer.tsx'

const track = DEMO_PROFILE.featuredTrack!
const label = 'Flying Whales — Gojira'

// O jsdom não reproduz áudio: simula-se o estado "paused" e os eventos play/pause.
const pausedState = new WeakMap<HTMLMediaElement, boolean>()

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (this: HTMLMediaElement) {
    return pausedState.get(this) ?? true
  })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(async function (this: HTMLMediaElement) {
    pausedState.set(this, false)
    this.dispatchEvent(new Event('play'))
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
    pausedState.set(this, true)
    this.dispatchEvent(new Event('pause'))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TrackPlayer', () => {
  it('mostra a música, a forma de onda real e a atribuição com link seguro', () => {
    const { container } = render(<TrackPlayer track={track} />)
    expect(screen.getByRole('region', { name: `featured track: ${label}` })).toBeInTheDocument()
    expect(container.querySelectorAll('rect')).toHaveLength(track.peaks.length)
    const source = screen.getByRole('link', { name: /apple music/ })
    expect(source).toHaveAttribute('href', track.trackUrl)
    expect(source).toHaveAttribute('target', '_blank')
    expect(source).toHaveAttribute('rel', expect.stringContaining('noopener'))
    // O áudio só é carregado quando se carrega em play.
    expect(container.querySelector('audio')).toHaveAttribute('preload', 'none')
  })

  it('play e pause alternam o botão', async () => {
    render(<TrackPlayer track={track} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: `play ${label}` }))
    })
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()
    const pause = screen.getByRole('button', { name: `pause ${label}` })
    fireEvent.click(pause)
    expect(screen.getByRole('button', { name: `play ${label}` })).toBeInTheDocument()
  })

  it('a posição acompanha o áudio e o seek muda o tempo', () => {
    const { container } = render(<TrackPlayer track={track} />)
    const audio = container.querySelector('audio')!
    audio.currentTime = 12
    fireEvent.timeUpdate(audio)
    expect(screen.getByText('0:12 / 0:30')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: 'position' }), { target: { value: '20' } })
    expect(audio.currentTime).toBe(20)
    expect(screen.getByText('0:20 / 0:30')).toBeInTheDocument()
  })

  it('se a pré-visualização falhar, os controlos ficam desativados e isso é dito', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException('blocked', 'NotSupportedError'))
    render(<TrackPlayer track={track} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: `play ${label}` }))
    })
    expect(screen.getByText('preview unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `play ${label}` })).toBeDisabled()
    expect(screen.getByRole('slider', { name: 'position' })).toBeDisabled()
  })
})
