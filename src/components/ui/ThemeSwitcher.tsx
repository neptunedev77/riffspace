import { useRef, type KeyboardEvent } from 'react'
import { THEMES, type ThemeId } from '../../domain/theme.ts'
import { cx } from '../../lib/cx.ts'
import styles from './ThemeSwitcher.module.css'

interface ThemeSwitcherProps {
  value: ThemeId
  onChange: (theme: ThemeId) => void
  className?: string
}

/**
 * Seletor de tema com semântica de radiogroup: Tab entra no grupo,
 * setas mudam o tema (padrão WAI-ARIA de roving tabindex).
 */
export function ThemeSwitcher({ value, onChange, className }: ThemeSwitcherProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const current = THEMES.find((theme) => theme.id === value) ?? THEMES[0]!

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    let nextIndex: number | null = null
    if (delta !== 0) nextIndex = (index + delta + THEMES.length) % THEMES.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = THEMES.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    const next = THEMES[nextIndex]!
    onChange(next.id)
    buttons.current[nextIndex]?.focus()
  }

  return (
    <div className={cx(styles.wrapper, className)}>
      <div role="radiogroup" aria-label="Tema visual" className={styles.group}>
        {THEMES.map((theme, index) => {
          const checked = theme.id === value
          return (
            <button
              key={theme.id}
              ref={(node) => {
                buttons.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={theme.label}
              title={`${theme.label} — ${theme.description}`}
              tabIndex={checked ? 0 : -1}
              className={cx(styles.option, checked && styles.checked)}
              onClick={() => onChange(theme.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span
                className={styles.swatch}
                aria-hidden="true"
                style={{ background: `linear-gradient(135deg, ${theme.swatch[0]} 45%, ${theme.swatch[1]} 46%)` }}
              />
            </button>
          )
        })}
      </div>
      <span className={styles.current} aria-hidden="true">
        {current.label}
      </span>
    </div>
  )
}
