import type { Profile } from '../../domain/profile.ts'
import { parseProfile } from '../../lib/validation/parse.ts'

export const EDITOR_TABS = [
  'profile',
  'appearance',
  'track',
  'socials',
  'bands',
  'albums',
  'genres',
  'rig',
  'settings',
] as const
export type EditorTab = (typeof EDITOR_TABS)[number]

/** Primeira mensagem de erro por caminho de campo ("nickname", "avatar.url", …). */
export type IssueMap = ReadonlyMap<string, string>

export function issuesForDraft(draft: Profile): IssueMap {
  const result = parseProfile(draft)
  const map = new Map<string, string>()
  if (!result.ok) {
    for (const issue of result.issues) {
      if (!map.has(issue.path)) map.set(issue.path, issue.message)
    }
  }
  return map
}

/** Secção onde cada campo é editado, para mostrar contadores de erros e saltar para o primeiro. */
export function tabForPath(path: string): EditorTab {
  const root = path.split('.')[0] ?? ''
  if (root === 'favoriteBandIds' || root === 'customBands') return 'bands'
  if (root === 'favoriteAlbumIds' || root === 'customAlbums') return 'albums'
  if (root === 'subgenres') return 'genres'
  if (root === 'rig') return 'rig'
  if (root === 'socials') return 'socials'
  if (root === 'featuredTrack') return 'track'
  if (root === 'theme') return 'appearance'
  return 'profile'
}

export function countByTab(issues: IssueMap): Record<EditorTab, number> {
  const counts = Object.fromEntries(EDITOR_TABS.map((tab) => [tab, 0])) as Record<EditorTab, number>
  for (const path of issues.keys()) counts[tabForPath(path)] += 1
  return counts
}
