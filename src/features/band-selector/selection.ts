import type { Album } from '../../domain/album.ts'
import type { Band } from '../../domain/band.ts'
import { LIMITS } from '../../domain/limits.ts'
import { allAlbums, allBands, type Profile } from '../../domain/profile.ts'
import { createId } from '../../lib/id.ts'
import type { Catalog } from '../../lib/validation/normalize.ts'
import { albumSchema, bandSchema, subgenreSchema } from '../../lib/validation/schemas.ts'
import { normalizeSearch } from './search.ts'

/**
 * Operações puras sobre a seleção musical de um perfil. Nunca alteram o perfil
 * recebido; devolvem um novo perfil ou um erro legível para mostrar na UI.
 */

export type Result<T = Profile> = { ok: true; profile: Profile; value: T } | { ok: false; error: string }

const ok = <T>(profile: Profile, value: T): Result<T> => ({ ok: true, profile, value })
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })

function move<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  if (item !== undefined) next.splice(to, 0, item)
  return next
}

// ── Bandas favoritas ────────────────────────────────────────────────────────

export function addFavoriteBand(profile: Profile, bandId: string): Result<null> {
  if (profile.favoriteBandIds.includes(bandId)) return ok(profile, null)
  if (profile.favoriteBandIds.length >= LIMITS.favoriteBands.max) {
    return fail(`Já tens ${LIMITS.favoriteBands.max} bandas favoritas. Remove uma para adicionar outra.`)
  }
  return ok({ ...profile, favoriteBandIds: [...profile.favoriteBandIds, bandId] }, null)
}

export function removeFavoriteBand(profile: Profile, bandId: string): Profile {
  return { ...profile, favoriteBandIds: profile.favoriteBandIds.filter((id) => id !== bandId) }
}

/** Move uma banda no ranking. Fora dos limites não faz nada. */
export function moveFavoriteBand(profile: Profile, bandId: string, delta: number): Profile {
  const from = profile.favoriteBandIds.indexOf(bandId)
  const to = from + delta
  if (from < 0 || to < 0 || to >= profile.favoriteBandIds.length) return profile
  return { ...profile, favoriteBandIds: move(profile.favoriteBandIds, from, to) }
}

// ── Álbuns favoritos ────────────────────────────────────────────────────────

export function toggleFavoriteAlbum(profile: Profile, albumId: string): Result<boolean> {
  if (profile.favoriteAlbumIds.includes(albumId)) {
    return ok({ ...profile, favoriteAlbumIds: profile.favoriteAlbumIds.filter((id) => id !== albumId) }, false)
  }
  if (profile.favoriteAlbumIds.length >= LIMITS.favoriteAlbums.max) {
    return fail(`Já tens ${LIMITS.favoriteAlbums.max} álbuns favoritos. Remove um para adicionar outro.`)
  }
  return ok({ ...profile, favoriteAlbumIds: [...profile.favoriteAlbumIds, albumId] }, true)
}

// ── Subgéneros ──────────────────────────────────────────────────────────────

export function toggleSubgenre(profile: Profile, genre: string): Result<boolean> {
  const parsed = subgenreSchema.safeParse(genre)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Subgénero inválido.')
  const key = normalizeSearch(parsed.data)
  const existing = profile.subgenres.find((g) => normalizeSearch(g) === key)
  if (existing) {
    return ok({ ...profile, subgenres: profile.subgenres.filter((g) => g !== existing) }, false)
  }
  if (profile.subgenres.length >= LIMITS.subgenres.max) {
    return fail(`Podes escolher até ${LIMITS.subgenres.max} subgéneros.`)
  }
  return ok({ ...profile, subgenres: [...profile.subgenres, parsed.data] }, true)
}

// ── Bandas personalizadas ───────────────────────────────────────────────────

export interface CustomBandInput {
  name: string
  country?: string
  formedYear?: number
  subgenres: string[]
}

