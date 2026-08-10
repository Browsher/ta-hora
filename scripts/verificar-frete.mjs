// Trava de paridade do FRETE: compara os VALORES da tabela local
// (`lib/frete/tabela.ts`) com o que a Shopify realmente cobra.
//
// Uso:  npm run verificar:frete
//   exit 0 = os 6 valores de zona conferem com a loja
//   exit 1 = divergência, tarifa sumida, ou sonda sem opções
//
// ─── 🔴 O QUE ESTE CHECK PROTEGE, E O QUE ELE NÃO PROTEGE ─────────────────────
//
//   VALOR  → protegido. É o motivo de o script existir.
//   PRAZO  → NÃO PROTEGIDO, e não há como proteger daqui. O prazo simplesmente
//            não existe na Storefront API: `CartDeliveryOption` tem code,
//            deliveryMethodType, description, estimatedCost, handle e title —
//            mais nada (medido em 10/08/2026), e `description` volta VAZIO em
//            tarifa manual. Levar o prazo para o `title` foi avaliado e recusado
//            pelo lojista (poluiria o checkout, que já mostra o prazo).
//
// Ou seja: metade da tabela tem trava automática e a outra metade depende de
// alguém lembrar. Risco conhecido e aceito — está declarado no topo de
// `lib/frete/tabela.ts`. Não "conserte" isso aqui inventando uma comparação de
// prazo: não há com o que comparar.
//
// ─── ⚠️ DUPLICAÇÃO DECLARADA ─────────────────────────────────────────────────
//
// Roda em Node puro, fora do Next: não pode importar `lib/frete/tabela.ts` (é
// TypeScript) nem `lib/shopify/client.ts` (tem `import "server-only"`), e não
// enxerga `.env.local` sozinho — daí o `--env-file` no script npm. Por isso
// repete o fetch, a leitura de env, o default da versão E a tabela de valores.
// 🔴 FONTE DA VERDADE = `lib/frete/tabela.ts`. Mudou valor lá? Mude aqui também,
// ou este check passa a comparar a Shopify com um número que a UI não usa —
// aprovando uma divergência real ou reprovando uma paridade que existe.
//
// ─── 🔴 PROVINCECODE É OBRIGATÓRIO ───────────────────────────────────────────
//
// Medido em 10/08/2026 com 12 sondas: `{countryCode:"BR", zip}` devolve ZERO
// delivery groups, em todas as regiões. A Shopify NÃO deduz a UF a partir do
// CEP — as zonas casam por PROVÍNCIA. Por isso a sonda manda `provinceCode` e
// nem se dá ao trabalho de mandar CEP. Se um dia as opções vierem vazias, o
// suspeito nº 1 é província faltando, não tarifa desconfigurada.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`.
// Este script faz `fetch`, e `process.exit()` derruba o processo com handles
// libuv abertos: no Windows isso vira `Assertion failed: !(handle->flags &
// UV_HANDLE_CLOSING)` e o exit code sai 127 — no sucesso e na falha. Aconteceu
// de verdade no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"

// DUPLICADO de `lib/frete/tabela.ts` (OPCOES_DA_ZONA + UF_SONDA). Só o VALOR —
// o prazo não é comparável (ver o topo).
//
// Uma UF por zona: como a Shopify casa por província e todas as UFs da zona
// caem na mesma tarifa, uma sonda cobre a zona. Limite honesto: isto não pega
// alguém movendo UMA UF de zona no admin (o Piauí sozinho para outro grupo).
// Cobrir esse caso custaria 27 carrinhos por rodada, e o modo de falha real é
// "mudei o preço", não "reparticionei o mapa".
const ZONAS = [
  { zona: "SP",           uf: "SP", valores: [14.9] },
  { zona: "SUDESTE",      uf: "RJ", valores: [19.9, 29.9] },
  { zona: "SUL",          uf: "RS", valores: [19.9, 29.9] },
  { zona: "CENTRO_OESTE", uf: "GO", valores: [39.9, 49.9] },
  { zona: "NORDESTE",     uf: "BA", valores: [49.9, 59.9] },
  { zona: "NORTE",        uf: "AM", valores: [49.9, 59.9] },
]

const domain  = process.env.SHOPIFY_STORE_DOMAIN
const token   = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

if (!domain || !token) {
  console.error(
    "Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN\n" +
    "em .env.local (o npm script já passa --env-file).",
  )
  process.exitCode = 1
} else {
  await rodar()
}

