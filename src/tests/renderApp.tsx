import { render } from '@testing-library/react'
import { App } from '../app/App.tsx'
import { createMemoryStorage, type KeyValueStorage } from '../lib/persistence/storage.ts'
import { createAppStore } from '../state/createAppStore.ts'
import { ProfileStoreProvider } from '../state/ProfileStoreProvider.tsx'

/** Renderiza a App com uma store isolada sobre o storage indicado (memória por omissão). */
export function renderApp(storage: KeyValueStorage = createMemoryStorage()) {
  const store = createAppStore(storage)
  const utils = render(
    <ProfileStoreProvider store={store}>
      <App />
    </ProfileStoreProvider>,
  )
  return { ...utils, store, storage }
}
