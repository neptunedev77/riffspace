export const SOCIAL_PLATFORMS = [
  'instagram',
  'spotify',
  'youtube',
  'bandcamp',
  'soundcloud',
  'tiktok',
  'x',
  'facebook',
  'twitch',
  'website',
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export interface SocialLink {
  id: string
  platform: SocialPlatform
  /** URL completo (http/https) do perfil nessa plataforma. */
  url: string
}

export interface SocialPlatformMeta {
  label: string
  /** Domínios aceites (inclui subdomínios). Vazio = qualquer domínio (website). */
  hosts: readonly string[]
  /** Constrói o URL a partir de um @handle, quando a plataforma o permite. */
  fromHandle?: (handle: string) => string
  /** URL de exemplo para o placeholder (a UI acrescenta "@handle or …" quando aplicável). */
  example: string
}

export const SOCIAL_META: Record<SocialPlatform, SocialPlatformMeta> = {
  instagram: {
    label: 'Instagram',
    hosts: ['instagram.com'],
    fromHandle: (h) => `https://www.instagram.com/${h}`,
    example: 'https://instagram.com/…',
  },
  spotify: { label: 'Spotify', hosts: ['spotify.com'], example: 'https://open.spotify.com/…' },
  youtube: {
    label: 'YouTube',
    hosts: ['youtube.com', 'youtu.be'],
    fromHandle: (h) => `https://www.youtube.com/@${h}`,
    example: 'https://youtube.com/@…',
  },
  bandcamp: { label: 'Bandcamp', hosts: ['bandcamp.com'], example: 'https://artist.bandcamp.com' },
  soundcloud: {
    label: 'SoundCloud',
    hosts: ['soundcloud.com'],
    fromHandle: (h) => `https://soundcloud.com/${h}`,
    example: 'https://soundcloud.com/…',
  },
  tiktok: {
    label: 'TikTok',
    hosts: ['tiktok.com'],
    fromHandle: (h) => `https://www.tiktok.com/@${h}`,
    example: 'https://tiktok.com/@…',
  },
  x: { label: 'X', hosts: ['x.com', 'twitter.com'], fromHandle: (h) => `https://x.com/${h}`, example: 'https://x.com/…' },
  facebook: { label: 'Facebook', hosts: ['facebook.com', 'fb.com'], example: 'https://facebook.com/…' },
  twitch: { label: 'Twitch', hosts: ['twitch.tv'], fromHandle: (h) => `https://www.twitch.tv/${h}`, example: 'https://twitch.tv/…' },
  website: { label: 'Website', hosts: [], example: 'https://…' },
}

const HANDLE_PATTERN = /^@?([A-Za-z0-9._-]{1,60})$/

/**
 * Converte o que o utilizador escreveu num URL: aceita URLs completos, URLs
 * sem protocolo ("instagram.com/x") e @handles nas plataformas que os suportam.
 * Não valida o domínio — isso é feito pelo schema (`isAllowedSocialUrl`).
 */
export function normalizeSocialInput(platform: SocialPlatform, raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  const meta = SOCIAL_META[platform]
  const handle = HANDLE_PATTERN.exec(value)
  if (handle && meta.fromHandle && (value.startsWith('@') || !value.includes('.'))) {
    return meta.fromHandle(handle[1]!)
  }
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

/** true quando o URL é http(s) e pertence a um dos domínios da plataforma. */
export function isAllowedSocialUrl(platform: SocialPlatform, url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
  const hosts = SOCIAL_META[platform].hosts
  if (hosts.length === 0) return true
  const host = parsed.hostname.toLowerCase()
  return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
}

/** Texto curto para mostrar o link: o @handle ou o domínio + caminho. */
export function socialDisplay(link: Pick<SocialLink, 'url'>): string {
  try {
    const url = new URL(link.url)
    const path = url.pathname.replace(/\/+$/, '')
    const host = url.hostname.replace(/^www\./, '')
    return path ? `${host}${path}` : host
  } catch {
    return link.url
  }
}
