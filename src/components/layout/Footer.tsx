import { cx } from '../../lib/cx.ts'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={cx('container', styles.inner)}>
        <p className={styles.brand}>RIFFSPACE</p>
        <p className={styles.note}>
          Este é um perfil de demonstração com uma persona fictícia. Os nomes de bandas, álbuns e equipamento são
          referências em texto; a arte é abstrata e gerada localmente, sem logótipos, fotografias ou capas de terceiros.
          Nada aqui está publicado online.
        </p>
      </div>
    </footer>
  )
}
