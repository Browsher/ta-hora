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
      // Só `/api/`: rotas de dados (carrinho, afiliados), sem conteúdo que sirva
      // a uma busca.
      //
      // 🔴 `/carrinho` FOI REMOVIDO em 12/08/2026 — era regra morta. Não existe
      // rota `/carrinho` neste app (`/carrinho` responde 404, com
      // `X-Matched-Path: /404`): o carrinho é um drawer client-side, e a spec
      // `carrinho-loja` é toda drawer + Server Actions, sem página própria
      // planejada. A regra bloqueava um caminho inexistente.
      //
      // ⚠️ Se um dia existir uma rota `/carrinho` de verdade, ela volta para cá —
      // página de carrinho é conteúdo de sessão, não de busca.
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
