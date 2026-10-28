import { DEFAULT_LOCALE, LOCALE_META, type Locale } from './locales.ts'
import { en, type MessageKey } from './messages/en.ts'
import { pt } from './messages/pt.ts'

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { en, pt }

/**
 * Idioma ativo ao nível do módulo. É o I18nProvider que o define; código fora
 * do React (mensagens Zod, operações de domínio) lê-o no momento em que corre.
 */
let activeLocale: Locale = DEFAULT_LOCALE

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale
}

export function getActiveLocale(): Locale {
  return activeLocale
}

/** Locale BCP 47 para Intl (datas, nomes de países). */
export function intlLocale(locale: Locale = activeLocale): string {
  return LOCALE_META[locale].intl
}

export type Vars = Record<string, string | number>

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}

/** Traduz uma chave para o idioma indicado (por omissão o ativo), com variáveis `{nome}`. */
export function translate(key: MessageKey, vars?: Vars, locale: Locale = activeLocale): string {
  return interpolate(DICTIONARIES[locale][key] ?? en[key], vars)
}

/** Plural simples: usa `<key>.one` quando count === 1 e `<key>.other` caso contrário. */
export function translatePlural(
  key: string,
  count: number,
  vars?: Vars,
  locale: Locale = activeLocale,
): string {
  const full = `${key}.${count === 1 ? 'one' : 'other'}` as MessageKey
  return translate(full, { count, ...vars }, locale)
}

export type { MessageKey }
