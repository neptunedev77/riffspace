import { useState } from 'react'
import type { GearItem } from '../../domain/gear.ts'
import { gearDisplayName } from '../../domain/gear.ts'
import { cx } from '../../lib/cx.ts'
import { GearIcon } from './GearIcon.tsx'
import styles from './GearImage.module.css'

interface GearImageProps {
  item: Pick<GearItem, 'type' | 'brand' | 'model' | 'imageUrl'>
  /** Tamanho da caixa em px; a caixa é sempre quadrada e reservada (sem layout shift). */
  size?: number
  className?: string
}

/**
 * Imagem do equipamento numa caixa de tamanho fixo. Sem imagem, ou se o URL
 * falhar, mostra o ícone do tipo — o mesmo placeholder em todo o lado.
 */
export function GearImage({ item, size = 64, className }: GearImageProps) {
  return (
    <span className={cx(styles.box, className)} style={{ width: size, height: size }}>
      {item.imageUrl ? (
        <LoadedImage key={item.imageUrl} item={item} size={size} />
      ) : (
        <GearIcon type={item.type} className={styles.icon} />
      )}
    </span>
  )
}

function LoadedImage({ item, size }: { item: GearImageProps['item']; size: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <GearIcon type={item.type} className={styles.icon} />
  return (
    <img
      src={item.imageUrl}
      alt={gearDisplayName(item)}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={styles.image}
      onError={() => setFailed(true)}
    />
  )
}
