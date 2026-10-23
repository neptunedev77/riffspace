import type { SelectOption } from '../../components/ui/Select.tsx'

/** Países mais comuns na cena metal; lista curta para um select legível. */
const CODES = [
  'PT', 'BR', 'ES', 'FR', 'GB', 'IE', 'DE', 'NL', 'BE', 'IT', 'CH', 'AT', 'PL', 'CZ', 'GR',
  'SE', 'NO', 'FI', 'DK', 'IS', 'RU', 'UA', 'US', 'CA', 'MX', 'AR', 'CL', 'AU', 'NZ', 'JP',
] as const

function regionName(code: string): string {
  try {
    return new Intl.DisplayNames(['pt-PT'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export const COUNTRY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Sem país' },
  ...CODES.map((code) => ({ value: code, label: regionName(code) })).sort((a, b) => a.label.localeCompare(b.label, 'pt')),
]
