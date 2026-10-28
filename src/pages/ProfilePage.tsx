import { useParams } from 'react-router'
import { AmbientCanvas } from '../components/art/AmbientCanvas.tsx'
import { ProfileCard } from '../components/card/ProfileCard.tsx'
import { AppBar } from '../components/layout/AppBar.tsx'
import { useI18n } from '../i18n/context.ts'
import { useProfileStore } from '../state/profileContext.ts'
import { NotFoundPage } from './NotFoundPage.tsx'
import styles from './ProfilePage.module.css'

/**
 * Perfil como o vê qualquer visitante: só o card, a ocupar o ecrã sobre um
 * palco atmosférico, sem controlos de edição. Serve `/` e `/@nickname`.
 *
 * Enquanto não há backend, o único perfil que existe é o deste browser: um
 * `/@nickname` diferente diz isso mesmo, em vez de fingir que o encontrou.
 */
export function ProfilePage() {
  const { t } = useI18n()
  const { handle } = useParams()
  const profile = useProfileStore((state) => state.profile)

  if (handle !== undefined) {
    const nickname = handle.startsWith('@') ? handle.slice(1).toLowerCase() : undefined
    if (nickname === undefined) return <NotFoundPage />
    if (nickname !== profile.nickname) {
      return <NotFoundPage title={t('profile.notFound.title', { nickname })} text={t('profile.notFound.text')} />
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true">
        <AmbientCanvas theme={profile.theme} />
      </div>

      <div className={styles.frame}>
        <AppBar canCustomise />
        <main id="content" tabIndex={-1} className={styles.main}>
          <ProfileCard profile={profile} fill className={styles.card} />
        </main>
      </div>
    </div>
  )
}
