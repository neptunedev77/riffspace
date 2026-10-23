import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Ícone decorativo à esquerda do texto. */
  icon?: ReactNode
  /** Conteúdo à direita (p. ex. um Badge "Em breve"). */
  trailing?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  trailing,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], styles[size], className)}
      {...rest}
    >
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children !== undefined && <span className={styles.label}>{children}</span>}
      {trailing}
    </button>
  )
}
