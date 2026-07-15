"use client"

import { motion, type MotionProps } from "framer-motion"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildIconHoverProps } from "@/lib/sectionEffectHelpers"
import type { IconHover } from "@/lib/types"
import type React from "react"

// ─── Lucide detection ─────────────────────────────────────────────────────────
//
// Strategy:
//   1. Emoji / unicode chars → codepoint > 0x7E → not a lucide name → render as text
//   2. ASCII kebab/word string → try PascalCase lookup in lucide exports
//   3. Lucide icons are forwardRef objects (typeof === "object"); utilities/factories are functions

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase())
}

function getLucideIcon(name: string): LucideIcon | null {
  // Non-ASCII → emoji or unicode char → not a lucide name
  if (/[^\x20-\x7E]/.test(name)) return null
  // Must look like a kebab/word identifier
  if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) return null

  const pascal    = toPascalCase(name)
  const candidate = (LucideIcons as Record<string, unknown>)[pascal]

  // Lucide icon components are forwardRef objects { $$typeof, render }
  // createLucideIcon and other utilities are functions — excluded by this check
  if (!candidate || typeof candidate !== "object") return null
  return candidate as LucideIcon
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type IconSlotProps = Omit<MotionProps, "ref"> & {
  icon?:        string     // emoji ("🔒") or lucide name ("lock", "arrow-right")
  hover?:       IconHover  // rotacionar/escalar/bounce/glow/spin/nenhum
  size?:        number     // box size when bgColor set; icon size otherwise. default 32
  color?:       string     // lucide stroke color; emoji ignores this
  bgColor?:     string     // optional background container around the icon
  borderColor?: string     // border of the box (applied as 1px solid); only when bgColor set
  className?:   string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IconSlot({
  icon        = "",
  hover,
  size        = 32,
  color,
  bgColor,
  borderColor,
  className,
  style,
  ...rest
}: IconSlotProps) {
  // spinClass → CSS @keyframes (spin) → must go on inner <span>, NOT on motion.div
  // fxMotion  → Framer Motion whileHover (rotate/scale/bounce/glow) → goes on motion.div
  // Reason: FM owns the `transform` property on motion.div — CSS @keyframes transforms
  // on the same element are silently overridden. Armadilha #4.
  const { className: spinClass, ...fxMotion } = buildIconHoverProps(hover)

  const LucideComp = icon ? getLucideIcon(icon) : null
  const hasBox     = bgColor !== undefined

  // Icon content — lucide svg or emoji/text span
  const innerSize = hasBox ? Math.round(size * 0.55) : size
  const fontSize  = hasBox ? size * 0.42 : size * 0.85

  const iconContent: React.ReactNode = LucideComp ? (
    <LucideComp size={innerSize} color={color ?? "currentColor"} strokeWidth={1.75} />
  ) : (
    <span style={{ fontSize, lineHeight: 1, display: "inline-block" }}>{icon}</span>
  )

  // Optional background box
  const boxed: React.ReactNode = hasBox ? (
    <div
      style={{
        width:           size,
        height:          size,
        borderRadius:    Math.round(size * 0.23),
        flexShrink:      0,
        background:      bgColor,
        border:          borderColor ? `1px solid ${borderColor}` : undefined,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
      }}
    >
      {iconContent}
    </div>
  ) : iconContent

  return (
    <motion.div
      data-effect-target="icon"
      className={cn("inline-flex flex-shrink-0", className)}
      style={style as MotionProps["style"]}
      {...(fxMotion as MotionProps)}
      {...(rest as MotionProps)}
    >
      {/* Inner span carries the CSS spin class — isolated from FM transform on the motion.div */}
      <span className={spinClass} style={{ display: "inline-flex" }}>
        {boxed}
      </span>
    </motion.div>
  )
}
