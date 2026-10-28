import { ArrowDown, ArrowUp, Check, LoaderCircle, Pencil, PenLine, Plus, RotateCw, Search, X } from 'lucide-react'
import { useState } from 'react'
import { BandArt } from '../../components/art/BandArt.tsx'
import { Badge } from '../../components/ui/Badge.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import type { Band } from '../../domain/band.ts'
import { LIMITS } from '../../domain/limits.ts'
import { useI18n } from '../../i18n/context.ts'
import { countryName } from '../../lib/countries.ts'
import { cx } from '../../lib/cx.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/EditorForms.module.css'
import { useFocusOnClose } from '../profile-editor/useFocusOnClose.ts'
import { CustomBandForm } from './CustomBandForm.tsx'
import { addBand, addCustomBand, moveBand, removeBand, updateCustomBand } from './selection.ts'
import { useArtistSearch } from './useArtistSearch.ts'

type FormState = { mode: 'closed' } | { mode: 'create'; name: string } | { mode: 'edit'; band: Band }

function bandMeta(band: Band, extra?: string): string {
  return [countryName(band.country), band.formedYear, extra].filter(Boolean).join(' · ')
}

/**
 * Bandas favoritas: ranking no topo e pesquisa na MusicBrainz por baixo. A
 * lista de resultados começa vazia — só aparece depois de se escrever. Quando
 * a banda não existe ou a API falha, pode criar-se à mão.
 */
