import type { GearItem } from '../domain/gear.ts'

/**
 * Rig de DEMONSTRAÇÃO. Marcas e modelos são apenas texto descritivo;
 * nenhuma especificação técnica é afirmada.
 */
export const DEMO_RIG: GearItem[] = [
  {
    id: 'gear-ec1000',
    type: 'guitar',
    brand: 'ESP LTD',
    model: 'EC-1000',
    nickname: 'A Viúva',
    notes: 'Guitarra principal. Vive em Drop C, cordas 11–56.',
    tags: ['Drop C', '24 trastes'],
    favorite: true,
  },
  {
    id: 'gear-polytune',
    type: 'pedal',
    brand: 'TC Electronic',
    model: 'PolyTune 3',
    notes: 'Primeiro da cadeia: afinar entre músicas sem desligar tudo.',
    tags: ['Afinador'],
  },
  {
    id: 'gear-od808',
    type: 'pedal',
    brand: 'Maxon',
    model: 'OD808',
    notes: 'Gain no zero, level a fundo. Aperta o low end antes do amp.',
    tags: ['Boost', 'Overdrive'],
    favorite: true,
  },
  {
    id: 'gear-ns2',
    type: 'pedal',
    brand: 'Boss',
    model: 'NS-2',
    notes: 'Corta o ruído nos breaks staccato.',
    tags: ['Noise gate'],
  },
  {
    id: 'gear-carbon-copy',
    type: 'pedal',
    brand: 'MXR',
    model: 'Carbon Copy',
    nickname: 'Eco',
    notes: 'Delay analógico curto para os solos.',
    tags: ['Delay'],
  },
  {
    id: 'gear-6505',
    type: 'amp',
    brand: 'Peavey',
    model: '6505+',
    nickname: 'A Fornalha',
    notes: 'Canal lead, gain abaixo das 12h. Presença baixa.',
    tags: ['Válvulas', 'High gain'],
    favorite: true,
  },
  {
    id: 'gear-recto-cab',
    type: 'cabinet',
    brand: 'Mesa/Boogie',
    model: 'Rectifier 4x12',
    notes: 'Microfonado com um SM57 fora do centro.',
    tags: ['4x12'],
  },
  {
    id: 'gear-scarlett',
    type: 'interface',
    brand: 'Focusrite',
    model: 'Scarlett 2i2',
    notes: 'Para gravar demos em casa.',
    tags: ['Gravação'],
  },
]
