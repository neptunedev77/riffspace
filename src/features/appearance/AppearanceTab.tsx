import { Check } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { themeDescription, THEMES } from '../../domain/theme.ts'
import { useI18n } from '../../i18n/context.ts'
import { cx } from '../../lib/cx.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import formStyles from '../profile-editor/EditorForms.module.css'
import styles from './AppearanceTab.module.css'

/**
 * Escolha do tema do card. Faz parte do rascunho: aplica-se logo à
 * pré-visualização e só fica guardado com "Guardar".
 * Semântica de radiogroup com roving tabindex (setas mudam o tema).
 */
export function AppearanceTab({ draft, update }: TabProps) {
  const { t } = useI18n()
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const select = (index: number) => {
    const theme = THEMES[index]
    if (!theme) return
    update((d) => ({ ...d, theme: theme.id }))
    refs.current[index]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !backward) return
    event.preventDefault()
    select((index + (forward ? 1 : -1) + THEMES.length) % THEMES.length)
  }

  return (
    <div className={formStyles.stack}>
      <p className={formStyles.note}>{t('appearance.intro')}</p>
      <div role="radiogroup" aria-label={t('appearance.themes')} className={styles.grid}>
        {THEMES.map((theme, index) => {
          const checked = theme.id === draft.theme
          return (
            <button
              key={theme.id}
              ref={(node) => {
                refs.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={theme.label}
              aria-describedby={`theme-desc-${theme.id}`}
              tabIndex={checked ? 0 : -1}
              className={cx(styles.tile, checked && styles.checked)}
              onClick={() => select(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              <span
                className={styles.swatch}
                aria-hidden="true"
                style={{
                  background: `radial-gradient(120% 90% at 0% 0%, ${theme.swatch[1]}55, transparent 60%), ${theme.swatch[0]}`,
                }}
              >
                <span className={styles.swatchBar} style={{ background: theme.swatch[1] }} />
                <span className={styles.swatchLine} />
                <span className={styles.swatchLine} />
              </span>
              <span className={styles.text}>
                <span className={styles.name}>
                  {theme.label}
                  {checked && <Check aria-hidden="true" />}
                </span>
                <span id={`theme-desc-${theme.id}`} className={styles.desc}>
                  {themeDescription(theme.id)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
