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
      {products.map((p, i) => (
        <ProductCardLink
          key={p.id}
          product={p}
          // 🔴 QUEM SABE A POSIÇÃO É QUEM ITERA — o card não tem como saber, e o
          // comentário dele em ProductCardLink.tsx pede exatamente isto.
          //
          // O índice 0 é o LCP das duas larguras: no celular ele é o primeiro de
          // uma linha de 2, no desktop o primeiro de uma linha de 4. É o único que
          // recebe `prioritaria` — a prop é uma ordem RELATIVA e marcar vários a
          // anula.
          prioritaria={i === 0}
          // O CORTE É EM 4 PORQUE A GRADE MAIS LARGA MOSTRA 4, não porque 4 caiba
          // na dobra do celular. Errar para o lado do eager é barato (uma imagem
          // baixada cedo demais); errar para o lado do lazy custa LCP em quem tem
          // a tela grande, que é justamente onde as 4 aparecem de primeira.
          //
          // Com 7 produtos isso deixa 3 em lazy. Eles saem da fila de preload e
          // param de disputar banda com o índice 0 — que era o problema real do
          // /catalogo, mais do que a ausência de prioridade.
          foraDaDobra={i >= 4}
        />
      ))}
    </div>
  )
}
