import { translate } from '../i18n/translate.ts'

export const THEME_IDS = ['obsidian', 'blood-moon', 'frozen-abyss'] as const

export type ThemeId = (typeof THEME_IDS)[number]

export interface ThemeMeta {
  id: ThemeId
  label: string
  /** Cores usadas apenas na amostra do seletor; as cores reais vivem em themes.css. */
  swatch: readonly [string, string]
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: 'obsidian',
    label: 'Obsidian',
    swatch: ['#141418', '#d4213a'],
  },
  {
    id: 'blood-moon',
    label: 'Blood Moon',
    swatch: ['#1b0c0a', '#ff5a2e'],
  },
  {
    id: 'frozen-abyss',
    label: 'Frozen Abyss',
    swatch: ['#0c131d', '#63d2ff'],
  },
]

export const DEFAULT_THEME: ThemeId = 'obsidian'

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

/** Descrição curta do tema no idioma ativo. */
export function themeDescription(id: ThemeId): string {
  return translate(`theme.desc.${id}`)
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!
}
