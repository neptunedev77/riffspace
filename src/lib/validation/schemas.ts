import { z } from 'zod'
import { GEAR_TYPES } from '../../domain/gear.ts'
import { COUNTRY_PATTERN, ID_PATTERN, LIMITS, maxYear, NICKNAME_PATTERN } from '../../domain/limits.ts'
import { THEME_IDS } from '../../domain/theme.ts'

/**
 * Schemas Zod do modelo de domínio. Validam forma, tipos, limites e formatos,
 * e normalizam espaços. Chaves desconhecidas são descartadas. As invariantes
 * entre entidades (referências, duplicados) ficam em normalize.ts.
 */

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label}: máximo de ${max} caracteres.`)

const requiredText = (max: number, label: string) => text(max, label).min(1, `${label} é obrigatório.`)

/** Texto opcional: string vazia (depois de trim) passa a undefined. */
const optionalText = (max: number, label: string) =>
  text(max, label)
    .transform((value) => value || undefined)
    .optional()

export const idSchema = z
  .string()
  .max(LIMITS.id.max, 'ID demasiado longo.')
  .regex(ID_PATTERN, 'ID inválido.')

const yearSchema = z
  .number()
  .int('O ano tem de ser um número inteiro.')
  .min(LIMITS.year.min, `O ano tem de ser ${LIMITS.year.min} ou posterior.`)
  .max(maxYear(), 'O ano não pode estar no futuro.')

export const httpUrlSchema = z
  .string()
  .trim()
  .max(LIMITS.url.max, 'URL demasiado longo.')
  .refine(isHttpUrl, 'O URL tem de começar por http:// ou https://.')

export const nicknameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(LIMITS.nickname.min, `O nickname precisa de pelo menos ${LIMITS.nickname.min} caracteres.`)
  .max(LIMITS.nickname.max, `O nickname tem no máximo ${LIMITS.nickname.max} caracteres.`)
  .regex(NICKNAME_PATTERN, 'Usa apenas letras minúsculas, números, ".", "_" ou "-", sem os pôr no início ou no fim.')

export const displayNameSchema = optionalText(LIMITS.displayName.max, 'Nome')
export const taglineSchema = text(LIMITS.tagline.max, 'Tagline')
export const bioSchema = text(LIMITS.bio.max, 'Bio')
export const locationSchema = optionalText(LIMITS.location.max, 'Localização')
export const subgenreSchema = requiredText(LIMITS.subgenre.max, 'Subgénero')

export const bandSchema = z.object({
  id: idSchema,
  name: requiredText(LIMITS.bandName.max, 'Nome da banda'),
  country: z.string().regex(COUNTRY_PATTERN, 'Código de país inválido.').optional(),
  formedYear: yearSchema.optional(),
  subgenres: z.array(subgenreSchema).max(LIMITS.subgenres.max),
  isCustom: z.boolean(),
})

export const albumSchema = z.object({
  id: idSchema,
  bandId: idSchema,
  title: requiredText(LIMITS.albumTitle.max, 'Título do álbum'),
  year: yearSchema.optional(),
})

export const gearItemSchema = z.object({
  id: idSchema,
  type: z.enum(GEAR_TYPES),
  brand: requiredText(LIMITS.gearBrand.max, 'Marca'),
  model: requiredText(LIMITS.gearModel.max, 'Modelo'),
  nickname: optionalText(LIMITS.gearNickname.max, 'Nome personalizado'),
  imageUrl: httpUrlSchema.optional(),
  notes: optionalText(LIMITS.gearNotes.max, 'Notas'),
  tags: z.array(requiredText(LIMITS.gearTag.max, 'Etiqueta')).max(LIMITS.gearTags.max),
  favorite: z.boolean().optional(),
})

export const avatarSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('generated') }),
  z.object({ kind: z.literal('url'), url: httpUrlSchema }),
])

export const themeSchema = z.enum(THEME_IDS)

export const profileSchema = z.object({
  id: idSchema,
  nickname: nicknameSchema,
  displayName: displayNameSchema,
  avatar: avatarSchema,
  tagline: taglineSchema,
  bio: bioSchema,
  location: locationSchema,
  favoriteBandIds: z.array(idSchema).max(LIMITS.favoriteBands.max, `Máximo de ${LIMITS.favoriteBands.max} bandas favoritas.`),
  favoriteAlbumIds: z.array(idSchema).max(LIMITS.favoriteAlbums.max, `Máximo de ${LIMITS.favoriteAlbums.max} álbuns favoritos.`),
  subgenres: z.array(subgenreSchema).max(LIMITS.subgenres.max, `Máximo de ${LIMITS.subgenres.max} subgéneros.`),
  customBands: z.array(bandSchema).max(LIMITS.customBands.max),
  customAlbums: z.array(albumSchema).max(LIMITS.customAlbums.max),
  rig: z.array(gearItemSchema).max(LIMITS.rig.max, `Máximo de ${LIMITS.rig.max} peças na rig.`),
  theme: themeSchema,
  isDemo: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
})
