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
  /**
   * `loading="lazy"` → a imagem sai do caminho crítico.
   *
   * 🔴 O EFEITO PRINCIPAL DESTA PROP NÃO É O LAZY-LOAD, É O PRELOAD.
   *
   * Nenhum `<link rel="preload" as="image">` deste site está escrito à mão: o
   * React 19 emite UM para cada `<img>` renderizada no SSR **que não tenha
   * `loading="lazy"`**. Medido na PDP em 11/08/2026: 12 imagens, 4 com lazy
   * (as da descrição), exatamente 8 preloads.
   *
   * Ou seja: marcar `lazy` é o único jeito de tirar uma imagem da lista de
   * preload — não existe "desligar o preload" separadamente.
   *
   * ⚠️ NUNCA marque `lazy` na imagem de LCP nem em nada acima da dobra que
   * importe: além de perder o preload, o navegador passa a esperar o layout
   * antes de buscá-la. Ver o levantamento na seção 10 do SEO-AUDIT.md.
   */
  loading?:      "lazy" | "eager"
  /**
   * `fetchPriority="high"` na imagem de LCP: sobe a prioridade dela na fila do
   * navegador acima das outras imagens da página. Complementa o `loading` — um
   * tira as concorrentes da frente, o outro adianta a que importa.
   */
  fetchPriority?: "high" | "low" | "auto"
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
  loading,
  fetchPriority,
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
            // Omitidos quando não informados: `loading={undefined}` deixa o
            // default do navegador ("eager"), que é o comportamento de sempre —
            // nenhum call site existente muda por esta prop ter nascido.
            {...(loading ? { loading } : {})}
            {...(fetchPriority ? { fetchPriority } : {})}
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
