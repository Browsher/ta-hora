// Salvaguarda da pré-condição de dados da VITRINE DA HOME (feature
// home-produtos-carrossel).
//
// A seção "Nossos Produtos" da Home mostra os produtos da coleção `destaques`,
// na ORDEM MANUAL que o lojista arrastou no admin. Toda a degradação da feature
// converge para o MESMO sintoma silencioso:
//
// 🔴 O MODO DE FALHA DESTA FEATURE É O SILÊNCIO. Coleção despublicada do canal
// Storefront, handle trocado, coleção esvaziada ou todo o estoque zerado — os
// quatro fazem `getVitrineHome()` devolver `[]`, a `VitrineHome` devolver `null`
// e a seção simplesmente SUMIR da Home. Nenhum erro, nenhum log, nenhuma página
// quebrada: a Home continua bonita, só que sem vender. É exatamente por isso que
// o barulho tem de vir daqui, do terminal.
//
// Uso:  npm run verificar:vitrine
//   exit 0 = a coleção existe, está publicada e tem ao menos 1 produto à venda
//   exit 1 = coleção nula, coleção sem produtos, ou TODOS os produtos esgotados
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o build tem de passar SEM
// `.env.local`, e este check precisa do token. Rode ao mexer na coleção
// `destaques` no admin.
//
// ⚠️ DUPLICAÇÃO DECLARADA: roda em Node puro, fora do Next — não pode importar
// `lib/shopify/products.ts` (é TypeScript e tem `import "server-only"`) nem
// enxerga `.env.local` sozinho (quem carrega é o Next; daí o `--env-file` no
// script npm). Por isso repete o fetch, a leitura de env, o default da versão, o
// handle da coleção e o teto da feature.
// 🔴 FONTE DA VERDADE = `lib/shopify/products.ts` (HOME_COLLECTION_HANDLE e
// HOME_VITRINE_TETO). Mudou lá? Mude aqui, ou este check passa a mentir. Ao mudar
// a versão da API, mude também em `lib/shopify/client.ts`.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles
// libuv abertos: no Windows isso vira `Assertion failed: !(handle->flags &
// UV_HANDLE_CLOSING)` e o exit code sai **127** — tanto no sucesso quanto na
// falha. Um check cujo exit code é sempre 127 não sinaliza nada. Aconteceu de
// verdade no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"

// A coleção que a vitrine da Home exibe — DUPLICADO de `lib/shopify/products.ts`
// (HOME_COLLECTION_HANDLE). É a coleção `destaques`, DIFERENTE da `cameras` do
// /catalogo (que quem verifica é o `verificar-destaques.mjs`, de outra feature).
const COLECAO = "destaques"

// O teto que a FEATURE pede à API — DUPLICADO de `HOME_VITRINE_TETO`. Aqui ele
// serve só de RÉGUA para o aviso lá embaixo; a busca deste script NÃO o usa.
const TETO_DA_FEATURE = 12

// 🔴 O script busca ACIMA do teto da feature, DE PROPÓSITO. Espelhar o `first: 12`
// impediria de distinguir "exatamente 12" de "13 ou mais", e o aviso do teto
// silencioso — o único motivo de este número existir — nunca dispararia. `250` é
// o teto da Storefront API (`first: 251` responde "first cannot exceed 250"), o
// mesmo valor já usado em `lib/shopify/recomendados.ts`.
const TETO_DA_API = 250

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token. Rode via `npm run verificar:vitrine`\n" +
  "  (que passa --env-file=.env.local)."

// Espelha a VITRINE_HOME_QUERY (`lib/shopify/queries.ts`) no que importa aqui:
// `sortKey: MANUAL` para a saída sair na MESMA ordem da Home (comparável com a
// tela lado a lado) e `availableForSale` para separar o que a Home filtra.
const QUERY = /* GraphQL */ `
  query VitrineDaHome($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      title
      products(first: $first, sortKey: MANUAL) {
        nodes {
          handle
          title
          availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`

async function buscar() {
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { handle: COLECAO, first: TETO_DA_API },
    }),
  })

  if (!res.ok) throw new Error(`Shopify respondeu ${res.status} ${res.statusText}`)

  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "))

  // `collection` null = handle errado ou coleção não publicada no canal
  // Storefront (mesmo tratamento de `getVitrineHome`). Devolve null p/ o caso 0.
  return json.data.collection ?? null
}

