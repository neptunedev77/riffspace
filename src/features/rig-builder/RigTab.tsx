import { ArrowDown, ArrowUp, Pencil, Star, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { GearImage } from '../../components/rig/GearImage.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { gearDisplayName, gearTypeLabel, type GearItem } from '../../domain/gear.ts'
import { LIMITS } from '../../domain/limits.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/EditorForms.module.css'
import { GearForm, QuickGearForm } from './GearForm.tsx'
import { addGear, groupRig, moveGear, removeGear, rigGroup, rigGroupLabel, updateGear } from './rig.ts'
import { useI18n } from '../../i18n/context.ts'

/**
 * Rig: adicionar é uma linha (tipo, marca, modelo); a lista mostra a cadeia
 * por estágios e cada peça edita-se no sítio, com os extras em "mais detalhes".
 */
export function RigTab({ draft, update }: TabProps) {
  const { t } = useI18n()
  const [editingId, setEditingId] = useState<string>()
  const lastEditedId = useRef<string>(undefined)

  // Ao fechar a edição inline, o foco volta ao botão "edit" dessa peça (o formulário desaparece).
  useEffect(() => {
    if (editingId) {
      lastEditedId.current = editingId
      return
    }
    const id = lastEditedId.current
    lastEditedId.current = undefined
    if (id) document.querySelector<HTMLButtonElement>(`[data-edit-gear="${id}"]`)?.focus()
  }, [editingId])
  const [feedback, setFeedback] = useState('')
  const groups = groupRig(draft.rig)
  const full = draft.rig.length >= LIMITS.rig.max

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

      <QuickGearForm
        disabled={full}
        onSubmit={(input) => {
          const result = addGear(draft, input)
          if (!result.ok) return result.error
          update(() => result.profile)
          setFeedback(
            t('rig.added', { name: gearDisplayName(result.value), group: rigGroupLabel(rigGroup(result.value)) }),
          )
          return undefined
        }}
      />
      {full && <p className={styles.formError}>{t('rig.full', { max: LIMITS.rig.max })}</p>}

      <p className={styles.note}>
        {t('rig.intro')}{' '}
        <span className={styles.count}>
          {draft.rig.length}/{LIMITS.rig.max}
        </span>
      </p>

      {groups.length === 0 ? (
        <p className={styles.empty}>{t('rig.empty')}</p>
      ) : (
        groups.map(({ group, items }) => (
          <section key={group} className={styles.block} aria-labelledby={`rig-group-${group}`}>
            <h3 id={`rig-group-${group}`} className={styles.blockTitle}>
              {rigGroupLabel(group)} <span className={styles.count}>{items.length}</span>
            </h3>
            <ol className={styles.rankList}>
              {items.map((item, index) => {
                const name = gearDisplayName(item)
                if (item.id === editingId) {
                  return (
                    <li key={item.id}>
                      <GearForm
                        item={item}
                        onCancel={() => setEditingId(undefined)}
                        onSubmit={(input) => {
                          const result = updateGear(draft, item.id, input)
                          if (!result.ok) return result.error
                          update(() => result.profile)
                          setEditingId(undefined)
                          setFeedback(t('rig.updated', { name: gearDisplayName(result.value) }))
                          return undefined
                        }}
                      />
                    </li>
                  )
                }
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
                        data-edit-gear={item.id}
                        aria-label={t('common.editItem', { name })}
                        onClick={() => setEditingId(item.id)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 />}
                        aria-label={t('common.removeItem', { name })}
                        onClick={() => {
                          update((d) => removeGear(d, item.id))
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
