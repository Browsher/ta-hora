"use client"

import { createContext, useContext } from "react"
import type { GlobalEffectsSettings } from "@/lib/types"

export const GlobalEffectsContext = createContext<GlobalEffectsSettings | null>(null)

export function useGlobalEffects(): GlobalEffectsSettings | null {
  return useContext(GlobalEffectsContext)
}