async function main() {
  if (!domain || !token) {
    console.error(ENV_AUSENTE)
    return 1
  }

  const colecao = await buscar()

  // ─── CASO 0 — coleção nula ou vazia. CHECADO PRIMEIRO E SEPARADO ─────────────
  // 🔴 A ordem importa: sem este caso, zero produtos cairia no caso "todos
  // esgotados" lá embaixo e o script culparia o ESTOQUE — apontando para o lugar
  // errado. Aqui o problema não é estoque, é o conjunto.
  const produtos = colecao?.products?.nodes ?? []
  if (!colecao || produtos.length === 0) {
    console.error(
      `✖ Coleção \`${COLECAO}\` ${!colecao ? "não encontrada" : "sem produtos"} na Storefront API.\n\n` +
        `  A seção "Nossos Produtos" da Home NÃO ESTÁ APARECENDO agora\n` +
        `  (getVitrineHome devolve [] e a VitrineHome devolve null). A Home segue\n` +
        `  renderizando as outras 8 seções — por isso ninguém percebe pela tela.\n\n` +
        `  Causas prováveis, nesta ordem:\n` +
        `   • a coleção não está publicada no canal Storefront (canal de vendas);\n` +
        `   • o handle mudou no admin — confira \`HOME_COLLECTION_HANDLE\` em\n` +
        `     lib/shopify/products.ts;\n` +
        `   • a coleção existe mas ficou sem produtos.\n`,
    )
    return 1
  }

  const total = produtos.length
  const indisponiveis = produtos.filter((p) => !p.availableForSale)
  const naTela = total - indisponiveis.length

  console.log(
    `Coleção \`${COLECAO}\` ("${colecao.title}"): ${total} produto(s), em ordem MANUAL.\n`,
  )

  // ─── A ordem manual, produto a produto ───────────────────────────────────────
  // É a mesma ordem que a Home renderiza — dá para conferir com a tela ao lado.
  console.log("Ordem manual (a mesma da Home, de cima para baixo):")
  produtos.forEach((p, i) => {
    const preco = p.priceRange.minVariantPrice
    const posicao = String(i + 1).padStart(2)
    // O que passa do teto NUNCA chega à Home: a query da feature corta em 12.
    const acimaDoTeto = i >= TETO_DA_FEATURE ? "  ✖ ACIMA DO TETO — não aparece" : ""
    const estado = p.availableForSale ? "✔ à venda" : "· esgotado (filtrado)"
    console.log(
      `  ${posicao}. ${p.handle.padEnd(28)} ${preco.currencyCode} ${String(preco.amount).padEnd(8)} ${estado}${acimaDoTeto}`,
    )
  })
  console.log("")

  console.log(
    `Na Home: ${naTela} card(s)` +
      (indisponiveis.length
        ? `  (${indisponiveis.length} esgotado(s) filtrado(s): ${indisponiveis.map((p) => p.handle).join(", ")})`
        : "  (0 esgotados)"),
  )
  console.log("")

  // ─── CASO 1 — todos esgotados ────────────────────────────────────────────────
  // A UI não consegue distinguir isto de "coleção vazia": os dois viram uma seção
  // que some. Só o terminal consegue dizer qual é qual.
  if (naTela === 0) {
    console.error(
      `✖ TODOS os ${total} produtos da coleção \`${COLECAO}\` estão indisponíveis.\n\n` +
        `  A seção da Home NÃO ESTÁ APARECENDO: a Home nunca mostra o que não se\n` +
        `  pode comprar, então a lista filtrada fica vazia e a seção devolve null.\n` +
        `  Pela tela isso é IDÊNTICO a "coleção vazia" — daí este check existir.\n\n` +
        `  Causas prováveis:\n` +
        `   • estoque zerado nos produtos da vitrine;\n` +
        `   • produtos despublicados do canal Storefront;\n` +
        `   • a coleção foi repovoada com produtos que não estão à venda.\n`,
    )
    return 1
  }

  // ─── AVISO (sem exit 1) — mais produtos que o teto da feature ────────────────
  // 🔴 AVISO, NÃO ERRO, de propósito: aqui a Home continua CORRETA e vendendo —
  // ela só mostra os 12 primeiros da ordem manual. O lojista precisa saber que o
  // teto foi atingido, mas um exit 1 viraria ruído permanente numa loja que
  // cresceu, e ruído permanente é o pior destino de um alarme.
  if (total > TETO_DA_FEATURE) {
    const fora = produtos.slice(TETO_DA_FEATURE)
    console.warn(
      `⚠ A coleção tem ${total} produtos, acima do teto de ${TETO_DA_FEATURE} da vitrine.\n` +
        `  ${fora.length} produto(s) NUNCA aparecem na Home, em silêncio:\n` +
        fora.map((p) => `   • ${p.handle}`).join("\n") +
        `\n\n  A Home continua correta (mostra os ${TETO_DA_FEATURE} primeiros da ordem manual).\n` +
        `  Para incluí-los: reordene a coleção no admin, ou aumente\n` +
        `  \`HOME_VITRINE_TETO\` em lib/shopify/products.ts — lembrando que todos\n` +
        `  os produtos vão inteiros no HTML da Home.\n`,
    )
  }

  console.log(
    `✔ Pré-condição OK: coleção \`${COLECAO}\` publicada, ` +
      `${naTela} produto(s) à venda na vitrine da Home ` +
      `(ordem manual: ${produtos.filter((p) => p.availableForSale).slice(0, TETO_DA_FEATURE).map((p) => p.handle).join(" → ")}).`,
  )
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar a vitrine da Home: ${e.message}`)
  process.exitCode = 1
}
