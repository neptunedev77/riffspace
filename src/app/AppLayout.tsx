import { Outlet } from 'react-router'
import { StorageNotice } from '../components/layout/StorageNotice.tsx'
import { useApplyTheme } from '../hooks/useTheme.ts'
import { useI18n } from '../i18n/context.ts'
import { useProfileStore } from '../state/profileContext.ts'

/** Estrutura comum a todas as páginas: tema, skip link e avisos de armazenamento. */
export function AppLayout() {
  const { t } = useI18n()
  // Durante a edição, o tema do rascunho é o que se está a pré-visualizar.
  const theme = useProfileStore((state) => (state.draft ?? state.profile).theme)
  useApplyTheme(theme)

  return (
    <>
      <a className="skip-link" href="#content">
        {t('common.skipToContent')}
      </a>
      <Outlet />
      <StorageNotice />
    </>
  )
}
