import { createContext, useContext } from 'react'
import { DEFAULT_LOCALE, type Locale } from './locales.ts'
import { translate, translatePlural, type MessageKey, type Vars } from './translate.ts'

export interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, vars?: Vars) => string
  tp: (key: string, count: number, vars?: Vars) => string
}

/** Valor por omissão (sem provider): inglês, sem possibilidade de mudar. */
export const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, vars) => translate(key, vars, DEFAULT_LOCALE),
  tp: (key, count, vars) => translatePlural(key, count, vars, DEFAULT_LOCALE),
})

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}
