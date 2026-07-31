import type { MetadataRoute } from "next"
import { getProducts } from "@/lib/shopify/products"
import { SITE_URL } from "@/lib/site"

// Gera /sitemap.xml. Antes deste arquivo a rota devolvia a página 404 do Next
// (~9 KB de HTML) com status 404 — o Google não tinha lista nenhuma de URLs.
//
// ⚠️ REGIME: ISR, não estático. `getProducts()` faz `fetch` com
// `{ revalidate: 300 }`, e é esse fetch que define a janela do sitemap também —
// produto novo na coleção aparece aqui em até 5 min, igual ao /catalogo. Não há
// `export const revalidate` nesta rota justamente porque a janela já vem de lá;
// duplicá-la aqui criaria dois números para ajustar na próxima mudança.
//
// As URLs são ABSOLUTAS por especificação do protocolo de sitemap — `metadataBase`
// não se aplica a esta rota, por isso `SITE_URL` aparece aqui explicitamente.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // `new Date()` = momento do build/revalidação. É honesto para as rotas
  // editoriais (mudam junto com um deploy) e é o melhor disponível para as de
  // produto: a Storefront API expõe `updatedAt`, mas `PRODUCTS_QUERY` não o pede
  // e ampliar a query só por causa do sitemap encareceria o /catalogo, que é
  // quem paga por ela. `lastModified` é dica, não promessa — o Google recrawleia
  // pelo que encontra na página.
  const agora = new Date()

  const estaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL,                             lastModified: agora, changeFrequency: "daily",   priority: 1 },
    { url: `${SITE_URL}/catalogo`,               lastModified: agora, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/sobre-nos`,              lastModified: agora, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/suporte`,                lastModified: agora, changeFrequency: "monthly", priority: 0.5 },
    // Páginas legais: prioridade baixa (ninguém as busca), mas presentes de
    // propósito — a existência de políticas publicadas é sinal de confiança que
    // o Google lê, e elas são recém-criadas (não estariam em índice nenhum).
    { url: `${SITE_URL}/politica-de-privacidade`, lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/termos-de-uso`,           lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/trocas-e-devolucoes`,     lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
  ]

  try {
    const produtos = await getProducts()
    return [
      ...estaticas,
      ...produtos.map((p) => ({
        url:             `${SITE_URL}/produtos/${p.handle}`,
        lastModified:    agora,
        changeFrequency: "weekly" as const,
        priority:        0.8,
      })),
    ]
  } catch {
    // Shopify fora / rede: mesma tolerância do resto do projeto (/catalogo, Home).
    // Um sitemap só com as rotas editoriais é MUITO melhor que um 500 — o Google
    // trata erro de sitemap como falha de confiança e reduz a frequência de crawl.
    return estaticas
  }
}
