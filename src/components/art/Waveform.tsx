import { cx } from '../../lib/cx.ts'
import styles from './Waveform.module.css'

interface WaveformProps {
  /** Picos normalizados (0–1), um por barra. */
  peaks: readonly number[]
  /** Fração já reproduzida (0–1), pintada com a cor de destaque. */
  progress?: number
  className?: string
}

/** Forma de onda desenhada a partir de picos reais de áudio. */
export function Waveform({ peaks, progress = 0, className }: WaveformProps) {
  const bars = peaks.length
  const played = Math.round(bars * Math.min(1, Math.max(0, progress)))

  return (
    <svg
      className={cx(styles.wave, className)}
      viewBox={`0 0 ${bars * 3} 24`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {peaks.map((peak, i) => {
        const height = Math.max(1.2, peak * 22)
        return (
          <rect
            key={i}
            x={i * 3}
            y={12 - height / 2}
            width={1.6}
            height={height}
            rx={0.8}
            className={i < played ? styles.played : styles.bar}
          />
        )
      })}
    </svg>
  )
}
