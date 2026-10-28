import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { SocialIcon } from '../../components/card/SocialLinks.tsx'
import { Badge } from '../../components/ui/Badge.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select } from '../../components/ui/Select.tsx'
import { isDemoSocial } from '../../data/demo-profile.ts'
import { LIMITS } from '../../domain/limits.ts'
import { SOCIAL_META, SOCIAL_PLATFORMS, socialDisplay, type SocialLink, type SocialPlatform } from '../../domain/social.ts'
import { useI18n } from '../../i18n/context.ts'
import styles from '../profile-editor/EditorForms.module.css'
import type { TabProps } from '../profile-editor/IdentityTab.tsx'
import { useFocusOnClose } from '../profile-editor/useFocusOnClose.ts'
import { addSocial, moveSocial, removeSocial, updateSocial } from './socials.ts'

const PLATFORM_OPTIONS = SOCIAL_PLATFORMS.map((platform) => ({ value: platform, label: SOCIAL_META[platform].label }))

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; link: SocialLink }

interface SocialFormProps {
  link?: SocialLink
  onSubmit: (platform: SocialPlatform, raw: string) => string | undefined
  onCancel: () => void
}

function SocialForm({ link, onSubmit, onCancel }: SocialFormProps) {
  const { t } = useI18n()
  const [platform, setPlatform] = useState<SocialPlatform>(link?.platform ?? 'instagram')
  const [value, setValue] = useState(link?.url ?? '')
  const [error, setError] = useState<string>()
  const titleId = useId()
  const meta = SOCIAL_META[platform]

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(onSubmit(platform, value))
  }

  return (
    <form className={styles.subform} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <h4 id={titleId} className={styles.subformTitle}>
        {link ? t('socials.editTitle', { platform: SOCIAL_META[link.platform].label }) : t('socials.newTitle')}
      </h4>
      <Select
        label={t('socials.platform')}
        options={PLATFORM_OPTIONS}
        value={platform}
        onChange={(event) => setPlatform(event.target.value as SocialPlatform)}
      />
      <Input
        label={meta.fromHandle ? t('socials.linkOrHandle') : t('socials.link')}
        value={value}
        autoFocus
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        maxLength={LIMITS.url.max}
        placeholder={meta.fromHandle ? t('socials.placeholderHandle', { example: meta.example }) : meta.example}
        hint={meta.hosts.length > 0 ? t('socials.hostHint', { hosts: meta.hosts.join(t('common.or')) }) : t('socials.anyHost')}
        onChange={(event) => setValue(event.target.value)}
      />
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
      <div className={styles.subformActions}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" size="sm">
          {link ? t('socials.saveLink') : t('socials.addLink')}
        </Button>
      </div>
    </form>
  )
}

export function SocialsTab({ draft, update }: TabProps) {
  const { t } = useI18n()
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [feedback, setFeedback] = useState('')
  const addRef = useFocusOnClose(form.mode !== 'closed')
  const full = draft.socials.length >= LIMITS.socials.max

  return (
    <div className={styles.stack}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {feedback}
      </p>
      <div className={styles.blockHeader}>
        <p className={styles.note}>
          {t('socials.count')}{' '}
          <span className={styles.count}>
            {draft.socials.length}/{LIMITS.socials.max}
          </span>
        </p>
        {form.mode === 'closed' && (
          <Button ref={addRef} size="sm" icon={<Plus />} disabled={full} onClick={() => setForm({ mode: 'create' })}>
            {t('socials.addLink')}
          </Button>
        )}
      </div>
      <p className={styles.note}>{t('socials.intro')}</p>
      {draft.isDemo && draft.socials.some(isDemoSocial) && <p className={styles.note}>{t('socials.demoNote')}</p>}

      {form.mode !== 'closed' && (
        <SocialForm
          key={form.mode === 'edit' ? form.link.id : 'new'}
          link={form.mode === 'edit' ? form.link : undefined}
          onCancel={() => setForm({ mode: 'closed' })}
          onSubmit={(platform, raw) => {
            const result =
              form.mode === 'edit' ? updateSocial(draft, form.link.id, platform, raw) : addSocial(draft, platform, raw)
            if (!result.ok) return result.error
            update(() => result.profile)
            setForm({ mode: 'closed' })
            const platformLabel = SOCIAL_META[result.value.platform].label
            setFeedback(t(form.mode === 'edit' ? 'socials.updated' : 'socials.added', { platform: platformLabel }))
            return undefined
          }}
        />
      )}

      {draft.socials.length === 0 ? (
        form.mode === 'closed' && <p className={styles.empty}>{t('socials.empty')}</p>
      ) : (
        <ol className={styles.rankList}>
          {draft.socials.map((link, index) => {
            const label = SOCIAL_META[link.platform].label
            return (
              <li key={link.id} className={styles.gearItem}>
                <span className={styles.socialIcon}>
                  <SocialIcon platform={link.platform} />
                </span>
                <span className={styles.resultText}>
                  <span className={styles.resultName}>
                    {label}
                    {isDemoSocial(link) && <Badge tone="planned">{t('common.demo')}</Badge>}
                  </span>
                  <span className={styles.resultMeta}>{socialDisplay(link)}</span>
                </span>
                <span className={styles.rankActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ArrowUp />}
                    aria-label={t('common.moveUp', { name: label })}
                    disabled={index === 0}
                    onClick={() => update((d) => moveSocial(d, link.id, -1))}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ArrowDown />}
                    aria-label={t('common.moveDown', { name: label })}
                    disabled={index === draft.socials.length - 1}
                    onClick={() => update((d) => moveSocial(d, link.id, 1))}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Pencil />}
                    aria-label={t('common.editItem', { name: label })}
                    onClick={() => setForm({ mode: 'edit', link })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 />}
                    aria-label={t('common.removeItem', { name: label })}
                    onClick={() => {
                      update((d) => removeSocial(d, link.id))
                      if (form.mode === 'edit' && form.link.id === link.id) setForm({ mode: 'closed' })
                      setFeedback(t('socials.removed', { platform: label }))
                    }}
                  />
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
