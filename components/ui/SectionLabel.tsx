"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
// Átomo de texto: HERDA o stagger da seção (buildSectionItemProps espalhado pelo
// componente) — não tem entry próprio. Ver "Consequência para os átomos" no fase_final.

export type SectionLabelProps = Omit<MotionProps, "ref"> & {
  text?:        string
  color?:       string       // default: accentColor
  accentColor?: string       // "#D4A017"
  showLine?:    boolean      // short decorative bar before text (default false)
  className?:   string
}

// ─── Component ────────────────────────────────────────────────────────────────
//
// Visual spec from lib/tokens.ts → "label": text-[11px] font-bold uppercase tracking-[.14em]
// Marca data-effect-target="badge" (mesmo alvo do HighlightBadge).
// display:"block" so parent text-align controls centering without requiring flexbox changes.
// showLine renders an inline decorative bar that follows the same centering as the text.

export function SectionLabel({
  text         = "",
  color,
  accentColor  = "#D4A017",
  showLine     = false,
  className,
  style,
  ...rest
}: SectionLabelProps) {
  const resolvedColor = color ?? accentColor

  return (
    <motion.span
      data-effect-target="badge"
      className={cn(className)}
      style={{
        display:       "block",
        fontSize:      11,
        fontWeight:    700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color:         resolvedColor,
        ...(style as object),
      } as MotionProps["style"]}
      {...(rest as MotionProps)}
    >
      {showLine && (
        <span
          aria-hidden
          style={{
            display:       "inline-block",
            width:         20,
            height:        2,
            borderRadius:  1,
            background:    resolvedColor,
            marginRight:   8,
            verticalAlign: "middle",
            flexShrink:    0,
          }}
        />
      )}
      {text}
    </motion.span>
  )
}
