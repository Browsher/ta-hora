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
// ═══ POR QUE NÃO HÁ `changeFrequency` NEM `priority` ══════════════════════
//
// Os dois saíram em 12/08/2026. O Google ignora ambos — `priority` nunca
// influenciou ranking (é prioridade RELATIVA dentro do próprio site, não um voto)
// e `changeFrequency` foi abandonado como sinal de crawl. Mantê-los era uma
// tabela de números para revisar a cada página nova, sem nenhum efeito do outro
// lado.
//
// ═══ POR QUE 7 URLs TÊM `lastModified` E 7 NÃO TÊM ════════════════════════
//
// 🔴 A AUSÊNCIA É DELIBERADA, não um caso não tratado. Sitemap com o campo em
// algumas URLs e não em outras é válido pela especificação.
//
// Antes, as 14 URLs saíam com `new Date()` — o instante do build, idêntico ao
// milissegundo em todas. Um valor que muda a cada deploy sem que o conteúdo mude
// não é "a melhor aproximação disponível": é ruído que o Google aprende a
// descontar, e o desconto vale para o DOMÍNIO inteiro, inclusive para as URLs em
// que a data seria verdadeira.
//
// Então cada URL só leva `lastModified` se existir fonte real:
//
//   PDPs (7)       → `updatedAt` da Shopify, a data em que o lojista de fato
//                    editou o produto. Fonte real, por produto. Ver a nota em
//                    `PRODUCTS_QUERY` sobre a reversão da decisão de não pedi-lo.
//
//   Editoriais (7) → OMITIDO. Não há fonte honesta:
//                    • `layouts/politica-de-privacidade.json`, `termos-de-uso` e
//                      `trocas-e-devolucoes` trazem `updatedAt: 1970-01-01` —
//                      placeholder que nunca foi mantido. Publicar 1970 é pior
//                      que não publicar nada.
//                    • `_home`, `sobre-nos` e `suporte` têm datas plausíveis, mas
//                      os layouts são editados à mão e nada garante que alguém
//                      atualize o campo junto com o texto.
//                    • `/` e `/catalogo` são agregados de produtos: não têm data
//                      de modificação própria que signifique alguma coisa.
//
// ⚠️ MANTER `lastmod` FORA DAQUI É O COMPORTAMENTO CORRETO, não uma pendência.
// Se um dia os layouts passarem a carregar data real e mantida, aí sim ela entra.
// Enquanto for cópia manual, a omissão é a informação mais precisa que temos.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL },
    { url: `${SITE_URL}/catalogo` },
    { url: `${SITE_URL}/sobre-nos` },
    { url: `${SITE_URL}/suporte` },
    // Páginas legais presentes de propósito: a existência de políticas publicadas
    // é sinal de confiança que o Google lê.
    { url: `${SITE_URL}/politica-de-privacidade` },
    { url: `${SITE_URL}/termos-de-uso` },
    { url: `${SITE_URL}/trocas-e-devolucoes` },
  ]

  try {
    const produtos = await getProducts()
    return [
      ...estaticas,
      ...produtos.map((p) => ({
        url: `${SITE_URL}/produtos/${p.handle}`,
        // `atualizadoEm` é `null` se alguém remover `updatedAt` da query — o
        // spread condicional faz a URL sair SEM o campo, em vez de com um
        // `undefined` que o Next serializaria como data do build. Degradar para
        // "sem data" é o comportamento certo; degradar para "data de hoje" seria
        // reintroduzir em silêncio exatamente o problema que este arquivo corrige.
        ...(p.atualizadoEm ? { lastModified: new Date(p.atualizadoEm) } : {}),
      })),
    ]
  } catch {
    // Shopify fora / rede: mesma tolerância do resto do projeto (/catalogo, Home).
    // Um sitemap só com as rotas editoriais é MUITO melhor que um 500 — o Google
    // trata erro de sitemap como falha de confiança e reduz a frequência de crawl.
    return estaticas
  }
}
