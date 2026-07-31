import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProducts, getProductByHandle } from "@/lib/shopify/products"
import { sanitizarDescricao } from "@/lib/shopify/sanitizarDescricao"
import { StoreShell } from "@/components/loja/StoreShell"
import { ProductGallery } from "@/components/loja/ProductGallery"
import { DescricaoProduto } from "@/components/loja/DescricaoProduto"
import { BotaoAdicionar } from "@/components/loja/BotaoAdicionar"
import { FichaTecnica } from "@/components/loja/FichaTecnica"
import { RecomendadosRelacionados } from "@/components/loja/RecomendadosRelacionados"
import { Heading } from "@/components/ui/Heading"
import { PriceTag } from "@/components/ui/PriceTag"
import { marcaDoProduto } from "@/lib/shopify/tags"
import { buscarRecomendados } from "@/lib/shopify/recomendados"
import type { Product, ProductCard } from "@/lib/shopify/types"

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
//
// 🔴 O SUFIXO SAIU DAQUI. O `· Ta Hora` que este arquivo acrescentava à mão foi
// substituído pelo `template: "%s | Ta Hora"` do app/layout.tsx — mantê-lo
// produziria "Camera Q8 · Ta Hora | Ta Hora". O separador mudou de `·` para `|`
// junto com o resto do site, que agora é uniforme.
//
// O `canonical` é o item de maior consequência desta rota: os links de afiliado
// apontam para PDPs com `?ref=<código>`, e sem ele cada afiliado criava uma URL
// distinta da MESMA página aos olhos do Google. Relativo, resolvido contra o
// `metadataBase` — e sem a query, que é o ponto.
export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> },
): Promise<Metadata> {
  const { handle } = await params
  const canonical = `/produtos/${handle}`
  try {
    const produto = await getProductByHandle(handle)
    if (produto) {
      const descricao = `${produto.title} — original, com nota fiscal e garantia. Entrega para todo o Brasil e até 12x sem juros no Ta Hora.`

      // 🔴 `openGraph` de uma rota SUBSTITUI o do layout raiz INTEIRO — não
      // mescla campo a campo. Enquanto este bloco declarava só `title` e `url`,
      // as 7 PDPs saíam sem `og:image`, `og:site_name`, `og:locale` e `og:type`:
      // link de produto no WhatsApp aparecia sem prévia nenhuma. Por isso tudo
      // que o raiz define e continua valendo aqui é REPETIDO abaixo. Ao mexer
      // no openGraph do app/layout.tsx, revisar este bloco junto.
      const foto = produto.images[0]

      return {
        title:       produto.title,
        description: descricao,
        alternates:  { canonical },
        openGraph: {
          type:     "website",
          locale:   "pt_BR",
          siteName: "Ta Hora",
          title:    produto.title,
          description: descricao,
          url:      canonical,
          images: [
            foto
              // `foto.url` já vem ABSOLUTA do CDN da Shopify — o `metadataBase`
              // não a toca. width/height só entram se a Shopify informou: OG
              // aceita a ausência, mas dimensão errada faz o WhatsApp recortar
              // mal ou descartar a prévia.
              ? {
                  url:    foto.url,
                  ...(foto.width  ? { width:  foto.width  } : {}),
                  ...(foto.height ? { height: foto.height } : {}),
                  alt:    foto.altText ?? produto.title,
                }
              // Produto sem foto cadastrada: cai na arte genérica do site, que
              // é melhor do que link sem prévia.
              : {
                  url:    "/uploads/og-image.webp",
                  width:  1200,
                  height: 630,
                  alt:    "Ta Hora — câmeras de segurança Wi-Fi originais",
                },
          ],
        },
      }
    }
  } catch {
    // ignora — cai no título genérico
  }
  return { title: "Produto", alternates: { canonical } }
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

  // Sanitiza no SERVIDOR (fronteira única). "" quando não há conteúdo visível —
  // é isso que decide o layout: 2 colunas (com descrição) x 1 coluna centrada.
  const descricaoLimpa = sanitizarDescricao(produto.descriptionHtml)
  const temDescricao = descricaoLimpa !== ""

  // Recomendados da MESMA marca (seção "Você também pode gostar"). Só busca se o
  // produto tem marca conhecida; a busca roda NO SERVIDOR, no ISR desta página.
  // Falha → [] → a seção não aparece: um extra não pode derrubar a página que
  // vende. Sem console.error (a mensagem de storefrontFetch conteria o endpoint).
  const marca = marcaDoProduto(produto.tags)
  let recomendados: ProductCard[] = []
  if (marca) {
    try {
      recomendados = await buscarRecomendados(marca, produto.handle)
    } catch {
      recomendados = []
    }
  }

  return (
    <StoreShell>
      <article
        // Layout em globals.css (classes explícitas — o mx-auto do Tailwind não
        // é gerado neste projeto): `produto-grid` = 60/40 centrado com esquerda
        // sticky; `produto-unico` = 1 coluna estreita centrada (sem descrição).
        className={temDescricao ? "produto-grid" : "produto-unico"}
        style={{ padding: "40px clamp(20px, 5vw, 64px) 72px" }}
      >
        {/* Coluna esquerda — bloco de compra. É o alvo do sticky (globals.css).
            No DESKTOP, um sub-grid lado a lado [galeria | info] baixa a altura da
            coluna (galeria e info dividem a altura em vez de somar) — é o que
            permite o sticky congelar em telas normais. No MOBILE colapsa para 1
            coluna: galeria → nome → preço → botão (a ordem do DOM). */}
        <div className="produto-coluna-esquerda">
          <div className="produto-esquerda-inner">
            <div className="produto-galeria">
              <ProductGallery images={produto.images} title={produto.title} />
            </div>

            {/* Info empilhada. Há espaço para crescer abaixo do botão (specs, etc.). */}
            <div className="produto-info">
              <Heading as="h1" size="pequeno" text={produto.title} color="var(--cor-texto)" accentColor="var(--cor-destaque)" />

              <PriceTag price={produto.price.price} currency={produto.price.currency} size="grande" />

              {/* O handle da rota — nunca um merchandiseId: o servidor resolve a
                  variante (o cliente não escolhe o que vai pro carrinho). Abre o
                  drawer e dispara os acessórios sugeridos — intocado. */}
              <BotaoAdicionar handle={handle} />
            </div>
          </div>
        </div>

        {/* Coluna direita — descrição rica, só quando há conteúdo. */}
        {temDescricao && <DescricaoProduto html={descricaoLimpa} />}
      </article>

      {/* Ficha técnica — IRMÃ do <article> (largura total, centralizada), entre a
          compra/descrição e os recomendados. Some sozinha quando o produto não tem
          nenhuma spec preenchida (mesmo padrão dos recomendados). */}
      <FichaTecnica specs={produto.specs} />

      {/* Seção "Você também pode gostar" — IRMÃ do <article> (largura total,
          centralizada), NUNCA um 3º filho do grid de 2 colunas. Some sozinha
          quando `recomendados` é []. */}
      <RecomendadosRelacionados produtos={recomendados} />
    </StoreShell>
  )
}
