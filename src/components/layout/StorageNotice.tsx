import { Info, TriangleAlert, X } from 'lucide-react'
import { useI18n, type I18nValue } from '../../i18n/context.ts'
import { cx } from '../../lib/cx.ts'
import { BACKUP_KEY, type LoadNotice } from '../../lib/persistence/repository.ts'
import { useProfileStore } from '../../state/profileContext.ts'
import type { SaveStatus } from '../../state/profileStore.ts'
import styles from './StorageNotice.module.css'

interface Message {
  tone: 'warning' | 'info'
  title: string
  body: string
}

function describeNotice(notice: LoadNotice, t: I18nValue['t']): Message {
  const backup = (saved: boolean) => (saved ? t('notice.backupSaved', { key: BACKUP_KEY }) : t('notice.backupFailed'))
  switch (notice.kind) {
    case 'storage-unavailable':
      return { tone: 'warning', title: t('notice.unavailable.title'), body: t('notice.unavailable.body') }
    case 'recovered':
      return {
        tone: 'warning',
        title: t('notice.recovered.title'),
        body: `${t('notice.recovered.body')} ${backup(notice.backupSaved)}`,
      }
    case 'unsupported-version':
      return {
        tone: 'warning',
        title: t('notice.newer.title'),
        body: `${t('notice.newer.body', { version: notice.version })} ${backup(notice.backupSaved)}`,
      }
    case 'migrated':
      return { tone: 'info', title: t('notice.migrated.title'), body: t('notice.migrated.body', { version: notice.from }) }
    case 'repaired':
      return { tone: 'info', title: t('notice.repaired.title'), body: notice.repairs.join(' ') }
  }
}

function saveErrorMessage(status: SaveStatus, t: I18nValue['t']): Message | null {
  if (status.state !== 'error') return null
  return {
    tone: 'warning',
    title: t('notice.saveFailed.title'),
    body: status.error === 'quota' ? t('notice.saveFailed.quota') : t('notice.saveFailed.other'),
  }
}

/** Aviso sobre o estado do armazenamento local: recuperação, migração ou falhas de escrita. */
export function StorageNotice() {
  const { t } = useI18n()
  const notice = useProfileStore((state) => state.notice)
  const saveStatus = useProfileStore((state) => state.saveStatus)
  const dismissNotice = useProfileStore((state) => state.dismissNotice)

  const saveError = saveErrorMessage(saveStatus, t)
  const message = saveError ?? (notice ? describeNotice(notice, t) : null)
  if (!message) return null

  const Icon = message.tone === 'warning' ? TriangleAlert : Info

  return (
    <div className={styles.wrapper}>
      <div className={cx(styles.notice, styles[message.tone])} role={message.tone === 'warning' ? 'alert' : 'status'}>
        <Icon className={styles.icon} aria-hidden="true" />
        <div className={styles.text}>
          <p className={styles.title}>{message.title}</p>
          <p className={styles.body}>{message.body}</p>
        </div>
        {!saveError && (
          <button type="button" className={styles.close} onClick={dismissNotice} aria-label={t('notice.dismiss')}>
            <X aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
