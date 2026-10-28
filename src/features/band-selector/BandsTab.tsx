import { ArrowDown, ArrowUp, Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select } from '../../components/ui/Select.tsx'
import { countryName, DEMO_SUBGENRES } from '../../data/demo-bands.ts'
import type { Band } from '../../domain/band.ts'
import { LIMITS } from '../../domain/limits.ts'
import { allBands, favoriteBands } from '../../domain/profile.ts'
import { useI18n } from '../../i18n/context.ts'
import { cx } from '../../lib/cx.ts'
import { DEMO_CATALOG } from '../../state/createAppStore.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/EditorForms.module.css'
import { useFocusOnClose } from '../profile-editor/useFocusOnClose.ts'
import { CustomBandForm } from './CustomBandForm.tsx'
import { collectSubgenres, searchBands } from './search.ts'
import {
  addCustomBand,
  addFavoriteBand,
  moveFavoriteBand,
  removeCustomBand,
  removeFavoriteBand,
  updateCustomBand,
} from './selection.ts'

type FormState = { mode: 'closed' } | { mode: 'create'; name: string } | { mode: 'edit'; band: Band }

function meta(band: Band): string {
  return [countryName(band.country), band.formedYear, band.subgenres.slice(0, 2).join(', ')].filter(Boolean).join(' · ')
}

