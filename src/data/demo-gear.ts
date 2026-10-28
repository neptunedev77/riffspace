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
    nickname: 'The Widow',
    notes: 'Main guitar. Lives in drop C, 11–56 strings.',
    tags: ['Drop C', '24 frets'],
    favorite: true,
  },
  {
    id: 'gear-polytune',
    type: 'pedal',
    brand: 'TC Electronic',
    model: 'PolyTune 3',
    notes: 'First in the chain: tune between songs without killing everything.',
    tags: ['Tuner'],
  },
  {
    id: 'gear-od808',
    type: 'pedal',
    brand: 'Maxon',
    model: 'OD808',
    notes: 'Gain at zero, level maxed. Tightens the low end before the amp.',
    tags: ['Boost', 'Overdrive'],
    favorite: true,
  },
  {
    id: 'gear-ns2',
    type: 'pedal',
    brand: 'Boss',
    model: 'NS-2',
    notes: 'Kills the noise on staccato breaks.',
    tags: ['Noise gate'],
  },
  {
    id: 'gear-carbon-copy',
    type: 'pedal',
    brand: 'MXR',
    model: 'Carbon Copy',
    nickname: 'Echo',
    notes: 'Short analogue delay for solos.',
    tags: ['Delay'],
  },
  {
    id: 'gear-6505',
    type: 'amp',
    brand: 'Peavey',
    model: '6505+',
    nickname: 'The Furnace',
    notes: 'Lead channel, gain below noon. Presence low.',
    tags: ['Tubes', 'High gain'],
    favorite: true,
  },
  {
    id: 'gear-recto-cab',
    type: 'cabinet',
    brand: 'Mesa/Boogie',
    model: 'Rectifier 4x12',
    notes: 'Miked with an off-axis SM57.',
    tags: ['4x12'],
  },
  {
    id: 'gear-scarlett',
    type: 'interface',
    brand: 'Focusrite',
    model: 'Scarlett 2i2',
    notes: 'For recording demos at home.',
    tags: ['Recording'],
  },
]
