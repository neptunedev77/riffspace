import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Chip } from '../../components/ui/Chip.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { DEMO_SUBGENRES } from '../../data/demo-bands.ts'
import { LIMITS } from '../../domain/limits.ts'
import { allBands } from '../../domain/profile.ts'
import { DEMO_CATALOG } from '../../state/createAppStore.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/EditorForms.module.css'
import { collectSubgenres, normalizeSearch } from './search.ts'
import { toggleSubgenre } from './selection.ts'
import { useI18n } from '../../i18n/context.ts'

export function GenresTab({ draft, update }: TabProps) {
  const { t } = useI18n()
  const [custom, setCustom] = useState('')
  const [error, setError] = useState<string>()

  const options = useMemo(
    () =>
      collectSubgenres(
        DEMO_SUBGENRES,
        draft.subgenres,
        ...allBands(draft, DEMO_CATALOG.bands).map((band) => band.subgenres),
      ),
    [draft],
  )
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
