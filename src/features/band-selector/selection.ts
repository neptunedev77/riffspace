import type { Album } from '../../domain/album.ts'
import type { Band } from '../../domain/band.ts'
import { LIMITS } from '../../domain/limits.ts'
import type { Profile } from '../../domain/profile.ts'
import { translate } from '../../i18n/translate.ts'
import { createId } from '../../lib/id.ts'
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

const firstIssue = (issues: readonly { message: string }[], fallback: string) => issues[0]?.message ?? fallback

// ── Bandas ──────────────────────────────────────────────────────────────────

function nameTaken(bands: readonly Band[], name: string, exceptId?: string): boolean {
  const key = normalizeSearch(name)
  return bands.some((band) => band.id !== exceptId && normalizeSearch(band.name) === key)
}

/** Junta uma banda (vinda da pesquisa) ao fim do ranking. Se já lá estiver, não faz nada. */
export function addBand(profile: Profile, band: Band): Result<Band> {
  const existing = profile.bands.find((item) => item.id === band.id)
  if (existing) return ok(profile, existing)
  if (profile.bands.length >= LIMITS.favoriteBands.max) {
    return fail(translate('music.error.maxFavoriteBands', { max: LIMITS.favoriteBands.max }))
  }
  const parsed = bandSchema.safeParse(band)
  if (!parsed.success) return fail(firstIssue(parsed.error.issues, translate('music.error.invalidBand')))
  return ok({ ...profile, bands: [...profile.bands, parsed.data] }, parsed.data)
}

/** Remove uma banda e, em cascata, os seus álbuns. */
export function removeBand(profile: Profile, bandId: string): Profile {
  return {
    ...profile,
    bands: profile.bands.filter((band) => band.id !== bandId),
    albums: profile.albums.filter((album) => album.bandId !== bandId),
  }
}

/** Move uma banda no ranking. Fora dos limites não faz nada. */
export function moveBand(profile: Profile, bandId: string, delta: number): Profile {
  const from = profile.bands.findIndex((band) => band.id === bandId)
  const to = from + delta
  if (from < 0 || to < 0 || to >= profile.bands.length) return profile
  return { ...profile, bands: move(profile.bands, from, to) }
}

export interface CustomBandInput {
  name: string
  country?: string
  formedYear?: number
}

function validateCustomBand(input: CustomBandInput, id: string, subgenres: string[]): Result<Band> | { ok: true; band: Band } {
  const parsed = bandSchema.safeParse({
    id,
    name: input.name,
    country: input.country?.trim().toUpperCase() || undefined,
    formedYear: input.formedYear,
    subgenres,
    source: 'custom',
  })
  if (!parsed.success) return fail(firstIssue(parsed.error.issues, translate('music.error.invalidBand')))
  return { ok: true, band: parsed.data }
}

/**
 * Cria uma banda à mão (quando a pesquisa não a encontra ou está indisponível)
 * e junta-a ao ranking. Recusa nomes que já estejam no perfil.
 */
export function addCustomBand(profile: Profile, input: CustomBandInput, id: string = createId('band')): Result<Band> {
  if (profile.bands.length >= LIMITS.favoriteBands.max) {
    return fail(translate('music.error.maxFavoriteBands', { max: LIMITS.favoriteBands.max }))
  }
  const validated = validateCustomBand(input, id, [])
  if (!('band' in validated)) return validated
  if (nameTaken(profile.bands, validated.band.name)) return fail(translate('music.error.bandExists'))
  return ok({ ...profile, bands: [...profile.bands, validated.band] }, validated.band)
}

/** Edita uma banda criada à mão. As bandas da MusicBrainz não são editáveis. */
export function updateCustomBand(profile: Profile, id: string, input: CustomBandInput): Result<Band> {
  const current = profile.bands.find((band) => band.id === id && band.source === 'custom')
  if (!current) return fail(translate('music.error.bandNotFound'))
  const validated = validateCustomBand(input, id, current.subgenres)
  if (!('band' in validated)) return validated
  if (nameTaken(profile.bands, validated.band.name, id)) return fail(translate('music.error.otherBandExists'))
  return ok({ ...profile, bands: profile.bands.map((band) => (band.id === id ? validated.band : band)) }, validated.band)
}

