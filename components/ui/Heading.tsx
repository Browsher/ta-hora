"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import type React from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
// Átomo de texto: HERDA o stagger da seção (buildSectionItemProps espalhado pelo
// componente) — não tem entry próprio. Ver "Consequência para os átomos" no fase_final.

export type HeadingProps = Omit<MotionProps, "ref"> & {
  as?:             "h1" | "h2" | "h3"
  size?:           "grande" | "medio" | "pequeno"
  text?:           string
  color?:          string
  accentColor?:    string
  highlightColor?: string  // overrides accentColor for the highlighted spans
  className?:      string
}

// ─── Size scale ───────────────────────────────────────────────────────────────
// clamp() prevents text overflow on mobile (Armadilha #8)

const SIZE_STYLE: Record<"grande" | "medio" | "pequeno", React.CSSProperties> = {
  grande:  { fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 800, lineHeight: 1.15 },
  medio:   { fontSize: "clamp(22px, 3.2vw, 38px)", fontWeight: 700, lineHeight: 1.25 },
  pequeno: { fontSize: "clamp(18px, 2.4vw, 30px)", fontWeight: 700, lineHeight: 1.3  },
}

// ─── %% highlight parser ──────────────────────────────────────────────────────
//
// "text %%highlight%% more" → split on %%; odd indices get highlightColor,
// even indices inherit parent color. Unclosed %% (odd count) → last chunk highlighted.
// Empty parts (e.g. %% at start/end) are skipped — no stray spans.

function renderText(text: string, highlight: string): React.ReactNode {
  const parts = text.split("%%")
  // Fast path: no delimiter → plain string, inherits parent style={{ color }}
  if (parts.length === 1) return text
  return (
    <>
      {parts.map((part, i) =>
        part ? (
          <span key={i} style={i % 2 === 1 ? { color: highlight } : undefined}>
            {part}
          </span>
        ) : null
      )}
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Heading({
  as             = "h2",
  size           = "medio",
  text           = "",
  color,
  accentColor    = "#D4A017",
  highlightColor,
  className,
  style,
  ...rest
}: HeadingProps) {
  // O accent aqui é TEXTO sobre o fundo da página — usa o tom forte, não o
  // vibrante (que é de superfície). Fallback = accentColor: sem o slot na
  // paleta, o comportamento é o de antes. Ver lib/paleta.ts.
  const resolvedHL   = highlightColor ?? `var(--cor-destaque-texto-forte, ${accentColor})`

  // Dynamic tag — ternary avoids TypeScript union issues with motion[as]
  const Tag = as === "h1" ? motion.h1 : as === "h3" ? motion.h3 : motion.h2

  return (
    <Tag
      data-effect-target="title"
      className={cn(className)}
      style={{
        ...SIZE_STYLE[size],
        ...(color !== undefined ? { color } : {}),
        margin: 0,
        ...(style as object),
      } as MotionProps["style"]}
      {...(rest as MotionProps)}
    >
      {renderText(text, resolvedHL)}
    </Tag>
  )
}
