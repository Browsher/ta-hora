"use client"

import { createContext, useContext } from "react"

export type EffectsMode = "canvas" | "preview" | null

export const EffectsModeContext = createContext<EffectsMode>(null)

export function useEffectsMode(): EffectsMode {
  return useContext(EffectsModeContext)
}