export function BandsTab({ draft, update }: TabProps) {
  const { t, tp } = useI18n()
  const [query, setQuery] = useState('')
  const [subgenre, setSubgenre] = useState('')
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [feedback, setFeedback] = useState('')
  const newBandRef = useFocusOnClose(form.mode !== 'closed')

  const bands = useMemo(() => allBands(draft, DEMO_CATALOG.bands), [draft])
  const favorites = favoriteBands(draft, DEMO_CATALOG.bands)
  const results = useMemo(() => searchBands(bands, { query, subgenre }), [bands, query, subgenre])
  const subgenreOptions = useMemo(
    () => collectSubgenres(DEMO_SUBGENRES, ...bands.map((band) => band.subgenres)),
    [bands],
  )

  const toggleFavorite = (band: Band) => {
    if (draft.favoriteBandIds.includes(band.id)) {
      update((d) => removeFavoriteBand(d, band.id))
      setFeedback(t('bands.removed', { name: band.name }))
      return
    }
    const result = addFavoriteBand(draft, band.id)
    if (!result.ok) return setFeedback(result.error)
    update(() => result.profile)
    setFeedback(t('bands.added', { name: band.name, position: result.profile.favoriteBandIds.length }))
  }

  const moveBand = (band: Band, delta: number) => {
    const next = moveFavoriteBand(draft, band.id, delta)
    update(() => next)
    setFeedback(t('bands.moved', { name: band.name, position: next.favoriteBandIds.indexOf(band.id) + 1 }))
  }

  const trimmed = query.trim()

  return (
    <div className={styles.stack}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {feedback}
      </p>

      <section aria-labelledby="ranking-title" className={styles.block}>
        <h3 id="ranking-title" className={styles.blockTitle}>
          {t('bands.ranking')}{' '}
          <span className={styles.count}>
            {favorites.length}/{LIMITS.favoriteBands.max}
          </span>
        </h3>
        {favorites.length === 0 ? (
          <p className={styles.empty}>{t('bands.rankingEmpty')}</p>
        ) : (
          <ol className={styles.rankList}>
            {favorites.map((band, index) => (
              <li key={band.id} className={styles.rankItem}>
                <span className={styles.rank} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.rankName}>
                  {band.name}
                  {band.isCustom && <Badge tone="neutral">{t('bands.custom')}</Badge>}
                </span>
                <span className={styles.rankActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ArrowUp />}
                    aria-label={t('common.moveUp', { name: band.name })}
                    disabled={index === 0}
                    onClick={() => moveBand(band, -1)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ArrowDown />}
                    aria-label={t('common.moveDown', { name: band.name })}
                    disabled={index === favorites.length - 1}
                    onClick={() => moveBand(band, 1)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<X />}
                    aria-label={t('bands.removeFavorite', { name: band.name })}
                    onClick={() => toggleFavorite(band)}
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
        <p className={styles.note}>{t('bands.catalogNote')}</p>
        <div className={styles.row}>
          <Input
            label={t('bands.name')}
            type="search"
            placeholder={t('bands.namePlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label={t('bands.subgenre')}
            options={[{ value: '', label: t('bands.allSubgenres') }, ...subgenreOptions.map((g) => ({ value: g, label: g }))]}
            value={subgenre}
            onChange={(event) => setSubgenre(event.target.value)}
          />
        </div>

        <p className={styles.resultsCount} aria-live="polite">
          {tp('bands.results', results.length)}
        </p>

        {results.length === 0 ? (
          <div className={styles.emptyResults}>
            <Search aria-hidden="true" />
            <p>
              {trimmed
                ? subgenre
                  ? t('bands.noMatchIn', { query: trimmed, subgenre })
                  : t('bands.noMatch', { query: trimmed })
                : t('bands.noneInSubgenre', { subgenre })}
            </p>
            {trimmed && (
              <Button size="sm" icon={<Plus />} onClick={() => setForm({ mode: 'create', name: trimmed })}>
                {t('bands.addAsCustom', { name: trimmed })}
              </Button>
            )}
          </div>
        ) : (
          <ul className={styles.resultList}>
            {results.map((band) => {
              const selected = draft.favoriteBandIds.includes(band.id)
              return (
                <li key={band.id} className={cx(styles.resultItem, selected && styles.resultSelected)}>
                  <span className={styles.resultText}>
                    <span className={styles.resultName}>
                      {band.name}
                      {band.isCustom && <Badge tone="neutral">{t('bands.custom')}</Badge>}
                    </span>
                    <span className={styles.resultMeta}>{meta(band)}</span>
                  </span>
                  <Button
                    size="sm"
                    variant={selected ? 'secondary' : 'ghost'}
                    icon={selected ? <Check /> : <Plus />}
                    aria-pressed={selected}
                    aria-label={
                      selected ? t('bands.removeFavorite', { name: band.name }) : t('bands.addFavorite', { name: band.name })
                    }
                    onClick={() => toggleFavorite(band)}
                  >
                    {selected ? t('bands.inList') : t('common.add')}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="custom-bands-title" className={styles.block}>
        <div className={styles.blockHeader}>
          <h3 id="custom-bands-title" className={styles.blockTitle}>
            {t('bands.customTitle')}{' '}
            <span className={styles.count}>
              {draft.customBands.length}/{LIMITS.customBands.max}
            </span>
          </h3>
          {form.mode === 'closed' && (
            <Button ref={newBandRef} size="sm" icon={<Plus />} onClick={() => setForm({ mode: 'create', name: '' })}>
              {t('bands.newBand')}
            </Button>
          )}
        </div>

        {form.mode !== 'closed' && (
          <CustomBandForm
            key={form.mode === 'edit' ? form.band.id : `new-${form.name}`}
            band={form.mode === 'edit' ? form.band : undefined}
            initialName={form.mode === 'create' ? form.name : undefined}
            subgenreOptions={subgenreOptions}
            onCancel={() => setForm({ mode: 'closed' })}
            onSubmit={(input) => {
              const result =
                form.mode === 'edit'
                  ? updateCustomBand(draft, form.band.id, input, DEMO_CATALOG)
                  : addCustomBand(draft, input, DEMO_CATALOG)
              if (!result.ok) return result.error
              update(() => result.profile)
              setForm({ mode: 'closed' })
              setQuery('')
              setFeedback(t(form.mode === 'edit' ? 'bands.updated' : 'bands.customAdded', { name: result.value.name }))
              return undefined
            }}
          />
        )}

        {draft.customBands.length === 0 ? (
          form.mode === 'closed' && <p className={styles.empty}>{t('bands.customEmpty')}</p>
        ) : (
          <ul className={styles.resultList}>
            {draft.customBands.map((band) => (
              <li key={band.id} className={styles.resultItem}>
                <span className={styles.resultText}>
                  <span className={styles.resultName}>{band.name}</span>
                  <span className={styles.resultMeta}>{meta(band) || t('bands.noDetails')}</span>
                </span>
                <span className={styles.rankActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Pencil />}
                    aria-label={t('common.editItem', { name: band.name })}
                    onClick={() => setForm({ mode: 'edit', band })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 />}
                    aria-label={t('common.deleteItem', { name: band.name })}
                    onClick={() => {
                      update((d) => removeCustomBand(d, band.id))
                      if (form.mode === 'edit' && form.band.id === band.id) setForm({ mode: 'closed' })
                      setFeedback(t('bands.deleted', { name: band.name }))
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
