import type { Profile } from '../../domain/profile.ts'
import { normalizeProfile } from '../validation/normalize.ts'
import { LEGACY_ALBUMS, LEGACY_BANDS, type LegacyAlbum, type LegacyBand } from './legacy-catalog.ts'
import { parseProfile, type ValidationIssue } from '../validation/parse.ts'

/**
 * Formato persistido (independente da UI e do tipo de storage):
 *
 *   { "app": "riffspace", "schemaVersion": 1, "savedAt": "<ISO>", "profile": { … } }
 *
 * O mesmo envelope servirá para a exportação JSON (Etapa 5) e para uma
 * futura migração para backend.
 */
export const APP_ID = 'riffspace'
export const CURRENT_SCHEMA_VERSION = 3

export interface StoredDocument {
  app: typeof APP_ID
  schemaVersion: number
  savedAt: string
  profile: Profile
}

/**
 * Migração de um documento da versão N para N+1. Recebe o documento já com
 * `schemaVersion: N` e devolve-o com `schemaVersion: N + 1`.
 */
export type Migration = (doc: Record<string, unknown>) => Record<string, unknown>

/**
 * Registo de migrações por versão de origem. Para mudar o schema: acrescentar
 * `N: (doc) => ({ ...doc, schemaVersion: N + 1, … })` e subir CURRENT_SCHEMA_VERSION.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  /** v1 → v2: o perfil ganha `socials` (vazio). */
  1: (doc) => ({
    ...doc,
    schemaVersion: 2,
    profile: isRecord(doc.profile) ? { socials: [], ...doc.profile } : doc.profile,
  }),
  /**
   * v2 → v3: as bandas e os álbuns deixam de ser IDs de um catálogo local e
   * passam a viver no perfil. Os IDs do catálogo antigo e as entradas
   * personalizadas são resolvidos e guardados por ordem (marcados como
   * `custom`, porque não vieram da MusicBrainz); IDs desconhecidos são descartados.
   */
  2: (doc) => ({
    ...doc,
    schemaVersion: 3,
    profile: isRecord(doc.profile) ? migrateMusicV2(doc.profile) : doc.profile,
  }),
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function migrateMusicV2(profile: Record<string, unknown>): Record<string, unknown> {
  const { favoriteBandIds, favoriteAlbumIds, customBands, customAlbums, ...rest } = profile
  const bandsById = new Map<string, LegacyBand>(LEGACY_BANDS.map((band) => [band.id, band]))
  for (const band of asArray(customBands)) {
    if (isRecord(band) && typeof band.id === 'string') bandsById.set(band.id, band as unknown as LegacyBand)
  }
  const albumsById = new Map<string, LegacyAlbum>(LEGACY_ALBUMS.map((album) => [album.id, album]))
  for (const album of asArray(customAlbums)) {
    if (isRecord(album) && typeof album.id === 'string') albumsById.set(album.id, album as unknown as LegacyAlbum)
  }

  const bands = asArray(favoriteBandIds).flatMap((id) => {
    const band = typeof id === 'string' ? bandsById.get(id) : undefined
    if (!band) return []
    const { isCustom: _isCustom, ...fields } = band
    return [{ ...fields, source: 'custom' }]
  })
  const bandIds = new Set(bands.map((band) => band.id))
  const albums = asArray(favoriteAlbumIds).flatMap((id) => {
    const album = typeof id === 'string' ? albumsById.get(id) : undefined
    return album && bandIds.has(album.bandId) ? [{ ...album, source: 'custom' }] : []
  })
  return { ...rest, bands, albums }
}

export type DeserializeResult =
  | { status: 'empty' }
  | { status: 'ok'; profile: Profile; savedAt: string; migratedFrom?: number; repairs: string[] }
  | { status: 'invalid'; reason: 'json' | 'envelope' | 'migration' | 'schema'; issues: ValidationIssue[] }
  | { status: 'unsupported-version'; version: number }

export interface DocumentOptions {
  currentVersion?: number
  migrations?: Readonly<Record<number, Migration>>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function serializeDocument(profile: Profile, savedAt: Date = new Date()): string {
  const doc: StoredDocument = {
    app: APP_ID,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    savedAt: savedAt.toISOString(),
    profile,
  }
  return JSON.stringify(doc)
}

/** Aplica migrações sequenciais até `target`. Lança erro se faltar algum passo. */
export function migrateDocument(
  doc: Record<string, unknown>,
  target: number,
  migrations: Readonly<Record<number, Migration>>,
): Record<string, unknown> {
  let current = doc
  let version = current.schemaVersion as number
  while (version < target) {
    const migrate = migrations[version]
    if (!migrate) throw new Error(`Missing migration from version ${version} to ${version + 1}.`)
    current = migrate(current)
    if (current.schemaVersion !== version + 1) {
      throw new Error(`Migration from version ${version} did not produce version ${version + 1}.`)
    }
    version += 1
  }
  return current
}

/**
 * Lê um documento persistido. Nunca lança exceções: dados vazios, JSON
 * corrompido, envelopes estranhos, versões futuras e perfis inválidos
 * resultam num estado explícito que a camada de cima pode tratar.
 */
export function deserializeDocument(raw: string | null, options: DocumentOptions): DeserializeResult {
  const target = options.currentVersion ?? CURRENT_SCHEMA_VERSION
  const migrations = options.migrations ?? MIGRATIONS

  if (raw === null || raw.trim() === '') return { status: 'empty' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 'invalid', reason: 'json', issues: [{ path: '', message: 'The content is not valid JSON.' }] }
  }

  if (
    !isRecord(parsed) ||
    parsed.app !== APP_ID ||
    typeof parsed.schemaVersion !== 'number' ||
    !Number.isInteger(parsed.schemaVersion) ||
    parsed.schemaVersion < 1
  ) {
    return {
      status: 'invalid',
      reason: 'envelope',
      issues: [{ path: '', message: 'The document is not a recognised RIFFSPACE profile.' }],
    }
  }

  const version = parsed.schemaVersion
  if (version > target) return { status: 'unsupported-version', version }

  let migrated: Record<string, unknown>
  try {
    migrated = migrateDocument(parsed, target, migrations)
  } catch (error) {
    return {
      status: 'invalid',
      reason: 'migration',
      issues: [{ path: '', message: error instanceof Error ? error.message : 'Migration failed.' }],
    }
  }

  const result = parseProfile(migrated.profile)
  if (!result.ok) {
    return { status: 'invalid', reason: 'schema', issues: result.issues }
  }

  const { profile, repairs } = normalizeProfile(result.value)
  return {
    status: 'ok',
    profile,
    savedAt: typeof migrated.savedAt === 'string' ? migrated.savedAt : new Date(0).toISOString(),
    migratedFrom: version < target ? version : undefined,
    repairs,
  }
}
