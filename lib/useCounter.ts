"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { parseCounterValue } from "@/lib/utils"

export interface UseCounterReturn {
  display: string
  ref: React.RefObject<HTMLSpanElement | null>
}

export function useCounter(rawValue: string, enabled: boolean): UseCounterReturn {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(rawValue)
  const hasAnimated = useRef(false)
  const rafId = useRef<number | null>(null)

  const animate = useCallback(() => {
    if (!enabled || hasAnimated.current) return
    hasAnimated.current = true

    const { num, suffix, prefix } = parseCounterValue(rawValue)
    if (num === 0) return

    const hasDecimal = rawValue.includes(".") || rawValue.includes(",")
    const duration   = 1500 // ms
    const startTime  = performance.now()

    function format(val: number): string {
      const formatted = hasDecimal ? val.toFixed(1) : Math.round(val).toString()
      return `${prefix}${formatted}${suffix}`
    }

    function tick(now: number) {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easing quadrático out
      const eased    = 1 - (1 - progress) * (1 - progress)
      setDisplay(format(num * eased))
      rafId.current = progress < 1 ? requestAnimationFrame(tick) : null
    }

    rafId.current = requestAnimationFrame(tick)
  }, [rawValue, enabled])

  // Cancela o rAF pendente no unmount (o loop de até 1.5s não pode chamar
  // setDisplay num componente desmontado)
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate()
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [animate, enabled])

  // Sincroniza display quando rawValue muda externamente.
  // Com enabled=true, só depois da animação inicial (senão sobrescreveria o 0→N);
  // cancela um rAF em voo para o valor novo não ser atropelado pelo tick antigo.
  useEffect(() => {
    if (!enabled || hasAnimated.current) {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
      setDisplay(rawValue)
    }
  }, [rawValue, enabled])

  return { display, ref }
}
