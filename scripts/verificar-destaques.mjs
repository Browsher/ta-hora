// Salvaguarda da pré-condição de dados dos DESTAQUES do catálogo (feature
// catalogo-destaques).
//
// Os blocos do /catalogo mostram uma TARJA (`custom.selo`) e uma linha de destaques
// (resolução sempre; lentes e alarme só quando são DIFERENCIAL). Toda decisão é
// tomada no servidor, em `lib/shopify/destaques.ts`, a partir do TEXTO gravado no
// admin. É isso que torna a feature frágil de um jeito específico:
//
// 🔴 O MODO DE FALHA DESTA FEATURE NÃO É "A CHAVE SUMIU" — é "A REDAÇÃO MUDOU".
// Se alguém no admin trocar "Lente dupla" por "Duas lentes", ou "Alarme sonoro" por
// "Sirene", a chave continua 7/7 PREENCHIDA e nenhum check de presença acusa nada —
// mas o gatilho DESLIGA e o ícone some da vitrine em silêncio. Por isso este script
// não se contenta em contar preenchidas: ele lista os VALORES DISTINTOS de
// `numero_de_lentes` e `com_alarme` e conta quantas câmeras DISPARAM cada gatilho.
//
// Uso:  npm run verificar:destaques
//   exit 0 = as 4 chaves têm dado E os dois gatilhos disparam em alguma câmera
//   exit 1 = coleção vazia, chave zerada, ou gatilho que não dispara em ninguém
//
// ⚠️ NÃO está acoplado ao `npm run build` DE PROPÓSITO: o build tem de passar SEM
// `.env.local`, e este check precisa do token. Rode ao mexer no catálogo/destaques
// ou ao editar os metafields no admin.
//
// ⚠️ DUPLICAÇÃO DECLARADA: roda em Node puro, fora do Next — não pode importar
// `lib/shopify/destaques.ts` (é TypeScript) nem `client.ts` (tem `import
// "server-only"`), e não enxerga `.env.local` sozinho (quem carrega é o Next; daí o
// `--env-file` no script npm). Por isso repete o fetch, a leitura de env, o default
// da versão, o handle da coleção e — o que mais importa — AS DUAS REGRAS DE GATILHO.
// 🔴 FONTE DA VERDADE = `lib/shopify/destaques.ts`. Mudou uma regra lá? Mude aqui
// também, ou este check passa a mentir: aprovaria um dado que a UI descarta (ou
// reprovaria um que ela aceita). Ao mudar a versão da API, mude também em
// `lib/shopify/client.ts`; ao mudar a coleção, em `lib/shopify/products.ts`.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles libuv
// abertos: no Windows isso vira `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`
// e o exit code sai **127** — tanto no sucesso quanto na falha. Um check cujo exit
// code é sempre 127 não sinaliza nada. Aconteceu de verdade no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"

// A coleção que o /catalogo exibe — DUPLICADO de `lib/shopify/products.ts`
// (CATALOGO_COLLECTION_HANDLE). Consultar a COLEÇÃO, e não `products` global, é
// deliberado: o check tem de olhar exatamente o conjunto que a vitrine mostra.
const COLECAO = "cameras"

const NAMESPACE = "custom"

// As 4 chaves da feature — DUPLICADAS dos aliases da PRODUCTS_QUERY
// (`lib/shopify/queries.ts`). São as LITERAIS DA LOJA, não o rótulo do admin: o
// rename no admin PRESERVA a key original (lição de `custom.marca` → rótulo
// "Aplicativo"). `campo` é o nome do campo correspondente no ProductCard.
const CHAVES = [
  { key: "selo", campo: "selo (tarja)" },
  { key: "tipo_de_resolucao", campo: "resolucao" },
  { key: "numero_de_lentes", campo: "lentes" },
  { key: "com_alarme", campo: "alarmeSonoro" },
]

