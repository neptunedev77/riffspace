import type { Profile } from '../domain/profile.ts'
import type { SocialLink } from '../domain/social.ts'
import type { FeaturedTrack } from '../domain/track.ts'
import { DEMO_RIG } from './demo-gear.ts'

/** Prefixo dos IDs dos links sociais ilustrativos do perfil demo. */
const DEMO_SOCIAL_PREFIX = 'social-demo-'

export function isDemoSocial(link: SocialLink): boolean {
  return link.id.startsWith(DEMO_SOCIAL_PREFIX)
}

/**
 * Quando o utilizador guarda o perfil demo como seu, os links ilustrativos são
 * removidos: deixariam de estar marcados como demo e apontariam para contas
 * que podem pertencer a outras pessoas.
 */
export function claimDemoProfile(profile: Profile): Profile {
  return { ...profile, socials: profile.socials.filter((link) => !isDemoSocial(link)) }
}

/** Cópia profunda e independente do perfil demo (para reset sem partilhar referências). */
export function createDemoProfile(): Profile {
  return structuredClone(DEMO_PROFILE)
}

/**
 * Música em destaque da demonstração: metadados e URLs oficiais da iTunes Search
 * API; os picos foram calculados no browser a partir da pré-visualização real
 * (lib/track/itunes.ts → analysePreview), por isso a forma de onda é a da faixa.
 */
const DEMO_TRACK: FeaturedTrack = {
  source: 'itunes',
  trackId: 213374170,
  title: 'Flying Whales',
  artist: 'Gojira',
  album: 'From Mars to Sirius',
  artworkUrl:
    'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/09/5d/88/095d8807-90bf-1668-f164-aad880c9fb0d/cover.jpg/300x300bb.jpg',
  previewUrl:
    'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/81/14/d9/8114d93b-b31b-0651-7617-cc420d899dbf/mzaf_11071663614055883807.plus.aac.p.m4a',
  trackUrl: 'https://music.apple.com/us/album/flying-whales/213374112?i=213374170&uo=4',
  durationMs: 464453,
  peaks: [
    0.537, 0.315, 0.584, 0.53, 0.656, 0.552, 0.388, 0.755, 0.502, 0.921, 0.775, 0.715, 0.744, 0.654, 0.818,
    0.746, 0.663, 0.749, 0.648, 0.846, 0.712, 0.694, 0.752, 0.686, 0.819, 0.816, 0.643, 0.727, 0.655, 0.857,
    0.688, 0.777, 0.762, 0.8, 0.95, 0.81, 0.678, 0.803, 0.756, 0.913, 0.856, 0.595, 0.706, 0.639, 0.781,
    0.756, 0.584, 0.708, 0.577, 0.754, 0.583, 0.758, 0.598, 0.641, 0.654, 0.692, 0.684, 0.644, 0.618, 0.635,
    0.588, 0.623, 0.608, 0.607, 0.592, 0.566, 0.582, 0.707, 0.569, 0.644, 0.77, 0.788, 0.732, 0.82, 0.85,
    0.806, 0.558, 0.714, 0.659, 0.684, 0.777, 0.558, 0.666, 0.652, 0.638, 0.845, 0.595, 0.642, 0.569, 0.75,
    1, 0.828, 0.727, 0.652, 0.801, 0.825, 0.754, 0.713, 0.584, 0.667, 0.548, 0.714, 0.845, 0.64, 0.733,
    0.667, 0.719, 0.785, 0.686, 0.679, 0.798, 0.728, 0.712, 0.697, 0.711, 0.729, 0.598, 0.728, 0.719, 0.608,
  ],
}

/**
 * Perfil de DEMONSTRAÇÃO, com uma persona fictícia. Não representa nenhum
 * utilizador real; a UI assinala-o sempre como demonstração.
 */
export const DEMO_PROFILE: Profile = {
  id: 'demo-nocturne',
  nickname: 'nocturne',
  displayName: 'Nocturne',
  avatar: { kind: 'generated' },
  tagline: 'Tuned to drop C, raised on Gothenburg riffs and Atlantic fog.',
  bio: 'Garage guitarist since 15. Somewhere between melodic death and progressive metal: riffs that breathe, solos with room, and a noise gate that never turns off. Looking for a drummer who is not afraid of 7/8.',
  location: 'Porto, Portugal',
  favoriteBandIds: ['gojira', 'opeth', 'moonspell', 'at-the-gates', 'mastodon', 'meshuggah'],
  favoriteAlbumIds: [
    'gojira-from-mars-to-sirius',
    'opeth-blackwater-park',
    'moonspell-wolfheart',
    'at-the-gates-slaughter-of-the-soul',
    'mastodon-crack-the-skye',
    'insomnium-winters-gate',
  ],
  subgenres: ['Melodic Death Metal', 'Progressive Metal', 'Gothic Metal', 'Djent'],
  customBands: [],
  customAlbums: [],
  rig: DEMO_RIG,
  // Links ilustrativos: enquanto o perfil é demo, a UI mostra-os sem hiperligação.
  socials: [
    { id: 'social-demo-instagram', platform: 'instagram', url: 'https://www.instagram.com/riffspace.demo' },
    { id: 'social-demo-bandcamp', platform: 'bandcamp', url: 'https://riffspace-demo.bandcamp.com' },
    { id: 'social-demo-youtube', platform: 'youtube', url: 'https://www.youtube.com/@riffspace-demo' },
    { id: 'social-demo-website', platform: 'website', url: 'https://example.com' },
  ],
  featuredTrack: DEMO_TRACK,
  theme: 'obsidian',
  isDemo: true,
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
}
