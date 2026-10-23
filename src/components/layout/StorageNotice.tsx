import { TriangleAlert, Info, X } from 'lucide-react'
import { BACKUP_KEY, type LoadNotice } from '../../lib/persistence/repository.ts'
import type { SaveStatus } from '../../state/profileStore.ts'
import { useProfileStore } from '../../state/profileContext.ts'
import { cx } from '../../lib/cx.ts'
import styles from './StorageNotice.module.css'

interface Message {
  tone: 'warning' | 'info'
  title: string
  body: string
}

function backupSentence(saved: boolean): string {
  return saved
    ? ` Os dados originais foram copiados para a chave "${BACKUP_KEY}" deste browser.`
    : ' Não foi possível guardar uma cópia dos dados originais.'
}

function describeNotice(notice: LoadNotice): Message {
  switch (notice.kind) {
    case 'storage-unavailable':
      return {
        tone: 'warning',
        title: 'Armazenamento local indisponível',
        body: 'Este browser não permite guardar dados (modo privado ou armazenamento bloqueado). As alterações perdem-se ao fechar a página.',
      }
    case 'recovered':
      return {
        tone: 'warning',
        title: 'Não foi possível ler o perfil guardado',
        body: `Os dados guardados estavam danificados, por isso foi aberto o perfil de demonstração.${backupSentence(notice.backupSaved)}`,
      }
    case 'unsupported-version':
      return {
        tone: 'warning',
        title: 'Perfil criado por uma versão mais recente',
        body: `Os dados guardados usam o schema v${notice.version}, que esta versão do RIFFSPACE não suporta. Foi aberto o perfil de demonstração.${backupSentence(notice.backupSaved)}`,
      }
    case 'migrated':
      return {
        tone: 'info',
        title: 'Perfil atualizado',
        body: `O perfil guardado foi convertido do schema v${notice.from} para o formato atual.`,
      }
    case 'repaired':
      return {
        tone: 'info',
        title: 'Perfil reparado',
        body: notice.repairs.join(' '),
      }
  }
}

function saveErrorMessage(status: SaveStatus): Message | null {
  if (status.state !== 'error') return null
  return {
    tone: 'warning',
    title: 'Não foi possível guardar',
    body:
      status.error === 'quota'
        ? 'O armazenamento local deste browser está cheio. A última alteração não foi guardada.'
        : 'O armazenamento local recusou a escrita. A última alteração não foi guardada.',
  }
}

/** Aviso sobre o estado do armazenamento local: recuperação, migração ou falhas de escrita. */
export function StorageNotice() {
  const notice = useProfileStore((state) => state.notice)
  const saveStatus = useProfileStore((state) => state.saveStatus)
  const dismissNotice = useProfileStore((state) => state.dismissNotice)

  const saveError = saveErrorMessage(saveStatus)
  const message = saveError ?? (notice ? describeNotice(notice) : null)
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
          <button type="button" className={styles.close} onClick={dismissNotice} aria-label="Fechar aviso">
            <X aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
