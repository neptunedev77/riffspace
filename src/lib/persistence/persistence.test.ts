import { describe, expect, it } from 'vitest'
import { DEMO_ALBUMS, DEMO_BANDS } from '../../data/demo-bands.ts'
import { createDemoProfile } from '../../data/demo-profile.ts'
import { makeProfile, storageWithProfile, storageWithRaw } from '../../tests/fixtures.ts'
import {
  APP_ID,
  CURRENT_SCHEMA_VERSION,
  deserializeDocument,
  migrateDocument,
  serializeDocument,
  type Migration,
} from './document.ts'
import { BACKUP_KEY, createProfileRepository, STORAGE_KEY, type BackupRecord } from './repository.ts'
import { createMemoryStorage, type KeyValueStorage } from './storage.ts'

const catalog = { bands: DEMO_BANDS, albums: DEMO_ALBUMS }
const fixedNow = () => new Date('2026-10-23T15:00:00.000Z')

function envelope(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    app: APP_ID,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    savedAt: '2026-10-23T12:00:00.000Z',
    profile: makeProfile(),
    ...overrides,
  })
}

describe('serializeDocument / deserializeDocument', () => {
  it('ciclo completo preserva o perfil', () => {
    const profile = makeProfile({ theme: 'frozen-abyss', tagline: 'Gelo e riffs' })
    const raw = serializeDocument(profile, fixedNow())
    const result = deserializeDocument(raw, { catalog })
    expect(result).toEqual({
      status: 'ok',
      profile,
      savedAt: '2026-10-23T15:00:00.000Z',
      migratedFrom: undefined,
      repairs: [],
    })
  })

  it('inclui app, versão do schema e data no envelope', () => {
    const doc = JSON.parse(serializeDocument(makeProfile(), fixedNow()))
    expect(doc).toMatchObject({ app: 'riffspace', schemaVersion: CURRENT_SCHEMA_VERSION, savedAt: '2026-10-23T15:00:00.000Z' })
  })

  it.each([null, '', '   '])('trata %j como vazio', (raw) => {
    expect(deserializeDocument(raw, { catalog })).toEqual({ status: 'empty' })
  })

  it.each(['{', 'undefined', '{"app":', 'NaN'])('JSON corrompido %j é inválido, sem lançar', (raw) => {
    const result = deserializeDocument(raw, { catalog })
    expect(result).toMatchObject({ status: 'invalid', reason: 'json' })
  })

  it.each([
    ['array', '[]'],
    ['número', '42'],
    ['outra app', envelope({ app: 'outra-coisa' })],
    ['sem versão', envelope({ schemaVersion: undefined })],
    ['versão texto', envelope({ schemaVersion: '1' })],
    ['versão zero', envelope({ schemaVersion: 0 })],
    ['versão decimal', envelope({ schemaVersion: 1.5 })],
  ])('envelope inválido (%s)', (_, raw) => {
    expect(deserializeDocument(raw, { catalog })).toMatchObject({ status: 'invalid', reason: 'envelope' })
  })

  it('versão futura é reportada como não suportada', () => {
    const raw = envelope({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 })
    expect(deserializeDocument(raw, { catalog })).toEqual({
      status: 'unsupported-version',
      version: CURRENT_SCHEMA_VERSION + 1,
    })
  })

  it('perfil que não cumpre o schema é inválido e lista os problemas', () => {
    const raw = envelope({ profile: { ...makeProfile(), nickname: 'x', theme: 'neon' } })
    const result = deserializeDocument(raw, { catalog })
    expect(result.status).toBe('invalid')
    if (result.status === 'invalid') {
      expect(result.reason).toBe('schema')
      expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['nickname', 'theme']))
    }
  })

  it('repara referências partidas em vez de rejeitar', () => {
    const raw = envelope({ profile: makeProfile({ favoriteBandIds: ['gojira', 'banda-removida'] }) })
    const result = deserializeDocument(raw, { catalog })
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.profile.favoriteBandIds).toEqual(['gojira'])
      expect(result.repairs.length).toBe(1)
    }
  })
})

describe('migrações', () => {
  // Cenário hipotético: na v1 a tagline chamava-se "motto"; na v2 o tema passou a ser obrigatório.
  const migrations: Record<number, Migration> = {
    1: (doc) => {
      const profile = { ...(doc.profile as Record<string, unknown>) }
      profile.tagline = profile.motto
      delete profile.motto
      return { ...doc, schemaVersion: 2, profile }
    },
    2: (doc) => ({
      ...doc,
      schemaVersion: 3,
      profile: { ...(doc.profile as Record<string, unknown>), theme: (doc.profile as Record<string, unknown>).theme ?? 'obsidian' },
    }),
  }

  function legacyV1() {
    const { tagline, theme, ...rest } = makeProfile()
    void theme
    return JSON.stringify({ app: APP_ID, schemaVersion: 1, savedAt: '2026-01-01T00:00:00.000Z', profile: { ...rest, motto: tagline } })
  }

  it('aplica migrações em sequência até à versão atual', () => {
    const result = deserializeDocument(legacyV1(), { catalog, currentVersion: 3, migrations })
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.migratedFrom).toBe(1)
      expect(result.profile.tagline).toBe(makeProfile().tagline)
      expect(result.profile.theme).toBe('obsidian')
    }
  })

  it('falha de forma controlada quando falta uma migração', () => {
    const result = deserializeDocument(legacyV1(), { catalog, currentVersion: 3, migrations: { 1: migrations[1]! } })
    expect(result).toMatchObject({ status: 'invalid', reason: 'migration' })
  })

  it('rejeita uma migração que não avança a versão', () => {
    expect(() => migrateDocument({ schemaVersion: 1 }, 2, { 1: (doc) => doc })).toThrow(/não produziu a versão 2/)
  })

  it('não altera documentos já na versão atual', () => {
    const doc = { schemaVersion: 2, profile: {} }
    expect(migrateDocument(doc, 2, migrations)).toBe(doc)
  })
})

