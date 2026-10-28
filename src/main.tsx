import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/themes.css'
import './styles/base.css'
import { routes } from './app/routes.tsx'
import { I18nProvider } from './i18n/I18nProvider.tsx'
import { setActiveLocale } from './i18n/translate.ts'
import { loadSettings, saveSettings } from './lib/persistence/settings.ts'
import { getBrowserStorage } from './lib/persistence/storage.ts'
import { createAppStore } from './state/createAppStore.ts'
import { ProfileStoreProvider } from './state/ProfileStoreProvider.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Element #root not found in index.html')
}

// O idioma é lido antes da store, para que as mensagens geradas ao carregar
// (reparações, avisos) já saiam no idioma escolhido.
const settingsStorage = getBrowserStorage()
const settings = loadSettings(settingsStorage)
setActiveLocale(settings.locale)

const store = createAppStore()
const router = createBrowserRouter(routes)

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider
      initialLocale={settings.locale}
      onLocaleChange={(locale) => saveSettings(settingsStorage, { ...settings, locale })}
    >
      <ProfileStoreProvider store={store}>
        <RouterProvider router={router} />
      </ProfileStoreProvider>
    </I18nProvider>
  </StrictMode>,
)
