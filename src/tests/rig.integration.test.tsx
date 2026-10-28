import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GearItem } from '../domain/gear.ts'
import { STORAGE_KEY } from '../lib/persistence/repository.ts'
import { createMemoryStorage, type KeyValueStorage } from '../lib/persistence/storage.ts'
import { makeProfile, storageWithProfile } from './fixtures.ts'
import { renderApp } from './renderApp.tsx'

const form = () => within(document.getElementById('editor-panel')!)
const header = () => within(screen.getByRole('heading', { level: 1 }).closest('header')!)
const preview = () => within(screen.getByRole('complementary', { name: 'card preview' }))

/** Abre o editor na secção Rig, com a pré-visualização do card na face Rig. */
function openRigTab(storage: KeyValueStorage = createMemoryStorage()) {
  const utils = renderApp(storage, '/edit')
  const tablist = screen.getByRole('tablist', { name: 'editor sections' })
  fireEvent.click(within(tablist).getByRole('tab', { name: /^rig/ }))
  fireEvent.click(preview().getByRole('tab', { name: /^rig/ }))
  return utils
}

/** Nomes da cadeia de sinal num contentor (pré-visualização ou página). */
function chainNames(scope = preview()) {
  return within(scope.getByRole('list', { name: 'signal chain' }))
    .getAllByRole('button')
    .map((button) => button.querySelector('[class*=nodeName]')?.textContent)
}

function fillGear(fields: { type?: string; brand: string; model: string; nickname?: string; tags?: string; url?: string }) {
  if (fields.type) fireEvent.change(form().getByLabelText('type'), { target: { value: fields.type } })
  fireEvent.change(form().getByLabelText('Brand'), { target: { value: fields.brand } })
  fireEvent.change(form().getByLabelText('Model'), { target: { value: fields.model } })
  if (fields.nickname) fireEvent.change(form().getByLabelText('custom name (optional)'), { target: { value: fields.nickname } })
  if (fields.tags) fireEvent.change(form().getByLabelText('tags (optional)'), { target: { value: fields.tags } })
  if (fields.url) fireEvent.change(form().getByLabelText('image url (optional)'), { target: { value: fields.url } })
}

function submitGear() {
  fireEvent.click(within(form().getByRole('form', { name: /new gear|edit/ })).getByRole('button', { name: /add gear|save gear/ }))
}

const DEMO_CHAIN = [
  'ESP LTD EC-1000',
  'TC Electronic PolyTune 3',
  'Maxon OD808',
  'Boss NS-2',
  'MXR Carbon Copy',
  'Peavey 6505+',
  'Mesa/Boogie Rectifier 4x12',
]

