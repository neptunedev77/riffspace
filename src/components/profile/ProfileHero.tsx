import { MapPin, Sparkles } from 'lucide-react'
import type { Profile } from '../../domain/profile.ts'
import type { ThemeId } from '../../domain/theme.ts'
import { cx } from '../../lib/cx.ts'
import { AmbientCanvas } from '../art/AmbientCanvas.tsx'
import { Badge } from '../ui/Badge.tsx'
import { Chip } from '../ui/Chip.tsx'
import { Surface } from '../ui/Surface.tsx'
import { Avatar } from './Avatar.tsx'
import styles from './ProfileHero.module.css'

interface ProfileHeroProps {
  profile: Profile
  theme: ThemeId
  counts: { bands: number; albums: number; gear: number }
}

export function ProfileHero({ profile, theme, counts }: ProfileHeroProps) {
  const name = profile.displayName || profile.nickname || 'Sem nome'

  return (
    <section className={styles.hero} aria-labelledby="profile-name" id="top">
      <div className={styles.banner} aria-hidden="true">
        <div className={styles.beams} />
        <AmbientCanvas theme={theme} />
        <span className={styles.watermark}>{profile.nickname}</span>
      </div>

      <div className={cx('container', styles.content)}>
        <div className={styles.identity}>
          <div className={styles.avatar}>
            <Avatar avatar={profile.avatar} seed={profile.nickname} label={`Avatar de ${name}`} />
          </div>
          <div className={styles.nameBlock}>
            {profile.isDemo && (
              <Badge tone="demo" icon={<Sparkles />}>
                Perfil de demonstração
              </Badge>
            )}
            <h1 id="profile-name" className={styles.name}>
              {name}
            </h1>
            <p className={styles.handle}>
              {profile.nickname && `@${profile.nickname}`}
              {profile.location && (
                <span className={styles.location}>
                  <MapPin aria-hidden="true" />
                  {profile.location}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.lead}>
            {profile.tagline && <p className={styles.tagline}>{profile.tagline}</p>}
            {profile.subgenres.length > 0 && (
              <ul className={styles.subgenres} aria-label="Subgéneros favoritos">
                {profile.subgenres.map((genre) => (
                  <li key={genre}>
                    <Chip>{genre}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Surface level={2} className={styles.bioPanel}>
            <h2 className="visually-hidden">Sobre {name}</h2>
            <p className={styles.bio}>{profile.bio || 'Ainda sem bio.'}</p>
            <dl className={styles.stats}>
              <div>
                <dt>Bandas</dt>
                <dd>{counts.bands}</dd>
              </div>
              <div>
                <dt>Álbuns</dt>
                <dd>{counts.albums}</dd>
              </div>
              <div>
                <dt>Peças na rig</dt>
                <dd>{counts.gear}</dd>
              </div>
            </dl>
          </Surface>
        </div>
      </div>
    </section>
  )
}
