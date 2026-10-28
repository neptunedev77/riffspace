/**
 * Música em destaque do perfil. Vem de um catálogo público (iTunes Search API):
 * só se guardam metadados, URLs oficiais e os picos da forma de onda, calculados
 * a partir do áudio real da pré-visualização. O áudio não é copiado.
 */
export interface FeaturedTrack {
  source: 'itunes'
  trackId: number
  title: string
  artist: string
  album?: string
  /** Capa servida pela Apple (mzstatic.com). */
  artworkUrl?: string
  /** Pré-visualização oficial de ~30 s (apple.com). */
  previewUrl: string
  /** Página da faixa na Apple Music / iTunes, para atribuição. */
  trackUrl?: string
  durationMs?: number
  /** Picos normalizados (0–1) da pré-visualização real, um por barra da forma de onda. */
  peaks: number[]
}

export const TRACK_HOSTS = {
  preview: ['apple.com'],
  artwork: ['mzstatic.com'],
  page: ['apple.com'],
} as const

/** true quando o URL é https e pertence a um dos domínios indicados (inclui subdomínios). */
export function isHttpsOnHosts(url: string, hosts: readonly string[]): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
  } catch {
    return false
  }
}
