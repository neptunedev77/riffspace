import type { Profile } from '../../domain/profile.ts'
import { parseProfile } from '../../lib/validation/parse.ts'

export const EDITOR_TABS = ['perfil', 'bandas', 'albuns', 'generos'] as const
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

/** Separador onde cada campo é editado, para mostrar contadores de erros e saltar para o primeiro. */
export function tabForPath(path: string): EditorTab {
  const root = path.split('.')[0] ?? ''
  if (root === 'favoriteBandIds' || root === 'customBands') return 'bandas'
  if (root === 'favoriteAlbumIds' || root === 'customAlbums') return 'albuns'
  if (root === 'subgenres') return 'generos'
  return 'perfil'
}

export function countByTab(issues: IssueMap): Record<EditorTab, number> {
  const counts: Record<EditorTab, number> = { perfil: 0, bandas: 0, albuns: 0, generos: 0 }
  for (const path of issues.keys()) counts[tabForPath(path)] += 1
  return counts
}
