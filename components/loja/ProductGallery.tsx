"use client"

import { useState } from "react"
import { ImageSlot } from "@/components/ui/ImageSlot"
import type { ProductImage } from "@/lib/shopify/types"

// Galeria da página de produto: imagem principal + thumbnails, troca via useState.
export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0)

  // Sem imagens → ImageSlot mostra o placeholder do tema ("Imagem aqui").
  if (images.length === 0) {
    return <ImageSlot alt={title} style={{ aspectRatio: "1 / 1", width: "100%" }} />
  }

  const idx  = Math.min(active, images.length - 1)
  const main = images[idx]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ImageSlot
        src={main.url}
        alt={main.altText ?? title}
        style={{ aspectRatio: "1 / 1", width: "100%" }}
      />

      {images.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagem ${i + 1} de ${images.length}`}
              aria-current={i === idx}
              style={{
                width:        64,
                height:       64,
                flexShrink:   0,
                padding:      0,
                borderRadius: 10,
                overflow:     "hidden",
                cursor:       "pointer",
                background:   "none",
                border: `2px solid ${
                  i === idx ? "var(--cor-destaque)" : "color-mix(in srgb, var(--cor-texto) 12%, transparent)"
                }`,
              }}
            >
              <ImageSlot src={img.url} alt={img.altText ?? ""} borderRadius={0} style={{ width: "100%", height: "100%" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
