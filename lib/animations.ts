import { Variants } from "framer-motion"

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export const fadeUpBounce: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export const slideIn: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
}

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export const hoverCard = {
  rest: { scale: 1 },
  hover: { scale: 1.03, transition: { duration: 0.25, ease: "easeOut" } },
}

export const hoverButton = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.97 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

// ─── Entrada de seção ────────────────────────────────────────────────────────

export const slideRight: Variants = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export const slideLeft: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export const zoomIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Entrada de imagem ───────────────────────────────────────────────────────

export const revealClip: Variants = {
  hidden:  { clipPath: "inset(0 100% 0 0)", opacity: 1 },
  visible: { clipPath: "inset(0 0% 0 0)",   opacity: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Hover de card ───────────────────────────────────────────────────────────

export const cardHoverSubir    = { y: -4,       transition: { duration: 0.2 } }
export const cardHoverEscalar  = { scale: 1.03, transition: { duration: 0.2 } }
export const cardHoverGlass    = { backdropFilter: "blur(12px)", backgroundColor: "rgba(255,255,255,0.06)" }
// cardHoverBorda is a function because the shadow color follows accentColor
export const cardHoverBorda    = (accentColor: string) => ({ boxShadow: `0 0 0 1px color-mix(in srgb, ${accentColor} 50.2%, transparent)` })

// ─── Hover/tap de botão ──────────────────────────────────────────────────────

export const buttonHoverLevantar = { y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", transition: { duration: 0.2 } }
export const buttonTapPressionar = { scale: 0.97 }

// ─── Hover de imagem ─────────────────────────────────────────────────────────

export const imageHoverZoom    = { scale: 1.05,            transition: { duration: 0.3 } }
export const imageHoverOverlay = { filter: "brightness(0.7)" }

// ─── Hover de ícone ──────────────────────────────────────────────────────────

export const iconHoverRotacionar = { rotate: 15,  transition: { duration: 0.2 } }
export const iconHoverEscalar    = { scale: 1.2,  transition: { duration: 0.2 } }
export const iconHoverBounce     = { y: -6, transition: { type: "spring" as const, stiffness: 500, damping: 10 } }
export const iconHoverGlow       = { filter: "drop-shadow(0 0 8px currentColor)", transition: { duration: 0.2 } }

// ─── Entrada da Navbar (page-load, usa animate não whileInView) ───────────────

export const navEntrySlideDown: Variants = {
  hidden:  { opacity: 0, y: -40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export const navEntryFade: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Entrada do Footer (scroll-triggered, usa whileInView) ───────────────────

export const footerEntryFade: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export const footerEntrySubir: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}