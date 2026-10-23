import type { Profile } from '../../domain/profile.ts'
import type { Catalog } from '../validation/normalize.ts'
import { deserializeDocument, serializeDocument, type DocumentOptions } from './document.ts'
import type { KeyValueStorage } from './storage.ts'

export const STORAGE_KEY = 'riffspace:state'
/** Guarda o último documento que não foi possível carregar, para não perder dados. */
export const BACKUP_KEY = 'riffspace:backup'

export type LoadNotice =
  | { kind: 'storage-unavailable' }
  | { kind: 'recovered'; reason: 'json' | 'envelope' | 'migration' | 'schema'; backupSaved: boolean }
  | { kind: 'unsupported-version'; version: number; backupSaved: boolean }
  | { kind: 'migrated'; from: number }
  | { kind: 'repaired'; repairs: string[] }

export interface LoadResult {
  profile: Profile
  /** true quando o perfil veio do storage; false quando é o fallback (demo). */
  fromStorage: boolean
  savedAt?: string
  notice?: LoadNotice
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: 'quota' | 'unavailable' }

export interface BackupRecord {
  backedUpAt: string
  reason: string
  raw: string
}

export interface RepositoryOptions extends Omit<DocumentOptions, 'catalog'> {
  catalog: Catalog
  /** Perfil usado quando não há dados válidos. Chamado de cada vez para devolver uma cópia nova. */
  fallback: () => Profile
  now?: () => Date
}

function writeBackup(storage: KeyValueStorage, raw: string, reason: string, now: Date): boolean {
  try {
    const record: BackupRecord = { backedUpAt: now.toISOString(), reason, raw }
    storage.setItem(BACKUP_KEY, JSON.stringify(record))
    return true
  } catch {
    return false
  }
}

/**
 * Acesso ao perfil persistido. Não depende de React: a UI usa-o através da
 * store (src/state), e um futuro backend pode substituí-lo com a mesma forma.
 */
export function createProfileRepository(storage: KeyValueStorage, options: RepositoryOptions) {
  const now = options.now ?? (() => new Date())

  function load(): LoadResult {
    let raw: string | null
    try {
      raw = storage.getItem(STORAGE_KEY)
    } catch {
      return { profile: options.fallback(), fromStorage: false, notice: { kind: 'storage-unavailable' } }
    }

    const result = deserializeDocument(raw, options)
    switch (result.status) {
      case 'empty':
        return { profile: options.fallback(), fromStorage: false }

      case 'ok': {
        const notice: LoadNotice | undefined =
          result.migratedFrom !== undefined
            ? { kind: 'migrated', from: result.migratedFrom }
            : result.repairs.length > 0
              ? { kind: 'repaired', repairs: result.repairs }
              : undefined
        return { profile: result.profile, fromStorage: true, savedAt: result.savedAt, notice }
      }

      case 'unsupported-version':
        return {
          profile: options.fallback(),
          fromStorage: false,
          notice: {
            kind: 'unsupported-version',
            version: result.version,
            backupSaved: writeBackup(storage, raw ?? '', `schemaVersion ${result.version} não suportada`, now()),
          },
        }

      case 'invalid':
        return {
          profile: options.fallback(),
          fromStorage: false,
          notice: {
            kind: 'recovered',
            reason: result.reason,
            backupSaved: writeBackup(storage, raw ?? '', `inválido: ${result.reason}`, now()),
          },
        }
    }
  }

  function save(profile: Profile): SaveResult {
    const savedAt = now()
    try {
      storage.setItem(STORAGE_KEY, serializeDocument(profile, savedAt))
      return { ok: true, savedAt: savedAt.toISOString() }
    } catch (error) {
      const quota = error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)
      return { ok: false, error: quota ? 'quota' : 'unavailable' }
    }
  }

  /** Remove o perfil guardado. O backup é mantido de propósito. */
  function clear(): void {
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // Sem storage não há nada para limpar.
    }
  }

  return { load, save, clear }
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>
