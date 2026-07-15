import { useState, useEffect, useRef, useCallback } from "react"

export interface UseCarouselConfig {
  itemCount:    number
  visibleCount: number
  gap?:         number   // default 20
  autoplay?:    boolean
  autoplayMs?:  number   // required when autoplay=true
}

export interface UseCarouselReturn {
  index:     number
  setIndex:  React.Dispatch<React.SetStateAction<number>>
  maxIndex:  number      // último índice útil: itemCount - visibleCount (nunca negativo)
  itemWidth: number
  gap:       number
  trackRef:  React.RefObject<HTMLDivElement | null>
  goNext:    () => void
  goPrev:    () => void
  // Espalhar no wrapper do carrossel: pausa o autoplay em hover/focus (WCAG 2.2.2)
  pauseHandlers: {
    onMouseEnter: () => void
    onMouseLeave: () => void
    onFocus:      () => void
    onBlur:       () => void
  }
}

export function useCarousel({
  itemCount,
  visibleCount,
  gap: gapProp = 20,
  autoplay = false,
  autoplayMs,
}: UseCarouselConfig): UseCarouselReturn {
  const gap = gapProp

  const [index, setIndex]         = useState(0)
  const [itemWidth, setItemWidth] = useState(0)
  const [paused, setPaused]       = useState(false)
  const trackRef                  = useRef<HTMLDivElement>(null)

  // O índice não pode passar do ponto em que o último item encosta na borda direita
  const maxIndex = Math.max(0, itemCount - visibleCount)

  // Re-clamp quando o domínio encolhe (itemCount diminui ou visibleCount aumenta no resize)
  useEffect(() => {
    setIndex(prev => Math.min(prev, maxIndex))
  }, [maxIndex])

  // Measurement: visibleCount and gap are read inside → both in dep array (#7)
  useEffect(() => {
    function measure() {
      if (!trackRef.current) return
      setItemWidth((trackRef.current.offsetWidth - gap * (visibleCount - 1)) / visibleCount)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [visibleCount, gap])

  // Autoplay: functional updater avoids index in dep array.
  // Não inicia com prefers-reduced-motion; pausa em hover/focus (paused).
  useEffect(() => {
    if (!autoplay || !autoplayMs || paused || maxIndex === 0) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(() => {
      setIndex(prev => (prev >= maxIndex ? 0 : prev + 1))
    }, autoplayMs)
    return () => clearInterval(id)
  }, [autoplay, autoplayMs, paused, maxIndex])

  const goNext = useCallback(
    () => setIndex(prev => (prev >= maxIndex ? 0 : prev + 1)),
    [maxIndex],
  )

  const goPrev = useCallback(
    () => setIndex(prev => (prev <= 0 ? maxIndex : prev - 1)),
    [maxIndex],
  )

  const pause  = useCallback(() => setPaused(true), [])
  const resume = useCallback(() => setPaused(false), [])

  const pauseHandlers = {
    onMouseEnter: pause,
    onMouseLeave: resume,
    onFocus:      pause,
    onBlur:       resume,
  }

  return { index, setIndex, maxIndex, itemWidth, gap, trackRef, goNext, goPrev, pauseHandlers }
}