// ── Álbuns ──────────────────────────────────────────────────────────────────

/** Marca ou desmarca um álbum (vindo da lista de uma banda do perfil) como favorito. */
export function toggleAlbum(profile: Profile, album: Album): Result<boolean> {
  if (profile.albums.some((item) => item.id === album.id)) {
    return ok({ ...profile, albums: profile.albums.filter((item) => item.id !== album.id) }, false)
  }
  if (!profile.bands.some((band) => band.id === album.bandId)) return fail(translate('music.error.pickBand'))
  if (profile.albums.length >= LIMITS.favoriteAlbums.max) {
    return fail(translate('music.error.maxFavoriteAlbums', { max: LIMITS.favoriteAlbums.max }))
  }
  const parsed = albumSchema.safeParse(album)
  if (!parsed.success) return fail(firstIssue(parsed.error.issues, translate('music.error.invalidAlbum')))
  return ok({ ...profile, albums: [...profile.albums, parsed.data] }, true)
}

export function removeAlbum(profile: Profile, albumId: string): Profile {
  return { ...profile, albums: profile.albums.filter((album) => album.id !== albumId) }
}

export interface CustomAlbumInput {
  bandId: string
  title: string
  year?: number
}

/** Cria à mão um álbum favorito de uma banda do perfil (quando a lista da MusicBrainz não o tem). */
export function addCustomAlbum(profile: Profile, input: CustomAlbumInput, id: string = createId('album')): Result<Album> {
  if (!profile.bands.some((band) => band.id === input.bandId)) return fail(translate('music.error.pickBand'))
  if (profile.albums.length >= LIMITS.favoriteAlbums.max) {
    return fail(translate('music.error.maxFavoriteAlbums', { max: LIMITS.favoriteAlbums.max }))
  }
  const parsed = albumSchema.safeParse({ id, bandId: input.bandId, title: input.title, year: input.year, source: 'custom' })
  if (!parsed.success) return fail(firstIssue(parsed.error.issues, translate('music.error.invalidAlbum')))
  const key = normalizeSearch(parsed.data.title)
  if (profile.albums.some((album) => album.bandId === input.bandId && normalizeSearch(album.title) === key)) {
    return fail(translate('music.error.albumExists'))
  }
  return ok({ ...profile, albums: [...profile.albums, parsed.data] }, parsed.data)
}

// ── Subgéneros ──────────────────────────────────────────────────────────────

export function toggleSubgenre(profile: Profile, genre: string): Result<boolean> {
  const parsed = subgenreSchema.safeParse(genre)
  if (!parsed.success) return fail(firstIssue(parsed.error.issues, translate('music.error.invalidSubgenre')))
  const key = normalizeSearch(parsed.data)
  const existing = profile.subgenres.find((g) => normalizeSearch(g) === key)
  if (existing) {
    return ok({ ...profile, subgenres: profile.subgenres.filter((g) => g !== existing) }, false)
  }
  if (profile.subgenres.length >= LIMITS.subgenres.max) {
    return fail(translate('music.error.maxSubgenres', { max: LIMITS.subgenres.max }))
  }
  return ok({ ...profile, subgenres: [...profile.subgenres, parsed.data] }, true)
}

/** Sugestões de subgéneros: os das bandas do perfil (por frequência) seguidos dos comuns. */
export function suggestSubgenres(profile: Profile, common: readonly string[]): string[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const band of profile.bands) {
    for (const genre of band.subgenres) {
      const key = normalizeSearch(genre)
      // "Metal" sozinho não diz nada num perfil de metal.
      if (key === 'metal') continue
      const entry = counts.get(key) ?? { label: genre, count: 0 }
      entry.count += 1
      counts.set(key, entry)
    }
  }
  const fromBands = [...counts.values()].sort((a, b) => b.count - a.count).map((entry) => entry.label)
  const seen = new Set(fromBands.map(normalizeSearch))
  return [...fromBands, ...common.filter((genre) => !seen.has(normalizeSearch(genre)))]
}
