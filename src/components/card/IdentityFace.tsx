import { ArrowUpRight } from 'lucide-react'
import type { Album } from '../../domain/album.ts'
import type { Band } from '../../domain/band.ts'
import { gearDisplayName, gearTypeLabel, type GearItem } from '../../domain/gear.ts'
import type { Profile } from '../../domain/profile.ts'
import { useI18n } from '../../i18n/context.ts'
import { AlbumCover } from '../art/AlbumCover.tsx'
import { BandArt } from '../art/BandArt.tsx'
import { GearImage } from '../rig/GearImage.tsx'
import { Chip } from '../ui/Chip.tsx'
import type { CardFace } from './ProfileCard.tsx'
import styles from './Faces.module.css'

interface IdentityFaceProps {
  profile: Profile
  topBand?: Band
  topAlbum?: Album
  /** Banda do álbum favorito (pode não ser a banda n.º 1). */
  topAlbumBand?: Band
  /** Peça em destaque: a primeira favorita ou, sem favoritas, a primeira da rig. */
  featuredGear?: GearItem
  onOpenFace: (face: CardFace) => void
}

/** Face "identity": bio, subgéneros e destaques que levam às outras faces. */
export function IdentityFace({ profile, topBand, topAlbum, topAlbumBand, featuredGear, onOpenFace }: IdentityFaceProps) {
  const { t } = useI18n()
  const hasHighlights = topBand || topAlbum || featuredGear

  return (
    <div className={styles.identity}>
      <div className={styles.about}>
        <p className={styles.bio}>{profile.bio || t('card.noBio')}</p>
        {profile.subgenres.length > 0 && (
          <ul className={styles.chips} aria-label={t('card.subgenres')}>
            {profile.subgenres.map((genre) => (
              <li key={genre}>
                <Chip>{genre}</Chip>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasHighlights && (
        <section aria-labelledby="card-highlights-title" className={styles.highlights}>
          <h3 id="card-highlights-title" className={styles.columnTitle}>
            {t('card.highlights')}
          </h3>
          <ul className={styles.highlightList}>
            {topBand && (
              <li>
                <button type="button" className={styles.highlight} onClick={() => onOpenFace('music')}>
                  <BandArt band={topBand} size={120} className={styles.highlightArt} />
                  <span className={styles.highlightText}>
                    <span className={styles.highlightLabel}>{t('card.topBand')}</span>
                    <span className={styles.highlightName}>{topBand.name}</span>
                  </span>
                  <ArrowUpRight className={styles.highlightArrow} aria-hidden="true" />
                </button>
              </li>
            )}
            {topAlbum && (
              <li>
                <button type="button" className={styles.highlight} onClick={() => onOpenFace('music')}>
                  <AlbumCover album={topAlbum} className={styles.highlightArt} />
                  <span className={styles.highlightText}>
                    <span className={styles.highlightLabel}>{t('card.topAlbum')}</span>
                    <span className={styles.highlightName}>{topAlbum.title}</span>
                    <span className={styles.highlightMeta}>
                      {[topAlbumBand?.name, topAlbum.year].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <ArrowUpRight className={styles.highlightArrow} aria-hidden="true" />
                </button>
              </li>
            )}
            {featuredGear && (
              <li>
                <button type="button" className={styles.highlight} onClick={() => onOpenFace('rig')}>
                  <GearImage item={featuredGear} size={52} />
                  <span className={styles.highlightText}>
                    <span className={styles.highlightLabel}>
                      {t('card.featuredGear', { type: gearTypeLabel(featuredGear.type) })}
                    </span>
                    <span className={styles.highlightName}>{gearDisplayName(featuredGear)}</span>
                  </span>
                  <ArrowUpRight className={styles.highlightArrow} aria-hidden="true" />
                </button>
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  )
}
