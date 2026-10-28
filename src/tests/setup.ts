import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { setActiveLocale } from '../i18n/translate.ts'

afterEach(() => {
  cleanup()
  // O idioma ativo é estado de módulo: cada teste começa em inglês.
  setActiveLocale('en')
})

// O jsdom não implementa canvas: devolver null mantém o AmbientCanvas inativo
// em vez de o jsdom registar "Not implemented" na consola.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext

// O jsdom também não implementa matchMedia. O stub simula um ecrã de desktop
// (1280 px, ponteiro fino, sem movimento reduzido): as min-width são avaliadas
// contra essa largura e as restantes queries são falsas.
const TEST_VIEWPORT_WIDTH = 1280

function evaluateQuery(query: string): boolean {
  const minWidth = /min-width:\s*(\d+)px/.exec(query)
  if (minWidth) return TEST_VIEWPORT_WIDTH >= Number(minWidth[1])
  const maxWidth = /max-width:\s*(\d+)px/.exec(query)
  if (maxWidth) return TEST_VIEWPORT_WIDTH <= Number(maxWidth[1])
  return false
}

window.matchMedia = (query: string): MediaQueryList => ({
  matches: evaluateQuery(query),
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})
