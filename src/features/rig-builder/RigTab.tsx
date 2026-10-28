import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { GearImage } from '../../components/rig/GearImage.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { gearDisplayName, gearTypeLabel, type GearItem } from '../../domain/gear.ts'
import { LIMITS } from '../../domain/limits.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/EditorForms.module.css'
import { useFocusOnClose } from '../profile-editor/useFocusOnClose.ts'
import { GearForm } from './GearForm.tsx'
import { addGear, groupRig, moveGear, removeGear, rigGroup, rigGroupLabel, updateGear } from './rig.ts'
import { useI18n } from '../../i18n/context.ts'

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; item: GearItem }

export function RigTab({ draft, update }: TabProps) {
  const { t } = useI18n()
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [feedback, setFeedback] = useState('')
  const groups = groupRig(draft.rig)
  const full = draft.rig.length >= LIMITS.rig.max
  const addRef = useFocusOnClose(form.mode !== 'closed')

  const move = (item: GearItem, delta: -1 | 1) => {
    const next = moveGear(draft, item.id, delta)
    if (next === draft) return
    update(() => next)
    const name = gearDisplayName(item)
    setFeedback(t(delta < 0 ? 'rig.movedUp' : 'rig.movedDown', { name }))
  }

  return (
    <div className={styles.stack}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {feedback}
      </p>

      <div className={styles.blockHeader}>
        <p className={styles.note}>
          {t('rig.count')}{' '}
          <span className={styles.count}>
            {draft.rig.length}/{LIMITS.rig.max}
          </span>
        </p>
        {form.mode === 'closed' && (
          <Button ref={addRef} size="sm" icon={<Plus />} disabled={full} onClick={() => setForm({ mode: 'create' })}>
            {t('rig.addGear')}
          </Button>
        )}
      </div>
      <p className={styles.note}>{t('rig.intro')}</p>
      {full && form.mode === 'closed' && (
        <p className={styles.formError}>{t('rig.full', { max: LIMITS.rig.max })}</p>
      )}

      {form.mode !== 'closed' && (
        <GearForm
          key={form.mode === 'edit' ? form.item.id : 'new'}
          item={form.mode === 'edit' ? form.item : undefined}
          onCancel={() => setForm({ mode: 'closed' })}
          onSubmit={(input) => {
            const result = form.mode === 'edit' ? updateGear(draft, form.item.id, input) : addGear(draft, input)
            if (!result.ok) return result.error
            update(() => result.profile)
            setForm({ mode: 'closed' })
            setFeedback(
              form.mode === 'edit'
                ? t('rig.updated', { name: gearDisplayName(result.value) })
                : t('rig.added', { name: gearDisplayName(result.value), group: rigGroupLabel(rigGroup(result.value)) }),
            )
            return undefined
          }}
        />
      )}

      {groups.length === 0 ? (
        form.mode === 'closed' && (
          <p className={styles.empty}>{t('rig.empty')}</p>
        )
      ) : (
        groups.map(({ group, items }) => (
          <section key={group} className={styles.block} aria-labelledby={`rig-group-${group}`}>
            <h3 id={`rig-group-${group}`} className={styles.blockTitle}>
              {rigGroupLabel(group)} <span className={styles.count}>{items.length}</span>
            </h3>
            <ol className={styles.rankList}>
              {items.map((item, index) => {
                const name = gearDisplayName(item)
                return (
                  <li key={item.id} className={styles.gearItem}>
                    <GearImage item={item} size={40} />
                    <span className={styles.resultText}>
                      <span className={styles.resultName}>
                        {name}
                        {item.favorite && <Star className={styles.favoriteIcon} aria-label={t('rigFace.favorite')} role="img" />}
                      </span>
                      <span className={styles.resultMeta}>
                        {[gearTypeLabel(item.type), item.nickname && `“${item.nickname}”`].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className={styles.rankActions}>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<ArrowUp />}
                        aria-label={t('common.moveUp', { name })}
                        disabled={index === 0}
                        onClick={() => move(item, -1)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<ArrowDown />}
                        aria-label={t('common.moveDown', { name })}
                        disabled={index === items.length - 1}
                        onClick={() => move(item, 1)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Pencil />}
                        aria-label={t('common.editItem', { name })}
                        onClick={() => setForm({ mode: 'edit', item })}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 />}
                        aria-label={t('common.removeItem', { name })}
                        onClick={() => {
                          update((d) => removeGear(d, item.id))
                          if (form.mode === 'edit' && form.item.id === item.id) setForm({ mode: 'closed' })
                          setFeedback(t('rig.removed', { name }))
                        }}
                      />
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>
        ))
      )}
    </div>
  )
}
