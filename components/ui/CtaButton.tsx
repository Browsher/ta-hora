"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { buildButtonHoverProps } from "@/lib/sectionEffectHelpers"
import type { ButtonHover } from "@/lib/types"
import { tokens } from "@/lib/tokens"
import { registrarCadastroInicio } from "@/lib/analytics/gtag"
import type React from "react"

type BtnShape = "quadrado" | "pill" | "reto" | "sublinhado"
type BtnFill  = "solido" | "outline" | "ghost"

export type CtaButtonProps = Omit<MotionProps, "ref"> & {
  href?:        string
  label?:       string
  hover?:       ButtonHover
  shape?:       BtnShape
  fill?:        BtnFill
  accentColor?: string
  textColor?:   string
  paddingX?:    number
  className?:   string
  /**
   * Aditivo. Existe porque o "Finalizar compra" do `CarrinhoDrawer` precisa
   * disparar `begin_checkout` antes de sair para a Shopify.
   *
   * Declarado EXPLICITAMENTE em vez de contar com o `...rest`: `MotionProps` do
   * framer-motion não inclui handlers de DOM, então um `onClick` passado por
   * quem usa o componente seria rejeitado pelo `tsc`. Vale para as duas
   * variantes (âncora e botão) — cai no mesmo spread.
   */
  onClick?:     React.MouseEventHandler<HTMLElement>
}

function buildStyle(
  shape: BtnShape,
  fill:  BtnFill,
  accentColor: string,
  textColor:   string,
  paddingX:    number,
): React.CSSProperties {
  if (shape === "sublinhado") {
    return {
      borderRadius: 0,
      background: "transparent",
      border: "none",
      // Sublinhado do rótulo: acompanha o TEXTO, não é superfície → tom forte.
      borderBottom: `2px solid var(--cor-destaque-texto-forte, ${accentColor})`,
      color: textColor,
      padding: "4px 0",
    }
  }

  const radius =
    shape === "pill"     ? "100px" :
    shape === "quadrado" ? "8px"   : "0px"

  const bg     = fill === "solido"  ? accentColor              : "transparent"
  const border = fill === "outline" ? `2px solid ${accentColor}` : "none"

  return {
    borderRadius: radius,
    background: bg,
    border,
    color: textColor,
    paddingLeft:  `${paddingX}px`,
    paddingRight: `${paddingX}px`,
  }
}

export function CtaButton({
  href,
  label,
  hover,
  shape       = "pill",
  fill        = "solido",
  accentColor = tokens.accent.default,
  textColor,
  paddingX    = 32,
  className,
  style,
  onClick,
  ...rest
}: CtaButtonProps) {
  const resolvedText = textColor ?? "var(--cor-destaque-texto)"

  // fill/slide hover assume a box with background — suppress on sublinhado (no box)
  const safeHover: ButtonHover | undefined =
    shape === "sublinhado" && (hover === "fill" || hover === "slide") ? "nenhum" : hover

  const { className: fxClass, ...fxMotion } = buildButtonHoverProps(safeHover)

  const computedStyle = {
    ...buildStyle(shape, fill, accentColor, resolvedText, paddingX),
    ...(style as object),
  } as MotionProps["style"]

  const computedClass = cn(
    "py-3 text-sm font-semibold inline-block cursor-pointer",
    fxClass,
    className,
  )

  if (href) {
    return (
      <motion.a
        href={href}
        data-effect-target="button"
        className={computedClass}
        style={computedStyle}
        onClick={(e) => {
          if (href.includes("afiliados.tahora.com.br")) {
            registrarCadastroInicio()
          }
          onClick?.(e)
        }}
        {...(fxMotion as MotionProps)}
        {...(rest as MotionProps)}
      >
        {label}
      </motion.a>
    )
  }

  return (
    <motion.button
      type="button"
      data-effect-target="button"
      className={computedClass}
      style={computedStyle}
      onClick={onClick}
      {...(fxMotion as MotionProps)}
      {...(rest as MotionProps)}
    >
      {label}
    </motion.button>
  )
}
