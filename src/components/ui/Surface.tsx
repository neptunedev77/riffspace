import type { HTMLAttributes } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Surface.module.css'

type SurfaceTag = 'div' | 'section' | 'article' | 'aside' | 'li'

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: SurfaceTag
  /** Nível de elevação: 1 subtil, 3 mais opaco. */
  level?: 1 | 2 | 3
  /** Reflexo de luz no topo do painel. */
  sheen?: boolean
}

/** Painel translúcido com blur — a base dos "cartões" do RIFFSPACE. */
export function Surface({ as: Tag = 'div', level = 1, sheen = true, className, ...rest }: SurfaceProps) {
  return <Tag className={cx(styles.surface, styles[`level${level}`], sheen && styles.sheen, className)} {...rest} />
}
