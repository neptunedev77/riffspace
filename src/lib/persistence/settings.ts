import { z } from 'zod'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../../i18n/locales.ts'
import type { KeyValueStorage } from './storage.ts'

/**
 * Definições da aplicação (preferências de quem usa este browser). Ficam fora
 * do perfil: não são exportadas com ele e aplicam-se de imediato.
 */
export interface AppSettings {
  locale: Locale
}

export const SETTINGS_KEY = 'riffspace:settings'

export const DEFAULT_SETTINGS: AppSettings = { locale: DEFAULT_LOCALE }

const settingsSchema = z.object({
  locale: z.enum(LOCALES).catch(DEFAULT_LOCALE),
})

/** Lê as definições; dados ausentes, corrompidos ou inválidos dão os valores por omissão. */
export function loadSettings(storage: KeyValueStorage | null): AppSettings {
  if (!storage) return DEFAULT_SETTINGS
  try {
    const raw = storage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = settingsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Grava as definições. Falhas de storage são ignoradas: a preferência vale para esta sessão. */
export function saveSettings(storage: KeyValueStorage | null, settings: AppSettings): void {
  if (!storage) return
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Sem armazenamento, a preferência fica só em memória.
  }
}