async function gql(query, variables = {}) {
  const r = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  })
  const j = await r.json()
  if (j.errors) throw new Error("GraphQL: " + JSON.stringify(j.errors))
  return j.data
}

async function rodar() {
  // Qualquer variante comprável serve: as tarifas da loja são por ZONA, não por
  // produto. ⚠️ É também o limite deste check — uma tarifa condicional ("grátis
  // acima de R$ X") não seria vista, porque a sonda usa 1 unidade de 1 produto.
  // Hoje não existe condição configurada; se passar a existir, esta sonda
  // precisa cobrir as faixas de valor.
  const d = await gql(`{
    products(first: 10) {
      nodes { title variants(first: 1) { nodes { id availableForSale } } }
    }
  }`)
  const produto = d.products.nodes.find(p => p.variants.nodes[0]?.availableForSale)
  if (!produto) {
    console.error("❌ Nenhuma variante disponível para montar o carrinho-sonda.")
    process.exitCode = 1
    return
  }
  const variantId = produto.variants.nodes[0].id
  console.log(`Sonda com: ${produto.title}\n`)

  let falhas = 0

  for (const { zona, uf, valores } of ZONAS) {
    const criado = await gql(
      `mutation($lines:[CartLineInput!]){
         cartCreate(input:{lines:$lines}){ cart { id } userErrors { message } }
       }`,
      { lines: [{ merchandiseId: variantId, quantity: 1 }] },
    )
    const cartId = criado.cartCreate?.cart?.id
    if (!cartId) {
      console.error(`❌ ${zona}: falhou ao criar carrinho-sonda`)
      falhas++
      continue
    }

    const r = await gql(
      `mutation($cartId:ID!,$addresses:[CartSelectableAddressInput!]!){
         cartDeliveryAddressesAdd(cartId:$cartId, addresses:$addresses){
           cart {
             deliveryGroups(first: 5) {
               nodes { deliveryOptions { title estimatedCost { amount } } }
             }
           }
           userErrors { message }
         }
       }`,
      {
        cartId,
        addresses: [{
          address: { deliveryAddress: { countryCode: "BR", provinceCode: uf } },
          selected:   true,
          oneTimeUse: true,
        }],
      },
    )

    const grupos  = r.cartDeliveryAddressesAdd?.cart?.deliveryGroups?.nodes ?? []
    const opcoes  = grupos.flatMap(g => g.deliveryOptions ?? [])
    // Number() e não parseFloat: a API devolve "14.9" com ponto decimal, e um
    // `toFixed(2)` dos dois lados evita 14.9 !== 14.900000000000001.
    const daLoja  = opcoes.map(o => Number(o.estimatedCost.amount).toFixed(2)).sort()
    const daLocal = valores.map(v => v.toFixed(2)).sort()

    if (opcoes.length === 0) {
      console.error(`❌ ${zona} (${uf}): a Shopify não devolveu NENHUMA opção de entrega.`)
      falhas++
      continue
    }

    if (daLoja.join(" · ") !== daLocal.join(" · ")) {
      console.error(
        `❌ ${zona} (${uf}): DIVERGE\n` +
        `      Shopify: ${daLoja.join(" · ")}   (${opcoes.map(o => o.title).join(" · ")})\n` +
        `      local:   ${daLocal.join(" · ")}   ← lib/frete/tabela.ts`,
      )
      falhas++
      continue
    }

    console.log(`✅ ${zona} (${uf}): ${daLoja.join(" · ")}`)
  }

  console.log()
  if (falhas > 0) {
    console.error(
      `${falhas} zona(s) fora de paridade.\n` +
      "Corrija lib/frete/tabela.ts (e a cópia de valores no topo deste script)\n" +
      "OU o admin da Shopify — decida qual dos dois está certo antes de editar.\n" +
      "⚠️ Se o VALOR mudou no admin, o PRAZO provavelmente mudou junto, e esse\n" +
      "   ninguém verifica: confira os dias úteis no admin na mesma passada.",
    )
    process.exitCode = 1
  } else {
    console.log(
      "Paridade de VALOR ok nas 6 zonas.\n" +
      "⚠️ Lembrete: o PRAZO não é verificado por nada. Se você mexeu em frete no\n" +
      "   admin, confira os dias úteis contra lib/frete/tabela.ts na mão.",
    )
  }
}
