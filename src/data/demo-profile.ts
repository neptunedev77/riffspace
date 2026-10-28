import type { Album } from '../domain/album.ts'
import type { Band } from '../domain/band.ts'
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
 * Bandas e álbuns da demonstração, tal como a MusicBrainz os devolve
 * (lib/music/musicbrainz.ts): IDs, país, ano de formação e géneros reais.
 * As fotografias vêm da Wikimedia Commons (via Wikidata), com autor e licença;
 * dois nomes de autor foram encurtados ao essencial.
 */
const BAND_IDS = {
  gojira: 'mb-1c5efd53-d6b6-4d63-9d22-a15025cf5f07',
  opeth: 'mb-c14b4180-dc87-481e-b17a-64e4150f90f6',
  moonspell: 'mb-386b19c6-a3d2-414a-bef2-c178572b1cbe',
  atTheGates: 'mb-35f92c4a-69d0-4ed1-ab9e-05259db89d14',
  mastodon: 'mb-bc5e2ad6-0a4a-4d90-b911-e9a7e6861727',
  meshuggah: 'mb-cf8b3b8c-118e-4136-8d1d-c37091173413',
} as const

const DEMO_BANDS: Band[] = [
  { id: BAND_IDS.gojira, name: 'Gojira', country: 'FR', formedYear: 1996, subgenres: ['Progressive Metal', 'Death Metal', 'Progressive Death Metal', 'Metal'], source: 'musicbrainz', image: { file: 'Gojira live at Unipol Arena, Bologna, December 9th, 2016.jpg', author: 'SuperVirtual', license: 'CC BY-SA 4.0' } },
  { id: BAND_IDS.opeth, name: 'Opeth', country: 'SE', formedYear: 1990, subgenres: ['Progressive Metal', 'Progressive Death Metal', 'Progressive Rock', 'Death Metal'], source: 'musicbrainz', image: { file: 'Opeth @ Rock Hard Festival 2017 201.jpg', author: 'Grywnn', license: 'CC BY-SA 4.0' } },
  { id: BAND_IDS.moonspell, name: 'Moonspell', country: 'PT', formedYear: 1989, subgenres: ['Gothic Metal', 'Black Metal', 'Metal'], source: 'musicbrainz', image: { file: 'Moonspell Studio Kraków 2007 10.JPG', author: 'Lilly M (Małgorzata Miłaszewska)', license: 'CC BY 2.5' } },
  { id: BAND_IDS.atTheGates, name: 'At the Gates', country: 'SE', formedYear: 1990, subgenres: ['Melodic Death Metal', 'Death Metal', 'Metal', 'Gothenburg Metal'], source: 'musicbrainz', image: { file: 'At The Gates - Wacken Open Air 2022 03.jpg', author: 'Frank Schwichtenberg', license: 'CC BY-SA 4.0' } },
  { id: BAND_IDS.mastodon, name: 'Mastodon', country: 'US', formedYear: 2000, subgenres: ['Progressive Metal', 'Sludge Metal', 'Heavy Metal', 'Metal'], source: 'musicbrainz', image: { file: 'Ursynalia 2012, Mastodon 12.jpg', author: 'Adam Kliczek', license: 'CC BY-SA 3.0' } },
  { id: BAND_IDS.meshuggah, name: 'Meshuggah', country: 'SE', formedYear: 1987, subgenres: ['Djent', 'Metal', 'Progressive Metal', 'Death Metal'], source: 'musicbrainz', image: { file: 'Meshuggah - Rock am Ring 2018-6418.jpg', author: 'Andreas Lawen, Fotandi', license: 'CC BY-SA 4.0' } },
]

const DEMO_ALBUMS: Album[] = [
  { id: 'mb-c64e38e7-ea8d-3cda-ba62-1f4b9f899419', bandId: BAND_IDS.gojira, title: 'From Mars to Sirius', year: 2005, source: 'musicbrainz' },
  { id: 'mb-1f4a9f6f-9621-3e46-977d-8503e8386768', bandId: BAND_IDS.opeth, title: 'Blackwater Park', year: 2001, source: 'musicbrainz' },
  { id: 'mb-7eb4d307-e2f2-3258-ad1c-329c29df44a0', bandId: BAND_IDS.moonspell, title: 'Wolfheart', year: 1995, source: 'musicbrainz' },
  { id: 'mb-675e453b-43c5-3c05-9ac8-dc526471e583', bandId: BAND_IDS.atTheGates, title: 'Slaughter of the Soul', year: 1995, source: 'musicbrainz' },
  { id: 'mb-defcc444-7255-320d-bf21-888eb4d53ff9', bandId: BAND_IDS.mastodon, title: 'Crack the Skye', year: 2009, source: 'musicbrainz' },
  { id: 'mb-bc3c02ea-5837-32ab-9c65-f60125458187', bandId: BAND_IDS.meshuggah, title: 'obZen', year: 2008, source: 'musicbrainz' },
]

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
  bands: DEMO_BANDS,
  albums: DEMO_ALBUMS,
  subgenres: ['Melodic Death Metal', 'Progressive Metal', 'Gothic Metal', 'Djent'],
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
