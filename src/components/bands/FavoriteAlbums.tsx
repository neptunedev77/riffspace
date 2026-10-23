import type { Album } from '../../domain/album.ts'
import type { Band } from '../../domain/band.ts'
import { GenerativeArt } from '../art/GenerativeArt.tsx'
import { SectionHeader } from '../ui/SectionHeader.tsx'
import styles from './FavoriteAlbums.module.css'

interface FavoriteAlbumsProps {
  albums: Album[]
  bands: Band[]
}

export function FavoriteAlbums({ albums, bands }: FavoriteAlbumsProps) {
  const bandName = (bandId: string) => bands.find((band) => band.id === bandId)?.name ?? 'Banda desconhecida'

  return (
    <section id="albuns" className={styles.section} aria-labelledby="albuns-title">
      <SectionHeader
        index="02"
        eyebrow="Na prateleira"
        title="Álbuns favoritos"
        headingId="albuns-title"
        description="Capas abstratas originais: nenhuma arte oficial é reproduzida."
      />

      {albums.length === 0 ? (
        <p className={styles.empty}>Ainda não há álbuns favoritos.</p>
      ) : (
        <ul className={styles.grid}>
          {albums.map((album) => (
            <li key={album.id}>
              <figure className={styles.album}>
                <div className={styles.sleeve}>
                  <span className={styles.vinyl} aria-hidden="true" />
                  <div className={styles.cover}>
                    <GenerativeArt seed={`album:${album.id}`} />
                  </div>
                </div>
                <figcaption className={styles.caption}>
                  <span className={styles.title}>{album.title}</span>
                  <span className={styles.meta}>
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
  )
}
