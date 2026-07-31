// Salvaguarda da pré-condição de dados da seção "Sobre este produto" (feature
// apresentacao-produto).
//
// A seção inteira depende de UM metafield no admin da Shopify:
//   `custom.apresentacao`  (tipo multi_line_text_field)
//
// Se ele sumir, mudar de key, ou tiver o ACESSO AO STOREFRONT desabilitado, a
// Storefront API devolve `null` — sem erro, sem log. A seção simplesmente não
// aparece, e é indistinguível de "este produto não tem apresentação". Este
// script existe para essa premissa cair com barulho.
//
// O acesso ao storefront é o modo de falha mais provável e o mais silencioso:
// o campo existe no admin, o lojista preenche, vê o texto salvo lá, e o site
// não muda. Por isso o diagnóstico abaixo é explícito.
//
// Uso:  npm run verificar:apresentacao   (exit 0 = premissa vale; 1 = caiu)
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o build tem de passar
// SEM `.env.local`, e este check precisa do token. Rode ao mexer no catálogo.
//
// ⚠️ DUPLICAÇÃO DECLARADA (mesma exceção dos outros verificar:*): roda em Node
// puro, fora do Next — não pode importar `lib/` (é TypeScript e tem
// `import "server-only"`) nem enxerga `.env.local` sozinho. Por isso repete o
// fetch, a leitura de env, o default da versão, o namespace/key e A REGRA DE
// BLOCOS de `lib/apresentacao.ts`. Ao mudar a convenção, mude nos DOIS lugares.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()` — `process.exit()` com
// handles de fetch abertos vira exit 127 no Windows, e um check cujo código de
// saída é sempre 127 não sinaliza nada.

const DEFAULT_API_VERSION = "2026-01"
const NAMESPACE = "custom"
const KEY = "apresentacao"
const TIPO_ESPERADO = "multi_line_text_field"

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token. Rode via `npm run verificar:apresentacao`\n" +
  "  (que passa --env-file=.env.local)."

const QUERY = /* GraphQL */ `
  query Apresentacao($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        apresentacao: metafield(namespace: "${NAMESPACE}", key: "${KEY}") {
          type
          value
        }
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
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data.products
}

// ─── Réplica da convenção de lib/apresentacao.ts (ver duplicação declarada) ───

function blocosDe(cru) {
  const texto = (cru ?? "").replace(/\r\n/g, "\n").trim()
  if (!texto) return []
  const brutos = texto.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  const saida = []
  for (const bruto of brutos) {
    let itens = []
    let linhasTexto = []
    const fecharLista = () => { if (itens.length) { saida.push({ tipo: "lista", itens }); itens = [] } }
    const fecharTexto = () => { if (linhasTexto.length) { saida.push({ tipo: "paragrafo" }); linhasTexto = [] } }
    for (const linha of bruto.split("\n")) {
      const l = linha.trim()
      if (!l) continue
      if (l.startsWith("- ")) { fecharTexto(); itens.push(l) }
      else { fecharLista(); linhasTexto.push(l) }
    }
    fecharTexto()
    fecharLista()
  }
  return saida
}

async function main() {
  if (!domain || !token) {
    console.error(ENV_AUSENTE)
    process.exitCode = 1
    return
  }

  const produtos = []
  let cursor = null
  let hasNext = true
  while (hasNext) {
    const pagina = await buscarPagina(cursor)
    produtos.push(...pagina.nodes)
    hasNext = pagina.pageInfo.hasNextPage
    cursor = pagina.pageInfo.endCursor
  }

  const comValor = produtos.filter((p) => p.apresentacao?.value?.trim())
  const tipoErrado = comValor.filter((p) => p.apresentacao.type !== TIPO_ESPERADO)

  console.log(`\nCatálogo: ${produtos.length} produto(s) publicado(s).\n`)
  console.log(`  ${NAMESPACE}.${KEY} preenchido → ${comValor.length}`)

  for (const p of produtos) {
    const cru = p.apresentacao?.value?.trim()
    if (!cru) {
      console.log(`     ○ ${p.handle}  (sem apresentação — seção não aparece)`)
      continue
    }
    const blocos = blocosDe(cru)
    const ultimo = blocos[blocos.length - 1]
    const temRessalva = blocos.length > 1 && ultimo?.tipo === "paragrafo"
    const listas = blocos.filter((b) => b.tipo === "lista")
    const itens = listas.reduce((n, l) => n + l.itens.length, 0)
    const semTravessao = listas
      .flatMap((l) => l.itens)
      .filter((i) => !/^.*?\s+[—–]\s+.*$/.test(i.slice(2)))

    console.log(
      `     • ${p.handle}  ${blocos.length} bloco(s), ` +
      `${listas.length} lista(s)/${itens} item(ns), ` +
      `ressalva: ${temRessalva ? "sim" : "NÃO"}`,
    )
    if (semTravessao.length) {
      console.log(`        ⚠ ${semTravessao.length} item(ns) sem travessão — sairão só em peso normal:`)
      for (const i of semTravessao) console.log(`           ${JSON.stringify(i.slice(2, 60))}`)
    }
  }

  if (tipoErrado.length) {
    console.error(`\n✖ Tipo de metafield inesperado (esperado ${TIPO_ESPERADO}):`)
    for (const p of tipoErrado) console.error(`     ${p.handle} → ${p.apresentacao.type}`)
    console.error("  Rich text devolve JSON, não texto — o parser de blocos não o entende.")
    process.exitCode = 1
    return
  }

  if (comValor.length === 0) {
    console.error("\n✖ NENHUM produto tem `" + NAMESPACE + "." + KEY + "` preenchido.")
    console.error("  Se você preencheu no admin, o suspeito nº1 é o ACESSO AO STOREFRONT")
    console.error("  desabilitado na definição do metafield: a API devolve null sem erro,")
    console.error("  e a seção fica indistinguível de 'produto sem apresentação'.")
    console.error("  Admin → Configurações → Dados personalizados → Produtos → Apresentação.")
    process.exitCode = 1
    return
  }

  console.log(`\n✔ Pré-condição OK: ${comValor.length} produto(s) com apresentação legível.`)
}

main().catch((erro) => {
  // Sem imprimir o objeto de erro cru: a mensagem do fetch conteria o endpoint.
  console.error(`✖ Falha ao consultar a Shopify: ${erro.message}`)
  process.exitCode = 1
})