export function BandsTab({ draft, update }: TabProps) {
  const { t, tp } = useI18n()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [feedback, setFeedback] = useState('')
  const { state: search, retry } = useArtistSearch(query)
  const manualRef = useFocusOnClose(form.mode !== 'closed')
  const trimmed = query.trim()
  const full = draft.bands.length >= LIMITS.favoriteBands.max

  const toggle = (band: Band) => {
    if (draft.bands.some((item) => item.id === band.id)) {
      update((d) => removeBand(d, band.id))
      setFeedback(t('bands.removed', { name: band.name }))
      return
    }
    const result = addBand(draft, band)
    if (!result.ok) return setFeedback(result.error)
    update(() => result.profile)
    setFeedback(t('bands.added', { name: band.name, position: result.profile.bands.length }))
  }

  const move = (band: Band, delta: number) => {
    const next = moveBand(draft, band.id, delta)
    update(() => next)
    setFeedback(t('bands.moved', { name: band.name, position: next.bands.findIndex((b) => b.id === band.id) + 1 }))
  }

  const addManually = (
    <Button
      ref={manualRef}
      size="sm"
      variant="ghost"
      icon={<PenLine />}
      disabled={full}
      onClick={() => setForm({ mode: 'create', name: trimmed })}
    >
      {trimmed ? t('bands.addAsCustom', { name: trimmed }) : t('bands.addManually')}
    </Button>
  )

  return (
    <div className={styles.stack}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {feedback}
      </p>

      <section aria-labelledby="ranking-title" className={styles.block}>
        <h3 id="ranking-title" className={styles.blockTitle}>
          {t('bands.ranking')}{' '}
          <span className={styles.count}>
            {draft.bands.length}/{LIMITS.favoriteBands.max}
          </span>
        </h3>
        {draft.bands.length === 0 ? (
          <p className={styles.empty}>{t('bands.rankingEmpty')}</p>
        ) : (
          <ol className={styles.rankList} aria-label={t('bands.ranking')}>
            {draft.bands.map((band, index) => (
              <li key={band.id} className={styles.rankItem}>
                <span className={styles.rank} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <BandArt band={band} size={80} className={styles.thumb} />
                <span className={styles.resultText}>
                  <span className={styles.rankName}>
                    {band.name}
                    {band.source === 'custom' && <Badge tone="neutral">{t('bands.custom')}</Badge>}
                  </span>
                  {bandMeta(band) && <span className={styles.resultMeta}>{bandMeta(band)}</span>}
                </span>
                <span className={styles.rankActions}>
                  {band.source === 'custom' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Pencil />}
                      aria-label={t('common.editItem', { name: band.name })}
                      onClick={() => setForm({ mode: 'edit', band })}
                    />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ArrowUp />}
                    aria-label={t('common.moveUp', { name: band.name })}
                    disabled={index === 0}
                    onClick={() => move(band, -1)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ArrowDown />}
                    aria-label={t('common.moveDown', { name: band.name })}
                    disabled={index === draft.bands.length - 1}
                    onClick={() => move(band, 1)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<X />}
                    aria-label={t('bands.removeFavorite', { name: band.name })}
                    onClick={() => toggle(band)}
                  />
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="search-title" className={styles.block}>
        <h3 id="search-title" className={styles.blockTitle}>
          {t('bands.search')}
        </h3>
        <Input
          label={t('bands.name')}
          type="search"
          placeholder={t('bands.namePlaceholder')}
          value={query}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />

        <div aria-live="polite">
          {search.status === 'loading' && (
            <p className={cx(styles.resultsCount, styles.statusLine)}>
              <LoaderCircle aria-hidden="true" className={styles.spin} /> {t('bands.searching')}
            </p>
          )}
          {search.status === 'done' && search.results.length > 0 && (
            <p className={styles.resultsCount}>{tp('bands.results', search.results.length)}</p>
          )}
        </div>

        {search.status === 'error' && (
          <div className={styles.emptyResults}>
            <p role="alert">{t('bands.searchError')}</p>
            <Button size="sm" icon={<RotateCw />} onClick={retry}>
              {t('albums.retry')}
            </Button>
            {form.mode === 'closed' && addManually}
          </div>
        )}

        {search.status === 'done' && search.results.length === 0 && (
          <div className={styles.emptyResults}>
            <Search aria-hidden="true" />
            <p>{t('bands.noMatch', { query: search.query })}</p>
            {form.mode === 'closed' && addManually}
          </div>
        )}

        {search.status === 'done' && search.results.length > 0 && (
          <>
            <ul className={styles.resultList} aria-label={t('bands.resultsLabel')}>
              {search.results.map(({ band, disambiguation }) => {
                const selected = draft.bands.some((item) => item.id === band.id)
                return (
                  <li key={band.id} className={cx(styles.resultItem, selected && styles.resultSelected)}>
                    <span className={styles.mediaItem}>
                      <BandArt band={band} size={80} className={styles.thumb} />
                      <span className={styles.resultText}>
                        <span className={styles.resultName}>{band.name}</span>
                        <span className={styles.resultMeta}>
                          {bandMeta(band, disambiguation) || t('bands.noDetails')}
                        </span>
                        {band.subgenres.length > 0 && (
                          <span className={styles.resultMeta}>{band.subgenres.slice(0, 3).join(', ')}</span>
                        )}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant={selected ? 'secondary' : 'ghost'}
                      icon={selected ? <Check /> : <Plus />}
                      aria-pressed={selected}
                      aria-label={
                        selected
                          ? t('bands.removeFavorite', { name: band.name })
                          : t('bands.addFavorite', { name: band.name })
                      }
                      disabled={!selected && full}
                      onClick={() => toggle(band)}
                    >
                      {selected ? t('bands.inList') : t('common.add')}
                    </Button>
                  </li>
                )
              })}
            </ul>
            {form.mode === 'closed' && <p className={styles.note}>{t('bands.notListed')} {addManually}</p>}
          </>
        )}

        {search.status === 'idle' && form.mode === 'closed' && <div>{addManually}</div>}

        {form.mode !== 'closed' && (
          <CustomBandForm
            key={form.mode === 'edit' ? form.band.id : `new-${form.name}`}
            band={form.mode === 'edit' ? form.band : undefined}
            initialName={form.mode === 'create' ? form.name : undefined}
            onCancel={() => setForm({ mode: 'closed' })}
            onSubmit={(input) => {
              const result =
                form.mode === 'edit' ? updateCustomBand(draft, form.band.id, input) : addCustomBand(draft, input)
              if (!result.ok) return result.error
              update(() => result.profile)
              setForm({ mode: 'closed' })
              setQuery('')
              setFeedback(t(form.mode === 'edit' ? 'bands.updated' : 'bands.customAdded', { name: result.value.name }))
              return undefined
            }}
          />
        )}

        <p className={styles.attribution}>
          {t('music.attribution.before')}{' '}
          <a href="https://musicbrainz.org" target="_blank" rel="noopener noreferrer">
            MusicBrainz
          </a>{' '}
          {t('music.attribution.after')}
        </p>
      </section>
    </div>
  )
}
