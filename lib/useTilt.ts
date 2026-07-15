"use client"

import { useRef, useState, useCallback } from "react"
import type React from "react"

export interface TiltReturn {
  ref: React.RefObject<HTMLDivElement | null>
  style: { rotateX: number; rotateY: number; transformPerspective: number } | object
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseLeave: () => void
}

export function useTilt(enabled: boolean): TiltReturn {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = (e.clientX - rect.left)  / rect.width   // 0..1
      const y = (e.clientY - rect.top)   / rect.height  // 0..1
      setTilt({
        rotateX:  (0.5 - y) * 16,
        rotateY:  (x - 0.5) * 16,
      })
    },
    [enabled]
  )

  const onMouseLeave = useCallback(() => {
    if (!enabled) return
    setTilt({ rotateX: 0, rotateY: 0 })
  }, [enabled])

  if (!enabled) {
    return {
      ref,
      style: {},
      onMouseMove: () => {},
      onMouseLeave: () => {},
    }
  }

  return {
    ref,
    style: { rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 800 },
    onMouseMove,
    onMouseLeave,
  }
}
