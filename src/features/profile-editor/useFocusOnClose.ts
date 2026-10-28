import { useEffect, useRef } from 'react'

/**
 * Quando um sub-formulário inline fecha (submetido ou cancelado), o elemento
 * focado desaparece e o foco cairia no <body>. Este hook devolve o foco ao
 * botão de abertura, ou ao painel do separador se o botão estiver desativado.
 */
export function useFocusOnClose(open: boolean) {
  const ref = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(open)

  useEffect(() => {
    if (wasOpen.current && !open) {
      const target = ref.current
      if (target && !target.disabled) target.focus()
      else document.getElementById('editor-panel')?.focus()
    }
    wasOpen.current = open
  }, [open])

  return ref
}
