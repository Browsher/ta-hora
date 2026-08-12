import { Heading } from "@/components/ui/Heading"
import { ProductCardLink } from "@/components/loja/ProductCardLink"
import { CarrosselMobile } from "@/components/ui/CarrosselMobile"
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
      {/* A faixa substitui o <div className="recomendados-grade"> e CARREGA a
          mesma classe: no desktop (≥768px) o layout é exatamente o de antes —
          flex-wrap centralizado, base clamp(150px, 42vw, 240px), max-width 260px,
          gap 20px. O carrossel só se sobrepõe dentro da media query de mobile.
          🔴 `verDetalhes` NÃO é passado: os cards de recomendados seguem como
          hoje (a chamada é só da vitrine da Home). */}
      <CarrosselMobile
        id="carrossel-recomendados"
        // Nome PRÓPRIO da faixa, diferente do aria-label da <section> acima: se
        // os dois fossem iguais, um leitor de tela anunciaria o mesmo rótulo
        // duas vezes ao entrar na região.
        rotulo="Produtos recomendados"
        quantidade={produtos.length}
        classeFaixa="recomendados-grade"
      >
        {produtos.map((p) => (
          // `foraDaDobra` SEMPRE: esta faixa fica no fim da PDP, depois da
          // galeria, da compra, da ficha e da descrição. Nenhum card dela é
          // visível sem rolar.
          //
          // O comentário do `ProductCardLink` já dava os recomendados como
          // exemplo de consumidor abaixo da dobra desde que a prop nasceu — mas
          // o call site nunca a passou. O resultado, medido no HTML de produção
          // em 12/08/2026: 2 imagens de produto recomendado saíam com
          // `<link rel="preload">` e disputavam banda com a imagem de LCP da
          // própria página, no celular, antes da primeira pintura.
          <ProductCardLink key={p.id} product={p} foraDaDobra />
        ))}
      </CarrosselMobile>
    </section>
  )
}