describe('createProfileRepository', () => {
  const options = { catalog, fallback: createDemoProfile, now: fixedNow }

  it('sem dados devolve o fallback sem aviso', () => {
    const result = createProfileRepository(createMemoryStorage(), options).load()
    expect(result).toEqual({ profile: createDemoProfile(), fromStorage: false })
  })

  it('carrega um perfil guardado', () => {
    const profile = makeProfile({ theme: 'blood-moon' })
    const result = createProfileRepository(storageWithProfile(profile), options).load()
    expect(result.fromStorage).toBe(true)
    expect(result.profile).toEqual(profile)
    expect(result.notice).toBeUndefined()
  })

  it('save + load sobrevive a um "refresh" (nova instância, mesmo storage)', () => {
    const storage = createMemoryStorage()
    const profile = makeProfile({ theme: 'frozen-abyss', bio: 'Persistido.' })
    expect(createProfileRepository(storage, options).save(profile)).toEqual({ ok: true, savedAt: '2026-10-23T15:00:00.000Z' })
    expect(createProfileRepository(storage, options).load().profile).toEqual(profile)
  })

  it('JSON corrompido: usa o fallback, guarda backup e avisa', () => {
    const storage = storageWithRaw('{corrompido')
    const result = createProfileRepository(storage, options).load()
    expect(result.profile).toEqual(createDemoProfile())
    expect(result.fromStorage).toBe(false)
    expect(result.notice).toEqual({ kind: 'recovered', reason: 'json', backupSaved: true })

    const backup = JSON.parse(storage.getItem(BACKUP_KEY)!) as BackupRecord
    expect(backup.raw).toBe('{corrompido')
    expect(backup.backedUpAt).toBe('2026-10-23T15:00:00.000Z')
    // Os dados originais não são apagados só por terem sido lidos.
    expect(storage.getItem(STORAGE_KEY)).toBe('{corrompido')
  })

  it('versão futura: usa o fallback, guarda backup e avisa', () => {
    const raw = envelope({ schemaVersion: 99 })
    const storage = storageWithRaw(raw)
    const result = createProfileRepository(storage, options).load()
    expect(result.notice).toEqual({ kind: 'unsupported-version', version: 99, backupSaved: true })
    expect((JSON.parse(storage.getItem(BACKUP_KEY)!) as BackupRecord).raw).toBe(raw)
  })

  it('perfil reparado: carrega e avisa com as reparações', () => {
    const storage = storageWithProfile(makeProfile({ favoriteBandIds: ['opeth', 'opeth'] }))
    const result = createProfileRepository(storage, options).load()
    expect(result.profile.favoriteBandIds).toEqual(['opeth'])
    expect(result.notice?.kind).toBe('repaired')
  })

  it('storage que lança ao ler não bloqueia o arranque', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {},
      removeItem: () => {},
    }
    const result = createProfileRepository(broken, options).load()
    expect(result.profile).toEqual(createDemoProfile())
    expect(result.notice).toEqual({ kind: 'storage-unavailable' })
  })

  it('backup falhado é reportado sem lançar', () => {
    const storage: KeyValueStorage = {
      getItem: () => '{corrompido',
      setItem: () => {
        throw new DOMException('cheio', 'QuotaExceededError')
      },
      removeItem: () => {},
    }
    expect(createProfileRepository(storage, options).load().notice).toEqual({
      kind: 'recovered',
      reason: 'json',
      backupSaved: false,
    })
  })

  it('save distingue quota cheia de outras falhas', () => {
    const quota: KeyValueStorage = {
      ...createMemoryStorage(),
      setItem: () => {
        throw new DOMException('cheio', 'QuotaExceededError')
      },
    }
    const other: KeyValueStorage = {
      ...createMemoryStorage(),
      setItem: () => {
        throw new Error('desconhecido')
      },
    }
    expect(createProfileRepository(quota, options).save(makeProfile())).toEqual({ ok: false, error: 'quota' })
    expect(createProfileRepository(other, options).save(makeProfile())).toEqual({ ok: false, error: 'unavailable' })
  })

  it('clear apaga o perfil mas mantém o backup', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: envelope(), [BACKUP_KEY]: '{"raw":"x"}' })
    createProfileRepository(storage, options).clear()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(storage.getItem(BACKUP_KEY)).toBe('{"raw":"x"}')
  })
})
