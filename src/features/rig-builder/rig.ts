import type { GearItem, GearType } from '../../domain/gear.ts'
import { LIMITS } from '../../domain/limits.ts'
import type { Profile } from '../../domain/profile.ts'
import { translate } from '../../i18n/translate.ts'
import { createId } from '../../lib/id.ts'
import { gearItemSchema } from '../../lib/validation/schemas.ts'

/**
 * Operações puras sobre a rig. Nunca alteram o perfil recebido; devolvem um
 * novo perfil ou um erro legível para a UI.
 */

export type RigResult<T = GearItem> = { ok: true; profile: Profile; value: T } | { ok: false; error: string }

export interface GearInput {
  type: GearType
  brand: string
  model: string
  nickname?: string
  imageUrl?: string
  notes?: string
  tags: string[]
  favorite?: boolean
}

/** Grupos de ordenação: cada estágio da cadeia e, à parte, o equipamento fora da cadeia. */
export type RigGroup = 'instrument' | 'pedal' | 'amp' | 'cabinet' | 'offchain'

export const RIG_GROUPS: readonly RigGroup[] = ['instrument', 'pedal', 'amp', 'cabinet', 'offchain']

export function rigGroupLabel(group: RigGroup): string {
  return translate(`rig.group.${group}`)
}

export function rigGroup(item: Pick<GearItem, 'type'>): RigGroup {
  switch (item.type) {
    case 'guitar':
    case 'bass':
      return 'instrument'
    case 'pedal':
      return 'pedal'
    case 'amp':
      return 'amp'
    case 'cabinet':
      return 'cabinet'
    default:
      return 'offchain'
  }
}

/** Converte "Drop C, boost ,drop c" em ["Drop C", "boost"]: sem vazios nem repetidos. */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of raw.split(',')) {
    const tag = part.trim()
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
  }
  return tags
}

function validate(input: GearInput, id: string): { ok: true; item: GearItem } | { ok: false; error: string } {
  if (input.tags.length > LIMITS.gearTags.max) {
    return { ok: false, error: translate('rig.error.maxTags', { max: LIMITS.gearTags.max }) }
  }
  const parsed = gearItemSchema.safeParse({
    id,
    type: input.type,
    brand: input.brand,
    model: input.model,
    nickname: input.nickname,
    imageUrl: input.imageUrl?.trim() || undefined,
    notes: input.notes,
    tags: input.tags,
    favorite: input.favorite || undefined,
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? translate('rig.error.invalid') }
  return { ok: true, item: parsed.data }
}

/**
 * Adiciona equipamento. Fica no fim do seu grupo, ou seja, no fim do estágio
 * correspondente da cadeia de sinal.
 */
export function addGear(profile: Profile, input: GearInput, id: string = createId('gear')): RigResult {
  if (profile.rig.length >= LIMITS.rig.max) {
    return { ok: false, error: translate('rig.error.max', { max: LIMITS.rig.max }) }
  }
  const validated = validate(input, id)
  if (!validated.ok) return validated
  return { ok: true, profile: { ...profile, rig: [...profile.rig, validated.item] }, value: validated.item }
}

/** Edita uma peça mantendo o ID e a posição na rig. */
export function updateGear(profile: Profile, id: string, input: GearInput): RigResult {
  if (!profile.rig.some((item) => item.id === id)) return { ok: false, error: translate('rig.error.notFound') }
  const validated = validate(input, id)
  if (!validated.ok) return validated
  return {
    ok: true,
    profile: { ...profile, rig: profile.rig.map((item) => (item.id === id ? validated.item : item)) },
    value: validated.item,
  }
}

export function removeGear(profile: Profile, id: string): Profile {
  return { ...profile, rig: profile.rig.filter((item) => item.id !== id) }
}

/**
 * Move uma peça uma posição dentro do seu grupo (troca com a vizinha do mesmo
 * grupo). Mover entre grupos não faria sentido: a cadeia segue sempre
 * instrumento → pedais → amp → cabinet. Fora dos limites devolve o mesmo perfil.
 */
export function moveGear(profile: Profile, id: string, delta: -1 | 1): Profile {
  const item = profile.rig.find((gear) => gear.id === id)
  if (!item) return profile
  const group = rigGroup(item)
  const positions = profile.rig.flatMap((gear, index) => (rigGroup(gear) === group ? [index] : []))
  const at = positions.findIndex((index) => profile.rig[index]!.id === id)
  const target = positions[at + delta]
  if (target === undefined) return profile

  const rig = [...profile.rig]
  const from = positions[at]!
  ;[rig[from], rig[target]] = [rig[target]!, rig[from]!]
  return { ...profile, rig }
}

/** Rig agrupada pela ordem de apresentação; grupos vazios são omitidos. */
export function groupRig(rig: readonly GearItem[]): Array<{ group: RigGroup; items: GearItem[] }> {
  return RIG_GROUPS.flatMap((group) => {
    const items = rig.filter((item) => rigGroup(item) === group)
    return items.length > 0 ? [{ group, items }] : []
  })
}
