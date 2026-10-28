import { HardDrive, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button.tsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx'
import { Select } from '../../components/ui/Select.tsx'
import { useI18n } from '../../i18n/context.ts'
import { isLocale, LOCALE_META, LOCALES } from '../../i18n/locales.ts'
import { intlLocale } from '../../i18n/translate.ts'
import { useProfileStore } from '../../state/profileContext.ts'
import styles from './EditorForms.module.css'

const LANGUAGE_OPTIONS = LOCALES.map((locale) => ({ value: locale, label: LOCALE_META[locale].label }))

/**
 * Definições da aplicação (idioma) e dos dados locais. Ao contrário do resto
 * do editor, o idioma aplica-se logo e não depende de "save".
 */
export function SettingsTab() {
  const { t, locale, setLocale } = useI18n()
  const saveStatus = useProfileStore((state) => state.saveStatus)
  const persistent = useProfileStore((state) => state.persistent)
  const hasSavedData = useProfileStore((state) => state.hasSavedData)
  const resetToDemo = useProfileStore((state) => state.resetToDemo)
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  const storageStatus = !persistent
    ? t('settings.storage.unavailable')
    : saveStatus.state === 'error'
      ? t('settings.storage.failed')
      : saveStatus.state === 'saved' && hasSavedData
        ? t('settings.storage.saved', {
            date: new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'short', timeStyle: 'short' }).format(
              new Date(saveStatus.at),
            ),
          })
        : t('settings.storage.empty')

  return (
    <div className={styles.stack}>
      <section className={styles.block} aria-labelledby="settings-language-title">
        <h3 id="settings-language-title" className={styles.blockTitle}>
          {t('settings.language.title')}
        </h3>
        <Select
          label={t('settings.language.label')}
          options={LANGUAGE_OPTIONS}
          value={locale}
          hint={t('settings.language.hint')}
          onChange={(event) => {
            if (isLocale(event.target.value)) setLocale(event.target.value)
          }}
        />
      </section>

      <section className={styles.block} aria-labelledby="settings-storage-title">
        <h3 id="settings-storage-title" className={styles.blockTitle}>
          <HardDrive aria-hidden="true" className={styles.inlineIcon} /> {t('settings.storage.title')}
        </h3>
        <p className={styles.note} aria-live="polite">
          {storageStatus}
        </p>
        <p className={styles.note}>{t('settings.storage.localOnly')}</p>
      </section>

      <section className={styles.block} aria-labelledby="settings-reset-title">
        <h3 id="settings-reset-title" className={styles.blockTitle}>
          {t('settings.reset.title')}
        </h3>
        <p className={styles.note}>{t('settings.reset.body')}</p>
        <div>
          <Button size="sm" icon={<RotateCcw />} onClick={() => setConfirming(true)}>
            {t('settings.reset.button')}
          </Button>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="settings-content-title">
        <h3 id="settings-content-title" className={styles.blockTitle}>
          {t('settings.content.title')}
        </h3>
        <p className={styles.note}>{t('settings.content.body')}</p>
      </section>

      <ConfirmDialog
        open={confirming}
        title={t('settings.reset.confirmTitle')}
        description={
          <>
            <p>{t('settings.reset.confirmBody')}</p>
            <p>{t('settings.reset.irreversible')}</p>
          </>
        }
        confirmLabel={t('settings.reset.confirm')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          resetToDemo()
          navigate('/')
        }}
      />
    </div>
  )
}
