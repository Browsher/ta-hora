import type { MotionProps } from "framer-motion"
import type { CardEntry, CardHover, ButtonHover, ButtonSecHover, IconHover, ImageEntry, ImageHover, SectionEntryEffect, NavEntryEffect, FooterEntryEffect } from "@/lib/types"
import type { EffectsMode } from "@/lib/EffectsModeContext"
import {
  fadeUp, fadeIn, staggerContainer, itemVariants, revealClip,
  cardHoverSubir, cardHoverEscalar, cardHoverGlass, cardHoverBorda,
  buttonHoverLevantar, buttonTapPressionar,
  imageHoverZoom, imageHoverOverlay,
  iconHoverRotacionar, iconHoverEscalar, iconHoverBounce, iconHoverGlow,
  navEntrySlideDown, navEntryFade,
  footerEntryFade, footerEntrySubir,
} from "@/lib/animations"

// Gatilho de entrada (whileInView) no preview/export.
// - once: true         → anima UMA vez (não re-dispara ao rolar pra cima/baixo).
// - amount: 0.15        → 15% do elemento visível. Mantido BAIXO de propósito:
//   uma seção mais alta que a viewport nunca ocupa 30%+ "de si mesma" na tela,
//   então amount alto TRAVARIA a entrada dela. amount baixo sempre é alcançável.
// - margin: "0 0 -15% 0" → encolhe a borda INFERIOR do root em 15% da altura da
//   viewport, atrasando o disparo até a seção entrar um pouco mais na tela (o
//   usuário pega melhor a cascata, sobretudo em seções altas como HowItWorks).
//   A margem só DESLOCA a linha de disparo — a seção sempre a cruza ao rolar,
//   então NÃO trava nenhuma animação (diferente de subir o amount).
const VIEWPORT = { once: true, amount: 0.15, margin: "0px 0px -15% 0px" } as const

// Return type shared by hover-only builders
type HoverResult = Pick<MotionProps, "whileHover" | "whileTap"> & { className?: string }

// ─── Entry props factory ─────────────────────────────────────────────────────
// canvas → initial+animate (runs on mount, visible immediately after remount)
// preview → initial+whileInView (runs when scrolled into view)

function entryProps(v: MotionProps["variants"], mode: EffectsMode): MotionProps {
  if (mode === "canvas") {
    return { variants: v as MotionProps["variants"], initial: "hidden", animate: "visible" }
  }
  return { variants: v as MotionProps["variants"], initial: "hidden", whileInView: "visible", viewport: VIEWPORT }
}

// ─── Entrada de seção (stagger da seção inteira) ─────────────────────────────
//
// "subir" → staggerContainer + itemVariants em cascata (todos os átomos da seção)
// "fade"  → a seção inteira faz fadeIn como um bloco único (sem stagger individual)
// "nenhum" → sem animação
//
// Uso no componente:
//   const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
//   const itemProps      = buildSectionItemProps(se?.sectionEntry)
//   // spread itemProps em cada átomo filho da stagger region

export function buildSectionContainerProps(entry: SectionEntryEffect | undefined, mode: EffectsMode): MotionProps {
  if (!entry || entry === "nenhum") return {}
  if (entry === "subir") {
    if (mode === "canvas") return { variants: staggerContainer, initial: "hidden", animate: "visible" }
    return { variants: staggerContainer, initial: "hidden", whileInView: "visible", viewport: VIEWPORT }
  }
  // "fade" — seção toda faz fadeIn como um bloco; filhos são estáticos
  return entryProps(fadeIn, mode)
}

export function buildSectionItemProps(entry: SectionEntryEffect | undefined): MotionProps {
  // Só "subir" cria stagger children. "fade" anima o container — filhos estáticos.
  if (entry === "subir") return { variants: itemVariants }
  return {}
}

// buildBadgeEntryProps / buildTitleEntryProps foram REMOVIDOS: átomos de texto
// herdam o stagger da seção (sectionEntry) — a decisão "Consequência para os
// átomos" do fase_final.md foi executada. Os campos badge/title de SectionEffects
// seguem existindo nos JSONs salvos (compat), mas ninguém os lê.

// ─── Cards — container e item ────────────────────────────────────────────────

export function buildCardContainerProps(entry: CardEntry | undefined, mode: EffectsMode = null): MotionProps {
  if (!entry || entry === "nenhum") return {}
  if (entry === "stagger") {
    if (mode === "canvas") {
      return { variants: staggerContainer, initial: "hidden", animate: "visible" }
    }
    return { variants: staggerContainer, initial: "hidden", whileInView: "visible", viewport: VIEWPORT }
  }
  // scroll-reveal: cada card anima individualmente; container sem stagger
  return {}
}

