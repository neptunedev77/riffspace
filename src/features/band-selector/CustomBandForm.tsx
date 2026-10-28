import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select } from '../../components/ui/Select.tsx'
import type { Band } from '../../domain/band.ts'
import { LIMITS, maxYear } from '../../domain/limits.ts'
import { useI18n } from '../../i18n/context.ts'
import styles from '../profile-editor/EditorForms.module.css'
import { countryOptions } from './countries.ts'
import type { CustomBandInput } from './selection.ts'

interface CustomBandFormProps {
  /** Banda a editar; sem ela o formulário cria uma nova. */
  band?: Band
  initialName?: string
  /** Devolve uma mensagem de erro para mostrar, ou undefined em caso de sucesso. */
  onSubmit: (input: CustomBandInput) => string | undefined
  onCancel: () => void
}

/** Banda escrita à mão, para quando a pesquisa não a encontra ou não está disponível. */
export function CustomBandForm({ band, initialName = '', onSubmit, onCancel }: CustomBandFormProps) {
  const [name, setName] = useState(band?.name ?? initialName)
  const [country, setCountry] = useState(band?.country ?? '')
  const [year, setYear] = useState(band?.formedYear ? String(band.formedYear) : '')
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
    setError(onSubmit({ name, country: country || undefined, formedYear: parsedYear }))
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {band ? t('bands.editTitle', { name: band.name }) : t('bands.newTitle')}
      </h4>
      <Input
        label={t('field.bandName')}
        value={name}
        maxLength={LIMITS.bandName.max}
        required
        autoFocus
        onChange={(event) => setName(event.target.value)}
      />
      <div className={styles.row}>
        <Select
          label={t('bands.country')}
          options={countryOptions()}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        />
        <Input
          label={t('bands.formedYear')}
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
          {band ? t('bands.saveBand') : t('bands.addBand')}
        </Button>
      </div>
    </form>
  )
}
