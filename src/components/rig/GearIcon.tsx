import { AudioLines, Gauge, Guitar, Package, Speaker, Zap, type LucideIcon } from 'lucide-react'
import type { GearType } from '../../domain/gear.ts'

const ICONS: Record<GearType, LucideIcon> = {
  guitar: Guitar,
  bass: Guitar,
  pedal: Zap,
  amp: Gauge,
  cabinet: Speaker,
  interface: AudioLines,
  other: Package,
}

export function GearIcon({ type, className }: { type: GearType; className?: string }) {
  const Icon = ICONS[type]
  return <Icon className={className} aria-hidden="true" />
}
