"use client"

import { createContext, useContext } from "react"
import type { SectionEffects } from "@/lib/types"

export const SectionEffectsContext = createContext<SectionEffects | null>(null)

export function useSectionEffects(): SectionEffects | null {
  return useContext(SectionEffectsContext)
}
