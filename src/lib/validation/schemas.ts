import { z } from 'zod'
import { GEAR_TYPES } from '../../domain/gear.ts'
import { COUNTRY_PATTERN, ID_PATTERN, LIMITS, maxYear, NICKNAME_PATTERN } from '../../domain/limits.ts'
import { isAllowedSocialUrl, SOCIAL_META, SOCIAL_PLATFORMS } from '../../domain/social.ts'
import { THEME_IDS } from '../../domain/theme.ts'
import { isHttpsOnHosts, TRACK_HOSTS } from '../../domain/track.ts'
import { translate, type MessageKey } from '../../i18n/translate.ts'

/**
 * Schemas Zod do modelo de domínio. Validam forma, tipos, limites e formatos,
 * e normalizam espaços. Chaves desconhecidas são descartadas. As invariantes
 * entre entidades (referências, duplicados) ficam em normalize.ts.
 *
 * As mensagens são funções: o Zod só as avalia quando há um erro, por isso
 * saem sempre no idioma ativo nesse momento.
 */

const msg = (key: MessageKey, vars?: Record<string, string | number>) => ({ error: () => translate(key, vars) })

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const text = (max: number, field: MessageKey) =>
  z
    .string()
    .trim()
    .max(max, { error: () => translate('validation.maxChars', { field: translate(field), max }) })

const requiredText = (max: number, field: MessageKey) =>
  text(max, field).min(1, { error: () => translate('validation.required', { field: translate(field) }) })

/** Texto opcional: string vazia (depois de trim) passa a undefined. */
const optionalText = (max: number, field: MessageKey) =>
  text(max, field)
    .transform((value) => value || undefined)
    .optional()

export const idSchema = z.string().max(LIMITS.id.max, msg('validation.idTooLong')).regex(ID_PATTERN, msg('validation.idInvalid'))

const yearSchema = z
  .number()
  .int(msg('validation.yearInteger'))
  .min(LIMITS.year.min, msg('validation.yearMin', { min: LIMITS.year.min }))
  .max(maxYear(), msg('validation.yearFuture'))

export const httpUrlSchema = z
  .string()
  .trim()
  .max(LIMITS.url.max, msg('validation.urlTooLong'))
  .refine(isHttpUrl, msg('validation.urlProtocol'))

export const nicknameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(LIMITS.nickname.min, msg('validation.nicknameMin', { min: LIMITS.nickname.min }))
  .max(LIMITS.nickname.max, msg('validation.nicknameMax', { max: LIMITS.nickname.max }))
  .regex(NICKNAME_PATTERN, msg('validation.nicknamePattern'))

export const displayNameSchema = optionalText(LIMITS.displayName.max, 'field.displayName')
export const taglineSchema = text(LIMITS.tagline.max, 'field.tagline')
export const bioSchema = text(LIMITS.bio.max, 'field.bio')
export const locationSchema = optionalText(LIMITS.location.max, 'field.location')
export const subgenreSchema = requiredText(LIMITS.subgenre.max, 'field.subgenre')

export const bandSchema = z.object({
  id: idSchema,
  name: requiredText(LIMITS.bandName.max, 'field.bandName'),
  country: z.string().regex(COUNTRY_PATTERN, msg('validation.countryInvalid')).optional(),
  formedYear: yearSchema.optional(),
  subgenres: z.array(subgenreSchema).max(LIMITS.subgenres.max),
  isCustom: z.boolean(),
})

export const albumSchema = z.object({
  id: idSchema,
  bandId: idSchema,
  title: requiredText(LIMITS.albumTitle.max, 'field.albumTitle'),
  year: yearSchema.optional(),
})

export const gearItemSchema = z.object({
  id: idSchema,
  type: z.enum(GEAR_TYPES),
  brand: requiredText(LIMITS.gearBrand.max, 'field.brand'),
  model: requiredText(LIMITS.gearModel.max, 'field.model'),
  nickname: optionalText(LIMITS.gearNickname.max, 'field.gearNickname'),
  imageUrl: httpUrlSchema.optional(),
  notes: optionalText(LIMITS.gearNotes.max, 'field.notes'),
  tags: z.array(requiredText(LIMITS.gearTag.max, 'field.tag')).max(LIMITS.gearTags.max),
  favorite: z.boolean().optional(),
})

export const avatarSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('generated') }),
  z.object({ kind: z.literal('url'), url: httpUrlSchema }),
])

export const socialLinkSchema = z
  .object({
    id: idSchema,
    platform: z.enum(SOCIAL_PLATFORMS),
    url: httpUrlSchema,
  })
  .superRefine((link, ctx) => {
    if (!isAllowedSocialUrl(link.platform, link.url)) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: translate('validation.socialHost', { platform: SOCIAL_META[link.platform].label }),
      })
    }
  })

const trackUrl = (hosts: readonly string[]) =>
  z
    .string()
    .max(LIMITS.url.max, msg('validation.urlTooLong'))
    .refine((url) => isHttpsOnHosts(url, hosts), msg('validation.trackUrl'))

export const featuredTrackSchema = z.object({
  source: z.literal('itunes'),
  trackId: z.number().int().positive(),
  title: requiredText(LIMITS.trackText.max, 'field.trackTitle'),
  artist: requiredText(LIMITS.trackText.max, 'field.artist'),
  album: optionalText(LIMITS.trackText.max, 'field.album'),
  artworkUrl: trackUrl(TRACK_HOSTS.artwork).optional(),
  previewUrl: trackUrl(TRACK_HOSTS.preview),
  trackUrl: trackUrl(TRACK_HOSTS.page).optional(),
  durationMs: z.number().int().positive().optional(),
  peaks: z.array(z.number().min(0).max(1)).min(LIMITS.peaks.min).max(LIMITS.peaks.max),
})

export const themeSchema = z.enum(THEME_IDS)

export const profileSchema = z.object({
  id: idSchema,
  nickname: nicknameSchema,
  displayName: displayNameSchema,
  avatar: avatarSchema,
  tagline: taglineSchema,
  bio: bioSchema,
  location: locationSchema,
  favoriteBandIds: z.array(idSchema).max(LIMITS.favoriteBands.max, msg('validation.maxFavoriteBands', { max: LIMITS.favoriteBands.max })),
  favoriteAlbumIds: z.array(idSchema).max(LIMITS.favoriteAlbums.max, msg('validation.maxFavoriteAlbums', { max: LIMITS.favoriteAlbums.max })),
  subgenres: z.array(subgenreSchema).max(LIMITS.subgenres.max, msg('validation.maxSubgenres', { max: LIMITS.subgenres.max })),
  customBands: z.array(bandSchema).max(LIMITS.customBands.max),
  customAlbums: z.array(albumSchema).max(LIMITS.customAlbums.max),
  rig: z.array(gearItemSchema).max(LIMITS.rig.max, msg('validation.maxRig', { max: LIMITS.rig.max })),
  socials: z.array(socialLinkSchema).max(LIMITS.socials.max, msg('validation.maxSocials', { max: LIMITS.socials.max })),
  featuredTrack: featuredTrackSchema.optional(),
  theme: themeSchema,
  isDemo: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
})
