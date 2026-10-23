import { DEMO_ALBUMS, DEMO_BANDS } from '../data/demo-bands.ts'
import { allBands, favoriteAlbums, favoriteBands } from '../domain/profile.ts'
import { useApplyTheme } from '../hooks/useTheme.ts'
import { useProfileStore } from '../state/profileContext.ts'
import { FavoriteAlbums } from '../components/bands/FavoriteAlbums.tsx'
import { FavoriteBands } from '../components/bands/FavoriteBands.tsx'
import { Footer } from '../components/layout/Footer.tsx'
import { StorageNotice } from '../components/layout/StorageNotice.tsx'
import { TopBar } from '../components/layout/TopBar.tsx'
import { ProfileHero } from '../components/profile/ProfileHero.tsx'
import { RigSection } from '../components/rig/RigSection.tsx'

/**
 * Página do perfil. O estado vem da store (persistida em localStorage);
 * a edição do perfil chega na Etapa 3.
 */
export function App() {
  const profile = useProfileStore((state) => state.profile)
  const setTheme = useProfileStore((state) => state.setTheme)
  useApplyTheme(profile.theme)

  const bands = favoriteBands(profile, DEMO_BANDS)
  const albums = favoriteAlbums(profile, DEMO_ALBUMS)

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <TopBar theme={profile.theme} onThemeChange={setTheme} />
      <main id="conteudo" tabIndex={-1}>
        <StorageNotice />
        <ProfileHero
          profile={profile}
          theme={profile.theme}
          counts={{ bands: bands.length, albums: albums.length, gear: profile.rig.length }}
        />
        <div className="container">
          <FavoriteBands bands={bands} albums={albums} />
          <FavoriteAlbums albums={albums} bands={allBands(profile, DEMO_BANDS)} />
          <RigSection rig={profile.rig} />
        </div>
      </main>
      <Footer />
    </>
  )
}
