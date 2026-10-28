import { describe, expect, it } from 'vitest'
import { en } from './messages/en.ts'
import { pt } from './messages/pt.ts'
import { getActiveLocale, setActiveLocale, translate, translatePlural } from './translate.ts'
import { loadSettings, saveSettings, SETTINGS_KEY } from '../lib/persistence/settings.ts'
import { createMemoryStorage } from '../lib/persistence/storage.ts'

const variables = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

describe('dicionários', () => {
  it('pt tem exatamente as chaves de en, sem textos vazios', () => {
    expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort())
    for (const value of [...Object.values(en), ...Object.values(pt)]) expect(value.trim()).not.toBe('')
  })

  it('cada tradução usa as mesmas variáveis que o inglês', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(variables(pt[key]), key).toEqual(variables(en[key]))
    }
  })
})

describe('translate', () => {
  it('interpola variáveis e deixa intactas as que faltam', () => {
    expect(translate('bands.added', { name: 'Gojira', position: 1 })).toBe('Gojira added at position 1.')
    expect(translate('bands.noMatch')).toBe('No band matches “{query}”.')
  })

  it('usa o idioma ativo por omissão e aceita um idioma explícito', () => {
    expect(translate('common.save')).toBe('save')
    setActiveLocale('pt')
    expect(getActiveLocale()).toBe('pt')
    expect(translate('common.save')).toBe('guardar')
    expect(translate('common.save', undefined, 'en')).toBe('save')
  })

  it('escolhe a forma singular ou plural', () => {
    expect(translatePlural('bands.results', 1)).toBe('1 result')
    expect(translatePlural('bands.results', 0)).toBe('0 results')
    expect(translatePlural('editor.fixFields', 3, undefined, 'pt')).toBe('Corrige 3 campos antes de guardar.')
  })
})

describe('definições', () => {
  it('por omissão é inglês; dados corrompidos ou inválidos não bloqueiam', () => {
    expect(loadSettings(null)).toEqual({ locale: 'en' })
    expect(loadSettings(createMemoryStorage())).toEqual({ locale: 'en' })
    expect(loadSettings(createMemoryStorage({ [SETTINGS_KEY]: '{oops' }))).toEqual({ locale: 'en' })
    expect(loadSettings(createMemoryStorage({ [SETTINGS_KEY]: '{"locale":"xx"}' }))).toEqual({ locale: 'en' })
  })

  it('guarda e volta a ler o idioma', () => {
    const storage = createMemoryStorage()
    saveSettings(storage, { locale: 'pt' })
    expect(loadSettings(storage)).toEqual({ locale: 'pt' })
  })
})
