import { useState } from 'react'
import type { Album } from '../../domain/album.ts'
import { commonsFilePage, type Band } from '../../domain/band.ts'
import { useI18n } from '../../i18n/context.ts'
import { countryName } from '../../lib/countries.ts'
import { AlbumCover } from '../art/AlbumCover.tsx'
import { BandArt } from '../art/BandArt.tsx'
import styles from './Faces.module.css'

/** Bandas mostradas antes de "mostrar todas" (o ranking completo pode ir até 20). */
export const BANDS_PREVIEW = 10
/** Álbuns mostrados antes de "mostrar todos" (três filas de três). */
export const ALBUMS_PREVIEW = 9

interface MusicFaceProps {
  bands: Band[]
  albums: Album[]
}

/**
 * Face "music": ranking de bandas (com a fotografia livre da Wikimedia Commons,
 * quando existe) e prateleira de álbuns com as capas da Cover Art Archive.
 * Listas longas mostram só o início, com um botão para o resto.
 */
export function MusicFace({ bands, albums }: MusicFaceProps) {
  const { t } = useI18n()
  const [allBands, setAllBands] = useState(false)
  const [allAlbums, setAllAlbums] = useState(false)
  const bandName = (id: string) => bands.find((band) => band.id === id)?.name ?? t('card.unknownBand')
  const bandMeta = (band: Band) =>
    [countryName(band.country), band.formedYear && t('card.since', { date: band.formedYear })].filter(Boolean).join(' · ')

  const shownBands = allBands ? bands : bands.slice(0, BANDS_PREVIEW)
  const shownAlbums = allAlbums ? albums : albums.slice(0, ALBUMS_PREVIEW)
  const credited = bands.filter((band) => band.image)

  return (
    <div className={styles.music}>
      <section aria-labelledby="card-bands-title" className={styles.column}>
        <h3 id="card-bands-title" className={styles.columnTitle}>
          {t('card.favoriteBands')}
        </h3>
        {bands.length === 0 ? (
          <p className={styles.empty}>{t('card.emptyBands')}</p>
        ) : (
          <>
            <ol className={styles.bandList}>
              {shownBands.map((band, index) => (
                <li key={band.id} className={index === 0 ? styles.bandTop : styles.band}>
                  <span className={styles.bandRank} aria-label={t('card.rank', { rank: index + 1 })}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <BandArt band={band} size={index === 0 ? 160 : 96} className={styles.bandArt} />
                  <span className={styles.bandText}>
                    <h4 className={styles.bandName}>{band.name}</h4>
                    <span className={styles.bandMeta}>
                      {bandMeta(band) || band.subgenres[0] || t('card.customBand')}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            {bands.length > BANDS_PREVIEW && (
              <button type="button" className={styles.more} onClick={() => setAllBands((v) => !v)}>
                {allBands ? t('card.showLess') : t('card.showAllBands', { count: bands.length })}
              </button>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="card-albums-title" className={styles.column}>
        <h3 id="card-albums-title" className={styles.columnTitle}>
          {t('card.favoriteAlbums')}
        </h3>
        {albums.length === 0 ? (
          <p className={styles.empty}>{t('card.emptyAlbums')}</p>
        ) : (
          <>
            <ul className={styles.shelf}>
              {shownAlbums.map((album) => (
                <li key={album.id}>
                  <figure className={styles.album}>
                    <div className={styles.sleeve}>
                      <span className={styles.vinyl} aria-hidden="true" />
                      <AlbumCover album={album} className={styles.cover} />
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
            {albums.length > ALBUMS_PREVIEW && (
              <button type="button" className={styles.more} onClick={() => setAllAlbums((v) => !v)}>
                {allAlbums ? t('card.showLess') : t('card.showAllAlbums', { count: albums.length })}
              </button>
            )}
          </>
        )}
      </section>

      {credited.length > 0 && (
        <details className={styles.credits}>
          <summary>{t('card.photoCredits')}</summary>
          <ul>
            {credited.map((band) => (
              <li key={band.id}>
                <a href={commonsFilePage(band.image!.file)} target="_blank" rel="noopener noreferrer">
                  {band.name}
                </a>
                {' — '}
                {[band.image!.author, band.image!.license].filter(Boolean).join(' · ')}
              </li>
            ))}
          </ul>
          <p>{t('card.photoSource')}</p>
        </details>
      )}
    </div>
  )
}
