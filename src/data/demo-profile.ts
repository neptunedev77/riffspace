import type { Profile } from '../domain/profile.ts'
import { DEMO_RIG } from './demo-gear.ts'

/** Cópia profunda e independente do perfil demo (para reset sem partilhar referências). */
export function createDemoProfile(): Profile {
  return structuredClone(DEMO_PROFILE)
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
  tagline: 'Afinado em Drop C, criado a riffs de Gotemburgo e nevoeiro atlântico.',
  bio: 'Guitarrista de garagem desde os 15. Entre death metal melódico e progressivo: riffs que respiram, solos com espaço e um noise gate sempre ligado. Procuro um baterista que não tenha medo de 7/8.',
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
  theme: 'obsidian',
  isDemo: true,
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
}
