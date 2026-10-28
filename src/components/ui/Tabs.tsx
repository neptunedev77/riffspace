import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Tabs.module.css'

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
  /** Indicador opcional (p. ex. número de erros). */
  badge?: ReactNode
}

interface TabsProps<T extends string> {
  /** Nome acessível da lista de separadores. */
  label: string
  /** Prefixo único para os IDs dos separadores e painéis. */
  idPrefix: string
  tabs: readonly TabItem<T>[]
  value: T
  onChange: (id: T) => void
  children: ReactNode
  className?: string
  /** Vertical: setas para cima/baixo (as horizontais também funcionam). */
  orientation?: 'horizontal' | 'vertical'
  /** Classes extra para a lista e o painel, para layouts próprios. */
  listClassName?: string
  panelClassName?: string
}

/** Separadores WAI-ARIA: setas e Home/End mudam de separador; o painel ativo é o único renderizado. */
export function Tabs<T extends string>({
  label,
  idPrefix,
  tabs,
  value,
  onChange,
  children,
  className,
  orientation = 'horizontal',
  listClassName,
  panelClassName,
}: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const tabId = (id: string) => `${idPrefix}-tab-${id}`
  const panelId = `${idPrefix}-panel`

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    let next: number | null = null
    const forward = event.key === 'ArrowRight' || (orientation === 'vertical' && event.key === 'ArrowDown')
    const backward = event.key === 'ArrowLeft' || (orientation === 'vertical' && event.key === 'ArrowUp')
    if (forward) next = (index + 1) % tabs.length
    if (backward) next = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = tabs.length - 1
    if (next === null) return
    event.preventDefault()
    onChange(tabs[next]!.id)
    refs.current[next]?.focus()
  }

  return (
    <div className={cx(styles.tabs, className)}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        className={cx(styles.list, orientation === 'vertical' && styles.vertical, listClassName)}
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === value
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[index] = node
              }}
              id={tabId(tab.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className={cx(styles.tab, selected && styles.selected)}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.label}
              {tab.badge}
            </button>
          )
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(value)} tabIndex={0} className={cx(styles.panel, panelClassName)}>
        {children}
      </div>
    </div>
  )
}