function validateBand(input: CustomBandInput, id: string): { ok: true; band: Band } | { ok: false; error: string } {
  const parsed = bandSchema.safeParse({
    id,
    name: input.name,
    country: input.country?.trim().toUpperCase() || undefined,
    formedYear: input.formedYear,
    subgenres: input.subgenres,
    isCustom: true,
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Banda inválida.' }
  return { ok: true, band: parsed.data }
}

function nameTaken(bands: readonly Band[], name: string, exceptId?: string): boolean {
  const key = normalizeSearch(name)
  return bands.some((band) => band.id !== exceptId && normalizeSearch(band.name) === key)
}

/**
 * Cria uma banda personalizada e junta-a às favoritas se houver espaço.
 * Recusa nomes que já existam no catálogo ou nas bandas personalizadas.
 */
export function addCustomBand(
  profile: Profile,
  input: CustomBandInput,
  catalog: Catalog,
  id: string = createId('band'),
): Result<Band> {
  if (profile.customBands.length >= LIMITS.customBands.max) {
    return fail(`Atingiste o limite de ${LIMITS.customBands.max} bandas personalizadas.`)
  }
  const validated = validateBand(input, id)
  if (!validated.ok) return validated
  if (nameTaken(allBands(profile, catalog.bands), validated.band.name)) {
    return fail('Já existe uma banda com esse nome. Procura-a na lista.')
  }
  const withBand = { ...profile, customBands: [...profile.customBands, validated.band] }
  const favorites =
    withBand.favoriteBandIds.length < LIMITS.favoriteBands.max
      ? [...withBand.favoriteBandIds, validated.band.id]
      : withBand.favoriteBandIds
  return ok({ ...withBand, favoriteBandIds: favorites }, validated.band)
}

export function updateCustomBand(profile: Profile, id: string, input: CustomBandInput, catalog: Catalog): Result<Band> {
  if (!profile.customBands.some((band) => band.id === id)) return fail('Banda personalizada não encontrada.')
  const validated = validateBand(input, id)
  if (!validated.ok) return validated
  if (nameTaken(allBands(profile, catalog.bands), validated.band.name, id)) {
    return fail('Já existe outra banda com esse nome.')
  }
  return ok(
    { ...profile, customBands: profile.customBands.map((band) => (band.id === id ? validated.band : band)) },
    validated.band,
  )
}

/** Remove uma banda personalizada e, em cascata, os seus álbuns e as referências nos favoritos. */
export function removeCustomBand(profile: Profile, id: string): Profile {
  const removedAlbumIds = new Set(profile.customAlbums.filter((album) => album.bandId === id).map((album) => album.id))
  return {
    ...profile,
    customBands: profile.customBands.filter((band) => band.id !== id),
    customAlbums: profile.customAlbums.filter((album) => album.bandId !== id),
    favoriteBandIds: profile.favoriteBandIds.filter((bandId) => bandId !== id),
    favoriteAlbumIds: profile.favoriteAlbumIds.filter((albumId) => !removedAlbumIds.has(albumId)),
  }
}

// ── Álbuns personalizados ───────────────────────────────────────────────────

export interface CustomAlbumInput {
  bandId: string
  title: string
  year?: number
}

function validateAlbum(
  profile: Profile,
  input: CustomAlbumInput,
  id: string,
  catalog: Catalog,
): { ok: true; album: Album } | { ok: false; error: string } {
  if (!allBands(profile, catalog.bands).some((band) => band.id === input.bandId)) {
    return { ok: false, error: 'Escolhe uma banda existente.' }
  }
  const parsed = albumSchema.safeParse({ id, bandId: input.bandId, title: input.title, year: input.year })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Álbum inválido.' }
  const key = normalizeSearch(parsed.data.title)
  const duplicate = allAlbums(profile, catalog.albums).some(
    (album) => album.id !== id && album.bandId === input.bandId && normalizeSearch(album.title) === key,
  )
  if (duplicate) return { ok: false, error: 'Essa banda já tem um álbum com esse título.' }
  return { ok: true, album: parsed.data }
}

/** Cria um álbum personalizado e marca-o como favorito se houver espaço. */
export function addCustomAlbum(
  profile: Profile,
  input: CustomAlbumInput,
  catalog: Catalog,
  id: string = createId('album'),
): Result<Album> {
  if (profile.customAlbums.length >= LIMITS.customAlbums.max) {
    return fail(`Atingiste o limite de ${LIMITS.customAlbums.max} álbuns personalizados.`)
  }
  const validated = validateAlbum(profile, input, id, catalog)
  if (!validated.ok) return validated
  const withAlbum = { ...profile, customAlbums: [...profile.customAlbums, validated.album] }
  const favorites =
    withAlbum.favoriteAlbumIds.length < LIMITS.favoriteAlbums.max
      ? [...withAlbum.favoriteAlbumIds, validated.album.id]
      : withAlbum.favoriteAlbumIds
  return ok({ ...withAlbum, favoriteAlbumIds: favorites }, validated.album)
}

export function updateCustomAlbum(profile: Profile, id: string, input: CustomAlbumInput, catalog: Catalog): Result<Album> {
  if (!profile.customAlbums.some((album) => album.id === id)) return fail('Álbum personalizado não encontrado.')
  const validated = validateAlbum(profile, input, id, catalog)
  if (!validated.ok) return validated
  return ok(
    { ...profile, customAlbums: profile.customAlbums.map((album) => (album.id === id ? validated.album : album)) },
    validated.album,
  )
}

export function removeCustomAlbum(profile: Profile, id: string): Profile {
  return {
    ...profile,
    customAlbums: profile.customAlbums.filter((album) => album.id !== id),
    favoriteAlbumIds: profile.favoriteAlbumIds.filter((albumId) => albumId !== id),
  }
}
