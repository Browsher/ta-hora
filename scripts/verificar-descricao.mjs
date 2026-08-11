// Salvaguarda da pré-condição de dados da página de produto (spec
// layout-pagina-produto, Req 8).
//
// A coluna direita da página de produto (a descrição rica com as imagens dos
// recursos) só aparece se o produto tem `descriptionHtml` NÃO-VAZIO. Se TODOS os
// produtos estão sem descrição, a coluna direita nunca renderiza em lugar nenhum
// — a feature vira código morto, indistinguível de um bug para quem olha a tela.
//
// Quando a spec foi escrita, 6 dos 7 produtos estavam sem descrição (só o ES-P9
// tinha). Este check existe para essa premissa cair COM BARULHO se as descrições
// sumirem ou nunca chegarem, em vez de virar um silêncio que ninguém investiga.
//
// ─── SEGUNDA PREMISSA (11/08/2026): as imagens de descrição são QUADRADAS ────
//
// `app/globals.css` declara `aspect-ratio: 1 / 1` em `.descricao-produto img`
// para reservar espaço e matar o layout shift — são as ÚNICAS imagens do site sem
// reserva. A proporção não veio de suposição: as 28 imagens das 7 PDPs foram
// medidas e todas são 800x800.
//
// Mas é uma afirmação sobre imagens FUTURAS, e o histórico daquele mesmo bloco de
// CSS registra que um `aspect-ratio: 4/3` anterior esmagava retratos reais
// (800x1067). Ou seja: retrato JÁ EXISTIU nesta loja.
//
// Este check lê o header de cada imagem e falha se alguma fugir de 1:1 — mesma
// disciplina do `verificar:schema` com o `aggregateRating`: a premissa vive
// travada em código, não na memória de quem mexer depois.
//
// Uso:  npm run verificar:descricao   (exit 0 = as duas premissas valem; exit 1 = caiu)
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o build tem de passar
// SEM `.env.local`, e este check precisa do token. Rode ao mexer no catálogo.
//
// ⚠️ DUPLICAÇÃO DECLARADA (mesma exceção do verificar-tags.mjs): roda em Node
// puro, fora do Next — não pode importar `lib/shopify/` (é TypeScript e tem
// `import "server-only"`) nem enxerga `.env.local` sozinho (quem carrega é o
// Next; daí o `--env-file` no script npm). Por isso repete o fetch, a leitura de
// env e o default da versão. Ao mudar a versão da API, mude nos DOIS lugares:
// `lib/shopify/client.ts` e aqui.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles
// libuv abertos: no Windows isso vira
// `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` e o exit code sai
// **127** — tanto no sucesso quanto na falha. Um check cujo exit code é sempre
// 127 não sinaliza nada. Isso aconteceu de verdade no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token. Rode via `npm run verificar:descricao`\n" +
  "  (que passa --env-file=.env.local)."

const QUERY = /* GraphQL */ `
  query ProdutosEDescricao($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        descriptionHtml
      }
    }
  }
`

async function buscarPagina(cursor) {
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query: QUERY, variables: { cursor } }),
  })

  if (!res.ok) throw new Error(`Shopify respondeu ${res.status} ${res.statusText}`)

  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "))

  return json.data.products
}

// ─── Dimensões de imagem, lidas do HEADER do arquivo ─────────────────────────
//
// Baixa só os primeiros bytes: a dimensão de PNG e WebP vive no começo, então não
// há motivo para puxar a imagem inteira (a maior tem 10 MB no original).
//
// `Accept: image/webp` de propósito — o CDN da Shopify NEGOCIA FORMATO por este
// header. Sem ele vem o PNG original, e o parser precisaria cobrir os dois
// caminhos por nada. (Foi a ausência deste header numa medição que, em
// 11/08/2026, produziu um relatório afirmando que uma PDP pesava 26 MB quando
// pesa 1,2 MB. Ver o topo do SEO-AUDIT.md.)
const CABECALHO_IMG = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "image/avif,image/webp,image/*,*/*;q=0.8",
}

/** `{ w, h }` da imagem, ou `null` se o formato não for reconhecido. */
async function dimensoes(url) {
  const res = await fetch(url, { headers: CABECALHO_IMG })
  if (!res.ok) throw new Error(`${res.status} ao buscar imagem`)
  const buf = Buffer.from(await res.arrayBuffer())

  // PNG: assinatura de 8 bytes, depois IHDR com width/height big-endian.
  if (buf.length >= 24 && buf.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }

  // WebP: RIFF....WEBP, e três variantes de chunk com layouts diferentes.
  if (buf.length >= 30 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") {
    const chunk = buf.subarray(12, 16).toString()
    if (chunk === "VP8X") {
      return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 }
    }
    if (chunk === "VP8 ") {
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
    }
    if (chunk === "VP8L") {
      const n = buf.readUInt32LE(21)
      return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }
    }
  }
  return null
}

