import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Chip.module.css'

interface ChipProps {
  children: ReactNode
  icon?: ReactNode
  /** Com onToggle, o chip torna-se um botão alternável (aria-pressed). */
  selected?: boolean
  onToggle?: () => void
  disabled?: boolean
  className?: string
}

export function Chip({ children, icon, selected = false, onToggle, disabled, className }: ChipProps) {
  const content = (
    <>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </>
  )

  if (!onToggle) {
    return <span className={cx(styles.chip, className)}>{content}</span>
  }

  return (
    <button
      type="button"
      className={cx(styles.chip, styles.interactive, selected && styles.selected, className)}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
    >
      {content}
    </button>
  )
}