const IDX_LENTES = CHAVES.findIndex((c) => c.key === "numero_de_lentes")
const IDX_ALARME = CHAVES.findIndex((c) => c.key === "com_alarme")

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const ENV_AUSENTE =
  "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
  "  Este check precisa do token. Rode via `npm run verificar:destaques`\n" +
  "  (que passa --env-file=.env.local)."

const IDENTIFIERS = CHAVES.map(({ key }) => ({ namespace: NAMESPACE, key }))

// `sortKey: MANUAL` espelha a PRODUCTS_QUERY — não muda o veredito (a ordem é
// irrelevante para contar), mas mantém a saída na MESMA ordem da vitrine, o que
// torna a lista por câmera comparável com a tela lado a lado.
const QUERY = /* GraphQL */ `
  query DestaquesDoCatalogo(
    $handle: String!
    $cursor: String
    $ids: [HasMetafieldsIdentifier!]!
  ) {
    collection(handle: $handle) {
      products(first: 50, after: $cursor, sortKey: MANUAL) {
        pageInfo { hasNextPage endCursor }
        nodes {
          handle
          title
          metafields(identifiers: $ids) { key value }
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
    body: JSON.stringify({
      query: QUERY,
      variables: { handle: COLECAO, cursor, ids: IDENTIFIERS },
    }),
  })

  if (!res.ok) throw new Error(`Shopify respondeu ${res.status} ${res.statusText}`)

  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "))

  // `collection` null = handle errado ou coleção não publicada no canal Storefront
  // (mesmo tratamento de `getProducts`). Devolve null para o caso 0 do main().
  return json.data.collection?.products ?? null
}

/** Valor "preenchido" = não-nulo e não-vazio após trim (regra do normalizeProductCard). */
function valorDe(mf) {
  if (!mf || mf.value == null) return null
  const v = String(mf.value).trim()
  return v === "" ? null : v
}

// ─── AS DUAS REGRAS — reescritas de `lib/shopify/destaques.ts` ────────────────────
// 🔴 Se elas divergirem da fonte da verdade, este check aprova dado que a UI
// descarta. Mantenha idênticas.

/** Lentes: `includes` de "dupla" OU "tripla". "Lente única" não contém nenhum dos dois. */
function temLenteMultipla(valor) {
  const v = (valor ?? "").trim().toLowerCase()
  return v.includes("dupla") || v.includes("tripla")
}

/** Alarme: IGUALDADE com "alarme sonoro" — não `includes` ("Sem alarme sonoro" mentiria). */
function temAlarmeSonoro(valor) {
  return (valor ?? "").trim().toLowerCase() === "alarme sonoro"
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
  let colecaoExiste = true
  do {
    const pagina = await buscarPagina(cursor)
    if (pagina === null) {
      colecaoExiste = false
      break
    }
    produtos.push(...pagina.nodes)
    cursor = pagina.pageInfo.hasNextPage ? pagina.pageInfo.endCursor : null
  } while (cursor)

  // ─── CASO 0 — coleção nula ou vazia. CHECADO PRIMEIRO E SEPARADO ────────────────
  // 🔴 A ordem importa: sem este caso, zero câmeras faria as 4 chaves aparecerem
  // como 0/0 e o script culparia a GRAFIA DA CHAVE — apontando para o lugar errado.
  // O problema aqui não é a chave, é o conjunto.
  if (!colecaoExiste || produtos.length === 0) {
    console.error(
      `✖ Coleção \`${COLECAO}\` ${!colecaoExiste ? "não encontrada" : "sem produtos"} na Storefront API.\n\n` +
        `  Isto NÃO é problema de grafia dos metafields — é o CONJUNTO que sumiu. O\n` +
        `  /catalogo inteiro está vazio agora (getProducts devolve [] via \`?? []\` e a\n` +
        `  página mostra "Nenhum produto disponível no momento").\n\n` +
        `  Causas prováveis, nesta ordem:\n` +
        `   • a coleção não está publicada no canal Storefront (canal de vendas);\n` +
        `   • o handle mudou no admin — confira \`CATALOGO_COLLECTION_HANDLE\` em\n` +
        `     lib/shopify/products.ts;\n` +
        `   • a coleção existe mas ficou sem produtos.\n`,
    )
    return 1
  }

  const total = produtos.length
  console.log(
    `Coleção \`${COLECAO}\`: ${total} câmera(s). Destaques: ${CHAVES.length} chaves.\n`,
  )

  // A API devolve a lista NA ORDEM dos identifiers, com null para os ausentes.
  const linhas = produtos.map((p) => {
    const mfs = p.metafields ?? []
    return {
      handle: p.handle,
      title: p.title,
      valores: CHAVES.map((_, i) => valorDe(mfs[i])),
    }
  })

  // ─── Por câmera: os 4 valores + o que a UI vai fazer com eles ───────────────────
  console.log("Por câmera (valores crus → o que a vitrine mostra):")
  for (const { handle, valores } of linhas) {
    const [selo, resolucao, lentes, alarme] = valores
    const disparaLentes = temLenteMultipla(lentes)
    const disparaAlarme = temAlarmeSonoro(alarme)
    console.log(`  ${handle}`)
    console.log(`     tarja      ${selo ?? "— (sem tarja)"}`)
    console.log(`     resolução  ${resolucao ?? "— (omitida)"}`)
    console.log(
      `     lentes     ${lentes ?? "—"}  →  ${disparaLentes ? "✔ exibe" : "· omitido"}`,
    )
    console.log(
      `     alarme     ${alarme ?? "—"}  →  ${disparaAlarme ? "✔ sirene" : "· omitido"}`,
    )
  }
  console.log("")

  // ─── Agregado por chave: preenchidas + VALORES DISTINTOS ────────────────────────
  // Os valores distintos são o coração deste check (Req 7.3): é a única saída que
  // revela uma MUDANÇA DE REDAÇÃO no admin — a que não zera a chave, mas desliga o
  // gatilho.
  console.log("Por chave (câmeras com valor · valores distintos):")
  const porChave = CHAVES.map(({ key, campo }, i) => {
    const valores = linhas.map((l) => l.valores[i]).filter((v) => v !== null)
    // Conta por valor, não só o conjunto: "6 câmeras com X, 1 com Y" mostra de
    // relance se uma câmera destoa das outras.
    const distintos = [...new Set(valores)].map((v) => ({
      valor: v,
      n: valores.filter((x) => x === v).length,
    }))
    return { key, campo, hits: valores.length, distintos }
  })

  for (const { key, campo, hits, distintos } of porChave) {
    const marca = hits === 0 ? " ✖ 0 — CHAVE DIVERGENTE?" : ""
    console.log(`  ${String(hits + "/" + total).padEnd(6)} custom.${key} → ${campo}${marca}`)
    for (const { valor, n } of distintos) {
      console.log(`           • ${JSON.stringify(valor)}  (${n})`)
    }
  }
  console.log("")

  // ─── Gatilhos: quantas câmeras DISPARAM cada destaque ───────────────────────────
  const comLentes = linhas.filter((l) => temLenteMultipla(l.valores[IDX_LENTES]))
  const comAlarme = linhas.filter((l) => temAlarmeSonoro(l.valores[IDX_ALARME]))

  console.log("Gatilhos (câmeras que exibem o destaque):")
  console.log(
    `  ${String(comLentes.length + "/" + total).padEnd(6)} lente múltipla (dupla/tripla)` +
      (comLentes.length ? `  — ${comLentes.map((l) => l.handle).join(", ")}` : ""),
  )
  console.log(
    `  ${String(comAlarme.length + "/" + total).padEnd(6)} alarme sonoro` +
      (comAlarme.length ? `  — ${comAlarme.map((l) => l.handle).join(", ")}` : ""),
  )
  console.log("")

  // ─── CASO 1 — alguma chave 0 em TODAS as câmeras (grafia da chave) ──────────────
  const zeradas = porChave.filter(({ hits }) => hits === 0)
  if (zeradas.length > 0) {
    console.error(
      `✖ A pré-condição dos destaques CAIU: ${zeradas.length} chave(s) com 0/${total}:\n` +
        zeradas.map(({ key, campo }) => `   • custom.${key} → ${campo}`).join("\n") +
        `\n\n  Esses destaques sumiriam do bloco em SILÊNCIO (a query devolve null e o\n` +
        `  normalizador degrada para "sem destaque"). Quase sempre é a GRAFIA da\n` +
        `  chave: lembre que o rename no admin PRESERVA a key original\n` +
        `  ("marca"→"Aplicativo", "notorizada"→"Motorizada"). Confira a key exata no\n` +
        `  admin (Configurações → Metafields → Produtos) e em lib/shopify/queries.ts.\n`,
    )
    return 1
  }

  // ─── CASO 2 — nenhuma câmera dispara o gatilho de LENTES ────────────────────────
  if (comLentes.length === 0) {
    console.error(
      `✖ O gatilho de LENTES não dispara em NENHUMA das ${total} câmeras.\n\n` +
        `  A premissa registrada na spec: hoje 5/7 câmeras têm lente dupla/tripla.\n` +
        `  Como custom.numero_de_lentes está preenchida, a causa provável NÃO é a\n` +
        `  chave — é a REDAÇÃO. Olhe os valores distintos listados acima: se a loja\n` +
        `  passou a gravar "Duas lentes" no lugar de "Lente dupla", a regra de\n` +
        `  \`includes("dupla"|"tripla")\` deixou de casar e o ícone sumiu da vitrine.\n\n` +
        `  🔴 SE A PREMISSA CAIU DE VERDADE (a loja agora só vende lente única), a\n` +
        `  ação correta é REMOVER o destaque de lentes da feature — não silenciar\n` +
        `  este check. Um alarme que sempre toca vira ruído permanente, e ruído\n` +
        `  permanente é o pior destino de um alarme.\n\n` +
        `  Fonte da verdade da regra: lib/shopify/destaques.ts (temLenteMultipla).\n`,
    )
    return 1
  }

  // ─── CASO 3 — nenhuma câmera dispara o gatilho de ALARME ────────────────────────
  if (comAlarme.length === 0) {
    console.error(
      `✖ O gatilho de ALARME SONORO não dispara em NENHUMA das ${total} câmeras.\n\n` +
        `  A premissa registrada na spec: hoje 2/7 câmeras têm "Alarme sonoro".\n` +
        `  Como custom.com_alarme está preenchida, a causa provável NÃO é a chave —\n` +
        `  é a REDAÇÃO. A regra é IGUALDADE exata com "alarme sonoro" (não\n` +
        `  \`includes\`, para "Sem alarme sonoro" nunca acender a sirene), então\n` +
        `  qualquer variação nova ("Sirene", "Alarme audível") desliga o destaque.\n` +
        `  Compare com os valores distintos listados acima.\n\n` +
        `  🔴 SE A PREMISSA CAIU DE VERDADE (nenhuma câmera do catálogo tem mais\n` +
        `  alarme sonoro), a ação correta é REMOVER o destaque de alarme da feature\n` +
        `  — não silenciar este check.\n\n` +
        `  Fonte da verdade da regra: lib/shopify/destaques.ts (temAlarmeSonoro).\n`,
    )
    return 1
  }

  console.log(
    `✔ Pré-condição OK: as ${CHAVES.length} chaves têm dado, ` +
      `${comLentes.length} câmera(s) exibem lente múltipla e ` +
      `${comAlarme.length} exibem alarme sonoro.`,
  )
  return 0
}

try {
  process.exitCode = await main()
} catch (e) {
  // Mensagem sem token (o endpoint pode aparecer; o token, nunca).
  console.error(`✖ Falha ao verificar destaques: ${e.message}`)
  process.exitCode = 1
}
