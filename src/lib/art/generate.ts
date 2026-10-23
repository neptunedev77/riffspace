import { createRng, type Rng } from './seed.ts'

/**
 * Arte generativa original e determinística (sem imagens de terceiros).
 * As funções devolvem primitivas SVG num viewBox 100×100; as cores são
 * "tintas" semânticas que o componente mapeia para tokens do tema, por
 * isso a mesma arte muda de cor quando o tema muda.
 */

export type Paint = 'accent' | 'ink' | 'second' | 'dark' | 'glow'

interface PrimitiveBase {
  fill?: Paint
  stroke?: Paint
  strokeWidth?: number
  opacity?: number
}

export type Primitive =
  | (PrimitiveBase & { kind: 'circle'; cx: number; cy: number; r: number })
  | (PrimitiveBase & { kind: 'path'; d: string })
  | (PrimitiveBase & { kind: 'rect'; x: number; y: number; width: number; height: number })

export const COVER_PATTERNS = ['eclipse', 'rings', 'shards', 'spectrum', 'topo'] as const
export type CoverPattern = (typeof COVER_PATTERNS)[number]

export interface ArtSpec {
  pattern: CoverPattern | 'sigil'
  /** Ângulo do gradiente de fundo, em graus. */
  angle: number
  primitives: Primitive[]
}

const r2 = (n: number) => Math.round(n * 100) / 100

function eclipse(rng: Rng): Primitive[] {
  const cx = rng.range(35, 65)
  const cy = rng.range(32, 55)
  const r = rng.range(18, 28)
  const shift = rng.range(2, 6)
  const horizon = rng.range(68, 82)
  return [
    { kind: 'circle', cx: r2(cx), cy: r2(cy), r: r2(r * 1.9), fill: 'glow', opacity: 0.5 },
    { kind: 'circle', cx: r2(cx), cy: r2(cy), r: r2(r), fill: 'accent' },
    { kind: 'circle', cx: r2(cx + shift), cy: r2(cy - shift / 2), r: r2(r * 0.97), fill: 'dark' },
    { kind: 'rect', x: 0, y: r2(horizon), width: 100, height: r2(100 - horizon), fill: 'dark', opacity: 0.85 },
    { kind: 'path', d: `M0 ${r2(horizon)}H100`, stroke: 'ink', strokeWidth: 0.4, opacity: 0.5 },
  ]
}

function rings(rng: Rng): Primitive[] {
  const cx = rng.range(15, 85)
  const cy = rng.range(15, 85)
  const count = rng.int(6, 10)
  const accentAt = rng.int(1, count - 1)
  return Array.from({ length: count }, (_, i): Primitive => ({
    kind: 'circle',
    cx: r2(cx),
    cy: r2(cy),
    r: r2(8 + i * rng.range(6, 10)),
    stroke: i === accentAt ? 'accent' : i % 2 ? 'second' : 'ink',
    strokeWidth: r2(i === accentAt ? 2.4 : rng.range(0.3, 1.2)),
    opacity: r2(i === accentAt ? 1 : rng.range(0.15, 0.55)),
  }))
}

function shards(rng: Rng): Primitive[] {
  const count = rng.int(5, 9)
  const shapes = Array.from({ length: count }, (_, i): Primitive => {
    const x = rng.range(5, 95)
    const y = rng.range(10, 95)
    const size = rng.range(14, 42)
    const a = rng.range(0, Math.PI * 2)
    const pts = [0, 2.2, 4.1].map((offset) => {
      const angle = a + offset + rng.range(-0.35, 0.35)
      const dist = size * rng.range(0.55, 1)
      return `${r2(x + Math.cos(angle) * dist)} ${r2(y + Math.sin(angle) * dist)}`
    })
    return {
      kind: 'path',
      d: `M${pts.join('L')}Z`,
      fill: i === 0 ? 'accent' : rng.pick(['ink', 'second', 'dark'] as const),
      opacity: r2(i === 0 ? 0.95 : rng.range(0.12, 0.6)),
    }
  })
  const slash = rng.range(20, 80)
  shapes.push({ kind: 'path', d: `M${r2(slash)} 0L${r2(100 - slash)} 100`, stroke: 'ink', strokeWidth: 0.35, opacity: 0.6 })
  return shapes
}