describe('rig builder', () => {
  it('lista a rig agrupada pelos estágios da cadeia', () => {
    openRigTab()
    const groups = form()
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent?.replace(/\d+$/, '').trim())
    expect(groups).toEqual(['instruments', 'pedals', 'amps', 'cabinets', 'off the chain'])
  })

  it('adicionar um pedal mostra-o logo na cadeia, antes do amplificador', () => {
    openRigTab()
    fireEvent.click(form().getByRole('button', { name: 'add gear' }))
    fillGear({ brand: 'Boss', model: 'DS-1', nickname: 'Laranja', tags: 'Distorção, clássico' })
    submitGear()
    expect(chainNames()).toEqual([...DEMO_CHAIN.slice(0, 5), 'Boss DS-1', ...DEMO_CHAIN.slice(5)])
    expect(form().getByText('pedal · “Laranja”')).toBeInTheDocument()
  })

  it('equipamento fora de catálogo e fora da cadeia vai para "Também na rig"', () => {
    openRigTab()
    fireEvent.click(form().getByRole('button', { name: 'add gear' }))
    fillGear({ type: 'other', brand: 'DIY', model: 'Pedalboard de madeira' })
    submitGear()
    expect(chainNames()).toEqual(DEMO_CHAIN)
    expect(preview().getByText('DIY Pedalboard de madeira')).toBeInTheDocument()
  })

  it('dados inválidos no formulário são recusados com mensagem', () => {
    openRigTab()
    fireEvent.click(form().getByRole('button', { name: 'add gear' }))
    fillGear({ brand: '', model: 'Sem marca' })
    submitGear()
    expect(form().getByRole('alert')).toHaveTextContent('Brand is required.')
  })

  it('reordenar pedais altera a cadeia visual', () => {
    openRigTab()
    fireEvent.click(form().getByRole('button', { name: 'move MXR Carbon Copy up' }))
    fireEvent.click(form().getByRole('button', { name: 'move MXR Carbon Copy up' }))
    expect(chainNames().slice(1, 5)).toEqual(['TC Electronic PolyTune 3', 'MXR Carbon Copy', 'Maxon OD808', 'Boss NS-2'])
    expect(form().getByRole('button', { name: 'move ESP LTD EC-1000 up' })).toBeDisabled()
    expect(form().getByRole('button', { name: 'move ESP LTD EC-1000 down' })).toBeDisabled()
  })

  it('editar mantém a posição e atualiza a cadeia', () => {
    openRigTab()
    fireEvent.click(form().getByRole('button', { name: 'edit Maxon OD808' }))
    expect(form().getByLabelText('Model')).toHaveValue('OD808')
    fillGear({ brand: 'Maxon', model: 'OD808X', nickname: 'Verde' })
    submitGear()
    expect(chainNames()[2]).toBe('Maxon OD808X')
  })

  it('remover a peça selecionada na cadeia volta a selecionar a primeira', () => {
    openRigTab()
    fireEvent.click(within(preview().getByRole('list', { name: 'signal chain' })).getByRole('button', { name: /Peavey 6505\+/ }))
    fireEvent.click(form().getByRole('button', { name: 'remove Peavey 6505+' }))

    expect(chainNames()).not.toContain('Peavey 6505+')
    const detail = document.getElementById('rig-detail')!
    expect(within(detail).getByRole('heading', { level: 3 })).toHaveTextContent('ESP LTD EC-1000')
  })

  it('a ordem e as alterações persistem depois de guardar e de um refresh', () => {
    const storage = createMemoryStorage()
    openRigTab(storage)
    fireEvent.click(form().getByRole('button', { name: 'move TC Electronic PolyTune 3 down' }))
    fireEvent.click(form().getByRole('button', { name: 'remove Focusrite Scarlett 2i2' }))
    fireEvent.click(form().getByRole('button', { name: 'add gear' }))
    fillGear({ type: 'amp', brand: 'Orange', model: 'Rockerverb 50', tags: 'Válvulas' })
    submitGear()
    fireEvent.click(header().getByRole('button', { name: 'save' }))

    const stored = JSON.parse(storage.getItem(STORAGE_KEY)!).profile.rig as GearItem[]
    expect(stored.map((g) => g.model)).not.toContain('Scarlett 2i2')

    cleanup()
    renderApp(storage)
    const page = within(screen.getByRole('article'))
    fireEvent.click(page.getByRole('tab', { name: /^rig/ }))
    expect(chainNames(page)).toEqual([
      'ESP LTD EC-1000',
      'Maxon OD808',
      'TC Electronic PolyTune 3',
      'Boss NS-2',
      'MXR Carbon Copy',
      'Peavey 6505+',
      'Orange Rockerverb 50',
      'Mesa/Boogie Rectifier 4x12',
    ])
    expect(page.queryByRole('heading', { name: 'off the chain' })).not.toBeInTheDocument()
  })

  it('cancelar o editor descarta as alterações à rig', () => {
    const storage = createMemoryStorage()
    openRigTab(storage)
    fireEvent.click(form().getByRole('button', { name: 'remove Boss NS-2' }))
    expect(chainNames()).not.toContain('Boss NS-2')
    fireEvent.click(header().getByRole('button', { name: 'cancel' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Discard changes?' })).getByRole('button', { name: 'discard' }))

    const page = within(screen.getByRole('article'))
    fireEvent.click(page.getByRole('tab', { name: /^rig/ }))
    expect(chainNames(page)).toEqual(DEMO_CHAIN)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('imagens de equipamento', () => {
  it('imagem quebrada mostra o ícone do tipo sem mudar o tamanho da caixa', () => {
    const rig: GearItem[] = [
      { id: 'gtr', type: 'guitar', brand: 'Ibanez', model: 'RG', tags: [], imageUrl: 'https://example.invalid/rg.png' },
    ]
    renderApp(storageWithProfile(makeProfile({ rig })))
    fireEvent.click(within(screen.getByRole('article')).getByRole('tab', { name: /^rig/ }))
    const detail = document.getElementById('rig-detail')!
    const img = within(detail).getByRole('img', { name: 'Ibanez RG' })
    const box = img.parentElement!
    expect(box.style.width).toBe('88px')
    expect(img).toHaveAttribute('width', '88')
    expect(img).toHaveAttribute('height', '88')

    fireEvent.error(img)
    expect(within(detail).queryByRole('img', { name: 'Ibanez RG' })).not.toBeInTheDocument()
    expect(box.querySelector('svg')).not.toBeNull()
    expect(box.style.width).toBe('88px')
  })

  it('sem imagem usa o mesmo placeholder', () => {
    renderApp()
    fireEvent.click(within(screen.getByRole('article')).getByRole('tab', { name: /^rig/ }))
    const detail = document.getElementById('rig-detail')!
    expect(within(detail).queryByRole('img', { name: /ESP/ })).not.toBeInTheDocument()
    expect(detail.querySelector('svg')).not.toBeNull()
  })
})

describe('rig com muitas peças', () => {
  it('renderiza 40 peças de vários tipos e a cadeia mantém os estágios', () => {
    const types = ['pedal', 'guitar', 'amp', 'cabinet', 'bass', 'interface', 'other'] as const
    const rig: GearItem[] = Array.from({ length: 40 }, (_, i) => ({
      id: `g${i}`,
      type: types[i % types.length]!,
      brand: 'Marca',
      model: `Modelo ${i}`,
      tags: [],
    }))
    const storage = storageWithProfile(makeProfile({ rig }))
    renderApp(storage)
    const page = within(screen.getByRole('article'))
    fireEvent.click(page.getByRole('tab', { name: /^rig/ }))

    const names = chainNames(page)
    const offChainCount = rig.filter((g) => g.type === 'interface' || g.type === 'other').length
    expect(names).toHaveLength(40 - offChainCount)
    expect(names[0]).toBe('Marca Modelo 1') // primeira guitarra
    expect(names.at(-1)).toBe('Marca Modelo 38') // último cabinet (índices 3, 10, …, 38)

    cleanup()
    openRigTab(storage)
    expect(form().getByText('40/40')).toBeInTheDocument()
    expect(form().getByRole('button', { name: 'add gear' })).toBeDisabled()
    expect(form().getByText(/The rig is full \(40 items\)/)).toBeInTheDocument()
  })
})

describe('foco nos sub-formulários', () => {
  it('depois de adicionar ou cancelar, o foco volta ao botão de abertura', () => {
    openRigTab()
    fireEvent.click(form().getByRole('button', { name: 'add gear' }))
    fillGear({ brand: 'Boss', model: 'DS-1' })
    submitGear()
    expect(form().getByRole('button', { name: 'add gear' })).toHaveFocus()

    fireEvent.click(form().getByRole('button', { name: 'add gear' }))
    fireEvent.click(within(form().getByRole('form', { name: 'new gear' })).getByRole('button', { name: 'cancel' }))
    expect(form().getByRole('button', { name: 'add gear' })).toHaveFocus()
  })

  it('o mesmo acontece no formulário de bandas personalizadas', () => {
    renderApp(createMemoryStorage(), '/edit')
    fireEvent.click(within(screen.getByRole('tablist', { name: 'editor sections' })).getByRole('tab', { name: /^bands/ }))
    fireEvent.click(form().getByRole('button', { name: 'new band' }))
    fireEvent.change(form().getByLabelText('Band name'), { target: { value: 'Garagem' } })
    fireEvent.click(form().getByRole('button', { name: 'add band' }))
    expect(form().getByRole('button', { name: 'new band' })).toHaveFocus()
  })
})
