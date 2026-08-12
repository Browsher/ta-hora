// Salvaguarda da pré-condição de dados da FICHA TÉCNICA (feature ficha-tecnica).
//
// A página de produto mostra uma seção "Especificações técnicas" alimentada por 21
// metafields `custom.*`. Se a CHAVE de algum divergir (namespace/key errados) ou os
// dados não estiverem preenchidos, aquela spec some SEM erro, sem log —
// indistinguível de "essa câmera não tem essa spec".
//
// 🔴 O RISCO É REAL E ESPECÍFICO AQUI: os metafields foram RENOMEADOS no admin, mas
// a Shopify PRESERVA a `custom.<key>` ORIGINAL. Então a key carrega o nome ANTIGO
// (`custom.marca` → rótulo "Aplicativo"; `custom.notorizada` → "Motorizada"). Se
// alguém "consertar" a key para casar com o rótulo atual, a spec zera em silêncio.
// Este script existe para essa premissa cair com barulho — a MESMA lição do
// `eseecloud`/`custom.resumo`: o Dev MCP valida o SCHEMA (o campo existe), mas só a
// loja real diz se cada chave está preenchida.
//
// Uso:  npm run verificar:especificacoes   (exit 0 = toda chave tem dado; exit 1 = alguma 0/7)
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o build tem de passar SEM
// `.env.local`, e este check precisa do token. Rode ao mexer no catálogo/ficha.
//
// ⚠️ DUPLICAÇÃO DECLARADA: roda em Node puro, fora do Next — não pode importar
// `lib/shopify/` (é TypeScript e tem `import "server-only"`) nem enxerga
// `.env.local` sozinho (quem carrega é o Next; daí o `--env-file` no script npm).
// Por isso repete o fetch, a leitura de env, o default da versão e as 21 chaves. Ao
// mudar a versão da API, mude nos DOIS lugares: `lib/shopify/client.ts` e aqui. Ao
// mudar as chaves, mude em `lib/shopify/specs.ts` e aqui.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles libuv
// abertos: no Windows isso vira `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`
// e o exit code sai **127** — tanto no sucesso quanto na falha. Um check cujo exit
// code é sempre 127 não sinaliza nada. Aconteceu de verdade no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"

// As 21 chaves da ficha técnica — DUPLICADAS de `lib/shopify/specs.ts` (SPEC_METAFIELDS).
// 🔴 mude nos DOIS lugares se mudarem. `marca`/`notorizada` são NOMES ANTIGOS (rename) —
// não "conserte" para "aplicativo"/"motorizada": zeraria a spec.
const NAMESPACE = "custom"
const CHAVES = [
  "tipo_de_resolucao",
  "visao_noturna",
  "com_visao_noturna_colorida",
  "resistente_a_agua",
  "audio_bidirecional",
  "com_sensor_de_movimento",
  "conectividade",
  "com_alarme",
  "marca",
  "qualidade_de_resolucao",
  "campo_visual",
  "zoom",
  "tipo_de_movimento",
  "notorizada",
  "diametro_da_lente_da_camera",
  "temperatura_maxima_suportada",
  "temperatura_minima_suportada",
  "lugares_de_montagem",
  "modelo",
  "linha",
  "cor",
]

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token. Rode via `npm run verificar:especificacoes`\n" +
  "  (que passa --env-file=.env.local)."

const IDENTIFIERS = CHAVES.map((key) => ({ namespace: NAMESPACE, key }))

