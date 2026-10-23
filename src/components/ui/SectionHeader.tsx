import type { ReactNode } from 'react'
import styles from './SectionHeader.module.css'

interface SectionHeaderProps {
  /** Número editorial da secção, p. ex. "02". */
  index: string
  eyebrow: string
  title: string
  headingId: string
  description?: ReactNode
  aside?: ReactNode
}

export function SectionHeader({ index, eyebrow, title, headingId, description, aside }: SectionHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.main}>
        <p className={styles.eyebrow}>
          <span className={styles.index}>{index}</span>
          <span className={styles.rule} aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </header>
  )
}
