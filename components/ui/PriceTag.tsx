"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { HighlightBadge } from "@/components/ui/HighlightBadge"
import { Text } from "@/components/ui/Text"
import type React from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriceTagProps = Omit<MotionProps, "ref"> & {
  price?:         string   // number portion only — "97,00"
  currency?:      string   // "R$" (default)
  oldPrice?:      string   // "De R$ 197" — shown strikethrough above price
  discountLabel?: string   // "50% OFF" → rendered as HighlightBadge (solido variant)
  installments?:  string   // "12x de R$ 9,70 sem juros"
  cashNote?:      string   // "ou R$ 97 à vista"
  accentColor?:   string
  size?:          "medio" | "grande"
  align?:         "esquerda" | "centro"
  className?:     string
}

// ─── Price number display ─────────────────────────────────────────────────────
// currency symbol (small) + integer part (big) + decimal part (medium)
// Split on first comma so "97,00" → integer="97", decimal=",00"

const INT_SIZE: Record<"medio" | "grande", string> = {
  grande: "clamp(36px, 5vw, 64px)",
  medio:  "clamp(28px, 4vw, 48px)",
}
const DEC_SIZE: Record<"medio" | "grande", string> = {
  grande: "clamp(18px, 2.2vw, 26px)",
  medio:  "clamp(14px, 1.8vw, 20px)",
}
const CUR_SIZE = "clamp(12px, 1.2vw, 15px)"

function PriceNumber({
  currency, price, size,
}: { currency: string; price: string; size: "medio" | "grande" }) {
  const commaIdx = price.indexOf(",")
  const integer  = commaIdx >= 0 ? price.slice(0, commaIdx) : price
  const decimal  = commaIdx >= 0 ? price.slice(commaIdx)    : undefined // includes ","

  return (
    <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 2, lineHeight: 1 }}>
      <span style={{ fontSize: CUR_SIZE, fontWeight: 700, paddingTop: "0.3em", flexShrink: 0, opacity: 0.8 }}>
        {currency}
      </span>
      <span style={{ fontSize: INT_SIZE[size], fontWeight: 800, lineHeight: 1 }}>
        {integer}
      </span>
      {decimal && (
        <span style={{ fontSize: DEC_SIZE[size], fontWeight: 700, paddingTop: "0.15em", flexShrink: 0 }}>
          {decimal}
        </span>
      )}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PriceTag({
  price         = "0,00",
  currency      = "R$",
  oldPrice,
  discountLabel,
  installments,
  cashNote,
  accentColor   = "#D4A017",
  size          = "medio",
  align         = "esquerda",
  className,
  style,
  ...rest
}: PriceTagProps) {
  const isCenter   = align === "centro"
  const flexAlign  = isCenter ? "center" : "flex-start"
  const hasTopRow  = Boolean(oldPrice || discountLabel)
  const hasBottomRow = Boolean(installments || cashNote)

  return (
    <motion.div
      className={cn("inline-flex flex-col", className)}
      style={{
        gap: 6,
        alignItems: flexAlign,
        ...(style as object),
      } as MotionProps["style"]}
      {...(rest as MotionProps)}
    >
      {/* Top row: old price (strikethrough) + discount badge */}
      {hasTopRow && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          justifyContent: isCenter ? "center" : "flex-start",
        }}>
          {oldPrice && (
            <Text
              size="pequeno"
              text={oldPrice}
              color="var(--cor-texto-fraco)"
              style={{ textDecoration: "line-through" }}
            />
          )}
          {discountLabel && (
            <HighlightBadge text={discountLabel} accentColor={accentColor} variant="solido" />
          )}
        </div>
      )}

      {/* Main price — always rendered */}
      <PriceNumber currency={currency} price={price} size={size} />

      {/* Bottom rows: installments and/or cash note */}
      {hasBottomRow && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: flexAlign }}>
          {installments && (
            <Text size="pequeno" text={installments} color="var(--cor-texto-fraco)" />
          )}
          {cashNote && (
            <Text size="pequeno" text={cashNote} color="var(--cor-texto-fraco)" />
          )}
        </div>
      )}
    </motion.div>
  )
}
