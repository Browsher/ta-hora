"use client"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { buildImageEntryProps, buildImageHoverProps } from "@/lib/sectionEffectHelpers"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import type { ImageEntry, ImageHover } from "@/lib/types"
import type React from "react"

export type ImageSlotProps = Omit<MotionProps, "ref"> & {
  src?:          string
  alt?:          string
  entry?:        ImageEntry
  hover?:        ImageHover
  borderRadius?: number    // default 24
  maxWidth?:     number    // sets max-width; width is always 100%
  objectFit?:    "cover" | "contain"   // default "cover"; "contain" mostra a imagem INTEIRA (ex: logos)
  className?:    string
}

export function ImageSlot({
  src,
  alt = "",
  entry,
  hover,
  borderRadius = 24,
  maxWidth,
  objectFit = "cover",
  className,
  style,
  ...rest
}: ImageSlotProps) {
  const mode = useEffectsMode()

  const entryMotion = buildImageEntryProps(entry, mode)
  // className from hover is extracted and merged — covers CSS-class-based effects added in future
  const { className: hoverClass, ...hoverMotion } = buildImageHoverProps(hover)

  const containerStyle: React.CSSProperties = {
    borderRadius,
    width: "100%",
    ...(maxWidth !== undefined ? { maxWidth: `${maxWidth}px` } : {}),
    ...(style as object),
  }

  return (
    // Outer: entry animation + clip boundary for zoom containment
    <motion.div
      data-effect-target="image"
      className={cn("overflow-hidden", hoverClass, className)}
      style={containerStyle as MotionProps["style"]}
      {...(entryMotion as MotionProps)}
      {...(rest as MotionProps)}
    >
      {/* Inner: hover target — scales/filters inside overflow:hidden so zoom stays within bounds */}
      <motion.div
        style={{ width: "100%", height: "100%" }}
        {...(hoverMotion as MotionProps)}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            style={{ width: "100%", height: "100%", objectFit, display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "color-mix(in srgb, var(--cor-texto) 30%, transparent)",
              background: "var(--cor-card)",
            }}
          >
            Imagem aqui
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
