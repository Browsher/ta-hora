"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import type React from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type TextProps = Omit<MotionProps, "ref"> & {
  size?:           "grande" | "medio" | "pequeno"
  align?:          "esquerda" | "centro"
  text?:           string
  color?:          string
  accentColor?:    string
  highlightColor?: string  // overrides accentColor for %% spans
  className?:      string
  // `children` vem do MotionProps e serve de escape hatch para conteúdo inline
  // rico (links, p. ex.), quando o texto não cabe numa string com o parser de
  // %%. Se presente, SUBSTITUI `text` — quem passa children aplica o próprio
  // realce. Usado por TextoLegal, que precisa de <a> no meio do parágrafo.
  // Não é redeclarado aqui de propósito: as seções fazem spread de MotionProps
  // em <Text>, e estreitar o tipo quebraria esses call sites.
}

// ─── Size scale ───────────────────────────────────────────────────────────────
// grande  → subtítulo / destaque abaixo do título
// medio   → corpo normal
// pequeno → secundário / legendas
// clamp() prevents overflow on mobile (Armadilha #8)

const SIZE_STYLE: Record<"grande" | "medio" | "pequeno", React.CSSProperties> = {
  grande:  { fontSize: "clamp(16px, 1.5vw, 22px)", fontWeight: 400, lineHeight: 1.6 },
  medio:   { fontSize: "clamp(14px, 1.2vw, 17px)", fontWeight: 400, lineHeight: 1.6 },
  pequeno: { fontSize: "clamp(12px, 1vw,   14px)", fontWeight: 400, lineHeight: 1.55 },
}

// ─── %% highlight parser ──────────────────────────────────────────────────────
// Same contract as Heading: split on %%, odd indices → highlightColor.
// Empty parts (e.g. %% at start/end) skipped. No %% → plain string fast path.

function renderText(text: string, highlight: string): React.ReactNode {
  const parts = text.split("%%")
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
// No data-effect-target — paragraph effects don't exist in the current system.
// No entry prop — no buildTextEntryProps helper exists; paragraphs animate via
// parent stagger or are static. FM props can still be passed via ...rest if needed.

export function Text({
  size           = "medio",
  align          = "esquerda",
  text           = "",
  color,
  accentColor    = "#D4A017",
  highlightColor,
  className,
  children,
  style,
  ...rest
}: TextProps) {
  // Accent como TEXTO → tom forte (ver Heading.tsx / lib/paleta.ts).
  const resolvedHL = highlightColor ?? `var(--cor-destaque-texto-forte, ${accentColor})`

  return (
    <motion.p
      className={cn(className)}
      style={{
        ...SIZE_STYLE[size],
        textAlign: align === "centro" ? "center" : "left",
        ...(color !== undefined ? { color } : {}),
        margin: 0,
        ...(style as object),
      } as MotionProps["style"]}
      {...(rest as MotionProps)}
    >
      {children ?? renderText(text, resolvedHL)}
    </motion.p>
  )
}
