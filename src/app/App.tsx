import { DEMO_ALBUMS, DEMO_BANDS } from '../data/demo-bands.ts'
import { DEMO_PROFILE } from '../data/demo-profile.ts'
import { favoriteAlbums, favoriteBands } from '../domain/profile.ts'
import { useTheme } from '../hooks/useTheme.ts'
import { FavoriteAlbums } from '../components/bands/FavoriteAlbums.tsx'
import { FavoriteBands } from '../components/bands/FavoriteBands.tsx'
import { Footer } from '../components/layout/Footer.tsx'
import { TopBar } from '../components/layout/TopBar.tsx'
import { ProfileHero } from '../components/profile/ProfileHero.tsx'
import { RigSection } from '../components/rig/RigSection.tsx'

/**
 * Etapa 1: perfil de demonstração estático com temas funcionais.
 * O perfil ainda não é editável nem persistido (Etapas 2 e 3).
 */
export function App() {
  const profile = DEMO_PROFILE
  const [theme, setTheme] = useTheme(profile.theme)
  const bands = favoriteBands(profile, DEMO_BANDS)
  const albums = favoriteAlbums(profile, DEMO_ALBUMS)

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <TopBar theme={theme} onThemeChange={setTheme} />
      <main id="conteudo" tabIndex={-1}>
        <ProfileHero
          profile={profile}
          theme={theme}
          counts={{ bands: bands.length, albums: albums.length, gear: profile.rig.length }}
        />
        <div className="container">
          <FavoriteBands bands={bands} albums={albums} />
          <FavoriteAlbums albums={albums} bands={DEMO_BANDS} />
          <RigSection rig={profile.rig} />
        </div>
      </main>
      <Footer />
    </>
  )
}
