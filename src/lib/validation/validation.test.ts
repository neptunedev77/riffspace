import { describe, expect, it } from 'vitest'
import { DEMO_ALBUMS, DEMO_BANDS } from '../../data/demo-bands.ts'
import { DEMO_PROFILE } from '../../data/demo-profile.ts'
import { LIMITS } from '../../domain/limits.ts'
import { makeProfile } from '../../tests/fixtures.ts'
import { normalizeProfile } from './normalize.ts'
import { parseProfile, validateField } from './parse.ts'
import { bioSchema, httpUrlSchema, nicknameSchema, taglineSchema } from './schemas.ts'

const catalog = { bands: DEMO_BANDS, albums: DEMO_ALBUMS }

function issuesFor(input: unknown) {
  const result = parseProfile(input)
  return result.ok ? [] : result.issues
}

describe('parseProfile', () => {
  it('aceita o perfil de demonstração', () => {
    const result = parseProfile(DEMO_PROFILE)
    expect(result.ok).toBe(true)
  })

  it.each(['id', 'nickname', 'avatar', 'tagline', 'bio', 'rig', 'theme', 'isDemo', 'createdAt', 'updatedAt'])(
    'rejeita perfis sem o campo obrigatório %s',
    (field) => {
      const profile: Record<string, unknown> = { ...makeProfile() }
      delete profile[field]
      expect(issuesFor(profile).some((issue) => issue.path === field)).toBe(true)
    },
  )

  it('rejeita valores que não são objetos', () => {
    for (const value of [null, 42, 'perfil', [], undefined]) {
      expect(parseProfile(value).ok).toBe(false)
    }
  })

  it('aplica os limites de texto', () => {
    const issues = issuesFor(
      makeProfile({ tagline: 'x'.repeat(LIMITS.tagline.max + 1), bio: 'x'.repeat(LIMITS.bio.max + 1) }),
    )
    expect(issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['tagline', 'bio']))
  })

  it('aceita textos exatamente no limite', () => {
    const result = parseProfile(makeProfile({ tagline: 'x'.repeat(LIMITS.tagline.max), bio: 'y'.repeat(LIMITS.bio.max) }))
    expect(result.ok).toBe(true)
  })

  it('normaliza espaços e converte textos opcionais vazios em undefined', () => {
    const result = parseProfile(makeProfile({ tagline: '  riff  ', displayName: '   ', location: '' }))
    expect(result.ok && result.value.tagline).toBe('riff')
    expect(result.ok && result.value.displayName).toBeUndefined()
    expect(result.ok && result.value.location).toBeUndefined()
  })

  it('descarta chaves desconhecidas', () => {
    const result = parseProfile({ ...makeProfile(), isAdmin: true, __proto_hack: 'x' })
    expect(result.ok).toBe(true)
    expect(result.ok && 'isAdmin' in result.value).toBe(false)
  })

  it('rejeita temas, tipos de gear e datas desconhecidos', () => {
    const profile = makeProfile()
    expect(issuesFor({ ...profile, theme: 'neon' })[0]?.path).toBe('theme')
    expect(issuesFor({ ...profile, createdAt: 'ontem' })[0]?.path).toBe('createdAt')
    const rig = [{ ...profile.rig[0]!, type: 'theremin' }]
    expect(issuesFor({ ...profile, rig })[0]?.path).toBe('rig.0.type')
  })

  it('rejeita IDs inválidos', () => {
    const profile = makeProfile()
    expect(issuesFor({ ...profile, id: 'Com Espaços' })[0]?.path).toBe('id')
    expect(issuesFor({ ...profile, favoriteBandIds: ['<script>'] })[0]?.path).toBe('favoriteBandIds.0')
  })

  it('valida avatares por URL apenas com http(s)', () => {
    const profile = makeProfile()
    expect(parseProfile({ ...profile, avatar: { kind: 'url', url: 'https://example.com/a.png' } }).ok).toBe(true)
    expect(issuesFor({ ...profile, avatar: { kind: 'url', url: 'javascript:alert(1)' } })[0]?.path).toBe('avatar.url')
    expect(parseProfile({ ...profile, avatar: { kind: 'emoji' } }).ok).toBe(false)
  })

  it('aplica o máximo de elementos nas listas', () => {
    const profile = makeProfile({ subgenres: Array.from({ length: LIMITS.subgenres.max + 1 }, (_, i) => `Género ${i}`) })
    expect(issuesFor(profile)[0]?.path).toBe('subgenres')
  })

  it('valida anos de formação', () => {
    const band = { id: 'nova', name: 'Nova', subgenres: [], isCustom: true }
    expect(parseProfile(makeProfile({ customBands: [{ ...band, formedYear: 1990 }] })).ok).toBe(true)
    expect(parseProfile(makeProfile({ customBands: [{ ...band, formedYear: 1800 }] })).ok).toBe(false)
    expect(parseProfile(makeProfile({ customBands: [{ ...band, formedYear: 3000 }] })).ok).toBe(false)
    expect(parseProfile(makeProfile({ customBands: [{ ...band, formedYear: 1999.5 }] })).ok).toBe(false)
  })
})

