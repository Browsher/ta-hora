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
// Uso:  npm run verificar:descricao   (exit 0 = há ao menos 1 descrição; exit 1 = zero)
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

  console.log("✔ Pré-condição OK: há ao menos um produto com descrição.")
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar descrição: ${e.message}`)
  process.exitCode = 1
}
