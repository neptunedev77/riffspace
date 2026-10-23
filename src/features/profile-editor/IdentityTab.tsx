import { LIMITS } from '../../domain/limits.ts'
import type { Profile } from '../../domain/profile.ts'
import { Avatar } from '../../components/profile/Avatar.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Textarea } from '../../components/ui/Textarea.tsx'
import { cx } from '../../lib/cx.ts'
import styles from './ProfileEditor.module.css'

export interface TabProps {
  draft: Profile
  update: (updater: (draft: Profile) => Profile) => void
  /** Erro a mostrar num campo (só depois de o campo ser tocado ou de uma tentativa de guardar). */
  errorFor: (path: string) => string | undefined
  touch: (path: string) => void
}

export function IdentityTab({ draft, update, errorFor, touch }: TabProps) {
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => update((d) => ({ ...d, [key]: value }))
  const avatarUrl = draft.avatar.kind === 'url' ? draft.avatar.url : ''

  return (
    <div className={styles.stack}>
      <Input
        label="Nickname"
        value={draft.nickname}
        maxLength={LIMITS.nickname.max}
        autoComplete="off"
        spellCheck={false}
        hint="Minúsculas, números, “.”, “_” ou “-”. Usado no teu @handle."
        error={errorFor('nickname')}
        onChange={(event) => set('nickname', event.target.value.toLowerCase())}
        onBlur={() => touch('nickname')}
      />
      <Input
        label="Nome de apresentação (opcional)"
        value={draft.displayName ?? ''}
        maxLength={LIMITS.displayName.max}
        error={errorFor('displayName')}
        onChange={(event) => set('displayName', event.target.value)}
        onBlur={() => touch('displayName')}
      />
      <Input
        label="Tagline"
        value={draft.tagline}
        maxLength={LIMITS.tagline.max}
        hint="Uma frase curta que aparece por baixo do teu nome."
        error={errorFor('tagline')}
        onChange={(event) => set('tagline', event.target.value)}
        onBlur={() => touch('tagline')}
      />
      <Textarea
        label="Bio"
        value={draft.bio}
        maxLength={LIMITS.bio.max}
        rows={5}
        error={errorFor('bio')}
        onChange={(event) => set('bio', event.target.value)}
        onBlur={() => touch('bio')}
      />
      <Input
        label="Localização (opcional)"
        value={draft.location ?? ''}
        maxLength={LIMITS.location.max}
        autoComplete="address-level2"
        hint="Cidade ou país, se quiseres partilhar."
        error={errorFor('location')}
        onChange={(event) => set('location', event.target.value)}
        onBlur={() => touch('location')}
      />

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Avatar</legend>
        <div className={styles.avatarRow}>
          <div className={styles.avatarPreview}>
            <Avatar avatar={draft.avatar} seed={draft.nickname} label="Pré-visualização do avatar" />
          </div>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                name="avatar-kind"
                checked={draft.avatar.kind === 'generated'}
                onChange={() => set('avatar', { kind: 'generated' })}
              />
              <span>
                Sigilo gerado
                <small>Arte original criada a partir do nickname.</small>
              </span>
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="avatar-kind"
                checked={draft.avatar.kind === 'url'}
                onChange={() => set('avatar', { kind: 'url', url: avatarUrl })}
              />
              <span>
                Imagem por URL
                <small>Usa apenas imagens que tenhas direito a usar.</small>
              </span>
            </label>
          </div>
        </div>
        {draft.avatar.kind === 'url' && (
          <Input
            label="URL da imagem"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={avatarUrl}
            maxLength={LIMITS.url.max}
            className={cx(styles.indent)}
            hint="Se a imagem não carregar, mostramos o sigilo gerado."
            error={errorFor('avatar.url')}
            onChange={(event) => set('avatar', { kind: 'url', url: event.target.value })}
            onBlur={() => touch('avatar.url')}
          />
        )}
      </fieldset>
    </div>
  )
}
