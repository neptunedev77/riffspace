import type { Album } from '../domain/album.ts'
import type { Band } from '../domain/band.ts'

/**
 * Catálogo local de DEMONSTRAÇÃO. Pequeno e propositadamente incompleto.
 * Contém apenas metadados factuais em texto (nome, país, ano de formação,
 * álbuns); não inclui logótipos, fotografias nem capas.
 */

export const DEMO_SUBGENRES = [
  'Melodic Death Metal',
  'Progressive Metal',
  'Progressive Death Metal',
  'Gothic Metal',
  'Doom Metal',
  'Black Metal',
  'Sludge Metal',
  'Djent',
  'Death Metal',
  'Stoner Doom',
] as const

export const DEMO_BANDS: Band[] = [
  { id: 'gojira', name: 'Gojira', country: 'FR', formedYear: 1996, subgenres: ['Progressive Death Metal'], isCustom: false },
  { id: 'opeth', name: 'Opeth', country: 'SE', formedYear: 1990, subgenres: ['Progressive Metal', 'Progressive Death Metal'], isCustom: false },
  { id: 'moonspell', name: 'Moonspell', country: 'PT', formedYear: 1992, subgenres: ['Gothic Metal'], isCustom: false },
  { id: 'at-the-gates', name: 'At the Gates', country: 'SE', formedYear: 1990, subgenres: ['Melodic Death Metal'], isCustom: false },
  { id: 'mastodon', name: 'Mastodon', country: 'US', formedYear: 2000, subgenres: ['Sludge Metal', 'Progressive Metal'], isCustom: false },
  { id: 'meshuggah', name: 'Meshuggah', country: 'SE', formedYear: 1987, subgenres: ['Djent', 'Progressive Metal'], isCustom: false },
  { id: 'emperor', name: 'Emperor', country: 'NO', formedYear: 1991, subgenres: ['Black Metal'], isCustom: false },
  { id: 'paradise-lost', name: 'Paradise Lost', country: 'GB', formedYear: 1988, subgenres: ['Gothic Metal', 'Doom Metal'], isCustom: false },
  { id: 'insomnium', name: 'Insomnium', country: 'FI', formedYear: 1997, subgenres: ['Melodic Death Metal'], isCustom: false },
  { id: 'sleep', name: 'Sleep', country: 'US', formedYear: 1990, subgenres: ['Stoner Doom', 'Doom Metal'], isCustom: false },
  { id: 'death', name: 'Death', country: 'US', formedYear: 1984, subgenres: ['Death Metal', 'Progressive Death Metal'], isCustom: false },
]

export const DEMO_ALBUMS: Album[] = [
  { id: 'gojira-from-mars-to-sirius', bandId: 'gojira', title: 'From Mars to Sirius', year: 2005 },
  { id: 'gojira-the-way-of-all-flesh', bandId: 'gojira', title: 'The Way of All Flesh', year: 2008 },
  { id: 'gojira-magma', bandId: 'gojira', title: 'Magma', year: 2016 },
  { id: 'opeth-still-life', bandId: 'opeth', title: 'Still Life', year: 1999 },
  { id: 'opeth-blackwater-park', bandId: 'opeth', title: 'Blackwater Park', year: 2001 },
  { id: 'opeth-ghost-reveries', bandId: 'opeth', title: 'Ghost Reveries', year: 2005 },
  { id: 'moonspell-wolfheart', bandId: 'moonspell', title: 'Wolfheart', year: 1995 },
  { id: 'moonspell-irreligious', bandId: 'moonspell', title: 'Irreligious', year: 1996 },
  { id: 'at-the-gates-slaughter-of-the-soul', bandId: 'at-the-gates', title: 'Slaughter of the Soul', year: 1995 },
  { id: 'mastodon-leviathan', bandId: 'mastodon', title: 'Leviathan', year: 2004 },
  { id: 'mastodon-crack-the-skye', bandId: 'mastodon', title: 'Crack the Skye', year: 2009 },
  { id: 'meshuggah-destroy-erase-improve', bandId: 'meshuggah', title: 'Destroy Erase Improve', year: 1995 },
  { id: 'meshuggah-obzen', bandId: 'meshuggah', title: 'obZen', year: 2008 },
  { id: 'emperor-in-the-nightside-eclipse', bandId: 'emperor', title: 'In the Nightside Eclipse', year: 1994 },
  { id: 'paradise-lost-draconian-times', bandId: 'paradise-lost', title: 'Draconian Times', year: 1995 },
  { id: 'insomnium-winters-gate', bandId: 'insomnium', title: "Winter's Gate", year: 2016 },
  { id: 'sleep-holy-mountain', bandId: 'sleep', title: 'Holy Mountain', year: 1992 },
  { id: 'death-symbolic', bandId: 'death', title: 'Symbolic', year: 1995 },
]

let regionNames: Intl.DisplayNames | null | undefined

/** Nome do país em português a partir do código ISO, com fallback para o próprio código. */
export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(['pt-PT'], { type: 'region' })
    } catch {
      regionNames = null
    }
  }
  return regionNames?.of(code) ?? code
}
