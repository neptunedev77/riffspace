import { describe, expect, it } from 'vitest'
import { DEMO_ALBUMS, DEMO_BANDS } from '../../data/demo-bands.ts'
import { claimDemoProfile, createDemoProfile, isDemoSocial } from '../../data/demo-profile.ts'
import { LIMITS } from '../../domain/limits.ts'
import { isAllowedSocialUrl, normalizeSocialInput, socialDisplay } from '../../domain/social.ts'
import { APP_ID, deserializeDocument } from '../../lib/persistence/document.ts'
import { normalizeProfile } from '../../lib/validation/normalize.ts'
import { parseProfile } from '../../lib/validation/parse.ts'
import { makeProfile } from '../../tests/fixtures.ts'
import { addSocial, moveSocial, removeSocial, updateSocial } from './socials.ts'

const empty = () => makeProfile({ socials: [] })
const catalog = { bands: DEMO_BANDS, albums: DEMO_ALBUMS }

describe('normalizeSocialInput', () => {
  it('converte @handles em URLs nas plataformas que os suportam', () => {
    expect(normalizeSocialInput('instagram', '@lamina.riffs')).toBe('https://www.instagram.com/lamina.riffs')
    expect(normalizeSocialInput('youtube', '@canal')).toBe('https://www.youtube.com/@canal')
    expect(normalizeSocialInput('tiktok', 'lamina')).toBe('https://www.tiktok.com/@lamina')
  })

  it('acrescenta https a URLs sem protocolo e mantém os completos', () => {
    expect(normalizeSocialInput('bandcamp', 'lamina.bandcamp.com')).toBe('https://lamina.bandcamp.com')
    expect(normalizeSocialInput('website', 'http://example.com')).toBe('http://example.com')
  })

  it('não inventa URLs a partir de handles em plataformas sem esse formato', () => {
    expect(normalizeSocialInput('spotify', '@lamina')).toBe('https://@lamina')
    expect(isAllowedSocialUrl('spotify', normalizeSocialInput('spotify', '@lamina'))).toBe(false)
  })

  it('vazio fica vazio', () => {
    expect(normalizeSocialInput('instagram', '   ')).toBe('')
  })
})

describe('isAllowedSocialUrl', () => {
  it('aceita o domínio da plataforma e subdomínios', () => {
    expect(isAllowedSocialUrl('bandcamp', 'https://lamina.bandcamp.com')).toBe(true)
    expect(isAllowedSocialUrl('spotify', 'https://open.spotify.com/artist/1')).toBe(true)
    expect(isAllowedSocialUrl('x', 'https://twitter.com/x')).toBe(true)
  })

  it('recusa outros domínios, imitações e protocolos perigosos', () => {
    expect(isAllowedSocialUrl('instagram', 'https://example.com/instagram')).toBe(false)
    expect(isAllowedSocialUrl('instagram', 'https://instagram.com.evil.example')).toBe(false)
    expect(isAllowedSocialUrl('instagram', 'https://fakeinstagram.com/x')).toBe(false)
    expect(isAllowedSocialUrl('website', 'javascript:alert(1)')).toBe(false)
    expect(isAllowedSocialUrl('website', 'não é url')).toBe(false)
  })

  it('website aceita qualquer domínio http(s)', () => {
    expect(isAllowedSocialUrl('website', 'https://a-minha-banda.pt')).toBe(true)
  })
})

describe('socialDisplay', () => {
  it('mostra o domínio sem www e o caminho', () => {
    expect(socialDisplay({ url: 'https://www.instagram.com/lamina/' })).toBe('instagram.com/lamina')
    expect(socialDisplay({ url: 'https://example.com' })).toBe('example.com')
  })
})

