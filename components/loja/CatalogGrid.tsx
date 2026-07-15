import { ProductCardLink } from "@/components/loja/ProductCardLink"
import type { ProductCard } from "@/lib/shopify/types"

// Grid responsivo da vitrine (padrão auto-fit do ProductGrid existente).
// Server Component: renderiza os cards (client) e trata o estado vazio.
export function CatalogGrid({ products }: { products: ProductCard[] }) {
  if (products.length === 0) {
    return (
      <div
        style={{
          textAlign:  "center",
          padding:    "64px 24px",
          color:      "var(--cor-texto-secundario)",
          fontSize:   16,
        }}
      >
        Nenhum produto disponível no momento.
      </div>
    )
  }

  return (
    // Colunas fixas: 2 no celular, 3 no tablet (≥640px), 4 no desktop (≥1024px).
    // Cards se ajustam à largura da coluna (frações) — sem scroll horizontal.
    <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCardLink key={p.id} product={p} />
      ))}
    </div>
  )
}
