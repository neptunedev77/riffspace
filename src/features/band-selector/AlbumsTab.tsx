import { Check, LoaderCircle, PenLine, Plus, RotateCw, X } from 'lucide-react'
import { useState } from 'react'
import { AlbumCover } from '../../components/art/AlbumCover.tsx'
import { Badge } from '../../components/ui/Badge.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Chip } from '../../components/ui/Chip.tsx'
import { Input } from '../../components/ui/Input.tsx'
import type { Album } from '../../domain/album.ts'
import { LIMITS } from '../../domain/limits.ts'
import { findBand } from '../../domain/profile.ts'
import { useI18n } from '../../i18n/context.ts'
import { cx } from '../../lib/cx.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/EditorForms.module.css'
import { CustomAlbumForm } from './CustomAlbumForm.tsx'
import { matchesSearch } from './search.ts'
import { addCustomAlbum, removeAlbum, toggleAlbum } from './selection.ts'
import { useStudioAlbums } from './useStudioAlbums.ts'

/** A partir de quantas bandas aparece o campo para as filtrar. */
const BAND_FILTER_FROM = 8
/** Álbuns mostrados de uma vez antes de "mostrar todos". */
const ALBUMS_PREVIEW = 8

/**
 * Álbuns favoritos. Só se escolhem álbuns das bandas do perfil: escolhe-se a
 * banda e aparece a sua discografia de estúdio (MusicBrainz), com filtro por
 * título e um limite inicial para a lista nunca ficar gigante.
 */