const QUERY = /* GraphQL */ `
  query ProdutosEspecificacoes($cursor: String, $ids: [HasMetafieldsIdentifier!]!) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        metafields(identifiers: $ids) { key value }
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
    body: JSON.stringify({ query: QUERY, variables: { cursor, ids: IDENTIFIERS } }),
  })

  if (!res.ok) throw new Error(`Shopify respondeu ${res.status} ${res.statusText}`)

  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "))

  return json.data.products
}

// Valor "preenchido" = não-nulo e não-vazio após trim (mesma regra do normalizeProduct).
function temValor(mf) {
  return Boolean(mf && mf.value != null && String(mf.value).trim() !== "")
}

async function main() {
  if (!domain || !token) {
    console.error(ENV_AUSENTE)
    return 1
  }

  // Pagina até o fim: um teto silencioso esconderia exatamente a câmera que quebrou
  // a premissa.
  const produtos = []
  let cursor = null
  do {
    const pagina = await buscarPagina(cursor)
    produtos.push(...pagina.nodes)
    cursor = pagina.pageInfo.hasNextPage ? pagina.pageInfo.endCursor : null
  } while (cursor)

  const total = produtos.length
  console.log(`Catálogo: ${total} produto(s) publicado(s). Ficha técnica: ${CHAVES.length} chaves.\n`)

  // ─── Por câmera: quantas das 21 têm valor ─────────────────────────────────────
  console.log("Por câmera (specs preenchidas / total):")
  for (const p of produtos) {
    // A API devolve a lista NA ORDEM dos identifiers, com null para os ausentes.
    const n = (p.metafields ?? []).filter(temValor).length
    console.log(`  ${String(n + "/" + CHAVES.length).padEnd(6)} ${p.handle}  (${p.title})`)
  }
  console.log("")

  // ─── Agregado por chave: em quantas das N câmeras cada spec tem valor ─────────
  const porChave = CHAVES.map((key) => ({ key, hits: 0 }))
  for (const p of produtos) {
    const mfs = p.metafields ?? []
    mfs.forEach((mf, i) => {
      if (temValor(mf)) porChave[i].hits++
    })
  }

  console.log("Por chave (câmeras com valor):")
  for (const { key, hits } of porChave) {
    const marca = hits === 0 ? " ✖ 0 — CHAVE DIVERGENTE?" : ""
    console.log(`  ${String(hits + "/" + total).padEnd(6)} custom.${key}${marca}`)
  }
  console.log("")

  // ─── Falha: ALGUMA chave 0 em TODAS as câmeras (divergência de grafia/rename) ──
  const zeradas = porChave.filter(({ hits }) => hits === 0)
  if (zeradas.length > 0) {
    console.error(
      `✖ A pré-condição da ficha técnica CAIU: ${zeradas.length} chave(s) com 0/${total}:\n` +
        zeradas.map(({ key }) => `   • custom.${key}`).join("\n") +
        `\n\n  Essas specs sumiriam da ficha em SILÊNCIO. Quase sempre é a GRAFIA da\n` +
        `  chave: lembre que o rename no admin PRESERVA a key original\n` +
        `  ("marca"→"Aplicativo", "notorizada"→"Motorizada"). Confira a key exata no\n` +
        `  admin (Configurações → Metafields → Produtos) e em lib/shopify/specs.ts.\n`,
    )
    return 1
  }

  // ─── Camada 2: UM produto destoando dos demais numa chave ────────────────────
  //
  // A camada acima pega a chave que sumiu para TODO MUNDO. Esta pega o oposto: a
  // chave preenchida em todas as câmeras, mas com UMA fora do padrão.
  //
  // 🔴 POR QUE EXISTE: em 12/08/2026 o `custom.linha` da Q8 estava "EseeCloud"
  // (nome do APLICATIVO) enquanto as outras 6 traziam "Câmera Segurança Wi-Fi".
  // O erro foi para produção e ficou no ar até uma auditoria de SEO ler as 7 PDPs
  // lado a lado. Nada quebrou: a ficha renderizou o valor errado com a mesma
  // confiança com que renderiza o certo. Um dado plausível e errado não tem como
  // ser detectado por "o campo está preenchido?" — só por comparação entre irmãos.
  //
  // A regra: a chave tem exatamente DOIS valores distintos, a maioria reúne 4+
  // câmeras e a minoria é UMA só. Fora dessa forma o script não opina — `modelo`
  // (7 valores únicos), `cor` (4 valores) e `tipo_de_resolucao` (4 valores) variam
  // por natureza e nunca disparam.
  //
  // ⚠️ HEURÍSTICA, NÃO VERDADE. Um dia uma câmera pode legitimamente ser a única
  // com outro diâmetro de lente. Quando isso acontecer, declare a chave em
  // `DIVERGENCIA_ESPERADA` com o motivo — não afrouxe a regra, e não "conserte" o
  // dado bom para calar o check.
  const DIVERGENCIA_ESPERADA = new Set([
    // Formato: "nome_da_chave",  // por que UM produto divergir aqui é correto
    // (vazia em 12/08/2026: nas 7 câmeras, a única chave nesta forma era a `linha`
    // da Q8, que é o bug de verdade.)
  ])

  // Só as câmeras: os acessórios (cartão, cabo) têm 0/21 e entrariam como um
  // "(vazio)" gigante em toda chave, afogando o sinal.
  const comFicha = produtos.filter((p) => (p.metafields ?? []).some(temValor))

  const destoantes = []
  CHAVES.forEach((key, i) => {
    if (DIVERGENCIA_ESPERADA.has(key)) return

    const porValor = new Map()
    for (const p of comFicha) {
      const mf = (p.metafields ?? [])[i]
      if (!temValor(mf)) continue
      const val = String(mf.value).trim()
      if (!porValor.has(val)) porValor.set(val, [])
      porValor.get(val).push(p.handle)
    }

    if (porValor.size !== 2) return
    const [maioria, minoria] = [...porValor.entries()].sort((a, b) => b[1].length - a[1].length)
    if (minoria[1].length !== 1 || maioria[1].length < 4) return

    destoantes.push({
      key,
      handle:      minoria[1][0],
      valorErrado: minoria[0],
      valorComum:  maioria[0],
      quantos:     maioria[1].length,
    })
  })

  if (destoantes.length > 0) {
    console.error(
      `✖ ${destoantes.length} campo(s) com UM produto fora do padrão dos demais:\n` +
        destoantes
          .map(
            (d) =>
              `   • custom.${d.key} — ${d.handle} tem ${JSON.stringify(d.valorErrado)},\n` +
              `     mas as outras ${d.quantos} câmeras têm ${JSON.stringify(d.valorComum)}`,
          )
          .join("\n") +
        `\n\n  Isto NÃO quebra a ficha: o valor errado renderiza normalmente na PDP e\n` +
        `  chega ao cliente com cara de dado correto. Confira no admin da Shopify\n` +
        `  (produto → Metafields) e corrija lá — o valor vem da loja, não do código.\n\n` +
        `  Se a divergência for LEGÍTIMA, declare a chave em DIVERGENCIA_ESPERADA,\n` +
        `  neste arquivo, com o motivo.\n`,
    )
    return 1
  }

  console.log("✔ Pré-condição OK: todas as 21 chaves têm dado em ao menos uma câmera.")
  console.log("✔ Nenhum produto destoa dos demais nas chaves de valor uniforme.")
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar especificações: ${e.message}`)
  process.exitCode = 1
}
