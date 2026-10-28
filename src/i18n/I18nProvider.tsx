import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { LOCALE_META, type Locale } from './locales.ts'
import { I18nContext, type I18nValue } from './context.ts'
import { setActiveLocale, translate, translatePlural } from './translate.ts'

interface I18nProviderProps {
  initialLocale: Locale
  /** Chamado quando o utilizador muda de idioma (para persistir a preferência). */
  onLocaleChange?: (locale: Locale) => void
  children: ReactNode
}

export function I18nProvider({ initialLocale, onLocaleChange, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    setActiveLocale(initialLocale)
    return initialLocale
  })

  const setLocale = useCallback(
    (next: Locale) => {
      // Atualiza o idioma do módulo antes do re-render, para que validações e
      // formatações feitas durante o render já usem o novo idioma.
      setActiveLocale(next)
      setLocaleState(next)
      onLocaleChange?.(next)
    },
    [onLocaleChange],
  )

  useLayoutEffect(() => {
    document.documentElement.lang = LOCALE_META[locale].htmlLang
  }, [locale])

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(key, vars, locale),
      tp: (key, count, vars) => translatePlural(key, count, vars, locale),
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
