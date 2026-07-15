"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
// Átomo de texto: HERDA o stagger da seção (buildSectionItemProps espalhado pelo
// componente) — não tem entry próprio. Ver "Consequência para os átomos" no fase_final.

export type HighlightBadgeProps = Omit<MotionProps, "ref"> & {
  text?:        string       // "50% OFF", "Novo", "Mais vendido"
  accentColor?: string
  variant?:     "solido" | "suave"
  showDot?:     boolean      // colored dot before text
  dotColor?:    string       // default: matches text color
  className?:   string
}

// ─── Component ────────────────────────────────────────────────────────────────
//
// variant "suave" (default) — translucent background, accent-colored text.
//   Matches the Hero Badge: bg accent @12.55%, border accent @31.37% (via color-mix).
// variant "solido" — filled background, contrasting text (Armadilha #2).
//   Dot defaults to the same color as text so it stays visible on the solid bg.

export function HighlightBadge({
  text        = "",
  accentColor = "#D4A017",
  variant     = "suave",
  showDot     = false,
  dotColor,
  className,
  style,
  ...rest
}: HighlightBadgeProps) {
  const textColor  = variant === "solido" ? "var(--cor-destaque-texto)" : accentColor
  // Versões translúcidas do accent via color-mix (in srgb — mesmo espaço do hex+alpha).
  // %s exatas: 20→12.55%, 50→31.37% (parseInt(sfx,16)/255). Aceita accentColor hex OU var(--cor-destaque).
  const bg         = variant === "solido" ? accentColor : `color-mix(in srgb, ${accentColor} 12.55%, transparent)`
  const border     = variant === "solido" ? "none"      : `1px solid color-mix(in srgb, ${accentColor} 31.37%, transparent)`
  // dot follows text color so it stays readable on both variants
  const resolvedDot = dotColor ?? textColor

  return (
    <motion.span
      data-effect-target="badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        "text-[11px] font-bold uppercase tracking-[.14em]",
        className,
      )}
      style={{
        background: bg,
        border,
        color: textColor,
        ...(style as object),
      } as MotionProps["style"]}
      {...(rest as MotionProps)}
    >
      {showDot && (
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ background: resolvedDot }}
        />
      )}
      {text}
    </motion.span>
  )
}
