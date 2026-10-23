import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select, type SelectOption } from '../../components/ui/Select.tsx'
import type { Album } from '../../domain/album.ts'
import { LIMITS, maxYear } from '../../domain/limits.ts'
import styles from '../profile-editor/ProfileEditor.module.css'
import type { CustomAlbumInput } from './selection.ts'

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

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsedYear = year.trim() === '' ? undefined : Number(year)
    if (parsedYear !== undefined && !Number.isInteger(parsedYear)) {
      setError('O ano tem de ser um número inteiro.')
      return
    }
    setError(onSubmit({ bandId, title, year: parsedYear }))
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {album ? `Editar “${album.title}”` : 'Novo álbum personalizado'}
      </h4>
      <Select label="Banda" options={bandOptions} value={bandId} onChange={(event) => setBandId(event.target.value)} />
      <div className={styles.row}>
        <Input
          label="Título"
          value={title}
          maxLength={LIMITS.albumTitle.max}
          required
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label="Ano (opcional)"
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
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm">
          {album ? 'Guardar álbum' : 'Adicionar álbum'}
        </Button>
      </div>
    </form>
  )
}
