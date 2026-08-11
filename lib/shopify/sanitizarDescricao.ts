import "server-only"
import sanitizeHtml from "sanitize-html"
import { urlComLargura, LARGURA_GALERIA } from "./imagens"

// Sanitiza o `descriptionHtml` do produto (HTML do lojista, vindo da Shopify)
// antes de ir ao DOM via dangerouslySetInnerHTML na página de produto.
//
// Roda SÓ no servidor (`import "server-only"`): a dependência `sanitize-html`
// nunca entra no bundle do cliente. A página é Server Component e chama esta
// função depois do fetch; o `DescricaoProduto` recebe o HTML já limpo.
//
// ⚠️ ARMADILHA VERIFICADA (protótipo, fase de design): o sanitize-html filtra os
// atributos DEPOIS de rodar `transformTags`. Os atributos que injetamos —
// `loading`/`decoding` na <img>, `rel`/`target` no <a> — PRECISAM estar na
// `allowedAttributes`, senão são adicionados e removidos em seguida, em silêncio.
// A primeira allowlist (só href/src/alt) produziu <img> sem loading e <a> sem
// rel. Não enxugue a allowlist "que não uso esses atributos": eu os injeto.

const OPCOES: sanitizeHtml.IOptions = {
  // Só formatação de texto e imagem. Tudo fora daqui cai — incluindo <script>,
  // <iframe>, <object>, <embed>, <style> e os atributos on*= / style=.
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u",
    "ul", "ol", "li", "a", "h2", "h3", "h4",
    "blockquote", "span", "img",
  ],
  allowedAttributes: {
    a:   ["href", "rel", "target"],
    img: ["src", "alt", "loading", "decoding"],
  },
  // Sem `javascript:` — links maliciosos perdem o href.
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel:    "noopener noreferrer nofollow",
        target: "_blank",
      },
    }),
    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        // Preserva o `alt` como veio (não inventa texto alternativo — seria
        // mentira sobre o conteúdo; medido: as 4 imagens do ES-P9 têm alt="").
        ...(attribs.src ? { src: otimizarLargura(attribs.src) } : {}),
        loading:  "lazy",
        decoding: "async",
      },
    }),
  },
}

/**
 * Acrescenta `width=800` às imagens servidas pela CDN da Shopify, preservando a
 * query existente (`?v=…`). Medido: `?width=800` corta o total das 4 imagens de
 * 804 KB para 434 KB (−46%), e a CDN já entrega WebP por negociação de `Accept`.
 *
 * A manipulação da URL é de `lib/shopify/imagens.ts` — o MESMO `urlComLargura`
 * que a galeria, os cards e o carrinho usam. Este arquivo foi o primeiro a fazer
 * o redimensionamento por URL; quando a otimização se estendeu ao resto da loja,
 * a lógica de host/query saiu daqui para lá em vez de virar uma segunda cópia.
 *
 * 🔴 A POLÍTICA AQUI É DIFERENTE do resto do site, e a diferença é deliberada:
 * uma imagem que JÁ tem `width` na URL passa INTACTA. Este HTML é do LOJISTA — se
 * ele dimensionou a imagem no editor da Shopify, a escolha é dele. Nos outros
 * consumidores a largura é ditada pelo LAYOUT (galeria 800, card 400, thumb 128),
 * e lá `urlComLargura` sobrescreve de propósito.
 *
 * Degrada com segurança: URL fora do CDN, já com `width`, ou inválida → `src`
 * intacto.
 */
function otimizarLargura(src: string): string {
  try {
    if (new URL(src).searchParams.has("width")) return src
  } catch {
    return src // URL inválida — não mexe (o `urlComLargura` faria o mesmo)
  }
  return urlComLargura(src, LARGURA_GALERIA)
}

/**
 * Sanitiza o descriptionHtml da Shopify e otimiza suas imagens.
 *
 * Retorna `""` quando não há conteúdo visível (vazio, `null`, ou só marcação
 * como `<p> </p>` / `<p>&nbsp;</p>`) — é esse contrato que a página usa para
 * decidir NÃO renderizar a coluna direita.
 */
export function sanitizarDescricao(htmlCru: string | null | undefined): string {
  if (!htmlCru) return ""

  const limpo = sanitizeHtml(htmlCru, OPCOES)

  // Vazio pós-limpeza: sem imagem E sem texto visível → "". Isso é o que faz
  // `<p> </p>` contar como vazio (a Shopify intercala esses parágrafos em
  // branco entre as imagens — medido no ES-P9).
  const temImagem = /<img\b/i.test(limpo)
  const texto = limpo.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim()
  if (!temImagem && texto === "") return ""

  return limpo
}
