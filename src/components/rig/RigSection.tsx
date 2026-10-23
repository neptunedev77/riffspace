import { Info, Star } from 'lucide-react'
import { useState } from 'react'
import { buildSignalChain, GEAR_TYPE_LABELS, gearDisplayName, isChainGear, type GearItem } from '../../domain/gear.ts'
import { cx } from '../../lib/cx.ts'
import { Badge } from '../ui/Badge.tsx'
import { Chip } from '../ui/Chip.tsx'
import { SectionHeader } from '../ui/SectionHeader.tsx'
import { Surface } from '../ui/Surface.tsx'
import { GearIcon } from './GearIcon.tsx'
import styles from './RigSection.module.css'

interface RigSectionProps {
  rig: GearItem[]
}

const DETAIL_ID = 'rig-detail'

function GearDetail({ item, position, total }: { item: GearItem; position?: number; total?: number }) {
  return (
    <div className={styles.detailBody}>
      <div className={styles.detailIcon}>
        <GearIcon type={item.type} />
      </div>
      <div className={styles.detailText}>
        <p className={styles.detailType}>
          {GEAR_TYPE_LABELS[item.type]}
          {position !== undefined && total !== undefined && (
            <span>
              {' '}
              · posição {position} de {total} na cadeia
            </span>
          )}
        </p>
        <h3 className={styles.detailName}>
          {gearDisplayName(item)}
          {item.favorite && (
            <Star className={styles.favorite} aria-label="Favorito" role="img" />
          )}
        </h3>
        {item.nickname && <p className={styles.detailNickname}>“{item.nickname}”</p>}
        {item.notes && <p className={styles.detailNotes}>{item.notes}</p>}
        {item.tags.length > 0 && (
          <ul className={styles.tags} aria-label="Etiquetas">
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

export function RigSection({ rig }: RigSectionProps) {
  const chain = buildSignalChain(rig)
  const offChain = rig.filter((item) => !isChainGear(item))
  const [selectedId, setSelectedId] = useState<string | undefined>(chain[0]?.id)
  const selectedIndex = chain.findIndex((item) => item.id === selectedId)
  const selected = chain[selectedIndex]

  return (
    <section id="rig" className={styles.section} aria-labelledby="rig-title">
      <SectionHeader
        index="03"
        eyebrow="Equipamento"
        title="A rig"
        headingId="rig-title"
        description="O caminho do sinal, da guitarra ao cabinet. Seleciona uma peça para ver os detalhes."
        aside={<Badge tone="accent">{rig.length} peças</Badge>}
      />

      {chain.length === 0 ? (
        <p className={styles.empty}>Ainda não há equipamento na cadeia de sinal.</p>
      ) : (
        <Surface level={1} className={styles.chainPanel}>
          <ol className={styles.chain} aria-label="Cadeia de sinal">
            {chain.map((item, index) => {
              const isSelected = item.id === selectedId
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
                      {String(index + 1).padStart(2, '0')} · {GEAR_TYPE_LABELS[item.type]}
                    </span>
                    <span className={styles.nodeName}>{gearDisplayName(item)}</span>
                    {item.nickname && <span className={styles.nodeNickname}>{item.nickname}</span>}
                  </button>
                </li>
              )
            })}
          </ol>

          <div id={DETAIL_ID} className={styles.detail} aria-live="polite">
            {selected && <GearDetail item={selected} position={selectedIndex + 1} total={chain.length} />}
          </div>
        </Surface>
      )}

      <p className={styles.disclaimer}>
        <Info aria-hidden="true" />
        Representação visual da ordem escolhida. Não valida compatibilidade elétrica nem de áudio.
      </p>

      {offChain.length > 0 && (
        <div className={styles.offChain}>
          <h3 className={styles.offChainTitle}>Também na rig</h3>
          <ul className={styles.offChainList}>
            {offChain.map((item) => (
              <Surface as="li" level={1} key={item.id} className={styles.offChainItem}>
                <GearDetail item={item} />
              </Surface>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
