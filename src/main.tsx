import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/themes.css'
import './styles/base.css'
import { App } from './app/App.tsx'
import { createAppStore } from './state/createAppStore.ts'
import { ProfileStoreProvider } from './state/ProfileStoreProvider.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Elemento #root não encontrado em index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <ProfileStoreProvider store={createAppStore()}>
      <App />
    </ProfileStoreProvider>
  </StrictMode>,
)
