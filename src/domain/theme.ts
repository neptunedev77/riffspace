export const THEME_IDS = ['obsidian', 'blood-moon', 'frozen-abyss'] as const

export type ThemeId = (typeof THEME_IDS)[number]

export interface ThemeMeta {
  id: ThemeId
  label: string
  description: string
  /** Cores usadas apenas na amostra do seletor; as cores reais vivem em themes.css. */
  swatch: readonly [string, string]
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'Carvão profundo com destaque carmesim.',
    swatch: ['#141418', '#d4213a'],
  },
  {
    id: 'blood-moon',
    label: 'Blood Moon',
    description: 'Negro quente, brasas e laranja de eclipse.',
    swatch: ['#1b0c0a', '#ff5a2e'],
  },
  {
    id: 'frozen-abyss',
    label: 'Frozen Abyss',
    description: 'Azul abissal com gelo ciano.',
    swatch: ['#0c131d', '#63d2ff'],
  },
]

export const DEFAULT_THEME: ThemeId = 'obsidian'

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!
}
