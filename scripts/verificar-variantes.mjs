// Salvaguarda da premissa "catálogo sem variantes" (Req 1.8).
//
// A loja vende sem seletor de variante porque HOJE todo produto tem exatamente
// 1 variante. Isso é decisão de produto e pode deixar de valer sem aviso — e se
// deixar, o site passaria a vender SEMPRE a primeira variante disponível, ou
// seja, a COR ERRADA, em silêncio. Este script existe para essa premissa cair
// com barulho.
//
// Uso:  npm run verificar:variantes      (exit 0 = premissa vale; exit 1 = caiu)
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o Req 8.6 exige que o
// build passe SEM `.env.local`, e este check precisa do token. Rode antes de
// publicar mudanças de catálogo. Se um dia houver CI com secrets, é lá que ele
// entra.
//
// ⚠️ DUPLICAÇÃO DECLARADA (exceção do Req 10.4): este script roda em Node puro,
// fora do Next — não pode importar `lib/shopify/` (é TypeScript e tem
// `import "server-only"`) nem enxerga `.env.local` sozinho (quem carrega é o
// Next; daí o `--env-file` no script npm). Por isso ele repete o fetch, a
// leitura de env e o default da versão. Ao mudar a versão da API, mude nos dois
// lugares: `lib/shopify/client.ts` e aqui.

const DEFAULT_API_VERSION = "2026-01"

const domain  = process.env.SHOPIFY_STORE_DOMAIN
const token   = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

// ⚠️ SEMPRE `process.exitCode = N`, NUNCA `process.exit(N)`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles
// libuv ainda abertos: no Windows isso vira
// `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` e o exit code sai
// **127** — tanto no sucesso quanto na falha. Um check cujo exit code é sempre
// 127 não sinaliza nada: seria uma salvaguarda que parece funcionar e não
// funciona. Com `exitCode`, o Node encerra sozinho, limpo, com o código certo.

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token — rode via `npm run verificar:variantes`\n" +
  "  (que passa --env-file=.env.local)."

// `variants(first: 2)`: 2 basta para detectar "mais de uma". Não é preciso
// baixar todas — a pergunta é binária.
//
// Conta VARIANTES, jamais `options`: hoje os produtos têm 1 variante mas MANTÊM
// a opção `Cor` com um único valor. Checar `options` daria falso positivo
// imediato, e um check que grita sem motivo é desligado na primeira semana.
const QUERY = /* GraphQL */ `
  query ProdutosEVariantes($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        variants(first: 2) { nodes { id title } }
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

  // Pagina até o fim: um teto silencioso aqui esconderia exatamente o produto
  // que quebrou a premissa.
  const produtos = []
  let cursor = null
  do {
    const pagina = await buscarPagina(cursor)
    produtos.push(...pagina.nodes)
    cursor = pagina.pageInfo.hasNextPage ? pagina.pageInfo.endCursor : null
  } while (cursor)

  const infratores = produtos.filter((p) => p.variants.nodes.length > 1)

  if (infratores.length > 0) {
    console.error(
      `\n✖ A premissa "catálogo sem variantes" CAIU — ${infratores.length} produto(s) com mais de 1 variante:\n`,
    )
    for (const p of infratores) {
      console.error(`   • ${p.handle}  (${p.title})`)
    }
    console.error(
      "\n  O site NÃO tem seletor de variante: ele adiciona a primeira variante\n" +
        "  disponível. Com mais de uma, o cliente pode receber a variante ERRADA.\n" +
        "\n  Ou remova as variantes na Shopify, ou implemente o seletor\n" +
        "  (hoje fora de escopo — ver .claude/specs/carrinho-loja).\n",
    )
    return 1
  }

  console.log(
    `✔ Premissa "catálogo sem variantes" vale: ${produtos.length} produto(s), todos com 1 variante.`,
  )
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar variantes: ${e.message}`)
  process.exitCode = 1
}
