"use client"

import { createContext, useContext } from "react"

// Allows playgrounds / test harnesses to force a mobile state without needing
// a real viewport resize. Components that call useIsMobile() pick this up
// automatically — no changes needed at the call site.
//
// null  = no override; useIsMobile falls back to window.innerWidth
// true  = force mobile (playground "📱 390px" mode)
// false = force desktop (not currently used, but available)

export const MobileOverrideContext = createContext<boolean | null>(null)

export function useMobileOverride(): boolean | null {
  return useContext(MobileOverrideContext)
}
