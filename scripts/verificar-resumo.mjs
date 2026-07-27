// Salvaguarda da pré-condição de dados do CATÁLOGO CONSULTIVO (feature catalogo-consultivo).
//
// Cada bloco do /catalogo mostra um resumo consultivo ("pra quem é") vindo do
// metafield `custom.resumo` de cada câmera. Se a CHAVE divergir (namespace/key
// errados) ou os dados não estiverem preenchidos, o resumo some SEM erro, sem
// log — indistinguível de "essa câmera não tem resumo".
//
// Este script existe para essa premissa cair com barulho — a MESMA lição do
// `eseecloud`: o Dev MCP valida o SCHEMA (o campo existe), mas só a loja real diz
// se a chave `custom.resumo` está preenchida. Confirma a chave E os dados.
//
// Uso:  npm run verificar:resumo    (exit 0 = alguém tem resumo; exit 1 = ninguém)
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o build tem de passar
// SEM `.env.local`, e este check precisa do token. Rode ao mexer no catálogo.
//
// ⚠️ DUPLICAÇÃO DECLARADA: roda em Node puro, fora do Next — não pode importar
// `lib/shopify/` (é TypeScript e tem `import "server-only"`) nem enxerga
// `.env.local` sozinho (quem carrega é o Next; daí o `--env-file` no script npm).
// Por isso repete o fetch, a leitura de env, o default da versão e a chave do
// metafield. Ao mudar a versão da API, mude nos DOIS lugares: `lib/shopify/client.ts`
// e aqui. Ao mudar a chave do metafield, mude em `lib/shopify/queries.ts` e aqui.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles
// libuv abertos: no Windows isso vira
// `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` e o exit code sai
// **127** — tanto no sucesso quanto na falha. Um check cujo exit code é sempre
// 127 não sinaliza nada. Isso aconteceu de verdade no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"
// Chave do metafield de resumo. Tem de bater com o alias `resumo:` da
// PRODUCTS_QUERY em `lib/shopify/queries.ts`.
const METAFIELD_NAMESPACE = "custom"
const METAFIELD_KEY = "resumo"

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token. Rode via `npm run verificar:resumo`\n" +
  "  (que passa --env-file=.env.local)."

const QUERY = /* GraphQL */ `
  query ProdutosEResumo($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        resumo: metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") { value }
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

  // Pagina até o fim: um teto silencioso esconderia exatamente o produto que
  // quebrou a premissa.
  const produtos = []
  let cursor = null
  do {
    const pagina = await buscarPagina(cursor)
    produtos.push(...pagina.nodes)
    cursor = pagina.pageInfo.hasNextPage ? pagina.pageInfo.endCursor : null
  } while (cursor)

  // Resumo "preenchido" = valor não-nulo e não-vazio após trim (mesma regra do
  // `normalizeProductCard`: `raw.resumo?.value?.trim() || null`).
  const temResumo = (p) => Boolean(p.resumo?.value?.trim())
  const comResumo = produtos.filter(temResumo)
  const semResumo = produtos.filter((p) => !temResumo(p))

  console.log(`Catálogo: ${produtos.length} produto(s) publicado(s).\n`)
  console.log(
    `  metafield "${METAFIELD_NAMESPACE}.${METAFIELD_KEY}" → ${comResumo.length} câmera(s) com resumo preenchido\n`,
  )

  // ─── Aviso (não falha): produto sem resumo ────────────────────────────────
  //
  // O bloco dessa câmera renderiza sem a linha de resumo (Req 1.5) — pode ser
  // deliberado. Aviso, e não bloqueio, para o dev conferir se foi esquecimento.
  if (semResumo.length > 0) {
    console.warn(`⚠ ${semResumo.length} produto(s) SEM "${METAFIELD_NAMESPACE}.${METAFIELD_KEY}":\n`)
    for (const p of semResumo) {
      console.warn(`   • ${p.handle}  (${p.title})`)
    }
    console.warn(
      `\n  Esses blocos aparecem SEM a linha de resumo no /catalogo.\n` +
        `  Se deveriam ter resumo, preencha no admin (Produtos → Metafields →\n` +
        `  "${METAFIELD_NAMESPACE}.${METAFIELD_KEY}") ou confira a GRAFIA da chave.\n`,
    )
  }

  // ─── Falha: NENHUM resumo preenchido ──────────────────────────────────────
  if (comResumo.length === 0) {
    console.error(
      `✖ A pré-condição do catálogo consultivo CAIU: NENHUM produto tem\n` +
        `  "${METAFIELD_NAMESPACE}.${METAFIELD_KEY}" preenchido. Todos os blocos ficariam\n` +
        `  sem resumo — indistinguível de chave errada.\n\n` +
        `  Confira a GRAFIA da chave no admin (Configurações → Metafields → Produtos)\n` +
        `  e se o alias "resumo:" da PRODUCTS_QUERY usa namespace "${METAFIELD_NAMESPACE}" e\n` +
        `  key "${METAFIELD_KEY}", ou aceite que o catálogo fica sem resumos.\n`,
    )
    return 1
  }

  console.log("✔ Pré-condição OK: há câmeras com resumo para o catálogo consultivo.")
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar resumo: ${e.message}`)
  process.exitCode = 1
}
