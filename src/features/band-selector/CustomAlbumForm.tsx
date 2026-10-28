import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select, type SelectOption } from '../../components/ui/Select.tsx'
import type { Album } from '../../domain/album.ts'
import { LIMITS, maxYear } from '../../domain/limits.ts'
import styles from '../profile-editor/EditorForms.module.css'
import type { CustomAlbumInput } from './selection.ts'
import { useI18n } from '../../i18n/context.ts'

interface CustomAlbumFormProps {
  album?: Album
  bandOptions: readonly SelectOption[]
  initialBandId?: string
  onSubmit: (input: CustomAlbumInput) => string | undefined
  onCancel: () => void
}

export function CustomAlbumForm({ album, bandOptions, initialBandId, onSubmit, onCancel }: CustomAlbumFormProps) {
  const [bandId, setBandId] = useState(album?.bandId ?? initialBandId ?? bandOptions[0]?.value ?? '')
  const [title, setTitle] = useState(album?.title ?? '')
  const [year, setYear] = useState(album?.year ? String(album.year) : '')
  const [error, setError] = useState<string>()
  const titleId = useId()
  const { t } = useI18n()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsedYear = year.trim() === '' ? undefined : Number(year)
    if (parsedYear !== undefined && !Number.isInteger(parsedYear)) {
      setError(t('validation.yearInteger'))
      return
    }
    setError(onSubmit({ bandId, title, year: parsedYear }))
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {album ? t('albums.editTitle', { title: album.title }) : t('albums.newTitle')}
      </h4>
      <Select label={t('albums.band')} options={bandOptions} value={bandId} onChange={(event) => setBandId(event.target.value)} />
      <div className={styles.row}>
        <Input
          label={t('albums.title')}
          value={title}
          maxLength={LIMITS.albumTitle.max}
          required
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label={t('albums.year')}
          type="number"
          inputMode="numeric"
          min={LIMITS.year.min}
          max={maxYear()}
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
      </div>
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
      <div className={styles.subformActions}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" size="sm">
          {album ? t('albums.saveAlbum') : t('albums.addAlbum')}
        </Button>
      </div>
    </form>
  )
}
