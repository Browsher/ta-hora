// Salvaguarda da pré-condição de dados da sugestão de acessórios (Req 7).
//
// A feature inteira depende de duas tags no admin da Shopify:
//   `camera`    → o GATILHO (se houver um no carrinho, sugerimos)
//   `acessorio` → o SUGERIDO
//
// Se qualquer uma some, a seção simplesmente NÃO APARECE — sem erro, sem log,
// sem nada. É indistinguível de "não há acessórios". Este script existe para
// essa premissa cair com barulho, em vez de virar um silêncio que ninguém
// investiga.
//
// Uso:  npm run verificar:tags     (exit 0 = premissa vale; exit 1 = caiu)
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o build tem de passar
// SEM `.env.local`, e este check precisa do token. Rode ao mexer no catálogo.
//
// ⚠️ DUPLICAÇÃO DECLARADA (exceção do Req 10.3): roda em Node puro, fora do
// Next — não pode importar `lib/shopify/` (é TypeScript e tem
// `import "server-only"`) nem enxerga `.env.local` sozinho (quem carrega é o
// Next; daí o `--env-file` no script npm). Por isso repete o fetch, a leitura de
// env, o default da versão e as strings das tags. Ao mudar a versão da API ou as
// tags, mude nos DOIS lugares: `lib/shopify/client.ts` + `lib/shopify/tags.ts`
// e aqui.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles
// libuv abertos: no Windows isso vira
// `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` e o exit code sai
// **127** — tanto no sucesso quanto na falha. Um check cujo exit code é sempre
// 127 não sinaliza nada. Isso aconteceu de verdade no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"
const TAG_CAMERA = "camera"
const TAG_ACESSORIO = "acessorio"

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token. Rode via `npm run verificar:tags`\n" +
  "  (que passa --env-file=.env.local)."

const QUERY = /* GraphQL */ `
  query ProdutosETags($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        tags
        availableForSale
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

  const cameras = produtos.filter((p) => p.tags.includes(TAG_CAMERA))
  const acessorios = produtos.filter((p) => p.tags.includes(TAG_ACESSORIO))

  // 🔴 SUGERÍVEL = etiquetado **E** disponível. Esta distinção é o requisito.
  // Um check que só conta a tag fica VERDE com os acessórios todos esgotados —
  // e aí o filtro de disponibilidade os remove das sugestões, a seção nunca
  // aparece, e o resultado é o estado exato que este script existe para impedir.
  const sugeriveis = acessorios.filter((p) => p.availableForSale)
  const camerasDisponiveis = cameras.filter((p) => p.availableForSale)

  console.log(`Catálogo: ${produtos.length} produto(s) publicado(s).\n`)
  console.log(`  tag "${TAG_CAMERA}"    → ${cameras.length} etiquetado(s), ${camerasDisponiveis.length} disponível(is)`)
  console.log(`  tag "${TAG_ACESSORIO}" → ${acessorios.length} etiquetado(s), ${sugeriveis.length} SUGERÍVEL(IS)`)
  console.log("")

  // ─── Aviso (não falha): produto sem tag alguma ─────────────────────────────
  //
  // Não é gatilho nem sugestão — quase sempre é cadastro novo em que alguém
  // esqueceu de etiquetar. Aviso, e não bloqueio: pode ser um produto que
  // deliberadamente não participa da feature.
  const semTag = produtos.filter((p) => p.tags.length === 0)
  if (semTag.length > 0) {
    console.warn(`⚠ ${semTag.length} produto(s) SEM TAG ALGUMA — não disparam a sugestão nem são sugeridos:\n`)
    for (const p of semTag) console.warn(`   • ${p.handle}  (${p.title})`)
    console.warn(
      `\n  Se algum é câmera, aplique a tag "${TAG_CAMERA}" para ele disparar a seção.\n` +
        `  Se é acessório, aplique "${TAG_ACESSORIO}". Se nenhum dos dois, ignore.\n`,
    )
  }

  // ─── Falhas ────────────────────────────────────────────────────────────────
  const problemas = []
  if (cameras.length === 0) {
    problemas.push(
      `Nenhum produto com a tag "${TAG_CAMERA}": a seção NUNCA vai aparecer,\n` +
        "     porque nada no carrinho dispara o gatilho.",
    )
  }
  if (sugeriveis.length === 0) {
    problemas.push(
      acessorios.length > 0
        ? `Há ${acessorios.length} produto(s) com a tag "${TAG_ACESSORIO}", mas NENHUM disponível:\n` +
          "     eles são filtrados das sugestões e a seção nunca aparece.\n" +
          "     Problema de ESTOQUE, não de etiqueta."
        : `Nenhum produto com a tag "${TAG_ACESSORIO}": não há o que sugerir.`,
    )
  }

  if (problemas.length > 0) {
    console.error("✖ A pré-condição da sugestão de acessórios CAIU:\n")
    for (const p of problemas) console.error(`   • ${p}`)
    console.error(
      "\n  A seção não aparecer é indistinguível de um bug para quem olha a tela.\n" +
        "  Corrija no admin da Shopify (Produtos → tags), ou aceite que a feature\n" +
        "  está inativa — mas saiba disso.\n",
    )
    return 1
  }

  console.log("✔ Pré-condição OK: há gatilho e há o que sugerir.")
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar tags: ${e.message}`)
  process.exitCode = 1
}
