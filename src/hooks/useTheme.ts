import { useLayoutEffect } from 'react'
import type { ThemeId } from '../domain/theme.ts'

/** Aplica o tema a <html data-theme> e à meta theme-color do browser. */
export function applyTheme(theme: ThemeId, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme
  const color = getComputedStyle(root).getPropertyValue('--theme-color').trim()
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta && color) meta.content = color
}

/**
 * Mantém <html data-theme> sincronizado com o tema do perfil.
 * Layout effect: o tema fica aplicado antes da pintura e antes dos efeitos
 * passivos dos filhos (o AmbientCanvas lê os tokens de cor).
 */
export function useApplyTheme(theme: ThemeId): void {
  useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])
}
