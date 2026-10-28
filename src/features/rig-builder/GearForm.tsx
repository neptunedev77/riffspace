import { useId, useState, type FormEvent } from 'react'
import { GearIcon } from '../../components/rig/GearIcon.tsx'
import { GearImage } from '../../components/rig/GearImage.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Chip } from '../../components/ui/Chip.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Textarea } from '../../components/ui/Textarea.tsx'
import { GEAR_TYPES, gearTypeLabel, type GearItem, type GearType } from '../../domain/gear.ts'
import { LIMITS } from '../../domain/limits.ts'
import { useI18n } from '../../i18n/context.ts'
import styles from '../profile-editor/EditorForms.module.css'
import { parseTags, type GearInput } from './rig.ts'

/** Escolha do tipo como fila de chips com ícone: mais rápido do que um select. */
export function GearTypePicker({ value, onChange }: { value: GearType; onChange: (type: GearType) => void }) {
  const { t } = useI18n()
  const labelId = useId()
  return (
    <div className={styles.fieldset}>
      <span id={labelId} className={styles.legend}>
        {t('rig.type')}
      </span>
      <ul className={styles.chips} aria-labelledby={labelId}>
        {GEAR_TYPES.map((type) => (
          <li key={type}>
            <Chip icon={<GearIcon type={type} />} selected={type === value} onToggle={() => onChange(type)}>
              {gearTypeLabel(type)}
            </Chip>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface QuickGearFormProps {
  disabled?: boolean
  onSubmit: (input: GearInput) => string | undefined
}

/**
 * Adicionar uma peça com o essencial: tipo, marca e modelo. Depois de
 * adicionar, os campos limpam-se (o tipo mantém-se) para encadear peças.
 */
export function QuickGearForm({ disabled, onSubmit }: QuickGearFormProps) {
  const { t } = useI18n()
  const [type, setType] = useState<GearType>('guitar')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [error, setError] = useState<string>()
  const titleId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = onSubmit({ type, brand, model, tags: [] })
    setError(result)
    if (!result) {
      setBrand('')
      setModel('')
    }
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {t('rig.addGear')}
      </h4>
      <GearTypePicker value={type} onChange={setType} />
      <div className={styles.quickRow}>
        <Input
          label={t('field.brand')}
          value={brand}
          maxLength={LIMITS.gearBrand.max}
          placeholder={t('rig.brandPlaceholder')}
          disabled={disabled}
          onChange={(event) => setBrand(event.target.value)}
        />
        <Input
          label={t('field.model')}
          value={model}
          maxLength={LIMITS.gearModel.max}
          placeholder={t('rig.modelPlaceholder')}
          disabled={disabled}
          onChange={(event) => setModel(event.target.value)}
        />
        <Button type="submit" variant="primary" disabled={disabled}>
          {t('common.add')}
        </Button>
      </div>
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

interface GearFormProps {
  item: GearItem
  onSubmit: (input: GearInput) => string | undefined
  onCancel: () => void
}

/** Edição de uma peça: o essencial à vista e os extras (nome, notas, etiquetas, imagem) em "mais detalhes". */
export function GearForm({ item, onSubmit, onCancel }: GearFormProps) {
  const [type, setType] = useState<GearType>(item.type)
  const [brand, setBrand] = useState(item.brand)
  const [model, setModel] = useState(item.model)
  const [nickname, setNickname] = useState(item.nickname ?? '')
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [tags, setTags] = useState(item.tags.join(', '))
  const [favorite, setFavorite] = useState(item.favorite ?? false)
  const [error, setError] = useState<string>()
  const titleId = useId()
  const { t } = useI18n()
  const parsedTags = parseTags(tags)
  const hasDetails = Boolean(item.nickname || item.notes || item.imageUrl || item.tags.length > 0)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(onSubmit({ type, brand, model, nickname, imageUrl, notes, tags: parsedTags, favorite }))
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {t('common.editItem', { name: `${item.brand} ${item.model}` })}
      </h4>
      <GearTypePicker value={type} onChange={setType} />
      <div className={styles.row}>
        <Input
          label={t('field.brand')}
          value={brand}
          maxLength={LIMITS.gearBrand.max}
          required
          autoFocus
          onChange={(event) => setBrand(event.target.value)}
        />
        <Input
          label={t('field.model')}
          value={model}
          maxLength={LIMITS.gearModel.max}
          required
          onChange={(event) => setModel(event.target.value)}
        />
      </div>
      <label className={styles.checkbox}>
        <input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />
        {t('rig.favorite')}
      </label>

      <details className={styles.details} open={hasDetails}>
        <summary>{t('rig.moreDetails')}</summary>
        <div className={styles.stack}>
          <Input
            label={t('rig.nickname')}
            value={nickname}
            maxLength={LIMITS.gearNickname.max}
            placeholder={t('rig.nicknamePlaceholder')}
            onChange={(event) => setNickname(event.target.value)}
          />
          <Textarea
            label={t('rig.notes')}
            value={notes}
            maxLength={LIMITS.gearNotes.max}
            rows={3}
            placeholder={t('rig.notesPlaceholder')}
            onChange={(event) => setNotes(event.target.value)}
          />
          <Input
            label={t('rig.tags')}
            value={tags}
            placeholder="Drop C, Boost"
            hint={t('rig.tagsHint', { count: parsedTags.length, max: LIMITS.gearTags.max })}
            onChange={(event) => setTags(event.target.value)}
          />
          <div className={styles.imageField}>
            <GearImage item={{ type, brand, model, imageUrl: imageUrl.trim() || undefined }} size={56} />
            <Input
              label={t('rig.imageUrl')}
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={imageUrl}
              maxLength={LIMITS.url.max}
              hint={t('rig.imageHint')}
              onChange={(event) => setImageUrl(event.target.value)}
            />
          </div>
        </div>
      </details>

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
          {t('rig.saveGear')}
        </Button>
      </div>
    </form>
  )
}
