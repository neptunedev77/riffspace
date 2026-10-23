import { Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx'
import { Tabs, type TabItem } from '../../components/ui/Tabs.tsx'
import { useProfileStore } from '../../state/profileContext.ts'
import { AlbumsTab } from '../band-selector/AlbumsTab.tsx'
import { BandsTab } from '../band-selector/BandsTab.tsx'
import { GenresTab } from '../band-selector/GenresTab.tsx'
import { IdentityTab, type TabProps } from './IdentityTab.tsx'
import { countByTab, issuesForDraft, tabForPath, type EditorTab } from './issues.ts'
import styles from './ProfileEditor.module.css'

const TAB_LABELS: Record<EditorTab, string> = {
  perfil: 'Perfil',
  bandas: 'Bandas',
  albuns: 'Álbuns',
  generos: 'Géneros',
}

/**
 * Editor do perfil em drawer modal. Edita um rascunho: a página por trás
 * mostra-o em tempo real e nada é guardado até "Guardar".
 */
export function ProfileEditor() {
  const draft = useProfileStore((state) => state.draft)
  const dirty = useProfileStore((state) => state.draftDirty)
  const updateDraft = useProfileStore((state) => state.updateDraft)
  const saveDraft = useProfileStore((state) => state.saveDraft)
  const discardDraft = useProfileStore((state) => state.discardDraft)
  const startEditing = useProfileStore((state) => state.startEditing)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<EditorTab>('perfil')
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const open = draft !== null

  const issues = useMemo(() => (draft ? issuesForDraft(draft) : new Map<string, string>()), [draft])
  const counts = countByTab(issues)

  // Abre/fecha o <dialog> nativo em sintonia com a existência do rascunho.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setTab('perfil')
      setTouched(new Set())
      setSubmitted(false)
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  // Avisa antes de sair da página com alterações por guardar.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const requestClose = () => (dirty ? setConfirmDiscard(true) : discardDraft())

  const save = () => {
    setSubmitted(true)
    const result = saveDraft()
    if (!result.ok) {
      const first = result.issues[0]
      if (first) setTab(tabForPath(first.path))
    }
  }

  const tabs: TabItem<EditorTab>[] = (Object.keys(TAB_LABELS) as EditorTab[]).map((id) => ({
    id,
    label: TAB_LABELS[id],
    badge:
      submitted && counts[id] > 0 ? (
        <span className={styles.errorBadge} aria-label={`${counts[id]} erro(s)`}>
          {counts[id]}
        </span>
      ) : undefined,
  }))

  const tabProps: TabProps | null = draft
    ? {
        draft,
        update: updateDraft,
        errorFor: (path) => (submitted || touched.has(path) ? issues.get(path) : undefined),
        touch: (path) => setTouched((current) => (current.has(path) ? current : new Set(current).add(path))),
      }
    : null

  return (
    <dialog
      ref={dialogRef}
      className={styles.drawer}
      aria-labelledby="editor-title"
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
    >
      {draft && tabProps && (
        <div className={styles.shell}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Pré-visualização em tempo real</p>
              <h2 id="editor-title" className={styles.title}>
                {draft.isDemo ? 'Editar perfil' : draft.nickname ? `@${draft.nickname}` : 'Novo perfil'}
              </h2>
            </div>
            <Button variant="ghost" size="sm" icon={<X />} aria-label="Fechar editor" onClick={requestClose} />
          </header>

          {draft.isDemo && (
            <div className={styles.demoBanner}>
              <Sparkles aria-hidden="true" />
              <p>
                Estás a editar o perfil de demonstração. Quando guardares, passa a ser o teu perfil e deixa de ter a
                etiqueta de demonstração.
              </p>
              <Button size="sm" onClick={() => startEditing('blank')}>
                Começar do zero
              </Button>
            </div>
          )}

          <Tabs label="Secções do editor" idPrefix="editor" tabs={tabs} value={tab} onChange={setTab} className={styles.tabs}>
            {tab === 'perfil' && <IdentityTab {...tabProps} />}
            {tab === 'bandas' && <BandsTab {...tabProps} />}
            {tab === 'albuns' && <AlbumsTab {...tabProps} />}
            {tab === 'generos' && <GenresTab {...tabProps} />}
          </Tabs>

          <footer className={styles.footer}>
            <p className={styles.footerStatus} role={submitted && issues.size > 0 ? 'alert' : undefined}>
              {submitted && issues.size > 0
                ? `Corrige ${issues.size === 1 ? '1 campo' : `${issues.size} campos`} antes de guardar.`
                : dirty
                  ? 'Alterações por guardar.'
                  : 'Sem alterações.'}
            </p>
            <div className={styles.footerActions}>
              <Button variant="ghost" onClick={requestClose}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={save}>
                Guardar
              </Button>
            </div>
          </footer>
        </div>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar alterações?"
        description={<p>As alterações feitas neste editor ainda não foram guardadas e vão perder-se.</p>}
        confirmLabel="Descartar"
        cancelLabel="Continuar a editar"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false)
          discardDraft()
        }}
      />
    </dialog>
  )
}
