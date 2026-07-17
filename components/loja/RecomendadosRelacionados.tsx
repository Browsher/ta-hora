import { Heading } from "@/components/ui/Heading"
import { ProductCardLink } from "@/components/loja/ProductCardLink"
import type { ProductCard } from "@/lib/shopify/types"

// Server Component (SEM "use client"): monta a seção no servidor e renderiza os
// cards (client, folha). Mesmo padrão do CatalogGrid — o token nunca chega perto
// daqui, e o cliente recebe HTML pronto. Nenhum estado, efeito ou hook.
export function RecomendadosRelacionados({ produtos }: { produtos: ProductCard[] }) {
  // Guarda ÚNICA: sem recomendados → a seção não aparece. Cobre TODOS os casos —
  // produto sem marca, só o próprio produto na marca, todos indisponíveis, ou
  // falha na busca — porque a página passa `[]` em todos eles. Sem título órfão,
  // sem contêiner vazio, sem resíduo visual.
  if (produtos.length === 0) return null

  return (
    <section className="recomendados-secao" aria-label="Você também pode gostar">
      {/* Copy fixa no código — exceção declarada ao "conteúdo em JSON" do
          product.md. A página de produto não passa pelo PreviewContent.
          Precedente idêntico: "Você também vai precisar" (acessorios-sugeridos)
          e o selo de pagamento (carrinho-loja). Cores via --cor-* do StoreShell. */}
      <Heading
        as="h2"
        size="grande"
        text="Você também pode gostar"
        color="var(--cor-texto)"
        accentColor="var(--cor-destaque)"
      />
      <div className="recomendados-grade">
        {produtos.map((p) => (
          <ProductCardLink key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
