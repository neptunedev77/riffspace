import { useEffect, useRef } from 'react'
import type { ThemeId } from '../../domain/theme.ts'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.ts'
import { createRng } from '../../lib/art/seed.ts'
import styles from './AmbientCanvas.module.css'

interface Particle {
  x: number
  y: number
  r: number
  speed: number
  sway: number
  phase: number
  alpha: number
}

const MAX_PARTICLES = 70
const AREA_PER_PARTICLE = 14_000

interface AmbientCanvasProps {
  /** Muda a cor e a direção (brasas sobem, gelo cai) a partir dos tokens do tema. */
  theme: ThemeId
}

/**
 * Partículas ambiente leves por trás do hero. Pausa fora do ecrã e com o
 * separador escondido; com movimento reduzido desenha um único frame estático.
 */
export function AmbientCanvas({ theme }: AmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const tokens = getComputedStyle(document.documentElement)
    const rgb = tokens.getPropertyValue('--particle-rgb').trim().split(/\s+/).join(',') || '255,90,70'
    const direction = Number(tokens.getPropertyValue('--particle-direction')) || -1
    const rng = createRng(`ambient:${theme}`)

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let visible = true
    let last = performance.now()

    const spawn = (anywhere: boolean): Particle => ({
      x: rng.range(0, width),
      y: anywhere ? rng.range(0, height) : direction < 0 ? height + 10 : -10,
      r: rng.range(0.6, 2.2),
      speed: rng.range(10, 32),
      sway: rng.range(6, 22),
      phase: rng.range(0, Math.PI * 2),
      alpha: rng.range(0.25, 0.9),
    })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(MAX_PARTICLES, Math.round((width * height) / AREA_PER_PARTICLE))
      particles = Array.from({ length: count }, () => spawn(true))
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        const x = p.x + Math.sin(time / 1400 + p.phase) * p.sway
        // Desvanece perto das extremidades verticais para não "cortar" as partículas.
        const edge = Math.min(p.y, height - p.y) / (height * 0.25)
        const alpha = p.alpha * Math.max(0, Math.min(1, edge))
        ctx.beginPath()
        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`
        ctx.shadowColor = `rgba(${rgb},${(alpha * 0.8).toFixed(3)})`
        ctx.shadowBlur = p.r * 6
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const tick = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000)
      last = time
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!
        p.y += direction * p.speed * dt
        if (p.y < -12 || p.y > height + 12) particles[i] = spawn(false)
      }
      draw(time)
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      if (reducedMotion || frame || !visible || document.hidden) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    resize()
    draw(0)

    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
      resize()
      draw(performance.now())
    }) : null
    resizeObserver?.observe(canvas)

    const intersectionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
      if (visible) start()
      else stop()
    }) : null
    intersectionObserver?.observe(canvas)

    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [theme, reducedMotion])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}
