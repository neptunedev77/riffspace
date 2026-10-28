import { useMediaQuery } from './useMediaQuery.ts'

/** true quando o sistema pede movimento reduzido. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
