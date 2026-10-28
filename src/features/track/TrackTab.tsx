import { Check, LoaderCircle, Music, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { useI18n } from '../../i18n/context.ts'
import { cx } from '../../lib/cx.ts'
import {
  analysePreview,
  searchTracks,
  toFeaturedTrack,
  TrackError,
  type DecodeAudio,
  type FetchLike,
  type TrackResult,
} from '../../lib/track/itunes.ts'
import styles from '../profile-editor/EditorForms.module.css'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import own from './TrackTab.module.css'

type SearchState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'done'; query: string; results: TrackResult[] }
  | { status: 'error' }

interface TrackTabProps extends TabProps {
  /** Injetáveis para os testes; por omissão usam fetch e a Web Audio API. */
  fetchFn?: FetchLike
  decode?: DecodeAudio
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * Música em destaque: pesquisa no catálogo público do iTunes, escolha de uma
 * faixa e análise da pré-visualização real para obter a forma de onda. Se a
 * rede ou o áudio falharem, nada é alterado e o erro é explicado.
 */
export function TrackTab({ draft, update, fetchFn, decode }: TrackTabProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<SearchState>({ status: 'idle' })
  const [analysing, setAnalysing] = useState<TrackResult>()
  const [error, setError] = useState<string>()
  const [feedback, setFeedback] = useState('')
  const controller = useRef<AbortController>(null)

  // Cancela pedidos pendentes ao sair da secção.
  useEffect(() => () => controller.current?.abort(), [])

  const restart = () => {
    controller.current?.abort()
    controller.current = new AbortController()
    return controller.current.signal
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    const signal = restart()
    setError(undefined)
    setAnalysing(undefined)
    setSearch({ status: 'searching' })
    try {
      const results = await searchTracks(term, { fetchFn, signal })
      setSearch({ status: 'done', query: term, results })
    } catch (caught) {
      if (isAbort(caught)) return
      setSearch({ status: 'error' })
    }
  }

  const pick = async (result: TrackResult) => {
    const signal = restart()
    setError(undefined)
    setAnalysing(result)
    try {
      const peaks = await analysePreview(result.previewUrl, { fetchFn, decode, signal })
      update((current) => ({ ...current, featuredTrack: toFeaturedTrack(result, peaks) }))
      setFeedback(t('trackTab.picked', { title: result.title }))
    } catch (caught) {
      if (isAbort(caught)) return
      setError(
        caught instanceof TrackError && caught.code === 'no-preview'
          ? t('trackTab.error.noPreview')
          : t('trackTab.error.audio'),
      )
    }
    setAnalysing(undefined)
  }

  const remove = () => {
    update((current) => {
      const next = { ...current }
      delete next.featuredTrack
      return next
    })
    setFeedback(t('trackTab.removed'))
  }

  const track = draft.featuredTrack
  const busy = search.status === 'searching' || analysing !== undefined

  return (
    <div className={styles.stack}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {feedback}
      </p>
      <p className={styles.note}>{t('trackTab.intro')}</p>

      <section className={styles.block} aria-labelledby="track-current-title">
        <h3 id="track-current-title" className={styles.blockTitle}>
          {t('trackTab.current')}
        </h3>
        {track ? (
          <div className={own.current}>
            <div className={own.item}>
              {track.artworkUrl ? (
                <img src={track.artworkUrl} alt="" width={56} height={56} className={cx(own.thumb, own.thumbLarge)} />
              ) : (
                <Music aria-hidden="true" className={cx(own.thumb, own.thumbLarge)} />
              )}
              <span className={styles.resultText}>
                <span className={own.name}>{track.title}</span>
                <span className={own.meta}>{[track.artist, track.album].filter(Boolean).join(' · ')}</span>
              </span>
            </div>
            <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={remove}>
              {t('trackTab.remove')}
            </Button>
          </div>
        ) : (
          <p className={styles.note}>{t('trackTab.none')}</p>
        )}
      </section>

      <section className={styles.block} aria-labelledby="track-search-title">
        <h3 id="track-search-title" className={styles.blockTitle}>
          {t('trackTab.search')}
        </h3>
        <form className={styles.inlineForm} onSubmit={submit} role="search">
          <Input
            label={t('trackTab.searchLabel')}
            type="search"
            placeholder={t('trackTab.searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" size="sm" icon={<Search />} disabled={!query.trim() || search.status === 'searching'}>
            {t('trackTab.searchButton')}
          </Button>
        </form>

        <div aria-live="polite">
          {search.status === 'searching' && (
            <p className={cx(styles.resultsCount, own.status)}>
              <LoaderCircle aria-hidden="true" className={own.spin} /> {t('trackTab.searching')}
            </p>
          )}
          {search.status === 'error' && <p className={styles.formError}>{t('trackTab.error.search')}</p>}
          {analysing && (
            <p className={cx(styles.resultsCount, own.status)}>
              <LoaderCircle aria-hidden="true" className={own.spin} /> {t('trackTab.analysing', { title: analysing.title })}
            </p>
          )}
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
        </div>

        {search.status === 'done' &&
          (search.results.length === 0 ? (
            <div className={styles.emptyResults}>
              <Search aria-hidden="true" />
              <p>{t('trackTab.noResults', { query: search.query })}</p>
            </div>
          ) : (
            <ul className={styles.resultList} aria-label={t('trackTab.results')}>
              {search.results.map((result) => {
                const selected = track?.trackId === result.trackId
                return (
                  <li key={result.trackId} className={cx(styles.resultItem, selected && styles.resultSelected)}>
                    <span className={own.item}>
                      {result.artworkUrl ? (
                        <img src={result.artworkUrl} alt="" width={40} height={40} loading="lazy" className={own.thumb} />
                      ) : (
                        <Music aria-hidden="true" className={own.thumb} />
                      )}
                      <span className={styles.resultText}>
                        <span className={own.name}>{result.title}</span>
                        <span className={own.meta}>{[result.artist, result.album].filter(Boolean).join(' · ')}</span>
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant={selected ? 'secondary' : 'ghost'}
                      icon={
                        analysing?.trackId === result.trackId ? (
                          <LoaderCircle className={own.spin} />
                        ) : selected ? (
                          <Check />
                        ) : (
                          <Plus />
                        )
                      }
                      aria-label={t('trackTab.pick', { title: `${result.title} — ${result.artist}` })}
                      aria-pressed={selected}
                      disabled={busy || selected}
                      onClick={() => pick(result)}
                    >
                      {selected ? t('trackTab.featured') : t('common.add')}
                    </Button>
                  </li>
                )
              })}
            </ul>
          ))}
      </section>

      <p className={own.attribution}>{t('trackTab.attribution')}</p>
    </div>
  )
}
