import { Info, Star } from 'lucide-react'
import { useState } from 'react'
import {
  buildSignalChain,
  gearDisplayName,
  gearTypeLabel,
  gearTypeShortLabel,
  isChainGear,
  type GearItem,
} from '../../domain/gear.ts'
import { useI18n } from '../../i18n/context.ts'
import { cx } from '../../lib/cx.ts'
import { GearIcon } from '../rig/GearIcon.tsx'
import { GearImage } from '../rig/GearImage.tsx'
import { Chip } from '../ui/Chip.tsx'
import styles from './RigFace.module.css'

const DETAIL_ID = 'rig-detail'

function GearDetail({ item, position, total }: { item: GearItem; position: number; total: number }) {
  const { t } = useI18n()
  return (
    <div className={styles.detailBody}>
      <GearImage item={item} size={item.imageUrl ? 88 : 56} />
      <div className={styles.detailText}>
        <p className={styles.detailType}>
          {t('rigFace.position', { type: gearTypeLabel(item.type), position, total })}
        </p>
        <h3 className={styles.detailName}>
          {gearDisplayName(item)}
          {item.favorite && <Star className={styles.favorite} aria-label={t('rigFace.favorite')} role="img" />}
        </h3>
        {item.nickname && <p className={styles.detailNickname}>“{item.nickname}”</p>}
        {item.notes && <p className={styles.detailNotes}>{item.notes}</p>}
        {item.tags.length > 0 && (
          <ul className={styles.tags} aria-label={t('rigFace.tags')}>
            {item.tags.map((tag) => (
              <li key={tag}>
                <Chip>{tag}</Chip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Face "rig" do card: cadeia de sinal interativa, detalhe da peça e equipamento fora da cadeia. */
export function RigFace({ rig }: { rig: GearItem[] }) {
  const { t } = useI18n()
  const chain = buildSignalChain(rig)
  const offChain = rig.filter((item) => !isChainGear(item))
  const [selectedId, setSelectedId] = useState<string | undefined>(chain[0]?.id)
  // Se a peça selecionada deixar de existir, volta à primeira da cadeia.
  const foundIndex = chain.findIndex((item) => item.id === selectedId)
  const selectedIndex = foundIndex >= 0 ? foundIndex : 0
  const selected = chain[selectedIndex]

  if (rig.length === 0) {
    return <p className={styles.empty}>{t('rigFace.empty')}</p>
  }

  return (
    <div className={styles.face}>
      {chain.length === 0 ? (
        <p className={styles.empty}>{t('rigFace.emptyChain')}</p>
      ) : (
        <>
          <ol className={styles.chain} aria-label={t('rigFace.chain')}>
            {chain.map((item, index) => {
              const isSelected = item.id === selected?.id
              return (
                <li key={item.id} className={styles.node}>
                  <button
                    type="button"
                    className={cx(styles.nodeButton, isSelected && styles.nodeSelected)}
                    aria-pressed={isSelected}
                    aria-controls={DETAIL_ID}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className={styles.nodeIcon}>
                      <GearIcon type={item.type} />
                    </span>
                    <span className={styles.nodeType}>
                      {String(index + 1).padStart(2, '0')} · {gearTypeShortLabel(item.type)}
                    </span>
                    <span className={styles.nodeName}>{gearDisplayName(item)}</span>
                  </button>
                </li>
              )
            })}
          </ol>

          <div id={DETAIL_ID} className={styles.detail} aria-live="polite">
            {selected && <GearDetail item={selected} position={selectedIndex + 1} total={chain.length} />}
          </div>
        </>
      )}

      {offChain.length > 0 && (
        <div className={styles.offChain}>
          <h3 className={styles.offChainTitle}>{t('rigFace.offChain')}</h3>
          <ul className={styles.offChainList}>
            {offChain.map((item) => (
              <li key={item.id} className={styles.offChainItem}>
                <GearImage item={item} size={36} />
                <span className={styles.offChainText}>
                  <span className={styles.offChainName}>{gearDisplayName(item)}</span>
                  <span className={styles.offChainType}>{gearTypeLabel(item.type)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={styles.disclaimer}>
        <Info aria-hidden="true" />
        {t('rigFace.disclaimer')}
      </p>
    </div>
  )
}
