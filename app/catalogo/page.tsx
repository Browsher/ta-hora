import type { Metadata } from "next"
import { getProducts } from "@/lib/shopify/products"
import { CatalogoConsultivo } from "@/components/loja/CatalogoConsultivo"
import { EventoVerLista } from "@/components/analytics/EventoVerLista"
import { itemDoCard } from "@/lib/analytics/gtag"
import { StoreShell } from "@/components/loja/StoreShell"
import { Heading } from "@/components/ui/Heading"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { metadataPagina } from "@/lib/seo/metadataPagina"
import { trilhaDoCatalogo, trilhaSchema } from "@/lib/seo/trilha"
import { Trilha } from "@/components/loja/Trilha"
import { JsonLd } from "@/components/seo/JsonLd"

// ISR: revalida a cada 5 min (preço/estoque frescos sem novo deploy).
export const revalidate = 300

// Metadata ESTÁTICA (objeto, não generateMetadata): não toca no regime ISR acima.
// `title` sem sufixo — o "| Ta Hora" vem do `template` do app/layout.tsx.
// `canonical` colapsa os `?ref=` dos links de afiliado numa URL só, e sai do
// mesmo `path` que o `og:url` (ver lib/seo/metadataPagina.ts).
//
// Sem `ogTitle`: "Catálogo de Câmeras de Segurança Wi-Fi" já se descreve sozinho
// como manchete de link compartilhado.
export const metadata: Metadata = metadataPagina({
  title: "Catálogo de Câmeras de Segurança Wi-Fi",
  path:  "/catalogo",
  description:
    // "3x sem juros e em até 12x" — os DOIS tetos, porque são diferentes: 3 é o
    // limite sem acréscimo, 12 é o limite total (com juros do cliente). String
    // fixa e não `parcelamento()` porque aqui não há produto: é a página da
    // coleção. Ao mexer, ler o bloco no topo de lib/parcelamento.ts.
    //
    // 175 → 155 chars em 12/08/2026. A versão anterior truncava no Google por
    // ~15 caracteres, e o que se perdia era o FIM da frase — justamente os dois
    // tetos de parcelamento. Saíram "Todas as" e "do Ta Hora" (a marca já está no
    // title, pelo `template` do layout); nenhum fato saiu.
    //
    // 🔴 O SEO-AUDIT.md propunha cortar "e em até 12x" para caber um "Veja os
    // modelos." — NÃO faça isso. Trocaria um fato pelo CTA mais genérico que
    // existe, e reintroduziria a ambiguidade dos dois tetos que este comentário
    // existe para impedir. Cortar preâmbulo é de graça; cortar fato, não.
    "Câmeras de segurança Wi-Fi: interna, externa, com holofote, 4K e a que rosqueia no bocal da lâmpada. Originais, com nota fiscal, 3x sem juros e em até 12x.",
})

export default async function CatalogoPage() {
  let corpo: React.ReactNode
  try {
    const produtos = await getProducts()
    corpo = (
      <>
        {/*
          `view_item_list` da lista COMPLETA que o servidor entregou — não o
          recorte do filtro. O porquê está no topo de EventoVerLista.tsx.

          Dentro do `try`: se a Shopify cair, não há lista e não há evento. Um
          `view_item_list` vazio seria pior que ausente — apareceria no relatório
          como "lista vista com 0 produtos", indistinguível de um catálogo
          realmente vazio.
        */}
        <EventoVerLista
          nomeDaLista="Catálogo"
          itens={produtos.map((p, i) => itemDoCard(p, i + 1))}
        />
        <CatalogoConsultivo produtos={produtos} />
      </>
    )
  } catch {
    // Shopify offline / erro → estado amigável (Req 4.4). O resto do site
    // (home, Sobre Nós) não depende da Shopify e segue funcionando.
    corpo = (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--cor-texto-secundario)", fontSize: 16 }}>
        Não foi possível carregar os produtos. Tente novamente em instantes.
      </div>
    )
  }

  // Uma fonte para a tela e para o schema — ver lib/seo/trilha.ts.
  const trilha = trilhaDoCatalogo()

  return (
    <StoreShell>
      {/* `Início > Catálogo`. Alinhada à esquerda, acima do cabeçalho
          centralizado — a trilha marca posição na hierarquia, não é título. */}
      <Trilha itens={trilha} />
      <JsonLd data={trilhaSchema(trilha)} />
      <div
        style={{
          maxWidth:      1200,
          margin:        "0 auto",
          padding:       "40px clamp(20px, 5vw, 64px) 72px",
          display:       "flex",
          flexDirection: "column",
          gap:           28,
        }}
      >
        {/* Cabeçalho centralizado (alinha com a barra de filtros .catalogo-filtros). */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
          {/* O SectionLabel já aplica `text-transform: uppercase` — o texto vem em
              caixa normal aqui e sai "CATÁLOGO" na tela (mesmo padrão dos irmãos). */}
          <SectionLabel text="Catálogo" accentColor="var(--cor-destaque)" />
          <Heading
            as="h1"
            size="medio"
            text="Encontre a câmera ideal para você"
            color="var(--cor-texto)"
            accentColor="var(--cor-destaque)"
          />
        </div>
        {corpo}
      </div>
    </StoreShell>
  )
}
