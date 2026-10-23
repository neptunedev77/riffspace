import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button.tsx'
import { Chip } from '../../components/ui/Chip.tsx'
import type { Album } from '../../domain/album.ts'
import { LIMITS } from '../../domain/limits.ts'
import { allAlbums, allBands } from '../../domain/profile.ts'
import { DEMO_CATALOG } from '../../state/createAppStore.ts'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import styles from '../profile-editor/ProfileEditor.module.css'
import { CustomAlbumForm } from './CustomAlbumForm.tsx'
import { addCustomAlbum, removeCustomAlbum, toggleFavoriteAlbum, updateCustomAlbum } from './selection.ts'

type FormState = { mode: 'closed' } | { mode: 'create'; bandId?: string } | { mode: 'edit'; album: Album }

export function AlbumsTab({ draft, update }: TabProps) {
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [feedback, setFeedback] = useState('')

  const bands = useMemo(() => allBands(draft, DEMO_CATALOG.bands), [draft])
  const albums = useMemo(() => allAlbums(draft, DEMO_CATALOG.albums), [draft])

  // Mostra as bandas favoritas (pela ordem do ranking) e ainda as bandas de álbuns já escolhidos.
  const groups = useMemo(() => {
    const favoriteAlbumBands = albums.filter((a) => draft.favoriteAlbumIds.includes(a.id)).map((a) => a.bandId)
    const bandIds = [...new Set([...draft.favoriteBandIds, ...favoriteAlbumBands])]
    return bandIds.flatMap((id) => {
      const band = bands.find((b) => b.id === id)
      return band ? [{ band, albums: albums.filter((a) => a.bandId === id) }] : []
    })
  }, [albums, bands, draft.favoriteAlbumIds, draft.favoriteBandIds])

  const bandOptions = useMemo(() => {
    const ordered = [...groups.map((g) => g.band), ...bands.filter((b) => !groups.some((g) => g.band.id === b.id))]
    return ordered.map((band) => ({ value: band.id, label: band.name }))
  }, [bands, groups])

  const toggle = (album: Album) => {
    const result = toggleFavoriteAlbum(draft, album.id)
    if (!result.ok) return setFeedback(result.error)
    update(() => result.profile)
    setFeedback(result.value ? `${album.title} adicionado aos favoritos.` : `${album.title} removido dos favoritos.`)
  }

  return (
    <div className={styles.stack}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {feedback}
      </p>

      <div className={styles.blockHeader}>
        <p className={styles.note}>
          Álbuns favoritos:{' '}
          <span className={styles.count}>
            {draft.favoriteAlbumIds.length}/{LIMITS.favoriteAlbums.max}
          </span>
        </p>
        {form.mode === 'closed' && bands.length > 0 && (
          <Button size="sm" icon={<Plus />} onClick={() => setForm({ mode: 'create' })}>
            Novo álbum
          </Button>
        )}
      </div>

      {form.mode !== 'closed' && (
        <CustomAlbumForm
          key={form.mode === 'edit' ? form.album.id : `new-${form.bandId ?? ''}`}
          album={form.mode === 'edit' ? form.album : undefined}
          initialBandId={form.mode === 'create' ? form.bandId : undefined}
          bandOptions={bandOptions}
          onCancel={() => setForm({ mode: 'closed' })}
          onSubmit={(input) => {
            const result =
              form.mode === 'edit'
                ? updateCustomAlbum(draft, form.album.id, input, DEMO_CATALOG)
                : addCustomAlbum(draft, input, DEMO_CATALOG)
            if (!result.ok) return result.error
            update(() => result.profile)
            setForm({ mode: 'closed' })
            setFeedback(form.mode === 'edit' ? `${result.value.title} atualizado.` : `${result.value.title} adicionado aos favoritos.`)
            return undefined
          }}
        />
      )}

      {groups.length === 0 ? (
        <p className={styles.empty}>
          Adiciona bandas favoritas no separador “Bandas” para escolher os álbuns delas, ou cria um álbum personalizado.
        </p>
      ) : (
        groups.map(({ band, albums: bandAlbums }) => (
          <section key={band.id} className={styles.block} aria-label={`Álbuns de ${band.name}`}>
            <div className={styles.blockHeader}>
              <h3 className={styles.blockTitle}>{band.name}</h3>
              <Button
                size="sm"
                variant="ghost"
                icon={<Plus />}
                aria-label={`Adicionar álbum de ${band.name}`}
                onClick={() => setForm({ mode: 'create', bandId: band.id })}
              />
            </div>
            {bandAlbums.length === 0 ? (
              <p className={styles.empty}>Sem álbuns no catálogo para esta banda.</p>
            ) : (
              <ul className={styles.chips}>
                {bandAlbums.map((album) => {
                  const custom = draft.customAlbums.some((a) => a.id === album.id)
                  return (
                    <li key={album.id} className={styles.albumChip}>
                      <Chip selected={draft.favoriteAlbumIds.includes(album.id)} onToggle={() => toggle(album)}>
                        {album.title}
                        {album.year && <span className={styles.chipMeta}>{album.year}</span>}
                      </Chip>
                      {custom && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Pencil />}
                            aria-label={`Editar ${album.title}`}
                            onClick={() => setForm({ mode: 'edit', album })}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 />}
                            aria-label={`Apagar ${album.title}`}
                            onClick={() => {
                              update((d) => removeCustomAlbum(d, album.id))
                              if (form.mode === 'edit' && form.album.id === album.id) setForm({ mode: 'closed' })
                              setFeedback(`${album.title} apagado.`)
                            }}
                          />
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  )
}
