import { LIMITS } from '../../domain/limits.ts'
import type { Profile } from '../../domain/profile.ts'
import { normalizeSocialInput, type SocialLink, type SocialPlatform } from '../../domain/social.ts'
import { createId } from '../../lib/id.ts'
import { socialLinkSchema } from '../../lib/validation/schemas.ts'
import { translate } from '../../i18n/translate.ts'

/** Operações puras sobre os links sociais; nunca alteram o perfil recebido. */

export type SocialResult = { ok: true; profile: Profile; value: SocialLink } | { ok: false; error: string }

function validate(
  profile: Profile,
  platform: SocialPlatform,
  raw: string,
  id: string,
): { ok: true; link: SocialLink } | { ok: false; error: string } {
  const url = normalizeSocialInput(platform, raw)
  if (!url) return { ok: false, error: translate('socials.error.empty') }
  const parsed = socialLinkSchema.safeParse({ id, platform, url })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? translate('socials.error.invalid') }
  const duplicate = profile.socials.some(
    (link) => link.id !== id && link.url.toLowerCase() === parsed.data.url.toLowerCase(),
  )
  if (duplicate) return { ok: false, error: translate('socials.error.duplicate') }
  return { ok: true, link: parsed.data }
}

export function addSocial(
  profile: Profile,
  platform: SocialPlatform,
  raw: string,
  id: string = createId('social'),
): SocialResult {
  if (profile.socials.length >= LIMITS.socials.max) {
    return { ok: false, error: translate('socials.error.max', { max: LIMITS.socials.max }) }
  }
  const validated = validate(profile, platform, raw, id)
  if (!validated.ok) return validated
  return { ok: true, profile: { ...profile, socials: [...profile.socials, validated.link] }, value: validated.link }
}

export function updateSocial(profile: Profile, id: string, platform: SocialPlatform, raw: string): SocialResult {
  if (!profile.socials.some((link) => link.id === id)) return { ok: false, error: translate('socials.error.notFound') }
  const validated = validate(profile, platform, raw, id)
  if (!validated.ok) return validated
  return {
    ok: true,
    profile: { ...profile, socials: profile.socials.map((link) => (link.id === id ? validated.link : link)) },
    value: validated.link,
  }
}

export function removeSocial(profile: Profile, id: string): Profile {
  return { ...profile, socials: profile.socials.filter((link) => link.id !== id) }
}

export function moveSocial(profile: Profile, id: string, delta: -1 | 1): Profile {
  const from = profile.socials.findIndex((link) => link.id === id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= profile.socials.length) return profile
  const socials = [...profile.socials]
  ;[socials[from], socials[to]] = [socials[to]!, socials[from]!]
  return { ...profile, socials }
}
