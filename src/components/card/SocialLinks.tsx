import { AtSign, AudioLines, Camera, Cloud, Disc3, Globe, Headphones, Radio, Users, Video, type LucideIcon } from 'lucide-react'
import { SOCIAL_META, socialDisplay, type SocialLink, type SocialPlatform } from '../../domain/social.ts'
import { useI18n } from '../../i18n/context.ts'
import { cx } from '../../lib/cx.ts'
import styles from './SocialLinks.module.css'

/**
 * Ícones genéricos por plataforma. De propósito não se usam logótipos de
 * marcas: o nome da plataforma acompanha sempre o ícone (texto ou aria-label).
 */
const ICONS: Record<SocialPlatform, LucideIcon> = {
  instagram: Camera,
  spotify: Headphones,
  youtube: Video,
  bandcamp: Disc3,
  soundcloud: Cloud,
  tiktok: AudioLines,
  x: AtSign,
  facebook: Users,
  twitch: Radio,
  website: Globe,
}

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const Icon = ICONS[platform]
  return <Icon className={className} aria-hidden="true" />
}

interface SocialLinksProps {
  links: readonly SocialLink[]
  /** Perfil de demonstração: os links são ilustrativos e não são clicáveis. */
  demo?: boolean
  className?: string
}

export function SocialLinks({ links, demo = false, className }: SocialLinksProps) {
  const { t } = useI18n()
  if (links.length === 0) return null
  return (
    <ul className={cx(styles.list, className)} aria-label={t('socials.listLabel')}>
      {links.map((link) => {
        const label = SOCIAL_META[link.platform].label
        return (
          <li key={link.id}>
            {demo ? (
              <span className={cx(styles.link, styles.demo)} title={t('socials.demoTitle', { platform: label })}>
                <SocialIcon platform={link.platform} className={styles.icon} />
                <span className={styles.label}>{label}</span>
              </span>
            ) : (
              <a
                className={styles.link}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={t('socials.linkLabel', { platform: label, url: socialDisplay(link) })}
                title={socialDisplay(link)}
              >
                <SocialIcon platform={link.platform} className={styles.icon} />
                <span className={styles.label}>{label}</span>
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
