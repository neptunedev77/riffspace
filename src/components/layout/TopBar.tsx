import { Pencil } from 'lucide-react'
import type { ThemeId } from '../../domain/theme.ts'
import { cx } from '../../lib/cx.ts'
import { Badge } from '../ui/Badge.tsx'
import { Button } from '../ui/Button.tsx'
import { ThemeSwitcher } from '../ui/ThemeSwitcher.tsx'
import styles from './TopBar.module.css'

const SECTIONS = [
  { href: '#bandas', label: 'Bandas' },
  { href: '#albuns', label: 'Álbuns' },
  { href: '#rig', label: 'Rig' },
]

interface TopBarProps {
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

export function TopBar({ theme, onThemeChange }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={cx('container', styles.inner)}>
        <a href="#top" className={styles.brand} aria-label="RIFFSPACE — topo do perfil">
          <svg viewBox="0 0 32 32" className={styles.mark} aria-hidden="true">
            <path d="M9 25V7h8a5.5 5.5 0 0 1 0 11H9m8 0 7 7" />
          </svg>
          <span className={styles.wordmark}>RIFFSPACE</span>
        </a>

        <nav aria-label="Secções do perfil" className={styles.nav}>
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <a href={section.href}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <ThemeSwitcher value={theme} onChange={onThemeChange} />
          <Button
            size="sm"
            variant="secondary"
            icon={<Pencil />}
            disabled
            aria-label="Editar perfil (em breve)"
            className={styles.editButton}
            trailing={
              <Badge tone="planned" className={styles.soon}>
                Em breve
              </Badge>
            }
          >
            <span className={styles.editLabel}>Editar perfil</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
