"use client"

import { useState, useEffect } from "react"
import { useMobileOverride } from "@/lib/MobileOverrideContext"

export function useIsMobile(breakpoint = 768): boolean {
  const override = useMobileOverride()
  const [fromViewport, setFromViewport] = useState(false)

  useEffect(() => {
    if (override !== null) return  // skip listener when overridden
    function check() {
      setFromViewport(window.innerWidth < breakpoint)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint, override])

  return override !== null ? override : fromViewport
}
