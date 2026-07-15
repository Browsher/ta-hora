"use client"

import { useEffect } from "react"
import { useGlobalEffects } from "@/lib/GlobalEffectsContext"

export function GlobalEffectsProvider({ children }: { children: React.ReactNode }) {
  const g = useGlobalEffects()

  // Smooth scroll
  useEffect(() => {
    if (!g) return
    document.documentElement.style.scrollBehavior = g.smoothScroll ? "smooth" : "auto"
    return () => { document.documentElement.style.scrollBehavior = "auto" }
  }, [g?.smoothScroll])

  // Cursor class + mousemove to track position via CSS vars
  useEffect(() => {
    if (!g) return
    document.body.classList.remove("cursor-ponto", "cursor-circulo")
    if (g.cursor === "ponto")   document.body.classList.add("cursor-ponto")
    if (g.cursor === "circulo") document.body.classList.add("cursor-circulo")

    if (g.cursor === "ponto" || g.cursor === "circulo") {
      function onMove(e: MouseEvent) {
        document.body.style.setProperty("--cx", `${e.clientX}px`)
        document.body.style.setProperty("--cy", `${e.clientY}px`)
      }
      document.addEventListener("mousemove", onMove)
      return () => {
        document.removeEventListener("mousemove", onMove)
        document.body.style.removeProperty("--cx")
        document.body.style.removeProperty("--cy")
        document.body.classList.remove("cursor-ponto", "cursor-circulo")
      }
    }

    return () => { document.body.classList.remove("cursor-ponto", "cursor-circulo") }
  }, [g?.cursor])

  // Magnetic CTA — single document listener, targets only .btn-effect-magnetic
  useEffect(() => {
    const MULTIPLIER = 0.3
    const RADIUS = 80

    function handleMove(e: MouseEvent) {
      document.querySelectorAll<HTMLElement>(".btn-effect-magnetic").forEach((btn) => {
        const rect = btn.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < RADIUS) {
          btn.style.transform = `translate(${(dx * MULTIPLIER).toFixed(1)}px, ${(dy * MULTIPLIER).toFixed(1)}px)`
          btn.style.transition = "transform 0.15s ease-out"
        } else {
          btn.style.transform = ""
          btn.style.transition = "transform 0.3s ease-out"
        }
      })
    }

    function handleLeave() {
      document.querySelectorAll<HTMLElement>(".btn-effect-magnetic").forEach((btn) => {
        btn.style.transform = ""
        btn.style.transition = "transform 0.3s ease-out"
      })
    }

    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseleave", handleLeave)

    return () => {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return <>{children}</>
}
