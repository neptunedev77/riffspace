import { useId, useMemo } from 'react'
import { generateCover, generateSigil, type Paint, type Primitive } from '../../lib/art/generate.ts'
import { cx } from '../../lib/cx.ts'
import styles from './GenerativeArt.module.css'

const PAINT: Record<Paint, string> = {
  accent: 'var(--accent-bright)',
  ink: 'var(--art-ink)',
  second: 'var(--art-2)',
  dark: 'var(--art-bg-2)',
  glow: 'var(--glow-1)',
}

interface GenerativeArtProps {
  seed: string
  variant?: 'cover' | 'sigil'
  /** Sem label a arte é decorativa (aria-hidden). */
  label?: string
  className?: string
}

function renderPrimitive(primitive: Primitive, key: number) {
  const style = {
    fill: primitive.fill ? PAINT[primitive.fill] : 'none',
    stroke: primitive.stroke ? PAINT[primitive.stroke] : undefined,
    strokeWidth: primitive.strokeWidth,
    opacity: primitive.opacity,
  }
  switch (primitive.kind) {
    case 'circle':
      return <circle key={key} cx={primitive.cx} cy={primitive.cy} r={primitive.r} style={style} />
    case 'rect':
      return (
        <rect key={key} x={primitive.x} y={primitive.y} width={primitive.width} height={primitive.height} style={style} />
      )
    case 'path':
      return <path key={key} d={primitive.d} style={{ ...style, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
  }
}

/** Capa ou sigilo abstrato original, gerado a partir de uma seed e tingido pelo tema ativo. */
export function GenerativeArt({ seed, variant = 'cover', label, className }: GenerativeArtProps) {
  // O formato do useId varia entre versões do React; limpa-se para ser seguro em url(#…).
  const gradientId = `art${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const spec = useMemo(() => (variant === 'sigil' ? generateSigil(seed) : generateCover(seed)), [seed, variant])

  return (
    <svg
      viewBox="0 0 100 100"
      className={cx(styles.art, className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {variant === 'sigil' ? (
          <radialGradient id={gradientId}>
            <stop offset="0%" style={{ stopColor: 'var(--art-bg-1)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--art-bg-2)' }} />
          </radialGradient>
        ) : (
          <linearGradient id={gradientId} gradientTransform={`rotate(${spec.angle} 0.5 0.5)`}>
            <stop offset="0%" style={{ stopColor: 'var(--art-bg-1)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--art-bg-2)' }} />
          </linearGradient>
        )}
      </defs>
      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      {spec.primitives.map(renderPrimitive)}
    </svg>
  )
}
