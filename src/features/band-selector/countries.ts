import type { SelectOption } from '../../components/ui/Select.tsx'
import { intlLocale, translate } from '../../i18n/translate.ts'

/** Países mais comuns na cena metal; lista curta para um select legível. */
const CODES = [
  'PT', 'BR', 'ES', 'FR', 'GB', 'IE', 'DE', 'NL', 'BE', 'IT', 'CH', 'AT', 'PL', 'CZ', 'GR',
  'SE', 'NO', 'FI', 'DK', 'IS', 'RU', 'UA', 'US', 'CA', 'MX', 'AR', 'CL', 'AU', 'NZ', 'JP',
] as const

/** Opções do select de países, com os nomes no idioma ativo. */
export function countryOptions(): SelectOption[] {
  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames([intlLocale()], { type: 'region' })
  } catch {
    names = null
  }
  const locale = intlLocale()
  return [
    { value: '', label: translate('bands.noCountry') },
    ...CODES.map((code) => ({ value: code, label: names?.of(code) ?? code })).sort((a, b) =>
      a.label.localeCompare(b.label, locale),
    ),
  ]
}
