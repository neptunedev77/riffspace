export const LOCALES = ['en', 'pt'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_META: Record<Locale, { label: string; intl: string; htmlLang: string }> = {
  en: { label: 'English', intl: 'en-GB', htmlLang: 'en' },
  pt: { label: 'Português', intl: 'pt-PT', htmlLang: 'pt' },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}
