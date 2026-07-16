import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProducts, getProductByHandle } from "@/lib/shopify/products"
import { StoreShell } from "@/components/loja/StoreShell"
import { ProductGallery } from "@/components/loja/ProductGallery"
import { ProductSpecs } from "@/components/loja/ProductSpecs"
import { BotaoAdicionar } from "@/components/loja/BotaoAdicionar"
import { Heading } from "@/components/ui/Heading"
import { PriceTag } from "@/components/ui/PriceTag"
import type { Product } from "@/lib/shopify/types"

// ISR + params dinâmicos: handles não pré-renderizados renderizam sob demanda.
export const revalidate = 300
export const dynamicParams = true

// C1 — tolerante: sem token/Shopify offline, retorna [] e deixa tudo pro ISR.
// O build NUNCA quebra por env ausente.
export async function generateStaticParams() {
  try {
    const produtos = await getProducts()
    return produtos.map((p) => ({ handle: p.handle }))
  } catch {
    return []
  }
}

// C1 — tolerante: erro → título genérico (não quebra o build).
export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> },
): Promise<Metadata> {
  const { handle } = await params
  try {
    const produto = await getProductByHandle(handle)
    if (produto) return { title: `${produto.title} · Ta Hora` }
  } catch {
    // ignora — cai no título genérico
  }
  return { title: "Produto · Ta Hora" }
}

export default async function ProdutoPage(
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params

  // S1 — dois modos de falha DISTINTOS:
  //   Shopify offline → exceção → UI de erro amigável (dentro do try/catch).
  //   Produto inexistente → null → notFound() FORA do try (senão o catch
  //   engoliria o NEXT_NOT_FOUND lançado por notFound()).
  let produto: Product | null
  try {
    produto = await getProductByHandle(handle)
  } catch {
    return (
      <StoreShell>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px clamp(20px, 5vw, 64px)", color: "var(--cor-texto-secundario)", textAlign: "center" }}>
          Não foi possível carregar o produto. Tente novamente em instantes.
        </div>
      </StoreShell>
    )
  }
  if (!produto) notFound()

  return (
    <StoreShell>
      <article
        // 1 coluna no mobile, 2 no desktop (md ≥ 768px).
        className="mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-[clamp(24px,4vw,56px)]"
        style={{ padding: "40px clamp(20px, 5vw, 64px) 72px" }}
      >
        {/* Coluna esquerda: galeria */}
        <ProductGallery images={produto.images} title={produto.title} />

        {/* Coluna direita: título, preço, ação, descrição, specs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Heading as="h1" size="pequeno" text={produto.title} color="var(--cor-texto)" accentColor="var(--cor-destaque)" />

          <PriceTag price={produto.price.price} currency={produto.price.currency} size="grande" />

          {/* O handle da rota — nunca um merchandiseId: o servidor resolve a
              variante (o cliente não escolhe o que vai pro carrinho). */}
          <BotaoAdicionar handle={handle} />

          {produto.descriptionHtml && (
            <div
              // descriptionHtml é conteúdo do lojista (fronteira de confiança
              // conhecida) — ver design.md, cenário 6.
              dangerouslySetInnerHTML={{ __html: produto.descriptionHtml }}
              style={{ color: "var(--cor-texto-secundario)", lineHeight: 1.7 }}
            />
          )}

          <ProductSpecs specs={produto.specs} />
        </div>
      </article>
    </StoreShell>
  )
}
