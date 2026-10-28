/**
 * Catálogo local da versão 2 do schema, congelado. Já não é usado pela UI:
 * existe só para a migração v2 → v3 converter os IDs do antigo catálogo em
 * bandas e álbuns guardados no próprio perfil. Não alterar.
 */
export interface LegacyBand {
  id: string
  name: string
  country?: string
  formedYear?: number
  subgenres: string[]
  isCustom: boolean
}

export interface LegacyAlbum {
  id: string
  bandId: string
  title: string
  year?: number
}

export const LEGACY_BANDS: readonly LegacyBand[] = [
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

export const LEGACY_ALBUMS: readonly LegacyAlbum[] = [
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
