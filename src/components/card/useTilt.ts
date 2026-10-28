import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.ts'

/** Inclinação máxima em graus: suficiente para dar volume sem prejudicar a leitura. */
const MAX_TILT = 5

/**
 * Inclinação 3D e reflexo que seguem o ponteiro. Escreve variáveis CSS no
 * elemento (--rx, --ry, --mx, --my) uma vez por frame. Desliga-se com
 * movimento reduzido e em ecrãs táteis, onde o efeito não faz sentido.
 */
export function useTilt<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || reducedMotion) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) return

    let frame = 0
    let pointerX = 0
    let pointerY = 0

    const apply = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const x = Math.min(1, Math.max(0, (pointerX - rect.left) / rect.width))
      const y = Math.min(1, Math.max(0, (pointerY - rect.top) / rect.height))
      el.style.setProperty('--rx', `${((0.5 - y) * MAX_TILT).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${((x - 0.5) * MAX_TILT).toFixed(2)}deg`)
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      el.dataset.tilting = 'true'
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      pointerX = event.clientX
      pointerY = event.clientY
      if (!frame) frame = requestAnimationFrame(apply)
    }

    const onLeave = () => {
      cancelAnimationFrame(frame)
      frame = 0
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
      delete el.dataset.tilting
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      onLeave()
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled, reducedMotion])

  return ref
}
