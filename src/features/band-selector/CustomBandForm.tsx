import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Chip } from '../../components/ui/Chip.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select } from '../../components/ui/Select.tsx'
import type { Band } from '../../domain/band.ts'
import { LIMITS, maxYear } from '../../domain/limits.ts'
import styles from '../profile-editor/ProfileEditor.module.css'
import { COUNTRY_OPTIONS } from './countries.ts'
import type { CustomBandInput } from './selection.ts'

interface CustomBandFormProps {
  /** Banda a editar; sem ela o formulário cria uma nova. */
  band?: Band
  initialName?: string
  subgenreOptions: readonly string[]
  /** Devolve uma mensagem de erro para mostrar, ou undefined em caso de sucesso. */
  onSubmit: (input: CustomBandInput) => string | undefined
  onCancel: () => void
}

export function CustomBandForm({ band, initialName = '', subgenreOptions, onSubmit, onCancel }: CustomBandFormProps) {
  const [name, setName] = useState(band?.name ?? initialName)
  const [country, setCountry] = useState(band?.country ?? '')
  const [year, setYear] = useState(band?.formedYear ? String(band.formedYear) : '')
  const [genres, setGenres] = useState<string[]>(band?.subgenres ?? [])
  const [error, setError] = useState<string>()
  const titleId = useId()

  const toggleGenre = (genre: string) =>
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((g) => g !== genre)
        : current.length < LIMITS.subgenres.max
          ? [...current, genre]
          : current,
    )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsedYear = year.trim() === '' ? undefined : Number(year)
    if (parsedYear !== undefined && !Number.isInteger(parsedYear)) {
      setError('O ano tem de ser um número inteiro.')
      return
    }
    setError(onSubmit({ name, country: country || undefined, formedYear: parsedYear, subgenres: genres }))
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {band ? `Editar “${band.name}”` : 'Nova banda personalizada'}
      </h4>
      <Input
        label="Nome da banda"
        value={name}
        maxLength={LIMITS.bandName.max}
        required
        autoFocus
        onChange={(event) => setName(event.target.value)}
      />
      <div className={styles.row}>
        <Select
          label="País (opcional)"
          options={COUNTRY_OPTIONS}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        />
        <Input
          label="Ano de formação (opcional)"
          type="number"
          inputMode="numeric"
          min={LIMITS.year.min}
          max={maxYear()}
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
      </div>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          Subgéneros{' '}
          <span className={styles.count}>
            {genres.length}/{LIMITS.subgenres.max}
          </span>
        </legend>
        <ul className={styles.chips}>
          {subgenreOptions.map((genre) => (
            <li key={genre}>
              <Chip selected={genres.includes(genre)} onToggle={() => toggleGenre(genre)}>
                {genre}
              </Chip>
            </li>
          ))}
        </ul>
      </fieldset>
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
          {band ? 'Guardar banda' : 'Adicionar banda'}
        </Button>
      </div>
    </form>
  )
}
