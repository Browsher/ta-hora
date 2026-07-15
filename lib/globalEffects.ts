import type { Layout, GlobalEffectsSettings } from "@/lib/types"

// Efeitos globais do site (smoothScroll, parallax, cursor). Módulo puro —
// sem React, sem estado de app — para poder ser reusado tanto pelo useEfeitos
// (builder) quanto pelo PreviewContent (render final / projeto exportado).

export const GLOBAL_EFFECTS_DEFAULT: GlobalEffectsSettings = {
  smoothScroll: false,
  parallax:     "nenhum",
  cursor:       "nenhum",
}

function isLegacyEffects(e: unknown): boolean {
  return typeof e === "object" && e !== null && "entry" in e
}

// Lê layout.globalSettings.effects, descartando o formato legado, e devolve
// as configurações globais no formato atual (com defaults preenchidos).
export function initGlobalEffects(layout: Layout): GlobalEffectsSettings {
  const saved = layout.globalSettings?.effects as unknown
  if (!saved || isLegacyEffects(saved)) return GLOBAL_EFFECTS_DEFAULT

  const g = saved as Record<string, unknown>

  // Discard legacy fields that no longer live in GlobalEffectsSettings
  const { scrollReveal: _sr, counter: _c, magneticCta: _m, ...rest } = g

  return {
    ...GLOBAL_EFFECTS_DEFAULT,
    ...(rest as Partial<GlobalEffectsSettings>),
  }
}
