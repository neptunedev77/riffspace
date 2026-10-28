import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../app/routes.tsx'
import { I18nProvider } from '../i18n/I18nProvider.tsx'
import { setActiveLocale } from '../i18n/translate.ts'
import { loadSettings, saveSettings } from '../lib/persistence/settings.ts'
import { createMemoryStorage, type KeyValueStorage } from '../lib/persistence/storage.ts'
import { createAppStore } from '../state/createAppStore.ts'
import { ProfileStoreProvider } from '../state/ProfileStoreProvider.tsx'

/**
 * Renderiza a aplicação com as rotas reais, num router em memória e com uma
 * store isolada sobre o storage indicado (memória por omissão). O idioma vem
 * das definições guardadas nesse storage, tal como em main.tsx.
 */
export function renderApp(storage: KeyValueStorage = createMemoryStorage(), initialPath = '/') {
  const settings = loadSettings(storage)
  setActiveLocale(settings.locale)
  const store = createAppStore(storage)
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  const utils = render(
    <I18nProvider
      initialLocale={settings.locale}
      onLocaleChange={(locale) => saveSettings(storage, { ...settings, locale })}
    >
      <ProfileStoreProvider store={store}>
        <RouterProvider router={router} />
      </ProfileStoreProvider>
    </I18nProvider>,
  )
  return { ...utils, store, storage, router }
}