describe('operações sobre socials', () => {
  it('adiciona, valida e respeita o limite', () => {
    const added = addSocial(empty(), 'instagram', '@lamina', 'social-1')
    expect(added.ok && added.value).toEqual({ id: 'social-1', platform: 'instagram', url: 'https://www.instagram.com/lamina' })
    expect(added.ok && parseProfile(added.profile).ok).toBe(true)

    expect(addSocial(empty(), 'spotify', 'https://example.com')).toEqual({
      ok: false,
      error: 'This link does not look like a Spotify link.',
    })
    expect(addSocial(empty(), 'website', '  ')).toMatchObject({ ok: false })

    const full = makeProfile({
      socials: Array.from({ length: LIMITS.socials.max }, (_, i) => ({ id: `s${i}`, platform: 'website' as const, url: `https://site${i}.example` })),
    })
    expect(addSocial(full, 'website', 'https://mais.example').ok).toBe(false)
  })

  it('recusa links repetidos (ignorando maiúsculas) mas permite editar o próprio', () => {
    const first = addSocial(empty(), 'website', 'https://Example.org', 'social-1')
    if (!first.ok) throw new Error('setup')
    expect(addSocial(first.profile, 'website', 'https://example.org')).toEqual({ ok: false, error: 'That link is already on your profile.' })
    expect(updateSocial(first.profile, 'social-1', 'website', 'https://Example.org').ok).toBe(true)
  })

  it('edita, move e remove', () => {
    const profile = makeProfile({
      socials: [
        { id: 'a', platform: 'website', url: 'https://a.example' },
        { id: 'b', platform: 'website', url: 'https://b.example' },
      ],
    })
    const edited = updateSocial(profile, 'a', 'instagram', '@novo')
    expect(edited.ok && edited.profile.socials[0]).toEqual({ id: 'a', platform: 'instagram', url: 'https://www.instagram.com/novo' })
    expect(moveSocial(profile, 'b', -1).socials.map((s) => s.id)).toEqual(['b', 'a'])
    expect(moveSocial(profile, 'a', -1)).toBe(profile)
    expect(removeSocial(profile, 'a').socials.map((s) => s.id)).toEqual(['b'])
    expect(updateSocial(profile, 'nada', 'website', 'https://x.example').ok).toBe(false)
  })
})

describe('schema e normalização dos socials', () => {
  it('o schema recusa links de outro domínio', () => {
    const result = parseProfile(makeProfile({ socials: [{ id: 's', platform: 'instagram', url: 'https://example.com' }] }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0]?.path).toBe('socials.0.url')
  })

  it('a normalização remove links repetidos', () => {
    const { profile, repairs } = normalizeProfile(
      makeProfile({
        socials: [
          { id: 'a', platform: 'website', url: 'https://a.example' },
          { id: 'b', platform: 'website', url: 'https://A.example' },
        ],
      }),
      catalog,
    )
    expect(profile.socials.map((s) => s.id)).toEqual(['a'])
    expect(repairs).toContain('Removed duplicate social links.')
  })
})

describe('migração v1 → v2', () => {
  it('um documento v1 (sem socials) carrega com socials vazio', () => {
    const { socials, ...v1Profile } = makeProfile()
    void socials
    const raw = JSON.stringify({ app: APP_ID, schemaVersion: 1, savedAt: '2026-10-23T12:00:00.000Z', profile: v1Profile })
    const result = deserializeDocument(raw, { catalog })
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.migratedFrom).toBe(1)
      expect(result.profile.socials).toEqual([])
      expect(result.profile.nickname).toBe('nocturne')
    }
  })
})

describe('perfil demo', () => {
  it('os socials do demo são ilustrativos e removidos ao reclamar o perfil', () => {
    const demo = createDemoProfile()
    expect(demo.socials.length).toBeGreaterThan(0)
    expect(demo.socials.every(isDemoSocial)).toBe(true)

    const own = { id: 'social-own', platform: 'website' as const, url: 'https://example.org' }
    const claimed = claimDemoProfile({ ...demo, socials: [...demo.socials, own] })
    expect(claimed.socials).toEqual([own])
  })
})
