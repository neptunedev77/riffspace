import { HardDrive, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../../lib/cx.ts'
import type { SaveStatus } from '../../state/profileStore.ts'
import { useProfileStore } from '../../state/profileContext.ts'
import { Button } from '../ui/Button.tsx'
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx'
import styles from './Footer.module.css'

const timeFormat = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' })

function describeSave(status: SaveStatus, persistent: boolean, hasSavedData: boolean): string {
  if (!persistent) return 'Armazenamento local indisponível: as alterações não são guardadas.'
  if (status.state === 'error') return 'A última alteração não foi guardada.'
  if (status.state === 'saved' && hasSavedData) {
    return `Guardado apenas neste browser · ${timeFormat.format(new Date(status.at))}`
  }
  return 'Sem dados guardados: a mostrar os dados de demonstração originais.'
}

export function Footer() {
  const saveStatus = useProfileStore((state) => state.saveStatus)
  const persistent = useProfileStore((state) => state.persistent)
  const hasSavedData = useProfileStore((state) => state.hasSavedData)
  const resetToDemo = useProfileStore((state) => state.resetToDemo)
  const [confirming, setConfirming] = useState(false)

  return (
    <footer className={styles.footer}>
      <div className={cx('container', styles.inner)}>
        <section className={styles.data} aria-labelledby="dados-locais-title">
          <h2 id="dados-locais-title" className={styles.dataTitle}>
            <HardDrive aria-hidden="true" />
            Dados locais
          </h2>
          <p className={styles.status} aria-live="polite">
            {describeSave(saveStatus, persistent, hasSavedData)}
          </p>
          <Button size="sm" icon={<RotateCcw />} onClick={() => setConfirming(true)}>
            Repor dados de demonstração
          </Button>
        </section>

        <div className={styles.about}>
          <p className={styles.brand}>RIFFSPACE</p>
          <p className={styles.note}>
            Este é um perfil de demonstração com uma persona fictícia. Os nomes de bandas, álbuns e equipamento são
            referências em texto; a arte é abstrata e gerada localmente, sem logótipos, fotografias ou capas de
            terceiros. Os dados ficam guardados apenas neste browser; nada é publicado online.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Repor dados de demonstração?"
        description={
          <>
            <p>O perfil guardado neste browser vai ser apagado e substituído pelo perfil de demonstração original.</p>
            <p>Esta ação não pode ser desfeita.</p>
          </>
        }
        confirmLabel="Repor"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          resetToDemo()
          setConfirming(false)
        }}
      />
    </footer>
  )
}
