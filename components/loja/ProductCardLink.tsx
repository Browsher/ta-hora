"use client"

import Link from "next/link"
import { ImageSlot } from "@/components/ui/ImageSlot"
import { Text } from "@/components/ui/Text"
import { PriceTag } from "@/components/ui/PriceTag"
// import type: só o TIPO (apagado na compilação) — nunca arrasta a camada de
// dados server-only para o bundle do cliente.
import type { ProductCard } from "@/lib/shopify/types"

// Card clicável da vitrine: imagem + título + preço, linkando para a página do
// produto. Reusa os primitivos de components/ui/.
export function ProductCardLink({ product }: { product: ProductCard }) {
  return (
    <Link
      href={`/produtos/${product.handle}`}
      className="block no-underline transition-transform duration-200 hover:-translate-y-1"
      style={{
        background:   "var(--cor-card)",
        border:       "1px solid color-mix(in srgb, var(--cor-destaque) 14%, transparent)",
        borderRadius: 20,
        overflow:     "hidden",
        color:        "var(--cor-texto)",
        height:       "100%",
        display:      "flex",
        flexDirection: "column",
      }}
    >
      <ImageSlot
        src={product.image?.url || undefined}
        alt={product.image?.altText ?? product.title}
        borderRadius={0}
        objectFit="contain"
        style={{ aspectRatio: "1 / 1", width: "100%" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px 18px" }}>
        <Text
          text={product.title}
          size="pequeno"
          color="var(--cor-texto)"
          style={{
            fontWeight:       600,
            // Trava em 2 linhas com reticências → todos os cards com a mesma
            // altura de título (grid uniforme). minHeight reserva as 2 linhas
            // mesmo quando o título tem só 1.
            display:          "-webkit-box",
            WebkitLineClamp:  2,
            WebkitBoxOrient:  "vertical",
            overflow:         "hidden",
            minHeight:        "3.1em", // 2 linhas × lineHeight 1.55
          }}
        />
        <PriceTag price={product.price.price} currency={product.price.currency} size="medio" />
      </div>
    </Link>
  )
}
