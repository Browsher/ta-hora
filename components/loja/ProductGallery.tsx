"use client"

import { useState } from "react"
import { ImageSlot } from "@/components/ui/ImageSlot"
import { urlComLargura, LARGURA_THUMB } from "@/lib/shopify/imagens"
import type { ProductImage } from "@/lib/shopify/types"

// Galeria da página de produto: imagem principal + thumbnails, troca via useState.
//
// As `images` chegam em LARGURA_GALERIA (800) de `normalizeProduct` — tamanho da
// imagem PRINCIPAL. Os thumbnails abaixo pedem a própria largura: são exibidos a
// 64 px, e uma PDP tem até 10 deles. Servi-los a 800 custaria ~10× a banda
// necessária na página que vende.
//
// A derivação é aqui, e não em `normalizeProduct`, porque as duas variantes saem
// da MESMA imagem da lista — não são dois campos, são dois tamanhos do mesmo
// item. `urlComLargura` usa `searchParams.set`, então o `width=800` que já está
// na URL é SOBRESCRITO por 128 (não acumulado). Ver `lib/shopify/imagens.ts`.
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
      {/* Esta é a imagem de LCP da PDP — a maior coisa acima da dobra. Sem
          `fetchPriority`, ela entrava na fila do navegador junto dos até 10
          thumbnails abaixo, todos com preload automático do React 19 e todos com
          a mesma prioridade (medido em 11/08/2026: 8 preloads numa PDP). */}
      <ImageSlot
        src={main.url}
        alt={main.altText ?? title}
        fetchPriority="high"
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
              {/* 🔴 `low`, NÃO `loading="lazy"`. Os thumbnails ficam ACIMA DA
                  DOBRA, e o aviso da prop `loading` em ImageSlot é explícito:
                  lazy ali faz o navegador esperar o layout antes de buscar.
                  `low` não adia a busca, só tira a imagem da frente do LCP.

                  ⚠️ EFEITO COLATERAL MEDIDO, maior do que o esperado: o React 19
                  NÃO emite `<link rel="preload">` para imagem com
                  `fetchPriority="low"`. Ou seja, `low` TAMBÉM tira do preload —
                  função que o comentário da prop `loading` em ImageSlot atribui
                  só ao `lazy`. Se aquele texto for a referência de alguém, ele
                  está incompleto: são dois caminhos para o mesmo efeito, com
                  consequências diferentes para QUANDO a imagem é buscada.

                  Medido no HTML de produção em 12/08/2026, PDP da A31H: 8
                  preloads de imagem antes desta mudança, 1 depois (só o LCP, com
                  `fetchPriority="high"`). Os 5 thumbnails saíram por esta linha;
                  os 2 recomendados, pelo `foraDaDobra` em
                  RecomendadosRelacionados.tsx. */}
              <ImageSlot src={urlComLargura(img.url, LARGURA_THUMB)} alt={img.altText ?? ""} borderRadius={0} fetchPriority="low" style={{ width: "100%", height: "100%" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
