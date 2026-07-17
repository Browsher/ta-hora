// Salvaguarda da pré-condição de dados dos PRODUTOS RECOMENDADOS (Req 8).
//
// A seção "Você também pode gostar" recomenda outras câmeras da MESMA marca. A
// marca de cada câmera é uma tag no admin da Shopify:
//   `eseecloud`  → uma das marcas   (🔴 DOIS "e" — grafia CERTA, medida na loja)
//   `icsee`      → a outra marca
//
// Se NENHUM produto tiver uma dessas tags, a seção nunca aparece — sem erro, sem
// log. Este script existe para essa premissa cair com barulho, e sobretudo para
// pegar uma DIVERGÊNCIA DE GRAFIA: se alguém "consertar" `eseecloud` para
// `essecloud` no admin (achando que é typo), a contagem de `eseecloud` zera aqui.
//
// Uso:  npm run verificar:marcas    (exit 0 = há marca; exit 1 = nenhuma)
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o build tem de passar
// SEM `.env.local`, e este check precisa do token. Rode ao mexer no catálogo.
//
// ⚠️ DUPLICAÇÃO DECLARADA: roda em Node puro, fora do Next — não pode importar
// `lib/shopify/` (é TypeScript e tem `import "server-only"`) nem enxerga
// `.env.local` sozinho (quem carrega é o Next; daí o `--env-file` no script npm).
// Por isso repete o fetch, a leitura de env, o default da versão e as strings das
// marcas. Ao mudar a versão da API ou as marcas, mude nos DOIS lugares:
// `lib/shopify/client.ts` + `lib/shopify/tags.ts` e aqui.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles
// libuv abertos: no Windows isso vira
// `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` e o exit code sai
// **127** — tanto no sucesso quanto na falha. Um check cujo exit code é sempre
// 127 não sinaliza nada. Isso aconteceu de verdade no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"
// 🔴 "eseecloud" com DOIS "e" — a grafia CERTA (medido: eseecloud→4, essecloud→0).
// Tem de bater com `TAG_ESEECLOUD` em `lib/shopify/tags.ts`.
const TAG_ESEECLOUD = "eseecloud"
const TAG_ICSEE = "icsee"
const MARCAS = [TAG_ESEECLOUD, TAG_ICSEE]

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token. Rode via `npm run verificar:marcas`\n" +
  "  (que passa --env-file=.env.local)."

const QUERY = /* GraphQL */ `
  query ProdutosEMarcas($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        tags
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

  const porMarca = MARCAS.map((m) => ({
    marca: m,
    produtos: produtos.filter((p) => p.tags.includes(m)),
  }))

  console.log(`Catálogo: ${produtos.length} produto(s) publicado(s).\n`)
  for (const { marca, produtos: ps } of porMarca) {
    console.log(`  tag "${marca}" → ${ps.length} câmera(s)`)
  }
  console.log("")

  // ─── Aviso (não falha): produto sem NENHUMA tag de marca conhecida ─────────
  //
  // Não entra em nenhuma seção de recomendados — quase sempre é cadastro novo em
  // que alguém esqueceu de etiquetar a marca, OU uma grafia divergente. Aviso, e
  // não bloqueio: pode ser um produto que deliberadamente não tem marca.
  const semMarca = produtos.filter(
    (p) => !MARCAS.some((m) => p.tags.includes(m)),
  )
  if (semMarca.length > 0) {
    console.warn(`⚠ ${semMarca.length} produto(s) SEM tag de marca conhecida (${MARCAS.join(" / ")}):\n`)
    for (const p of semMarca) {
      console.warn(`   • ${p.handle}  (${p.title})  tags: [${p.tags.join(", ")}]`)
    }
    console.warn(
      `\n  Esses produtos NÃO aparecem na seção "Você também pode gostar".\n` +
        `  Se são de uma marca conhecida, confira a GRAFIA da tag no admin —\n` +
        `  "${TAG_ESEECLOUD}" tem dois "e" DE PROPÓSITO (não é "essecloud").\n`,
    )
  }

  // ─── Falha: NENHUMA marca cadastrada ──────────────────────────────────────
  const totalComMarca = porMarca.reduce((n, { produtos: ps }) => n + ps.length, 0)
  if (totalComMarca === 0) {
    console.error(
      `✖ A pré-condição dos recomendados CAIU: NENHUM produto tem "${TAG_ESEECLOUD}"\n` +
        `  nem "${TAG_ICSEE}". A seção "Você também pode gostar" nunca vai aparecer.\n\n` +
        "  A seção não aparecer é indistinguível de um bug para quem olha a tela.\n" +
        "  Corrija no admin da Shopify (Produtos → tags), conferindo a GRAFIA\n" +
        `  ("${TAG_ESEECLOUD}" com dois "e"), ou aceite que a feature está inativa.\n`,
    )
    return 1
  }

  console.log("✔ Pré-condição OK: há câmeras com marca para recomendar.")
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar marcas: ${e.message}`)
  process.exitCode = 1
}
