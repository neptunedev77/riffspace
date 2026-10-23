import type { Profile } from '../../domain/profile.ts'
import { normalizeProfile, type Catalog } from '../validation/normalize.ts'
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
export const CURRENT_SCHEMA_VERSION = 1

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
 * Registo de migrações por versão de origem. Vazio enquanto só existir a v1;
 * quando o schema mudar, acrescenta-se `1: (doc) => ({ ...doc, schemaVersion: 2, … })`
 * e sobe-se CURRENT_SCHEMA_VERSION.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {}

export type DeserializeResult =
  | { status: 'empty' }
  | { status: 'ok'; profile: Profile; savedAt: string; migratedFrom?: number; repairs: string[] }
  | { status: 'invalid'; reason: 'json' | 'envelope' | 'migration' | 'schema'; issues: ValidationIssue[] }
  | { status: 'unsupported-version'; version: number }

export interface DocumentOptions {
  catalog: Catalog
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
    if (!migrate) throw new Error(`Falta a migração da versão ${version} para ${version + 1}.`)
    current = migrate(current)
    if (current.schemaVersion !== version + 1) {
      throw new Error(`A migração da versão ${version} não produziu a versão ${version + 1}.`)
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
    return { status: 'invalid', reason: 'json', issues: [{ path: '', message: 'O conteúdo não é JSON válido.' }] }
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
      issues: [{ path: '', message: 'O documento não é um perfil RIFFSPACE reconhecido.' }],
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
      issues: [{ path: '', message: error instanceof Error ? error.message : 'Falha na migração.' }],
    }
  }

  const result = parseProfile(migrated.profile)
  if (!result.ok) {
    return { status: 'invalid', reason: 'schema', issues: result.issues }
  }

  const { profile, repairs } = normalizeProfile(result.value, options.catalog)
  return {
    status: 'ok',
    profile,
    savedAt: typeof migrated.savedAt === 'string' ? migrated.savedAt : new Date(0).toISOString(),
    migratedFrom: version < target ? version : undefined,
    repairs,
  }
}
