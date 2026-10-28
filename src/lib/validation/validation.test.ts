import { describe, expect, it } from 'vitest'
import { DEMO_PROFILE } from '../../data/demo-profile.ts'
import { LIMITS } from '../../domain/limits.ts'
import { makeProfile } from '../../tests/fixtures.ts'
import { normalizeProfile } from './normalize.ts'
import { parseProfile, validateField } from './parse.ts'
import { bioSchema, httpUrlSchema, nicknameSchema, taglineSchema } from './schemas.ts'

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
    expect(issuesFor({ ...profile, bands: [{ ...profile.bands[0]!, id: '<script>' }] })[0]?.path).toBe('bands.0.id')
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
    const band = { id: 'nova', name: 'Nova', subgenres: [], source: 'custom' as const }
    expect(parseProfile(makeProfile({ bands: [{ ...band, formedYear: 1990 }], albums: [] })).ok).toBe(true)
    expect(parseProfile(makeProfile({ bands: [{ ...band, formedYear: 1800 }], albums: [] })).ok).toBe(false)
    expect(parseProfile(makeProfile({ bands: [{ ...band, formedYear: 3000 }], albums: [] })).ok).toBe(false)
    expect(parseProfile(makeProfile({ bands: [{ ...band, formedYear: 1999.5 }], albums: [] })).ok).toBe(false)
  })

  it('a fotografia da banda é só um nome de ficheiro da Commons (nunca um URL) com créditos opcionais', () => {
    const profile = makeProfile()
    const withImage = (image: unknown) => ({ ...profile, bands: [{ ...profile.bands[0]!, image }, ...profile.bands.slice(1)] })
    expect(parseProfile(withImage({ file: 'Gojira live 2016.jpg', author: 'X', license: 'CC BY-SA 4.0' })).ok).toBe(true)
    expect(parseProfile(withImage({ file: 'Logo.svg' })).ok).toBe(true)
    expect(issuesFor(withImage({ file: 'https://evil.example/a.jpg' }))[0]?.path).toBe('bands.0.image.file')
    expect(issuesFor(withImage({ file: 'sem extensão' }))[0]?.path).toBe('bands.0.image.file')
    expect(issuesFor(withImage({ file: 'a<script>.jpg' }))[0]?.path).toBe('bands.0.image.file')
    expect(issuesFor(withImage({ file: 'a.jpg', author: 'x'.repeat(LIMITS.imageCredit.max + 1) }))[0]?.path).toBe('bands.0.image.author')
  })

  it('só aceita as origens musicbrainz e custom e limita o número de bandas', () => {
    const profile = makeProfile()
    expect(issuesFor({ ...profile, bands: [{ ...profile.bands[0]!, source: 'spotify' }] })[0]?.path).toBe('bands.0.source')
    const many = Array.from({ length: LIMITS.favoriteBands.max + 1 }, (_, i) => ({ ...profile.bands[0]!, id: `b${i}` }))
    expect(issuesFor({ ...profile, bands: many, albums: [] })[0]?.path).toBe('bands')
  })
})

describe('validação de campos', () => {
  it('nickname: normaliza para minúsculas e aplica comprimento e formato', () => {
    expect(nicknameSchema.parse('  Nocturne ')).toBe('nocturne')
    expect(validateField(nicknameSchema, 'ab')).toMatch(/at least 3/)
    expect(validateField(nicknameSchema, 'a'.repeat(LIMITS.nickname.max + 1))).toMatch(/up to 24/)
    expect(validateField(nicknameSchema, '_riff')).toBeDefined()
    expect(validateField(nicknameSchema, 'riff_')).toBeDefined()
    expect(validateField(nicknameSchema, 'riff space')).toBeDefined()
    expect(validateField(nicknameSchema, 'riff.space_666')).toBeUndefined()
  })

  it('tagline e bio aceitam vazio mas não excesso', () => {
    expect(validateField(taglineSchema, '')).toBeUndefined()
    expect(validateField(bioSchema, 'x'.repeat(LIMITS.bio.max + 1))).toMatch(/up to 500 characters/)
  })

  it('URLs: só http e https', () => {
    expect(validateField(httpUrlSchema, 'https://example.com')).toBeUndefined()
    expect(validateField(httpUrlSchema, 'ftp://example.com')).toBeDefined()
    expect(validateField(httpUrlSchema, 'não é url')).toBeDefined()
  })
})

describe('normalizeProfile', () => {
  it('não altera um perfil consistente', () => {
    const { profile, repairs } = normalizeProfile(makeProfile())
    expect(repairs).toEqual([])
    expect(profile).toEqual(makeProfile())
  })

  it('remove bandas repetidas mantendo a ordem do ranking', () => {
    const [gojira, opeth] = makeProfile().bands
    const { profile, repairs } = normalizeProfile(makeProfile({ bands: [opeth!, gojira!, opeth!], albums: [] }))
    expect(profile.bands).toEqual([opeth, gojira])
    expect(repairs.length).toBeGreaterThan(0)
  })

  it('aceita bandas e álbuns criados à mão', () => {
    const band = { id: 'a-minha-banda', name: 'A Minha Banda', subgenres: [], source: 'custom' as const }
    const album = { id: 'demo-tape', bandId: band.id, title: 'Demo Tape', source: 'custom' as const }
    const { profile, repairs } = normalizeProfile(makeProfile({ bands: [band], albums: [album] }))
    expect(repairs).toEqual([])
    expect(profile.albums).toEqual([album])
  })

  it('remove álbuns de bandas que não estão no perfil e álbuns repetidos', () => {
    const base = makeProfile()
    const orphan = { id: 'orfao', bandId: 'fantasma', title: 'Órfão', source: 'custom' as const }
    const { profile, repairs } = normalizeProfile({ ...base, albums: [...base.albums, orphan, base.albums[0]!] })
    expect(profile.albums).toEqual(base.albums)
    expect(repairs).toHaveLength(1)
  })

  it('remove peças da rig e subgéneros repetidos', () => {
    const base = makeProfile()
    const { profile } = normalizeProfile({
      ...base,
      rig: [...base.rig, base.rig[0]!],
      subgenres: ['Doom Metal', 'doom metal', 'Djent'],
    })
    expect(profile.rig).toHaveLength(base.rig.length)
    expect(profile.subgenres).toEqual(['Doom Metal', 'Djent'])
  })

  it('não altera o objeto recebido', () => {
    const opeth = makeProfile().bands[1]!
    const input = makeProfile({ bands: [opeth, opeth], albums: [] })
    normalizeProfile(input)
    expect(input.bands).toHaveLength(2)
  })
})
