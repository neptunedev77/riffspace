import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { LIMITS, maxYear } from '../../domain/limits.ts'
import { useI18n } from '../../i18n/context.ts'
import styles from '../profile-editor/EditorForms.module.css'

interface CustomAlbumFormProps {
  bandName: string
  /** Devolve uma mensagem de erro para mostrar, ou undefined em caso de sucesso. */
  onSubmit: (input: { title: string; year?: number }) => string | undefined
  onCancel: () => void
}

/** Álbum escrito à mão para a banda escolhida, quando a lista da MusicBrainz não o tem. */
export function CustomAlbumForm({ bandName, onSubmit, onCancel }: CustomAlbumFormProps) {
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
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
    setError(onSubmit({ title, year: parsedYear }))
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {t('albums.newTitle', { name: bandName })}
      </h4>
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
          {t('albums.addAlbum')}
        </Button>
      </div>
    </form>
  )
}
