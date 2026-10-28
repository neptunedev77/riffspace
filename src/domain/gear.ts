import { translate } from '../i18n/translate.ts'

export const GEAR_TYPES = [
  'guitar',
  'bass',
  'pedal',
  'amp',
  'cabinet',
  'interface',
  'other',
] as const

export type GearType = (typeof GEAR_TYPES)[number]

/** Nome do tipo de equipamento no idioma ativo. */
export function gearTypeLabel(type: GearType): string {
  return translate(`gear.type.${type}`)
}

/** Nome curto para espaços apertados (nós da cadeia de sinal). */
export function gearTypeShortLabel(type: GearType): string {
  return translate(`gear.short.${type}`)
}

export interface GearItem {
  id: string
  type: GearType
  brand: string
  model: string
  nickname?: string
  imageUrl?: string
  notes?: string
  tags: string[]
  favorite?: boolean
}

/**
 * Estágios da cadeia de sinal, pela ordem em que o sinal os percorre.
 * Interfaces e "outros" ficam fora da cadeia.
 */
const CHAIN_STAGE: Partial<Record<GearType, number>> = {
  guitar: 0,
  bass: 0,
  pedal: 1,
  amp: 2,
  cabinet: 3,
}

export function isChainGear(item: GearItem): boolean {
  return CHAIN_STAGE[item.type] !== undefined
}

/**
 * Cadeia de sinal visual: instrumento → pedais → amplificador → cabinet.
 * Dentro de cada estágio mantém a ordem da rig (ordenação estável).
 * É uma representação visual; não valida compatibilidade elétrica ou de áudio.
 */
export function buildSignalChain(rig: readonly GearItem[]): GearItem[] {
  return rig
    .filter(isChainGear)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (CHAIN_STAGE[a.item.type] ?? 0) - (CHAIN_STAGE[b.item.type] ?? 0) || a.index - b.index)
    .map(({ item }) => item)
}

export function gearDisplayName(item: Pick<GearItem, 'brand' | 'model'>): string {
  return `${item.brand} ${item.model}`.trim()
}
