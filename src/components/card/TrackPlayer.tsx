import { ArrowUpRight, Pause, Play } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FeaturedTrack } from '../../domain/track.ts'
import { useI18n } from '../../i18n/context.ts'
import { cx } from '../../lib/cx.ts'
import { Waveform } from '../art/Waveform.tsx'
import styles from './TrackPlayer.module.css'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Leitor da música em destaque: forma de onda real (picos da pré-visualização),
 * play/pause, posição e atribuição. O áudio é a pré-visualização oficial,
 * carregado só quando se carrega em play. Quem o usa deve dar-lhe uma `key`
 * por faixa, para que trocar de música reponha o leitor.
 */
export function TrackPlayer({ track, className }: { track: FeaturedTrack; className?: string }) {
  const { t } = useI18n()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(30)
  const [failed, setFailed] = useState(false)

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    try {
      await audio.play()
    } catch {
      setFailed(true)
    }
  }

  const seek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setTime(value)
  }

  const label = `${track.title} — ${track.artist}`

  return (
    <section className={cx(styles.player, className)} aria-label={t('track.player', { title: label })}>
      <audio
        ref={audioRef}
        src={track.previewUrl}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setTime(0)
        }}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration)
        }}
        onError={() => setFailed(true)}
      />

      <button
        type="button"
        className={styles.play}
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? t('track.pause', { title: label }) : t('track.play', { title: label })}
      >
        {track.artworkUrl && <img src={track.artworkUrl} alt="" width={44} height={44} className={styles.artwork} />}
        <span className={styles.playIcon} aria-hidden="true">
          {playing ? <Pause /> : <Play />}
        </span>
      </button>

      <div className={styles.body}>
        <p className={styles.meta}>
          <span className={styles.title}>{track.title}</span>
          <span className={styles.artist}>{track.artist}</span>
        </p>
        <div className={styles.waveWrap}>
          <Waveform peaks={track.peaks} progress={duration > 0 ? time / duration : 0} />
          <input
            type="range"
            className={styles.seek}
            min={0}
            max={duration}
            step={0.1}
            value={time}
            disabled={failed}
            aria-label={t('track.seek')}
            aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`}
            onChange={(event) => seek(Number(event.target.value))}
          />
        </div>
        <p className={styles.footer}>
          <span className={styles.time}>
            {failed ? t('track.unavailable') : `${formatTime(time)} / ${formatTime(duration)}`}
          </span>
          {track.trackUrl && (
            <a className={styles.source} href={track.trackUrl} target="_blank" rel="noopener noreferrer nofollow">
              {t('track.source')}
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
        </p>
      </div>
    </section>
  )
}