/**
 * Confere que toda imagem de descrição é 1:1 — a premissa do `aspect-ratio` em
 * `.descricao-produto img` (app/globals.css).
 *
 * Devolve o número de falhas. Imagem cujo formato não foi reconhecido NÃO conta
 * como falha: o objetivo é pegar proporção errada, não policiar formato, e
 * reprovar por um parser incompleto seria ruído.
 */
async function conferirProporcao(produtos) {
  const alvo = produtos.filter((p) => (p.descriptionHtml || "").trim() !== "")
  const urls = []
  for (const p of alvo) {
    // `&amp;` → `&`: o descriptionHtml vem com entidade HTML, e uma URL com
    // `&amp;width=800` literal faz o CDN IGNORAR o parâmetro e servir o original.
    const achadas = [...p.descriptionHtml.matchAll(/<img[^>]*src="([^"]+)"/g)]
      .map((m) => m[1].replace(/&amp;/g, "&"))
      .filter((u) => u.startsWith("http"))
    for (const u of achadas) urls.push({ handle: p.handle, url: u })
  }

  if (urls.length === 0) {
    console.log("  (nenhuma imagem nas descrições — nada a conferir)\n")
    return 0
  }

  let falhas = 0
  let quadradas = 0
  const desconhecidas = []
  for (const { handle, url } of urls) {
    const nome = url.split("/").pop().split("?")[0]
    try {
      const d = await dimensoes(url)
      if (!d) { desconhecidas.push(nome); continue }
      if (d.w !== d.h) {
        console.error(
          `  ✖ ${handle} · ${nome}: ${d.w}x${d.h} NÃO é 1:1.\n` +
          `     O 'aspect-ratio: 1 / 1' de .descricao-produto img (app/globals.css)\n` +
          `     vai exibi-la reduzida, com faixa branca (o 'object-fit: contain'\n` +
          `     impede que ela seja esmagada — mas ela não ocupa o espaço todo).\n` +
          `     Leia o comentário daquele bloco antes de decidir: a saída provável é\n` +
          `     remover o aspect-ratio, NÃO trocar o 1/1 por outro literal.`,
        )
        falhas++
      } else {
        quadradas++
      }
    } catch (e) {
      console.error(`  ✖ ${handle} · ${nome}: ${e.message}`)
      falhas++
    }
  }

  if (quadradas > 0) console.log(`  ✓ ${quadradas} imagem(ns) de descrição em 1:1`)
  if (desconhecidas.length > 0) {
    console.log(`  ⚠ ${desconhecidas.length} em formato não reconhecido (não conta como falha): ${desconhecidas.join(", ")}`)
  }
  console.log("")
  return falhas
}

async function main() {
  if (!domain || !token) {
    console.error(ENV_AUSENTE)
    return 1
  }

  // Pagina até o fim: um teto silencioso poderia contar só produtos sem descrição
  // e mascarar que os descritos existem (ou vice-versa).
  const produtos = []
  let cursor = null
  do {
    const pagina = await buscarPagina(cursor)
    produtos.push(...pagina.nodes)
    cursor = pagina.pageInfo.hasNextPage ? pagina.pageInfo.endCursor : null
  } while (cursor)

  // Não-vazio de verdade: `descriptionHtml` pode vir "", null, ou só marcação em
  // branco. Aqui basta um trim do texto — o sanitizador da página é quem trata
  // `<p> </p>` (o check é grosso de propósito: só quer saber se ALGO existe).
  const comDescricao = produtos.filter((p) => (p.descriptionHtml || "").trim() !== "")

  console.log(`Catálogo: ${produtos.length} produto(s) publicado(s).\n`)
  console.log(`  com descriptionHtml não-vazio → ${comDescricao.length}`)
  for (const p of comDescricao) console.log(`     • ${p.handle}  (${p.title})`)
  console.log("")

  if (comDescricao.length === 0) {
    console.error("✖ A pré-condição da página de produto CAIU:\n")
    console.error(
      "   • NENHUM produto tem descriptionHtml não-vazio. A coluna direita da\n" +
        "     página de produto (descrição rica + imagens) NUNCA vai renderizar —\n" +
        "     a feature está inativa e isso é indistinguível de um bug na tela.",
    )
    console.error(
      "\n  Preencha a descrição de ao menos um produto no admin da Shopify\n" +
        "  (Produtos → Descrição), ou aceite que a coluna direita está inativa —\n" +
        "  mas saiba disso.\n",
    )
    return 1
  }

  // ── Segunda premissa: proporção 1:1 das imagens de descrição ───────────────
  console.log("Proporção das imagens de descrição (premissa do aspect-ratio no CSS):\n")
  const falhasProporcao = await conferirProporcao(produtos)

  if (falhasProporcao > 0) {
    console.error(`✖ ${falhasProporcao} imagem(ns) fora de 1:1 — ver app/globals.css → .descricao-produto img\n`)
    return 1
  }

  console.log("✔ Pré-condições OK: há descrição, e as imagens dela são quadradas.")
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar descrição: ${e.message}`)
  process.exitCode = 1
}
