import type { Profile } from '../../domain/profile.ts'
import { translate } from '../../i18n/translate.ts'

export interface NormalizeResult {
  profile: Profile
  /** Descrição das reparações feitas; vazio quando o perfil já era consistente. */
  repairs: string[]
}

function uniqueBy<T>(items: readonly T[], key: (item: T) => string): { items: T[]; removed: number } {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const k = key(item)
    if (seen.has(k)) continue
    seen.add(k)
    result.push(item)
  }
  return { items: result, removed: items.length - result.length }
}

/**
 * Repõe as invariantes entre entidades de um perfil já validado pelo schema.
 * Repara em vez de rejeitar: dados guardados com duplicados ou referências
 * partidas não devem impedir o arranque. É uma função pura.
 */
export function normalizeProfile(input: Profile): NormalizeResult {
  const repairs: string[] = []

  const bands = uniqueBy(input.bands, (band) => band.id)
  if (bands.removed > 0) repairs.push(translate('repair.bands'))
  const bandIds = new Set(bands.items.map((band) => band.id))

  // Álbuns: ID único e banda presente no perfil.
  const albums = uniqueBy(
    input.albums.filter((album) => bandIds.has(album.bandId)),
    (album) => album.id,
  )
  if (albums.items.length !== input.albums.length) repairs.push(translate('repair.albums'))

  const subgenres = uniqueBy(input.subgenres, (genre) => genre.toLowerCase())
  if (subgenres.removed > 0) repairs.push(translate('repair.subgenres'))

  const rig = uniqueBy(input.rig, (item) => item.id)
  if (rig.removed > 0) repairs.push(translate('repair.rig', { count: rig.removed }))

  const socials = uniqueBy(uniqueBy(input.socials, (link) => link.id).items, (link) => link.url.toLowerCase())
  if (socials.items.length !== input.socials.length) repairs.push(translate('repair.socials'))

  return {
    profile: {
      ...input,
      bands: bands.items,
      albums: albums.items,
      subgenres: subgenres.items,
      rig: rig.items,
      socials: socials.items,
    },
    repairs,
  }
}