export function buildCardItemProps(entry: CardEntry | undefined, mode: EffectsMode = null): MotionProps {
  if (!entry || entry === "nenhum") return {}
  if (entry === "stagger") return { variants: itemVariants }
  if (entry === "scroll-reveal") {
    return entryProps(fadeUp, mode)
  }
  return {}
}

// ─── Card hover ──────────────────────────────────────────────────────────────

export function buildCardHoverProps(hover: CardHover | undefined, accentColor = "#D4A017"): HoverResult {
  if (!hover || hover === "nenhum") return {}
  switch (hover) {
    case "subir":   return { whileHover: cardHoverSubir }
    case "escalar": return { whileHover: cardHoverEscalar }
    case "tilt-3d": return { className: "effect-tilt" }
    case "glass":   return { whileHover: cardHoverGlass    as MotionProps["whileHover"] }
    case "borda":   return { whileHover: cardHoverBorda(accentColor) as MotionProps["whileHover"] }
    default:        return {}
  }
}

// ─── Botão principal ─────────────────────────────────────────────────────────

export function buildButtonHoverProps(hover: ButtonHover | undefined): HoverResult {
  if (!hover || hover === "nenhum") return {}
  switch (hover) {
    case "levantar":       return { whileHover: buttonHoverLevantar, whileTap: buttonTapPressionar }
    case "pressionar":     return { whileTap: buttonTapPressionar }
    case "fill":           return { className: "btn-effect-fill-sutil" }
    case "slide":          return { className: "btn-effect-slide-fill" }
    case "glow":           return { className: "btn-effect-glow" }
    case "magnetico":      return { className: "btn-effect-magnetic" }
    default:               return {}
  }
}

// ─── Botão secundário ────────────────────────────────────────────────────────
// Same effect set as the primary button — delegates to avoid duplication.
// Kept as a separate function so the type can diverge in the future if needed.

export function buildButtonSecHoverProps(hover: ButtonSecHover | undefined): HoverResult {
  return buildButtonHoverProps(hover as ButtonHover | undefined)
}

// ─── Ícones ──────────────────────────────────────────────────────────────────

export function buildIconHoverProps(hover: IconHover | undefined): HoverResult {
  if (!hover || hover === "nenhum") return {}
  switch (hover) {
    case "rotacionar": return { whileHover: iconHoverRotacionar }
    case "escalar":    return { whileHover: iconHoverEscalar }
    case "bounce":     return { whileHover: iconHoverBounce }
    case "glow":       return { whileHover: iconHoverGlow }
    case "spin":       return { className: "icon-effect-spin" }
    default:           return {}
  }
}

// ─── Imagem — entrada e hover ────────────────────────────────────────────────

export function buildImageEntryProps(entry: ImageEntry | undefined, mode: EffectsMode = null): MotionProps {
  if (!entry || entry === "nenhum") return {}
  const v = entry === "reveal-clip" ? revealClip : fadeIn
  return entryProps(v, mode)
}

export function buildImageHoverProps(hover: ImageHover | undefined): HoverResult {
  if (!hover || hover === "nenhum") return {}
  if (hover === "zoom")    return { whileHover: imageHoverZoom }
  if (hover === "overlay") return { whileHover: imageHoverOverlay as MotionProps["whileHover"] }
  return {}
}

// ─── Navbar — entrada de página ──────────────────────────────────────────────
// Navbar anima ao CARREGAR a página (initial+animate), não ao scrollar.
// Nunca usa whileInView — a Navbar está sempre no topo, sempre visível.

export function buildNavEntryProps(navEntry: NavEntryEffect | undefined, _mode: EffectsMode): MotionProps {
  if (!navEntry || navEntry === "nenhum") return {}
  const v = navEntry === "slide-down" ? navEntrySlideDown : navEntryFade
  return { variants: v, initial: "hidden", animate: "visible" }
}

// ─── Footer — entrada por scroll ─────────────────────────────────────────────
// Footer usa whileInView (preview) ou animate (canvas) — igual a buildSectionContainerProps.
// Distinção: canvas dispara no mount para que o Apply no painel de Efeitos funcione (armadilha #6).

export function buildFooterEntryProps(footerEntry: FooterEntryEffect | undefined, mode: EffectsMode): MotionProps {
  if (!footerEntry || footerEntry === "nenhum") return {}
  const v = footerEntry === "subir" ? footerEntrySubir : footerEntryFade
  return entryProps(v, mode)
}