function spectrum(rng: Rng): Primitive[] {
  const count = rng.int(18, 30)
  const width = 100 / count
  const base = rng.range(62, 72)
  let level = rng.range(0.3, 0.7)
  const peak = rng.int(0, count - 1)
  const bars: Primitive[] = []
  for (let i = 0; i < count; i++) {
    level = Math.min(1, Math.max(0.08, level + rng.range(-0.22, 0.22)))
    const height = (i === peak ? 1 : level) * (base - 10)
    bars.push({
      kind: 'rect',
      x: r2(i * width + width * 0.18),
      y: r2(base - height),
      width: r2(width * 0.64),
      height: r2(height),
      fill: i === peak ? 'accent' : 'ink',
      opacity: r2(i === peak ? 1 : 0.25 + level * 0.5),
    })
    bars.push({
      kind: 'rect',
      x: r2(i * width + width * 0.18),
      y: r2(base + 1.5),
      width: r2(width * 0.64),
      height: r2(height * 0.35),
      fill: i === peak ? 'accent' : 'second',
      opacity: 0.18,
    })
  }
  return bars
}

function topo(rng: Rng): Primitive[] {
  const lines = rng.int(9, 14)
  const accentLine = rng.int(2, lines - 2)
  const freq = rng.range(1.5, 3.5)
  const phase = rng.range(0, Math.PI * 2)
  return Array.from({ length: lines }, (_, i): Primitive => {
    const y0 = 12 + (i * 80) / lines
    const amp = rng.range(2, 9)
    const segments = 20
    const points = Array.from({ length: segments + 1 }, (_, s) => {
      const x = (s / segments) * 100
      const y = y0 + Math.sin((s / segments) * Math.PI * freq + phase + i * 0.45) * amp
      return `${r2(x)} ${r2(y)}`
    })
    return {
      kind: 'path',
      d: `M${points.join('L')}`,
      stroke: i === accentLine ? 'accent' : 'ink',
      strokeWidth: i === accentLine ? 1.6 : 0.45,
      opacity: r2(i === accentLine ? 1 : rng.range(0.2, 0.55)),
    }
  })
}

const PATTERN_BUILDERS: Record<CoverPattern, (rng: Rng) => Primitive[]> = {
  eclipse,
  rings,
  shards,
  spectrum,
  topo,
}

/** Capa abstrata para bandas e álbuns. Mesma seed → mesma arte. */
export function generateCover(seed: string, pattern?: CoverPattern): ArtSpec {
  const rng = createRng(`cover:${seed}`)
  const chosen = pattern ?? rng.pick(COVER_PATTERNS)
  return {
    pattern: chosen,
    angle: Math.round(rng.range(0, 360)),
    primitives: PATTERN_BUILDERS[chosen](rng),
  }
}

/** Sigilo geométrico usado como avatar gerado a partir do nickname. */
export function generateSigil(seed: string): ArtSpec {
  const rng = createRng(`sigil:${seed.toLowerCase()}`)
  const sides = rng.int(3, 7)
  const rotation = rng.range(0, Math.PI * 2)
  const polyR = rng.range(22, 30)
  const polygon = Array.from({ length: sides }, (_, i) => {
    const a = rotation + (i / sides) * Math.PI * 2
    return `${r2(50 + Math.cos(a) * polyR)} ${r2(50 + Math.sin(a) * polyR)}`
  })
  const ticks = rng.int(8, 18)
  const tickPaths = Array.from({ length: ticks }, (_, i) => {
    const a = (i / ticks) * Math.PI * 2
    const inner = i % 2 ? 40 : 37
    return `M${r2(50 + Math.cos(a) * inner)} ${r2(50 + Math.sin(a) * inner)}L${r2(50 + Math.cos(a) * 43)} ${r2(50 + Math.sin(a) * 43)}`
  })
  const branchY = rng.range(36, 48)
  const branchW = rng.range(8, 14)
  const rune = `M50 24V76M50 ${r2(branchY)}L${r2(50 - branchW)} ${r2(branchY - 10)}M50 ${r2(branchY + 12)}L${r2(50 + branchW)} ${r2(branchY + 2)}`

  return {
    pattern: 'sigil',
    angle: Math.round(rng.range(0, 360)),
    primitives: [
      { kind: 'circle', cx: 50, cy: 50, r: 34, fill: 'glow', opacity: 0.45 },
      { kind: 'circle', cx: 50, cy: 50, r: 46, stroke: 'ink', strokeWidth: 0.5, opacity: 0.4 },
      { kind: 'path', d: tickPaths.join(''), stroke: 'ink', strokeWidth: 0.8, opacity: 0.55 },
      { kind: 'path', d: `M${polygon.join('L')}Z`, stroke: 'accent', strokeWidth: 1.6 },
      { kind: 'circle', cx: 50, cy: 50, r: r2(polyR * 0.42), stroke: 'second', strokeWidth: 0.8, opacity: 0.8 },
      { kind: 'path', d: rune, stroke: 'ink', strokeWidth: 2.2 },
    ],
  }
}
