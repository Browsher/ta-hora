"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTilt } from "@/lib/useTilt"
import { buildCardHoverProps, buildCardItemProps } from "@/lib/sectionEffectHelpers"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import type { CardHover, CardEntry } from "@/lib/types"
import type React from "react"

export type TiltCardProps = Omit<MotionProps, "ref"> & {
  hover?:       CardHover
  entry?:       CardEntry   // encapsula buildCardItemProps — consumers existentes ainda podem passar via {...rest}
  accentColor?: string      // used by the "borda" hover effect — defaults to "#D4A017"
  children:     React.ReactNode
  className?:   string
}

export function TiltCard({
  hover,
  entry,
  accentColor = "#D4A017",
  children,
  style,
  className,
  ...rest
}: TiltCardProps) {
  const mode   = useEffectsMode()
  const tilt   = useTilt(hover === "tilt-3d")

  // Entry props — stagger/scroll-reveal encapsulated; safe to merge with consumer rest
  const entryMotion = buildCardItemProps(entry, mode)

  // Hover props — extract className to merge via cn() (prevents bug #5 className overwrite)
  let hoverClass: string | undefined
  let hoverMotion: MotionProps = {}
  if (hover !== "tilt-3d") {
    const { className: cls, ...motion } = buildCardHoverProps(hover, accentColor)
    hoverClass  = cls
    hoverMotion = motion as MotionProps
  }

  return (
    <motion.div
      ref={tilt.ref as React.RefObject<HTMLDivElement>}
      data-effect-target="card"
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={cn(hoverClass, className)}
      style={{ ...(tilt.style as object), ...(style as object) } as MotionProps["style"]}
      {...(entryMotion as MotionProps)}
      {...hoverMotion}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
