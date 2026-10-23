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
import { cx } from '../../lib/cx.ts'
import { DEMO_CATALOG } from '../../state/createAppStore.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/ProfileEditor.module.css'
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
  const [query, setQuery] = useState('')
  const [subgenre, setSubgenre] = useState('')
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [feedback, setFeedback] = useState('')

  const bands = useMemo(() => allBands(draft, DEMO_CATALOG.bands), [draft])
  const favorites = favoriteBands(draft, DEMO_CATALOG.bands)
  const results = useMemo(() => searchBands(bands, { query, subgenre }), [bands, query, subgenre])
  const subgenreOptions = useMemo(
    () => collectSubgenres(DEMO_SUBGENRES, ...bands.map((band) => band.subgenres)),
    [bands],
  )

  const say = (message: string) => setFeedback(message)

  const toggleFavorite = (band: Band) => {
    if (draft.favoriteBandIds.includes(band.id)) {
      update((d) => removeFavoriteBand(d, band.id))
      say(`${band.name} removida das favoritas.`)
      return
    }
    const result = addFavoriteBand(draft, band.id)
    if (!result.ok) return say(result.error)
    update(() => result.profile)
    say(`${band.name} adicionada na posição ${result.profile.favoriteBandIds.length}.`)
  }

  const moveBand = (band: Band, delta: number) => {
    const next = moveFavoriteBand(draft, band.id, delta)
    update(() => next)
    say(`${band.name} está agora na posição ${next.favoriteBandIds.indexOf(band.id) + 1}.`)
  }

  return (
    <div className={styles.stack}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {feedback}
      </p>

      <section aria-labelledby="ranking-title" className={styles.block}>
        <h3 id="ranking-title" className={styles.blockTitle}>
          O teu ranking{' '}
          <span className={styles.count}>
            {favorites.length}/{LIMITS.favoriteBands.max}
          </span>
        </h3>
        {favorites.length === 0 ? (
          <p className={styles.empty}>Ainda não escolheste bandas. Pesquisa abaixo e adiciona as tuas favoritas.</p>
        ) : (
          <ol className={styles.rankList}>
            {favorites.map((band, index) => (
              <li key={band.id} className={styles.rankItem}>
                <span className={styles.rank} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.rankName}>
                  {band.name}
                  {band.isCustom && <Badge tone="neutral">Personalizada</Badge>}
                </span>
                <span className={styles.rankActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ArrowUp />}
                    aria-label={`Subir ${band.name}`}
                    disabled={index === 0}
                    onClick={() => moveBand(band, -1)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ArrowDown />}
                    aria-label={`Descer ${band.name}`}
                    disabled={index === favorites.length - 1}
                    onClick={() => moveBand(band, 1)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<X />}
                    aria-label={`Remover ${band.name} das favoritas`}
                    onClick={() => toggleFavorite(band)}
                  />
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="pesquisa-title" className={styles.block}>
        <h3 id="pesquisa-title" className={styles.blockTitle}>
          Procurar bandas
        </h3>
        <p className={styles.note}>Catálogo local de demonstração, pequeno e incompleto. Se não encontrares a tua banda, adiciona-a.</p>
        <div className={styles.row}>
          <Input
            label="Nome"
            type="search"
            placeholder="p. ex. Gojira"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label="Subgénero"
            options={[{ value: '', label: 'Todos' }, ...subgenreOptions.map((g) => ({ value: g, label: g }))]}
            value={subgenre}
            onChange={(event) => setSubgenre(event.target.value)}
          />
        </div>

        <p className={styles.resultsCount} aria-live="polite">
          {results.length === 1 ? '1 resultado' : `${results.length} resultados`}
        </p>

        {results.length === 0 ? (
          <div className={styles.emptyResults}>
            <Search aria-hidden="true" />
            <p>
              {query.trim()
                ? `Nenhuma banda corresponde a “${query.trim()}”${subgenre ? ` em ${subgenre}` : ''}.`
                : `Nenhuma banda de ${subgenre} no catálogo.`}
            </p>
            {query.trim() && (
              <Button size="sm" icon={<Plus />} onClick={() => setForm({ mode: 'create', name: query.trim() })}>
                Adicionar “{query.trim()}” como banda personalizada
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
                      {band.isCustom && <Badge tone="neutral">Personalizada</Badge>}
                    </span>
                    <span className={styles.resultMeta}>{meta(band)}</span>
                  </span>
                  <Button
                    size="sm"
                    variant={selected ? 'secondary' : 'ghost'}
                    icon={selected ? <Check /> : <Plus />}
                    aria-pressed={selected}
                    aria-label={selected ? `Remover ${band.name} das favoritas` : `Adicionar ${band.name} às favoritas`}
                    onClick={() => toggleFavorite(band)}
                  >
                    {selected ? 'Na lista' : 'Adicionar'}
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
            Bandas personalizadas{' '}
            <span className={styles.count}>
              {draft.customBands.length}/{LIMITS.customBands.max}
            </span>
          </h3>
          {form.mode === 'closed' && (
            <Button size="sm" icon={<Plus />} onClick={() => setForm({ mode: 'create', name: '' })}>
              Nova banda
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
              say(form.mode === 'edit' ? `${result.value.name} atualizada.` : `${result.value.name} adicionada às favoritas.`)
              return undefined
            }}
          />
        )}

        {draft.customBands.length === 0 ? (
          form.mode === 'closed' && <p className={styles.empty}>Ainda não adicionaste bandas fora do catálogo.</p>
        ) : (
          <ul className={styles.resultList}>
            {draft.customBands.map((band) => (
              <li key={band.id} className={styles.resultItem}>
                <span className={styles.resultText}>
                  <span className={styles.resultName}>{band.name}</span>
                  <span className={styles.resultMeta}>{meta(band) || 'Sem detalhes'}</span>
                </span>
                <span className={styles.rankActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Pencil />}
                    aria-label={`Editar ${band.name}`}
                    onClick={() => setForm({ mode: 'edit', band })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 />}
                    aria-label={`Apagar ${band.name}`}
                    onClick={() => {
                      update((d) => removeCustomBand(d, band.id))
                      if (form.mode === 'edit' && form.band.id === band.id) setForm({ mode: 'closed' })
                      say(`${band.name} apagada, com os seus álbuns personalizados.`)
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
