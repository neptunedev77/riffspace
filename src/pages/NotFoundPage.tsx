import { ArrowLeft } from 'lucide-react'
import { LinkButton } from '../components/ui/Button.tsx'
import { useI18n } from '../i18n/context.ts'
import styles from './NotFoundPage.module.css'

/** Página 404; com `title`/`text` serve também para "perfil não encontrado". */
export function NotFoundPage({ title, text }: { title?: string; text?: string }) {
  const { t } = useI18n()
  return (
    <main id="content" tabIndex={-1} className={styles.page}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 className={styles.title}>{title ?? t('notFound.title')}</h1>
      <p className={styles.text}>{text ?? t('notFound.text')}</p>
      <LinkButton to="/" variant="primary" icon={<ArrowLeft />}>
        {t('notFound.back')}
      </LinkButton>
    </main>
  )
}
