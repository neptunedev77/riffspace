import { countryName } from '../../data/demo-bands.ts'
import type { Album } from '../../domain/album.ts'
import type { Band } from '../../domain/band.ts'
import { useI18n } from '../../i18n/context.ts'
import { GenerativeArt } from '../art/GenerativeArt.tsx'
import styles from './Faces.module.css'

interface MusicFaceProps {
  bands: Band[]
  albums: Album[]
  /** Todas as bandas conhecidas (catálogo + personalizadas), para o nome da banda de cada álbum. */
  allBands: Band[]
}

/** Face "music": ranking de bandas e prateleira de álbuns, com arte abstrata original. */
export function MusicFace({ bands, albums, allBands }: MusicFaceProps) {
  const { t } = useI18n()
  const bandName = (id: string) => allBands.find((band) => band.id === id)?.name ?? t('card.unknownBand')
  const bandMeta = (band: Band) =>
    [countryName(band.country), band.formedYear && t('card.since', { date: band.formedYear })].filter(Boolean).join(' · ')

  return (
    <div className={styles.music}>
      <section aria-labelledby="card-bands-title" className={styles.column}>
        <h3 id="card-bands-title" className={styles.columnTitle}>
          {t('card.favoriteBands')}
        </h3>
        {bands.length === 0 ? (
          <p className={styles.empty}>{t('card.emptyBands')}</p>
        ) : (
          <ol className={styles.bandList}>
            {bands.map((band, index) => (
              <li key={band.id} className={index === 0 ? styles.bandTop : styles.band}>
                <span className={styles.bandRank} aria-label={t('card.rank', { rank: index + 1 })}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.bandArt}>
                  <GenerativeArt seed={`band:${band.id}`} />
                </span>
                <span className={styles.bandText}>
                  <h4 className={styles.bandName}>{band.name}</h4>
                  <span className={styles.bandMeta}>{bandMeta(band) || t('card.customBand')}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="card-albums-title" className={styles.column}>
        <h3 id="card-albums-title" className={styles.columnTitle}>
          {t('card.favoriteAlbums')}
        </h3>
        {albums.length === 0 ? (
          <p className={styles.empty}>{t('card.emptyAlbums')}</p>
        ) : (
          <ul className={styles.shelf}>
            {albums.map((album) => (
              <li key={album.id}>
                <figure className={styles.album}>
                  <div className={styles.sleeve}>
                    <span className={styles.vinyl} aria-hidden="true" />
                    <div className={styles.cover}>
                      <GenerativeArt seed={`album:${album.id}`} />
                    </div>
                  </div>
                  <figcaption className={styles.albumCaption}>
                    <span className={styles.albumTitle}>{album.title}</span>
                    <span className={styles.albumMeta}>
                      {bandName(album.bandId)}
                      {album.year && ` · ${album.year}`}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
