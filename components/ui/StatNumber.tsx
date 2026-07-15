"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCounter } from "@/lib/useCounter"

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatNumberProps = Omit<MotionProps, "ref"> & {
  value?:       string    // "3.2x", "10.000", "98%" — prefix/suffix handled by useCounter
  label?:       string    // "ROI médio", "clientes", "satisfação"
  enabled?:     boolean   // animates the count on scroll-into-view (default false = static)
  color?:       string    // number color — default: accentColor
  labelColor?:  string    // label color — default: var(--cor-texto-fraco)
  accentColor?: string
  size?:        "medio" | "grande"
  align?:       "esquerda" | "centro"
  direction?:   "column" | "row"   // column = stacked (BenefitsCard); row = inline (CTAFinal)
  className?:   string
}

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE: Record<"medio" | "grande", { num: string; fw: number; label: string }> = {
  medio:  { num: "clamp(24px, 3vw, 36px)",   fw: 800, label: "clamp(12px, 1vw, 14px)"    },
  grande: { num: "clamp(42px, 5.5vw, 72px)", fw: 900, label: "clamp(10px, 0.9vw, 13px)" },
}

// ─── Component ────────────────────────────────────────────────────────────────
//
// Encapsulates useCounter — consumer passes value/label/enabled, never touches the ref.
// direction="row"    → number + label side-by-side (CTAFinal stats row)
// direction="column" → number stacked above label (BenefitsCard highlight, default)

export function StatNumber({
  value       = "0",
  label       = "",
  enabled     = false,
  color,
  labelColor,
  accentColor = "#D4A017",
  size        = "medio",
  align       = "esquerda",
  direction   = "column",
  className,
  style,
  ...rest
}: StatNumberProps) {
  const { display, ref }   = useCounter(value, enabled)
  const resolvedColor      = color ?? accentColor
  const resolvedLabelColor = labelColor ?? "var(--cor-texto-fraco)"
  const isRow              = direction === "row"
  const isCenter           = align === "centro"
  const s                  = SIZE[size]

  return (
    <motion.div
      data-effect-target="counter"
      className={cn("inline-flex", isRow ? "flex-row items-center" : "flex-col", className)}
      style={{
        gap:        isRow ? 16 : 4,
        alignItems: isRow ? "center" : (isCenter ? "center" : "flex-start"),
        ...(style as object),
      } as MotionProps["style"]}
      {...(rest as MotionProps)}
    >
      <span
        ref={ref}
        style={{ fontSize: s.num, fontWeight: s.fw, lineHeight: 1, color: resolvedColor, flexShrink: 0 }}
      >
        {display}
      </span>
      {label && (
        <span style={{ fontSize: s.label, fontWeight: 400, lineHeight: 1.4, color: resolvedLabelColor }}>
          {label}
        </span>
      )}
    </motion.div>
  )
}
