import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Badge.module.css'

export type BadgeTone = 'neutral' | 'accent' | 'demo' | 'planned'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  icon?: ReactNode
  className?: string
  id?: string
}

export function Badge({ children, tone = 'neutral', icon, className, id }: BadgeProps) {
  return (
    <span id={id} className={cx(styles.badge, styles[tone], className)}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
