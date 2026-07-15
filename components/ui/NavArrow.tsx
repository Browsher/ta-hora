"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import type React from "react"

// Estilos visuais da seta. "circular" é o estilo histórico do átomo (e o default):
// os 3 consumidores (Hero-carrossel, ProductGrid, Testimonials) que não passam
// `variant` continuam renderizando exatamente como antes.
export type ArrowVariant = "circular" | "minimalista" | "pill"

interface NavArrowProps extends Omit<MotionProps, "ref"> {
  direction:   "prev" | "next"
  onClick:     () => void
  accentColor: string
  variant?:    ArrowVariant
  className?:  string
}

// Cada variante deriva SÓ de accentColor (opacidade via color-mix) — agnóstico de tema.
function variantStyle(variant: ArrowVariant, accentColor: string): React.CSSProperties {
  switch (variant) {
    // Sem fundo nem borda: só o chevron. O textShadow garante legibilidade quando a
    // seta fica sobreposta a uma foto (caso do Hero-carrossel).
    case "minimalista":
      return {
        width:      32,
        height:     32,
        background: "transparent",
        border:     "none",
        fontSize:   26,
        textShadow: "0 1px 3px rgba(0,0,0,.45)",
      }

    case "pill":
      return {
        width:        44,
        height:       36,
        borderRadius: "10px",
        background:   `color-mix(in srgb, ${accentColor} 14%, transparent)`,
        border:       `1px solid color-mix(in srgb, ${accentColor} 24%, transparent)`,
        fontSize:     22,
      }

    // DEFAULT — cópia literal do estilo histórico do NavArrow. Não recalcular.
    case "circular":
    default:
      return {
        width:        40,
        height:       40,
        borderRadius: "50%",
        background:   `color-mix(in srgb, ${accentColor} 9.41%, transparent)`,
        border:       `1px solid color-mix(in srgb, ${accentColor} 20.78%, transparent)`,
        fontSize:     22,
      }
  }
}

export function NavArrow({
  direction,
  onClick,
  accentColor,
  variant = "circular",
  className,
  style: extraStyle,
  ...rest
}: NavArrowProps) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={direction === "prev" ? "Anterior" : "Próximo"}
      {...rest}
      className={cn(className)}
      style={{
        // base (comum às 3 variantes)
        color:          accentColor,
        cursor:         "pointer",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
        lineHeight:     1,
        // variante (forma, fundo, borda, tamanho do glifo)
        ...variantStyle(variant, accentColor),
        // consumidor por ÚLTIMO — o position/top/left do Hero continua vencendo
        ...extraStyle,
      }}
    >
      {direction === "prev" ? "‹" : "›"}
    </motion.button>
  )
}