describe('validação de campos', () => {
  it('nickname: normaliza para minúsculas e aplica comprimento e formato', () => {
    expect(nicknameSchema.parse('  Nocturne ')).toBe('nocturne')
    expect(validateField(nicknameSchema, 'ab')).toMatch(/pelo menos 3/)
    expect(validateField(nicknameSchema, 'a'.repeat(LIMITS.nickname.max + 1))).toMatch(/máximo/)
    expect(validateField(nicknameSchema, '_riff')).toBeDefined()
    expect(validateField(nicknameSchema, 'riff_')).toBeDefined()
    expect(validateField(nicknameSchema, 'riff space')).toBeDefined()
    expect(validateField(nicknameSchema, 'riff.space_666')).toBeUndefined()
  })

  it('tagline e bio aceitam vazio mas não excesso', () => {
    expect(validateField(taglineSchema, '')).toBeUndefined()
    expect(validateField(bioSchema, 'x'.repeat(LIMITS.bio.max + 1))).toMatch(/máximo de 500/)
  })

  it('URLs: só http e https', () => {
    expect(validateField(httpUrlSchema, 'https://example.com')).toBeUndefined()
    expect(validateField(httpUrlSchema, 'ftp://example.com')).toBeDefined()
    expect(validateField(httpUrlSchema, 'não é url')).toBeDefined()
  })
})

describe('normalizeProfile', () => {
  it('não altera um perfil consistente', () => {
    const { profile, repairs } = normalizeProfile(makeProfile(), catalog)
    expect(repairs).toEqual([])
    expect(profile).toEqual(makeProfile())
  })

  it('remove favoritos repetidos e inexistentes mantendo a ordem', () => {
    const { profile, repairs } = normalizeProfile(
      makeProfile({ favoriteBandIds: ['opeth', 'nao-existe', 'gojira', 'opeth'] }),
      catalog,
    )
    expect(profile.favoriteBandIds).toEqual(['opeth', 'gojira'])
    expect(repairs.length).toBeGreaterThan(0)
  })

  it('aceita favoritos de bandas e álbuns personalizados', () => {
    const { profile } = normalizeProfile(
      makeProfile({
        customBands: [{ id: 'a-minha-banda', name: 'A Minha Banda', subgenres: [], isCustom: true }],
        customAlbums: [{ id: 'demo-tape', bandId: 'a-minha-banda', title: 'Demo Tape' }],
        favoriteBandIds: ['a-minha-banda'],
        favoriteAlbumIds: ['demo-tape'],
      }),
      catalog,
    )
    expect(profile.favoriteBandIds).toEqual(['a-minha-banda'])
    expect(profile.favoriteAlbumIds).toEqual(['demo-tape'])
  })

  it('remove bandas personalizadas que colidem com o catálogo e força isCustom', () => {
    const { profile } = normalizeProfile(
      makeProfile({
        customBands: [
          { id: 'gojira', name: 'Impostor', subgenres: [], isCustom: true },
          { id: 'local', name: 'Local', subgenres: [], isCustom: false },
        ],
      }),
      catalog,
    )
    expect(profile.customBands).toEqual([{ id: 'local', name: 'Local', subgenres: [], isCustom: true }])
  })

  it('remove álbuns personalizados de bandas inexistentes', () => {
    const { profile } = normalizeProfile(
      makeProfile({ customAlbums: [{ id: 'orfao', bandId: 'fantasma', title: 'Órfão' }] }),
      catalog,
    )
    expect(profile.customAlbums).toEqual([])
  })

  it('remove peças da rig e subgéneros repetidos', () => {
    const base = makeProfile()
    const { profile } = normalizeProfile(
      { ...base, rig: [...base.rig, base.rig[0]!], subgenres: ['Doom Metal', 'doom metal', 'Djent'] },
      catalog,
    )
    expect(profile.rig).toHaveLength(base.rig.length)
    expect(profile.subgenres).toEqual(['Doom Metal', 'Djent'])
  })

  it('não altera o objeto recebido', () => {
    const input = makeProfile({ favoriteBandIds: ['opeth', 'opeth'] })
    normalizeProfile(input, catalog)
    expect(input.favoriteBandIds).toEqual(['opeth', 'opeth'])
  })
})
