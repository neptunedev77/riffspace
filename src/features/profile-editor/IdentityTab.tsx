import { LIMITS } from '../../domain/limits.ts'
import type { Profile } from '../../domain/profile.ts'
import { Avatar } from '../../components/profile/Avatar.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Textarea } from '../../components/ui/Textarea.tsx'
import { useI18n } from '../../i18n/context.ts'
import styles from './EditorForms.module.css'

export interface TabProps {
  draft: Profile
  update: (updater: (draft: Profile) => Profile) => void
  /** Erro a mostrar num campo (só depois de o campo ser tocado ou de uma tentativa de guardar). */
  errorFor: (path: string) => string | undefined
  touch: (path: string) => void
}

export function IdentityTab({ draft, update, errorFor, touch }: TabProps) {
  const { t } = useI18n()
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => update((d) => ({ ...d, [key]: value }))
  const avatarUrl = draft.avatar.kind === 'url' ? draft.avatar.url : ''

  return (
    <div className={styles.stack}>
      <Input
        label={t('identity.nickname')}
        value={draft.nickname}
        maxLength={LIMITS.nickname.max}
        autoComplete="off"
        spellCheck={false}
        hint={t('identity.nicknameHint')}
        error={errorFor('nickname')}
        onChange={(event) => set('nickname', event.target.value.toLowerCase())}
        onBlur={() => touch('nickname')}
      />
      <Input
        label={t('identity.displayName')}
        value={draft.displayName ?? ''}
        maxLength={LIMITS.displayName.max}
        error={errorFor('displayName')}
        onChange={(event) => set('displayName', event.target.value)}
        onBlur={() => touch('displayName')}
      />
      <Input
        label={t('identity.tagline')}
        value={draft.tagline}
        maxLength={LIMITS.tagline.max}
        hint={t('identity.taglineHint')}
        error={errorFor('tagline')}
        onChange={(event) => set('tagline', event.target.value)}
        onBlur={() => touch('tagline')}
      />
      <Textarea
        label={t('identity.bio')}
        value={draft.bio}
        maxLength={LIMITS.bio.max}
        rows={5}
        error={errorFor('bio')}
        onChange={(event) => set('bio', event.target.value)}
        onBlur={() => touch('bio')}
      />
      <Input
        label={t('identity.location')}
        value={draft.location ?? ''}
        maxLength={LIMITS.location.max}
        autoComplete="address-level2"
        hint={t('identity.locationHint')}
        error={errorFor('location')}
        onChange={(event) => set('location', event.target.value)}
        onBlur={() => touch('location')}
      />

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('identity.avatar')}</legend>
        <div className={styles.avatarRow}>
          <div className={styles.avatarPreview}>
            <Avatar avatar={draft.avatar} seed={draft.nickname} label={t('identity.avatarPreview')} />
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
                {t('identity.avatarGenerated')}
                <small>{t('identity.avatarGeneratedHint')}</small>
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
                {t('identity.avatarUrl')}
                <small>{t('identity.avatarUrlHint')}</small>
              </span>
            </label>
          </div>
        </div>
        {draft.avatar.kind === 'url' && (
          <Input
            label={t('identity.imageUrl')}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={avatarUrl}
            maxLength={LIMITS.url.max}
            className={styles.indent}
            hint={t('identity.imageUrlHint')}
            error={errorFor('avatar.url')}
            onChange={(event) => set('avatar', { kind: 'url', url: event.target.value })}
            onBlur={() => touch('avatar.url')}
          />
        )}
      </fieldset>
    </div>
  )
}
