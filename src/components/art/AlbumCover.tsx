import { useState } from 'react'
import { albumCoverUrl, type Album } from '../../domain/album.ts'
import { cx } from '../../lib/cx.ts'
import { GenerativeArt } from './GenerativeArt.tsx'
import styles from './AlbumCover.module.css'

interface AlbumCoverProps {
  album: Album
  size?: 250 | 500
  className?: string
}

/**
 * Capa do álbum: a imagem da Cover Art Archive quando existe, carregada só
 * quando fica visível; se não houver capa (ou falhar), arte gerada original.
 * Decorativa — o título está sempre ao lado em texto.
 */
export function AlbumCover({ album, size = 250, className }: AlbumCoverProps) {
  const url = albumCoverUrl(album, size)
  // Guarda-se o URL que falhou (e não um booleano) para recuperar sozinho se o álbum mudar.
  const [failedUrl, setFailedUrl] = useState<string>()
  const showImage = url !== undefined && failedUrl !== url

  return (
    <span className={cx(styles.cover, className)}>
      <GenerativeArt seed={`album:${album.id}`} />
      {showImage && (
        <img
          src={url}
          alt=""
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
