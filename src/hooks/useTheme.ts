import { useLayoutEffect, useState } from 'react'
import { DEFAULT_THEME, type ThemeId } from '../domain/theme.ts'

/** Aplica o tema a <html data-theme> e à meta theme-color do browser. */
export function applyTheme(theme: ThemeId, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme
  const color = getComputedStyle(root).getPropertyValue('--theme-color').trim()
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta && color) meta.content = color
}

/**
 * Estado do tema ativo. Na Etapa 1 vive só em memória; a persistência
 * com o perfil chega na Etapa 2.
 */
export function useTheme(initial: ThemeId = DEFAULT_THEME) {
  const [theme, setTheme] = useState<ThemeId>(initial)

  // Layout effect: o tema fica aplicado antes dos efeitos passivos dos filhos
  // (p. ex. AmbientCanvas lê os tokens de cor) e antes da pintura.
  useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])

  return [theme, setTheme] as const
}