export function AlbumsTab({ draft, update }: TabProps) {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string>()
  const [bandQuery, setBandQuery] = useState('')
  const [albumQuery, setAlbumQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [manual, setManual] = useState(false)
  const [feedback, setFeedback] = useState('')

  // Sem escolha (ou se a banda escolhida saiu do perfil), usa a primeira do ranking.
  const band = (selectedId && findBand(draft, selectedId)) || draft.bands[0]
  const { state, retry } = useStudioAlbums(band)
  const full = draft.albums.length >= LIMITS.favoriteAlbums.max

  const selectBand = (id: string) => {
    setSelectedId(id)
    setAlbumQuery('')
    setShowAll(false)
    setManual(false)
  }

  const toggle = (album: Album) => {
    const result = toggleAlbum(draft, album)
    if (!result.ok) return setFeedback(result.error)
    update(() => result.profile)
    setFeedback(t(result.value ? 'albums.added' : 'albums.removed', { title: album.title }))
  }

  const visibleBands = draft.bands.filter((b) => matchesSearch(b.name, bandQuery))
  const albums = state.status === 'done' ? state.albums.filter((a) => matchesSearch(a.title, albumQuery)) : []
  const filtering = albumQuery.trim() !== ''
  const shown = showAll || filtering ? albums : albums.slice(0, ALBUMS_PREVIEW)

  return (
    <div className={styles.stack}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {feedback}
      </p>

      <section aria-labelledby="favorite-albums-title" className={styles.block}>
        <h3 id="favorite-albums-title" className={styles.blockTitle}>
          {t('albums.count')}{' '}
          <span className={styles.count}>
            {draft.albums.length}/{LIMITS.favoriteAlbums.max}
          </span>
        </h3>
        {draft.albums.length === 0 ? (
          <p className={styles.empty}>{t('albums.favoritesEmpty')}</p>
        ) : (
          <ul className={styles.resultList}>
            {draft.albums.map((album) => (
              <li key={album.id} className={styles.resultItem}>
                <span className={styles.mediaItem}>
                  <AlbumCover album={album} className={styles.thumb} />
                  <span className={styles.resultText}>
                    <span className={styles.mediaName}>{album.title}</span>
                    <span className={styles.mediaMeta}>
                      {[findBand(draft, album.bandId)?.name, album.year].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<X />}
                  aria-label={t('common.removeItem', { name: album.title })}
                  onClick={() => {
                    update((d) => removeAlbum(d, album.id))
                    setFeedback(t('albums.removed', { title: album.title }))
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="browse-albums-title" className={styles.block}>
        <h3 id="browse-albums-title" className={styles.blockTitle}>
          {t('albums.browse')}
        </h3>

        {!band ? (
          <p className={styles.empty}>{t('albums.empty')}</p>
        ) : (
          <>
            {draft.bands.length >= BAND_FILTER_FROM && (
              <Input
                label={t('albums.findBand')}
                type="search"
                value={bandQuery}
                autoComplete="off"
                onChange={(event) => setBandQuery(event.target.value)}
              />
            )}
            <ul className={styles.chips} aria-label={t('albums.bandPicker')}>
              {visibleBands.map((b) => (
                <li key={b.id}>
                  <Chip selected={b.id === band.id} onToggle={() => selectBand(b.id)}>
                    {b.name}
                  </Chip>
                </li>
              ))}
            </ul>

            <div className={styles.subform} aria-labelledby="band-albums-title" role="group">
              <h4 id="band-albums-title" className={styles.subformTitle}>
                {t('albums.ofBand', { name: band.name })}
              </h4>

              {state.status === 'none' && <p className={styles.note}>{t('albums.customBandNote')}</p>}
              {state.status === 'loading' && (
                <p className={cx(styles.resultsCount, styles.statusLine)} aria-live="polite">
                  <LoaderCircle aria-hidden="true" className={styles.spin} /> {t('albums.loading')}
                </p>
              )}
              {state.status === 'error' && (
                <div className={styles.emptyResults}>
                  <p role="alert">{t('albums.loadError')}</p>
                  <Button size="sm" icon={<RotateCw />} onClick={retry}>
                    {t('albums.retry')}
                  </Button>
                </div>
              )}

              {state.status === 'done' && (
                <>
                  {state.albums.length > ALBUMS_PREVIEW && (
                    <Input
                      label={t('albums.filter')}
                      type="search"
                      value={albumQuery}
                      autoComplete="off"
                      onChange={(event) => setAlbumQuery(event.target.value)}
                    />
                  )}
                  {albums.length === 0 ? (
                    <p className={styles.note}>
                      {filtering ? t('albums.noMatch', { query: albumQuery.trim() }) : t('albums.noneForBand')}
                    </p>
                  ) : (
                    <ul className={styles.resultList} aria-label={t('albums.ofBand', { name: band.name })}>
                      {shown.map((album) => {
                        const selected = draft.albums.some((a) => a.id === album.id)
                        return (
                          <li key={album.id} className={cx(styles.resultItem, selected && styles.resultSelected)}>
                            <span className={styles.mediaItem}>
                              <AlbumCover album={album} className={styles.thumb} />
                              <span className={styles.resultText}>
                                <span className={styles.mediaName}>{album.title}</span>
                                {album.year && <span className={styles.mediaMeta}>{album.year}</span>}
                              </span>
                            </span>
                            <Button
                              size="sm"
                              variant={selected ? 'secondary' : 'ghost'}
                              icon={selected ? <Check /> : <Plus />}
                              aria-pressed={selected}
                              aria-label={t(selected ? 'albums.removeFavorite' : 'albums.addFavorite', {
                                title: album.title,
                              })}
                              disabled={!selected && full}
                              onClick={() => toggle(album)}
                            >
                              {selected ? t('bands.inList') : t('common.add')}
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {!showAll && !filtering && albums.length > ALBUMS_PREVIEW && (
                    <div>
                      <Button size="sm" variant="ghost" onClick={() => setShowAll(true)}>
                        {t('albums.showAll', { count: albums.length })}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {draft.albums
                .filter((album) => album.bandId === band.id && album.source === 'custom')
                .map((album) => (
                  <p key={album.id} className={styles.note}>
                    <Badge tone="neutral">{t('bands.custom')}</Badge> {album.title}
                    {album.year && ` · ${album.year}`}
                  </p>
                ))}

              {manual ? (
                <CustomAlbumForm
                  bandName={band.name}
                  onCancel={() => setManual(false)}
                  onSubmit={(input) => {
                    const result = addCustomAlbum(draft, { ...input, bandId: band.id })
                    if (!result.ok) return result.error
                    update(() => result.profile)
                    setManual(false)
                    setFeedback(t('albums.added', { title: result.value.title }))
                    return undefined
                  }}
                />
              ) : (
                <div>
                  <Button size="sm" variant="ghost" icon={<PenLine />} disabled={full} onClick={() => setManual(true)}>
                    {t('albums.addManually')}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        <p className={styles.attribution}>
          {t('music.attribution.before')}{' '}
          <a href="https://musicbrainz.org" target="_blank" rel="noopener noreferrer">
            MusicBrainz
          </a>{' '}
          {t('albums.coverAttribution')}{' '}
          <a href="https://coverartarchive.org" target="_blank" rel="noopener noreferrer">
            Cover Art Archive
          </a>
          .
        </p>
      </section>
    </div>
  )
}
