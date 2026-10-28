import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { Profile } from '../../domain/profile.ts'
import { useI18n } from '../../i18n/context.ts'
import { intlLocale } from '../../i18n/translate.ts'
import { cx } from '../../lib/cx.ts'
import { Avatar } from '../profile/Avatar.tsx'
import { Badge } from '../ui/Badge.tsx'
import { Tabs, type TabItem } from '../ui/Tabs.tsx'
import { IdentityFace } from './IdentityFace.tsx'
import { MusicFace } from './MusicFace.tsx'
import { RigFace } from './RigFace.tsx'
import { SocialLinks } from './SocialLinks.tsx'
import { TrackPlayer } from './TrackPlayer.tsx'
import styles from './ProfileCard.module.css'

export type CardFace = 'identity' | 'music' | 'rig'

interface ProfileCardProps {
  profile: Profile
  /** Nível do título com o nome: 1 na página do perfil, 2 dentro de outra página (pré-visualização). */
  headingLevel?: 1 | 2
  /** Prefixo dos IDs dos separadores, para não colidir quando há mais de um card. */
  idPrefix?: string
  /** Ocupa a altura do contentor; o conteúdo das faces faz scroll dentro do card. */
  fill?: boolean
  className?: string
}

/**
 * O perfil: identidade, música em destaque com a forma de onda real, três
 * faces (identity, music, rig) e uma barra discreta com números. Visual
 * sóbrio — sem inclinação nem reflexos — e adaptado à própria largura
 * (container queries).
 */
export function ProfileCard({
  profile,
  headingLevel = 1,
  idPrefix = 'card',
  fill = false,
  className,
}: ProfileCardProps) {
  const { t, locale } = useI18n()
  const [face, setFace] = useState<CardFace>('identity')

  const { bands, albums } = profile
  const featuredGear = profile.rig.find((item) => item.favorite) ?? profile.rig[0]
  const name = profile.displayName || profile.nickname || t('card.noName')
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  const headingId = `${idPrefix}-name`
  const since = new Date(profile.createdAt)
  const sinceLabel = Number.isNaN(since.getTime())
    ? undefined
    : new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }).format(since)

  const tabs: TabItem<CardFace>[] = [
    { id: 'identity', label: t('card.face.identity') },
    { id: 'music', label: t('card.face.music'), badge: <span className={styles.tabCount}>{bands.length}</span> },
    { id: 'rig', label: t('card.face.rig'), badge: <span className={styles.tabCount}>{profile.rig.length}</span> },
  ]

  return (
    <div className={cx(styles.stage, fill && styles.fill, className)}>
      <article className={styles.card} aria-labelledby={headingId}>
        <header className={styles.header}>
          <div className={styles.identityRow}>
            <div className={styles.avatar}>
              <Avatar avatar={profile.avatar} seed={profile.nickname} label={t('card.avatar', { name })} />
            </div>
            <div className={styles.nameBlock}>
              {profile.isDemo && (
                <Badge tone="demo" icon={<Sparkles />}>
                  {t('card.demo')}
                </Badge>
              )}
              <Heading id={headingId} className={styles.name}>
                {name}
              </Heading>
              <p className={styles.handle}>
                {profile.nickname && <span>@{profile.nickname}</span>}
                {profile.location && <span className={styles.location}>{profile.location}</span>}
              </p>
            </div>
          </div>

          {profile.tagline && <p className={styles.tagline}>{profile.tagline}</p>}
          <SocialLinks links={profile.socials} demo={profile.isDemo} />
          {profile.featuredTrack && <TrackPlayer key={profile.featuredTrack.previewUrl} track={profile.featuredTrack} />}
        </header>

        <Tabs
          label={t('card.faces')}
          idPrefix={idPrefix}
          tabs={tabs}
          value={face}
          onChange={setFace}
          className={styles.faces}
          listClassName={styles.faceTabs}
          panelClassName={styles.facePanel}
        >
          <div key={face} className={styles.faceContent}>
            {face === 'identity' && (
              <IdentityFace
                profile={profile}
                topBand={bands[0]}
                topAlbum={albums[0]}
                topAlbumBand={albums[0] && bands.find((band) => band.id === albums[0]!.bandId)}
                featuredGear={featuredGear}
                onOpenFace={setFace}
              />
            )}
            {face === 'music' && <MusicFace bands={bands} albums={albums} />}
            {face === 'rig' && <RigFace rig={profile.rig} />}
          </div>
        </Tabs>

        <footer className={styles.statusBar}>
          <dl className={styles.stats}>
            <div>
              <dt>{t('card.stat.bands')}</dt>
              <dd>{bands.length}</dd>
            </div>
            <div>
              <dt>{t('card.stat.albums')}</dt>
              <dd>{albums.length}</dd>
            </div>
            <div>
              <dt>{t('card.stat.gear')}</dt>
              <dd>{profile.rig.length}</dd>
            </div>
          </dl>
          {sinceLabel && <p className={styles.meta}>{t('card.since', { date: sinceLabel })}</p>}
        </footer>
      </article>
    </div>
  )
}
