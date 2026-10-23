import { countryName } from '../../data/demo-bands.ts'
import type { Album } from '../../domain/album.ts'
import type { Band } from '../../domain/band.ts'
import { cx } from '../../lib/cx.ts'
import { GenerativeArt } from '../art/GenerativeArt.tsx'
import { Chip } from '../ui/Chip.tsx'
import { SectionHeader } from '../ui/SectionHeader.tsx'
import styles from './FavoriteBands.module.css'

interface FavoriteBandsProps {
  bands: Band[]
  /** Álbuns favoritos, para destacar os da banda nº 1. */
  albums: Album[]
}

const rank = (index: number) => String(index + 1).padStart(2, '0')

function bandMeta(band: Band): string {
  return [countryName(band.country), band.formedYear && `desde ${band.formedYear}`].filter(Boolean).join(' · ')
}

export function FavoriteBands({ bands, albums }: FavoriteBandsProps) {
  return (
    <section id="bandas" className={styles.section} aria-labelledby="bandas-title">
      <SectionHeader
        index="01"
        eyebrow="Identidade musical"
        title="Bandas favoritas"
        headingId="bandas-title"
        description="Ordenadas por ranking pessoal. Arte abstrata gerada a partir do nome de cada banda."
      />

      {bands.length === 0 ? (
        <p className={styles.empty}>Ainda não há bandas favoritas.</p>
      ) : (
        <ol className={styles.list}>
          {bands.map((band, index) => {
            const featured = index === 0
            const bandAlbums = featured ? albums.filter((album) => album.bandId === band.id) : []
            return (
              <li key={band.id} className={cx(styles.item, featured && styles.featured)}>
                <span className={styles.rank} aria-label={`Posição ${index + 1}`}>
                  {rank(index)}
                </span>
                <div className={styles.art}>
                  <GenerativeArt seed={`band:${band.id}`} />
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{band.name}</h3>
                  <p className={styles.meta}>{bandMeta(band)}</p>
                  {featured && (
                    <>
                      <ul className={styles.genres} aria-label={`Subgéneros de ${band.name}`}>
                        {band.subgenres.map((genre) => (
                          <li key={genre}>
                            <Chip>{genre}</Chip>
                          </li>
                        ))}
                      </ul>
                      {bandAlbums.length > 0 && (
                        <p className={styles.albumsLine}>
                          <span>Álbum favorito</span> {bandAlbums.map((album) => album.title).join(', ')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
