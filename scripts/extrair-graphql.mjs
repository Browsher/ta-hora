// Extrai os documentos GraphQL do CÓDIGO REAL, com as interpolações resolvidas —
// para validar no Dev MCP **o que o runtime monta**, não o que alguém lembra.
//
// Uso:  node scripts/extrair-graphql.mjs [saida.json]
//
// Por que existe: o fragmento `CAMPOS_DO_CARRINHO` é interpolado na
// CARRINHO_QUERY e nas 5 mutations — as **6 operações** do carrinho. Qualquer
// mudança nele muda todas. Validar "de memória" é como o argumento não-nulo do
// cupom quase entrou em produção na spec `carrinho-loja`.
//
// Não faz `import` dos módulos: eles são TypeScript, usam imports extensionless
// e levam `import "server-only"` — o Node ESM não os carrega. Então: parse do
// fonte, resolvendo as DUAS interpolações (`${CAMPOS_DO_CARRINHO}` e
// `${RETORNO_DA_MUTATION}`).
//
// ⚠️ Este script NÃO valida — ele MONTA. A validação é o Dev MCP
// (`validate_graphql_codeblocks`, api: storefront-graphql, version: 2026-01), e
// **aviso de depreciação conta como falha** (`productByHandle` valida com
// ⚠️ INFORM, não com ❌).

import { readFileSync, writeFileSync } from "node:fs"

const BACKTICK = String.fromCharCode(96)

/** Lê `NOME = /* GraphQL *\/ \`…\`` e devolve o conteúdo do template literal. */
function extrair(fonte, nome) {
  const marca = `${nome} = /* GraphQL */ ${BACKTICK}`
  const inicio = fonte.indexOf(marca)
  if (inicio === -1) return null
  const abre = inicio + marca.length
  const fecha = fonte.indexOf(BACKTICK, abre)
  if (fecha === -1) return null
  return fonte.slice(abre, fecha)
}

const OPERACOES_DO_CARRINHO = [
  "CARRINHO_QUERY",
  "CRIAR_CARRINHO_MUTATION",
  "ADICIONAR_LINHAS_MUTATION",
  "ATUALIZAR_LINHAS_MUTATION",
  "REMOVER_LINHAS_MUTATION",
  "DEFINIR_CUPONS_MUTATION",
]

// Do catálogo: entram para provar NÃO-REGRESSÃO (não deviam mudar nunca).
const OPERACOES_DO_CATALOGO = [
  "PRODUTO_PARA_CARRINHO_QUERY",
  "PRODUCTS_QUERY",
  "PRODUCT_BY_HANDLE_QUERY",
]

function main() {
  const qc = readFileSync("lib/shopify/queriesCarrinho.ts", "utf8")
  const qs = readFileSync("lib/shopify/queries.ts", "utf8")

  const fragmento = extrair(qc, "const CAMPOS_DO_CARRINHO")
  const retorno = extrair(qc, "const RETORNO_DA_MUTATION")

  if (!fragmento || !retorno) {
    console.error(
      "✖ Não encontrei CAMPOS_DO_CARRINHO e/ou RETORNO_DA_MUTATION em\n" +
        "  lib/shopify/queriesCarrinho.ts. Se os nomes mudaram, atualize este script.",
    )
    return 1
  }

  // As DUAS interpolações. `split/join` em vez de `replace(/…/g)` para não
  // interpretar `$` do conteúdo GraphQL (`$cartId`) como grupo de captura.
  const resolver = (doc) =>
    doc
      .split("${CAMPOS_DO_CARRINHO}").join(fragmento)
      .split("${RETORNO_DA_MUTATION}").join(retorno)

  const docs = {}
  for (const nome of OPERACOES_DO_CARRINHO) docs[nome] = resolver(extrair(qc, `export const ${nome}`))
  for (const nome of OPERACOES_DO_CATALOGO) docs[nome] = extrair(qs, `export const ${nome}`)

  let falhou = false
  console.log("Documentos montados a partir do código real:\n")

  for (const [nome, doc] of Object.entries(docs)) {
    if (!doc) {
      console.log(`  ✖ ${nome} — NÃO ENCONTRADO`)
      falhou = true
      continue
    }

    const semResiduo = !doc.includes("${")
    const ehDoCarrinho = OPERACOES_DO_CARRINHO.includes(nome)
    const ehMutation = doc.includes("mutation ")
    const temWarnings = doc.includes("warnings")

    // ⚠️ DUAS CHECAGENS INGÊNUAS JÁ PASSARAM PELO MOTIVO ERRADO AQUI:
    //
    //  1. `!doc.includes("${")` — um documento TRUNCADO também não tem `${`.
    //  2. `doc.includes("fragment CamposDoCarrinho on Cart")` — a DECLARAÇÃO do
    //     fragmento fica no topo, ANTES do ponto onde a extração corta. Também
    //     passa truncado.
    //
    // Isso não é hipótese: uma crase dentro de um comentário GraphQL fechou o
    // template literal cedo, a extração cortou no meio, e as duas checagens
    // aprovaram 6 documentos quebrados.
    //
    // A prova ESTRUTURAL é o balanço de chaves: um documento cortado no meio
    // fecha menos chaves do que abre. Isso não tem como passar truncado.
    const abre = (doc.match(/\{/g) || []).length
    const fecha = (doc.match(/\}/g) || []).length
    const balanceado = abre === fecha && abre > 0

    const fragmentoInlinado = !ehDoCarrinho || doc.includes("fragment CamposDoCarrinho on Cart")
    const resolvido = semResiduo && fragmentoInlinado && balanceado

    // Toda mutation de carrinho DEVE selecionar `warnings`: o limite de estoque
    // da Shopify chega com `userErrors` VAZIO e sinaliza só ali.
    const okWarnings = !ehMutation || temWarnings

    if (!resolvido || !okWarnings) falhou = true

    const marcas = [
      !semResiduo ? "✖ RESÍDUO DE ${…}" : null,
      !fragmentoInlinado ? "✖ FRAGMENTO AUSENTE" : null,
      !balanceado ? `✖ CHAVES DESBALANCEADAS (${abre} abrem, ${fecha} fecham) — EXTRAÇÃO TRUNCADA` : null,
      resolvido ? "íntegro" : null,
      ehMutation ? (temWarnings ? "warnings ok" : "✖ SEM WARNINGS") : null,
      `${doc.length} bytes`,
    ].filter(Boolean)

    console.log(`  ${resolvido && okWarnings ? "✔" : "✖"} ${nome.padEnd(30)} ${marcas.join(" | ")}`)
  }

  const saida = process.argv[2]
  if (saida) {
    writeFileSync(saida, JSON.stringify(docs, null, 1))
    console.log(`\n  → ${Object.keys(docs).length} documentos em ${saida}`)
  }

  console.log(
    "\n  Próximo passo: validar cada documento com o Dev MCP\n" +
      "  (validate_graphql_codeblocks, api: storefront-graphql, version: 2026-01).\n" +
      "  Aviso de depreciação = FALHA, não só erro de schema.",
  )

  return falhou ? 1 : 0
}

// `process.exitCode`, nunca `process.exit()` — precedente do verificar-variantes.
process.exitCode = main()
