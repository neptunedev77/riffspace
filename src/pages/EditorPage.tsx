import { ArrowLeft, Eye, PenLine, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'
import { ProfileCard } from '../components/card/ProfileCard.tsx'
import { Button, LinkButton } from '../components/ui/Button.tsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx'
import { Tabs, type TabItem } from '../components/ui/Tabs.tsx'
import { AppearanceTab } from '../features/appearance/AppearanceTab.tsx'
import { AlbumsTab } from '../features/band-selector/AlbumsTab.tsx'
import { BandsTab } from '../features/band-selector/BandsTab.tsx'
import { GenresTab } from '../features/band-selector/GenresTab.tsx'
import { IdentityTab, type TabProps } from '../features/profile-editor/IdentityTab.tsx'
import { countByTab, EDITOR_TABS, issuesForDraft, tabForPath, type EditorTab } from '../features/profile-editor/issues.ts'
import { SettingsTab } from '../features/profile-editor/SettingsTab.tsx'
import { RigTab } from '../features/rig-builder/RigTab.tsx'
import { SocialsTab } from '../features/socials/SocialsTab.tsx'
import { TrackTab } from '../features/track/TrackTab.tsx'
import { useMediaQuery } from '../hooks/useMediaQuery.ts'
import { useI18n } from '../i18n/context.ts'
import { cx } from '../lib/cx.ts'
import { useProfileStore, useProfileStoreApi } from '../state/profileContext.ts'
import styles from './EditorPage.module.css'

/** A partir desta largura a pré-visualização fica fixa ao lado do formulário. */
const WIDE_QUERY = '(min-width: 1100px)'
/** A partir desta largura as secções ficam numa navegação lateral vertical. */
const SIDE_NAV_QUERY = '(min-width: 800px)'

/**
 * Página de edição dedicada. Edita um rascunho na store: a pré-visualização
 * reflete cada alteração e nada é guardado até "save". Sair com alterações
 * por guardar (botão, link, "voltar" do browser) pede confirmação.
 */
export function EditorPage() {
  const { t, tp } = useI18n()
  const store = useProfileStoreApi()
  const draft = useProfileStore((state) => state.draft)
  const dirty = useProfileStore((state) => state.draftDirty)
  const updateDraft = useProfileStore((state) => state.updateDraft)
  const saveDraft = useProfileStore((state) => state.saveDraft)
  const startEditing = useProfileStore((state) => state.startEditing)
  const navigate = useNavigate()
  const wide = useMediaQuery(WIDE_QUERY, true)
  const sideNav = useMediaQuery(SIDE_NAV_QUERY, true)

  const [tab, setTab] = useState<EditorTab>('profile')
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form')

  // Abre o rascunho ao entrar; ao sair da página o rascunho é sempre descartado
  // (se tinha alterações, o blocker já pediu confirmação).
  useEffect(() => {
    if (!store.getState().draft) store.getState().startEditing()
    return () => store.getState().discardDraft()
  }, [store])

  // Lê o estado no momento da navegação: depois de guardar já não há alterações.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      store.getState().draftDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const issues = useMemo(() => (draft ? issuesForDraft(draft) : new Map<string, string>()), [draft])
  const counts = countByTab(issues)

  if (!draft) return null

  const save = () => {
    setSubmitted(true)
    const result = saveDraft()
    if (result.ok) {
      navigate('/')
      return
    }
    const first = result.issues[0]
    if (first) setTab(tabForPath(first.path))
    setMobileView('form')
  }

  const tabs: TabItem<EditorTab>[] = EDITOR_TABS.map((id) => ({
    id,
    label: t(`editor.tab.${id}`),
    badge:
      submitted && counts[id] > 0 ? (
        <span className={styles.errorBadge} aria-label={tp('editor.errors', counts[id])}>
          {counts[id]}
        </span>
      ) : undefined,
  }))

  const tabProps: TabProps = {
    draft,
    update: updateDraft,
    errorFor: (path) => (submitted || touched.has(path) ? issues.get(path) : undefined),
    touch: (path) => setTouched((current) => (current.has(path) ? current : new Set(current).add(path))),
  }

  const status =
    submitted && issues.size > 0
      ? tp('editor.fixFields', issues.size)
      : dirty
        ? t('editor.unsaved')
        : t('editor.noChanges')

  const showForm = wide || mobileView === 'form'
  const showPreview = wide || mobileView === 'preview'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={cx('container', styles.headerInner)}>
          <LinkButton to="/" size="sm" variant="ghost" icon={<ArrowLeft />} className={styles.back}>
            <span className={styles.backLabel}>{t('editor.back')}</span>
          </LinkButton>
          <div className={styles.titleBlock}>
            <p className={styles.eyebrow}>{t('editor.eyebrow')}</p>
            <h1 className={styles.title}>
              {draft.isDemo ? t('editor.title') : draft.nickname ? `@${draft.nickname}` : t('editor.newProfile')}
            </h1>
          </div>
          <p className={styles.status} role={submitted && issues.size > 0 ? 'alert' : undefined}>
            {status}
          </p>
          <div className={styles.actions}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={save}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </header>

      <main id="content" tabIndex={-1} className={cx('container', styles.main)}>
        {draft.isDemo && (
          <div className={styles.demoBanner}>
            <Sparkles aria-hidden="true" />
            <p>{t('editor.demoBanner')}</p>
            <Button size="sm" onClick={() => startEditing('blank')}>
              {t('editor.startBlank')}
            </Button>
          </div>
        )}

        {!wide && (
          <div className={styles.viewToggle} role="group" aria-label={t('editor.view')}>
            <button
              type="button"
              aria-pressed={mobileView === 'form'}
              className={cx(styles.toggle, mobileView === 'form' && styles.toggleOn)}
              onClick={() => setMobileView('form')}
            >
              <PenLine aria-hidden="true" /> {t('editor.viewEdit')}
            </button>
            <button
              type="button"
              aria-pressed={mobileView === 'preview'}
              className={cx(styles.toggle, mobileView === 'preview' && styles.toggleOn)}
              onClick={() => setMobileView('preview')}
            >
              <Eye aria-hidden="true" /> {t('editor.viewPreview')}
            </button>
          </div>
        )}

        <div className={styles.layout}>
          {showForm && (
            <Tabs
              label={t('editor.sections')}
              idPrefix="editor"
              tabs={tabs}
              value={tab}
              onChange={setTab}
              orientation={sideNav ? 'vertical' : 'horizontal'}
              className={styles.tabs}
              listClassName={styles.nav}
              panelClassName={styles.panel}
            >
              <h2 className={styles.sectionTitle}>{t(`editor.tab.${tab}`)}</h2>
              {tab === 'profile' && <IdentityTab {...tabProps} />}
              {tab === 'appearance' && <AppearanceTab {...tabProps} />}
              {tab === 'track' && <TrackTab {...tabProps} />}
              {tab === 'socials' && <SocialsTab {...tabProps} />}
              {tab === 'bands' && <BandsTab {...tabProps} />}
              {tab === 'albums' && <AlbumsTab {...tabProps} />}
              {tab === 'genres' && <GenresTab {...tabProps} />}
              {tab === 'rig' && <RigTab {...tabProps} />}
              {tab === 'settings' && <SettingsTab />}
            </Tabs>
          )}

          {showPreview && (
            <aside className={styles.preview} aria-label={t('editor.previewLabel')}>
              <p className={styles.previewLabel}>{t('editor.livePreview')}</p>
              <ProfileCard profile={draft} headingLevel={2} idPrefix="preview" />
            </aside>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={t('editor.discard.title')}
        description={<p>{t('editor.discard.body')}</p>}
        confirmLabel={t('editor.discard.confirm')}
        cancelLabel={t('editor.discard.cancel')}
        onCancel={() => blocker.reset?.()}
        onConfirm={() => {
          store.getState().discardDraft()
          blocker.proceed?.()
        }}
      />
    </div>
  )
}
