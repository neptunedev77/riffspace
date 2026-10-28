import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Chip } from '../../components/ui/Chip.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { COMMON_SUBGENRES } from '../../data/subgenres.ts'
import { LIMITS } from '../../domain/limits.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/EditorForms.module.css'
import { normalizeSearch } from './search.ts'
import { suggestSubgenres, toggleSubgenre } from './selection.ts'
import { useI18n } from '../../i18n/context.ts'

/** Subgéneros do perfil: sugeridos a partir dos géneros das bandas escolhidas, ou escritos à mão. */
export function GenresTab({ draft, update }: TabProps) {
  const { t } = useI18n()
  const [custom, setCustom] = useState('')
  const [error, setError] = useState<string>()

  // Sugestões das bandas e comuns, seguidas dos escolhidos que não são sugestão (ordem estável ao alternar).
  const options = useMemo(() => {
    const suggestions = suggestSubgenres(draft, COMMON_SUBGENRES)
    const suggested = new Set(suggestions.map(normalizeSearch))
    return [...suggestions, ...draft.subgenres.filter((genre) => !suggested.has(normalizeSearch(genre)))]
  }, [draft])
  const isSelected = (genre: string) => draft.subgenres.some((g) => normalizeSearch(g) === normalizeSearch(genre))

  const toggle = (genre: string): boolean => {
    const result = toggleSubgenre(draft, genre)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setError(undefined)
    update(() => result.profile)
    return true
  }

  const addCustom = (event: FormEvent) => {
    event.preventDefault()
    if (!custom.trim()) return setError(t('genres.errorEmpty'))
    if (isSelected(custom)) return setError(t('genres.errorDuplicate'))
    if (toggle(custom)) setCustom('')
  }

  return (
    <div className={styles.stack}>
      <p className={styles.note}>
        {t('genres.intro')}{' '}
        <span className={styles.count}>
          {draft.subgenres.length}/{LIMITS.subgenres.max}
        </span>
      </p>
      <ul className={styles.chips} aria-label={t('genres.list')}>
        {options.map((genre) => (
          <li key={genre}>
            <Chip selected={isSelected(genre)} onToggle={() => toggle(genre)}>
              {genre}
            </Chip>
          </li>
        ))}
      </ul>
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
      <form className={styles.inlineForm} onSubmit={addCustom} noValidate>
        <Input
          label={t('genres.other')}
          placeholder={t('genres.otherPlaceholder')}
          value={custom}
          maxLength={LIMITS.subgenre.max}
          onChange={(event) => setCustom(event.target.value)}
        />
        <Button type="submit" size="md" icon={<Plus />}>
          {t('common.add')}
        </Button>
      </form>
    </div>
  )
}
