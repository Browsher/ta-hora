import type { ProductImage } from "./types"

// Redimensionamento de imagem pela URL do CDN da Shopify.
//
// Sem `server-only` DE PROPÓSITO: o `ProductGallery` é "use client" e precisa de
// `urlComLargura` para derivar os thumbnails. Aqui não há token, fetch nem query —
// só manipulação de string e aritmética de proporção.
//
// ── POR QUE ISTO EXISTE ──────────────────────────────────────────────────────
// A Storefront API devolve a URL da imagem ORIGINAL. A `A31H3_4` da loja é
// 3543×3543 px e era servida assim em três lugares: galeria da PDP (exibida a
// ~600 px), cards do catálogo (~300 px) e thumbnails de 64 px. O CDN da Shopify
// aceita `&width=` na própria URL e devolve a versão redimensionada sem custo e
// sem processamento nosso.
//
// Medido em 11/08/2026, com `Accept: image/webp` (como um navegador pede):
//     original    153,5 KB
//     &width=800   27,9 KB
//     &width=400   12,6 KB
//
// ⚠️ NÃO acrescente `&format=webp`. Foi testado e NÃO faz nada — a resposta volta
// `image/png` igual. O CDN já faz NEGOCIAÇÃO DE CONTEÚDO pelo header `Accept`, e
// é isso que entrega WebP a todo navegador real. (Esse detalhe custou uma
// auditoria inteira: uma medição feita sem o header recebeu os PNGs originais e
// concluiu que a PDP pesava 26 MB, quando o peso real é 1,47 MB. Ver SEO-AUDIT.md.)

// ── QUEM CHAMA ESTE MÓDULO ───────────────────────────────────────────────────
//   normalize.ts        → cards (400) e galeria (800) + a variante de OG (1200)
//   normalizeCarrinho.ts→ miniaturas do drawer (128)
//   ProductGallery.tsx  → thumbnails (128), derivados da imagem da galeria
//   sanitizarDescricao.ts → imagens do HTML do lojista (800), com POLÍTICA
//                           PRÓPRIA: não sobrescreve largura que o lojista já
//                           tenha definido. Ver o comentário lá.
//
// Este arquivo NASCEU do `otimizarLargura` de `sanitizarDescricao.ts`, que fazia
// isto só para as imagens de descrição. Ao estender a otimização ao resto da
// loja, a lógica de host/query veio para cá em vez de virar uma segunda cópia.

/**
 * Hosts do CDN da Shopify onde `width=` é interpretado.
 *
 * Qualquer outro host passa INTACTO — é o caso do hero da home
 * (`/uploads/Promocao_placa.webp`), que é arquivo nosso servido pela Vercel e
 * ignora o parâmetro. Degradar para "não mexe" é o comportamento certo: pior que
 * uma imagem grande é uma URL quebrada.
 */
const HOSTS_CDN = ["cdn.shopify.com", "cdn.shopifycdn.net"]

// ── Larguras por contexto ────────────────────────────────────────────────────
//
// São o DOBRO do tamanho de exibição, para telas 2x (retina) não ficarem moles.
// Quem escolhe é o CHAMADOR — nenhuma função aqui adivinha contexto a partir da
// URL ou do formato da imagem.

/** Cards de produto: `/catalogo`, vitrine da home, recomendados, acessórios. */
export const LARGURA_CARD = 400
/** Imagem principal da galeria da PDP (exibida a ~600 px no desktop). */
export const LARGURA_GALERIA = 800
/** Thumbnails da galeria (64 px) e miniaturas do carrinho (64 px). */
export const LARGURA_THUMB = 128
/**
 * `og:image` das PDPs. 1200 px é o ideal do Open Graph (Facebook/WhatsApp) — por
 * isso é MAIOR que a galeria: a prévia do link tem exigência própria, e derivá-la
 * do tamanho da galeria entregaria 800 px a um contexto que pede 1200.
 */
export const LARGURA_OG = 1200

/**
 * Devolve a URL com `width=<largura>`, quando o host é CDN da Shopify.
 *
 * Usa `searchParams.set` (não concatenação de string) por dois motivos que já
 * seriam bugs:
 *   - as URLs da Shopify SEMPRE chegam com `?v=…`, então o separador correto é
 *     `&`, não `?` — um `?width=` cego destruiria o `v`;
 *   - `set` SOBRESCREVE um `width` existente em vez de acumular. É isso que
 *     permite o `ProductGallery` pedir um thumbnail de 128 px a partir de uma URL
 *     que já veio com `width=800`, sem produzir `&width=800&width=128`.
 *
 * URL relativa ou malformada → devolvida intacta (o `new URL` lançaria).
 */
export function urlComLargura(url: string, largura: number): string {
  try {
    const u = new URL(url)
    if (!HOSTS_CDN.includes(u.hostname)) return url
    u.searchParams.set("width", String(largura))
    return u.toString()
  } catch {
    return url
  }
}

/**
 * Redimensiona a imagem E as dimensões declaradas, juntas.
 *
 * 🔴 É O PONTO DA EXISTÊNCIA DESTE MÓDULO. `width`/`height` de `ProductImage` são
 * as dimensões INTRÍNSECAS do arquivo. Trocar a URL sem recalculá-las faz o
 * objeto mentir sobre o próprio conteúdo, e há dois consumidores onde isso vira
 * bug visível:
 *
 *   1. `og:image:width` / `og:image:height` das 7 PDPs
 *      (`app/produtos/[handle]/page.tsx`). Dimensão de OG que não bate com o
 *      arquivo faz o WhatsApp recortar errado ou DESCARTAR a prévia — numa loja
 *      que vende por indicação e afiliado, é o pior lugar possível para isso.
 *   2. `width`/`height` nas `<img>`, que reservam a proporção contra CLS. Valor
 *      errado transforma a correção de CLS em CAUSA de CLS.
 *
 * A Shopify preserva o aspect ratio no `width=`, então a altura nova é a regra de
 * três — nenhuma suposição envolvida.
 *
 * **A Shopify NÃO faz upscale.** Pedir `width=800` de um original de 500 px
 * devolve 500 px. Por isso a imagem menor que o alvo volta INTACTA: declarar 800
 * ali seria a mesma mentira que este módulo existe para evitar.
 */
export function redimensionar(
  img: ProductImage | null | undefined,
  largura: number,
): ProductImage | null {
  if (!img) return null

  // Original menor ou igual ao alvo: o CDN devolveria o mesmo arquivo. Não mexe
  // na URL (mantém o cache do que já está em circulação) nem nas dimensões.
  if (img.width !== null && img.width <= largura) return img

  const url = urlComLargura(img.url, largura)

  // Largura original desconhecida (a Shopify pode devolver `null`): não dá para
  // saber nem se o resize se aplica, nem a proporção. A URL vai redimensionada
  // (é seguro — o CDN limita ao original), e as dimensões viram `null`, que é o
  // valor HONESTO para "não sei". Consumidores já tratam: o `og:image` omite os
  // campos (`...(foto.width ? … : {})`) em vez de declarar número errado.
  if (img.width === null) {
    return { url, altText: img.altText, width: null, height: null }
  }

  return {
    url,
    altText: img.altText, // 🔴 campo separado no GraphQL — o resize NUNCA o toca.
    width:   largura,
    height:  img.height !== null
      ? Math.round((img.height * largura) / img.width)
      : null,
  }
}
