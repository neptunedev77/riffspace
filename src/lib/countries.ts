import { intlLocale } from '../i18n/translate.ts'

const regionNamesByLocale = new Map<string, Intl.DisplayNames | null>()

/** Nome do país no idioma ativo a partir do código ISO, com fallback para o próprio código. */
export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined
  const locale = intlLocale()
  if (!regionNamesByLocale.has(locale)) {
    try {
      regionNamesByLocale.set(locale, new Intl.DisplayNames([locale], { type: 'region' }))
    } catch {
      regionNamesByLocale.set(locale, null)
    }
  }
  try {
    return regionNamesByLocale.get(locale)?.of(code) ?? code
  } catch {
    // Códigos especiais da MusicBrainz (p. ex. XW, "mundo") não são regiões válidas.
    return code
  }
}
