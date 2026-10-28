import { Pencil } from 'lucide-react'
import { AmbientCanvas } from '../components/art/AmbientCanvas.tsx'
import { ProfileCard } from '../components/card/ProfileCard.tsx'
import { LinkButton } from '../components/ui/Button.tsx'
import { useI18n } from '../i18n/context.ts'
import { useProfileStore } from '../state/profileContext.ts'
import styles from './ProfilePage.module.css'

/**
 * Página principal: só o card, a ocupar o ecrã sobre um palco atmosférico.
 * Não tem controlos de personalização — tudo isso vive no editor.
 */
export function ProfilePage() {
  const { t } = useI18n()
  const profile = useProfileStore((state) => state.profile)

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.beams} />
        <AmbientCanvas theme={profile.theme} />
      </div>

      <main id="content" tabIndex={-1} className={styles.main}>
        <ProfileCard
          profile={profile}
          fill
          className={styles.card}
          actions={
            <LinkButton to="/edit" size="sm" variant="ghost" icon={<Pencil />} aria-label={t('profile.edit')}>
              <span className={styles.editLabel}>{t('profile.editShort')}</span>
            </LinkButton>
          }
        />
      </main>
    </div>
  )
}
