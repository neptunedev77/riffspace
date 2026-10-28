import { useState } from 'react'
import { commonsImageUrl, type Band } from '../../domain/band.ts'
import { cx } from '../../lib/cx.ts'
import styles from './AlbumCover.module.css'
import { GenerativeArt } from './GenerativeArt.tsx'

interface BandArtProps {
  band: Band
  /** Largura pedida à Commons (a imagem é recortada em quadrado). */
  size?: number
  className?: string
}

/**
 * Imagem da banda: a fotografia livre da Wikimedia Commons quando existe,
 * sobre arte gerada (que aparece enquanto carrega, sem fotografia ou se falhar).
 * Decorativa — o nome está sempre ao lado; o autor e a licença ficam no título.
 */
export function BandArt({ band, size = 160, className }: BandArtProps) {
  const url = band.image ? commonsImageUrl(band.image.file, size) : undefined
  const [failedUrl, setFailedUrl] = useState<string>()
  const credit = band.image && [band.image.author, band.image.license].filter(Boolean).join(' · ')

  return (
    <span className={cx(styles.cover, className)}>
      <GenerativeArt seed={`band:${band.id}`} />
      {url && failedUrl !== url && (
        <img
          src={url}
          alt=""
          title={credit || undefined}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={styles.image}
          onError={() => setFailedUrl(url)}
        />
      )}
    </span>
  )
}
