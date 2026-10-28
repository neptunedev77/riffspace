import { useId, useState, type FormEvent } from 'react'
import { GearImage } from '../../components/rig/GearImage.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select } from '../../components/ui/Select.tsx'
import { Textarea } from '../../components/ui/Textarea.tsx'
import { GEAR_TYPES, gearTypeLabel, type GearItem, type GearType } from '../../domain/gear.ts'
import { LIMITS } from '../../domain/limits.ts'
import styles from '../profile-editor/EditorForms.module.css'
import { parseTags, type GearInput } from './rig.ts'
import { useI18n } from '../../i18n/context.ts'

interface GearFormProps {
  /** Peça a editar; sem ela o formulário cria uma nova. */
  item?: GearItem
  onSubmit: (input: GearInput) => string | undefined
  onCancel: () => void
}


export function GearForm({ item, onSubmit, onCancel }: GearFormProps) {
  const [type, setType] = useState<GearType>(item?.type ?? 'pedal')
  const [brand, setBrand] = useState(item?.brand ?? '')
  const [model, setModel] = useState(item?.model ?? '')
  const [nickname, setNickname] = useState(item?.nickname ?? '')
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [tags, setTags] = useState(item?.tags.join(', ') ?? '')
  const [favorite, setFavorite] = useState(item?.favorite ?? false)
  const [error, setError] = useState<string>()
  const titleId = useId()
  const { t } = useI18n()
  const typeOptions = GEAR_TYPES.map((value) => ({ value, label: gearTypeLabel(value) }))

  const parsedTags = parseTags(tags)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(onSubmit({ type, brand, model, nickname, imageUrl, notes, tags: parsedTags, favorite }))
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {item ? t('common.editItem', { name: `${item.brand} ${item.model}` }) : t('rig.newGear')}
      </h4>
      <Select
        label={t('rig.type')}
        options={typeOptions}
        value={type}
        hint={
          type === 'interface' || type === 'other'
            ? t('rig.typeHintOff')
            : t('rig.typeHintChain')
        }
        onChange={(event) => setType(event.target.value as GearType)}
      />
      <div className={styles.row}>
        <Input
          label={t('field.brand')}
          value={brand}
          maxLength={LIMITS.gearBrand.max}
          required
          autoFocus
          placeholder={t('rig.brandPlaceholder')}
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
      <label className={styles.checkbox}>
        <input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />
        {t('rig.favorite')}
      </label>
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
          {item ? t('rig.saveGear') : t('rig.addGear')}
        </Button>
      </div>
    </form>
  )
}
