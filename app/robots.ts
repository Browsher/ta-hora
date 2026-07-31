import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

// Gera /robots.txt em BUILD (rota estática — sem cookies()/headers()/fetch).
// Antes deste arquivo, /robots.txt devolvia a página 404 do Next (~9 KB de HTML)
// com status 404: os crawlers não tinham nenhum apontamento para o sitemap.
//
// O domínio sai de `SITE_URL` (lib/site.ts) de propósito: o `sitemap:` do
// robots.txt é ABSOLUTO por especificação — não aceita caminho relativo — então
// ele é um dos lugares que precisam acompanhar a troca de domínio.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/ são rotas de dados (carrinho, afiliados) e /carrinho não é página
      // indexável — nenhuma das duas tem conteúdo que sirva a uma busca.
      disallow: ["/api/", "/carrinho"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
