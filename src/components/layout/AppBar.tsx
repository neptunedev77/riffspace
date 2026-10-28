import { SlidersHorizontal } from 'lucide-react'
import { useI18n } from '../../i18n/context.ts'
import { LinkButton } from '../ui/Button.tsx'
import styles from './AppBar.module.css'

/**
 * Barra da aplicação, por cima do card: para quem é dono do perfil, o acesso à
 * personalização. É chrome da app — o card fica limpo, tal como o vê qualquer
 * visitante.
 */
export function AppBar({ canCustomise }: { canCustomise: boolean }) {
  const { t } = useI18n()
  return (
    <header className={styles.bar}>
      {canCustomise && (
        <LinkButton to="/edit" size="sm" variant="ghost" icon={<SlidersHorizontal />}>
          {t('appBar.customise')}
        </LinkButton>
      )}
    </header>
  )
}
