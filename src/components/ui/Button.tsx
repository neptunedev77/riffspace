import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '../../lib/cx.ts'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

interface ButtonLookProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Ícone decorativo à esquerda do texto. */
  icon?: ReactNode
  /** Conteúdo à direita (p. ex. um Badge). */
  trailing?: ReactNode
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonLookProps {
  ref?: Ref<HTMLButtonElement>
}

function Content({ icon, trailing, children }: Pick<ButtonLookProps, 'icon' | 'trailing'> & { children?: ReactNode }) {
  return (
    <>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children !== undefined && <span className={styles.label}>{children}</span>}
      {trailing}
    </>
  )
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
    <button type={type} className={cx(styles.button, styles[variant], styles[size], className)} {...rest}>
      <Content icon={icon} trailing={trailing}>
        {children}
      </Content>
    </button>
  )
}

/** Ligação de navegação com o aspeto de um botão (é um <a>, não um <button>). */
export function LinkButton({
  variant = 'secondary',
  size = 'md',
  icon,
  trailing,
  className,
  children,
  ...rest
}: LinkProps & ButtonLookProps) {
  return (
    <Link className={cx(styles.button, styles[variant], styles[size], styles.link, className)} {...rest}>
      <Content icon={icon} trailing={trailing}>
        {children}
      </Content>
    </Link>
  )
}
