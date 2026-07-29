// Mostra o carimbo de afiliado (`afiliado_ref`) de um carrinho — sem caçar no
// Network do navegador.
//
// Uso:  npm run verificar:afiliado -- "<cart id>"
//
// Onde achar o <cart id>: DevTools → Application → Cookies → o cookie
// `carrinho_id`. Ele é `httpOnly` (JS não lê), mas o painel do DevTools mostra o
// valor — é só copiar. Formato:
//   gid://shopify/Cart/<token>?key=<key>
//
// ESCOPO HONESTO: isto verifica o CARRINHO, via Storefront API — o único token
// que a loja tem. Ele NÃO lê pedidos (isso exigiria a Admin API, que este
// projeto não usa). A confirmação de que o `afiliado_ref` chegou ao PEDIDO é
// feita no admin da Shopify, no pedido de teste (tarefa 21 da spec).
//
// Ainda assim este script é útil: se o carimbo está no carrinho ANTES do
// checkout, a Shopify o converte em `note_attributes` do pedido. Carrinho sem
// carimbo = pedido sem atribuição, garantido — e isso ele pega na hora.
//
// ⚠️ DUPLICAÇÃO DECLARADA: roda em Node puro, fora do Next — não pode importar
// `lib/shopify/` (TypeScript + `import "server-only"`) nem `lib/afiliados/ref.ts`.
// Por isso repete o fetch, a leitura de env, o default da versão, a chave do
// attribute e o formato do ref. Ao mudar qualquer um, mude nos DOIS lugares:
// `lib/shopify/client.ts` + `lib/afiliados/ref.ts` e aqui.
//
// ⚠️ SEMPRE `process.exitCode`, NUNCA `process.exit()`: com handles de fetch
// abertos, no Windows o `process.exit()` vira
// `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` e o exit code sai 127
// no sucesso E na falha. Já aconteceu no `verificar-variantes.mjs`.

const DEFAULT_API_VERSION = "2026-01"

/** A chave do contrato com o webhook — espelha `lib/afiliados/ref.ts`. */
const CHAVE_ATRIBUTO = "afiliado_ref"

/** O formato do código — espelha `lib/afiliados/ref.ts`. */
const FORMATO_DO_REF = /^[A-Z0-9]{8}$/

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const QUERY = /* GraphQL */ `
  query CarrinhoDoAfiliado($id: ID!) {
    cart(id: $id) {
      id
      totalQuantity
      checkoutUrl
      attributes { key value }
      lines(first: 20) {
        nodes {
          quantity
          merchandise { ... on ProductVariant { product { title } } }
        }
      }
    }
  }
`

async function main() {
  const cartId = process.argv[2]

  if (!cartId) {
    console.error(
      "✖ Falta o id do carrinho.\n\n" +
        '  Uso:  npm run verificar:afiliado -- "gid://shopify/Cart/...?key=..."\n\n' +
        "  Copie de: DevTools → Application → Cookies → cookie `carrinho_id`.",
    )
    process.exitCode = 1
    return
  }

  if (!domain || !token) {
    console.error(
      "✖ Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN.\n" +
        "  Rode via `npm run verificar:afiliado` (que passa --env-file=.env.local).",
    )
    process.exitCode = 1
    return
  }

  const resposta = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query: QUERY, variables: { id: cartId } }),
  })

  const json = await resposta.json()

  if (json.errors) {
    console.error("✖ A Shopify recusou a consulta:")
    for (const e of json.errors) console.error(`  • ${e.message}`)
    process.exitCode = 1
    return
  }

  const cart = json.data?.cart

  if (!cart) {
    console.error(
      "✖ Carrinho não encontrado.\n" +
        "  `cart: null` = id errado, carrinho expirado, ou JÁ FINALIZADO em checkout.\n" +
        "  (A Storefront API não distingue os três — é o mesmo sinal.)",
    )
    process.exitCode = 1
    return
  }

  const itens = cart.lines.nodes
    .map((l) => `${l.quantity}× ${l.merchandise?.product?.title ?? "?"}`)
    .join(", ")

  console.log(`carrinho:  ${cart.id}`)
  console.log(`itens:     ${cart.totalQuantity} (${itens || "vazio"})`)
  console.log(`attributes: ${JSON.stringify(cart.attributes)}`)
  console.log("")

  const ref = cart.attributes.find((a) => a.key === CHAVE_ATRIBUTO)?.value ?? null

  if (!ref) {
    console.error(
      `✖ SEM CARIMBO: o carrinho não tem o attribute \`${CHAVE_ATRIBUTO}\`.\n\n` +
        "  O pedido gerado por este carrinho NÃO será atribuído a nenhum afiliado.\n" +
        "  Checar: o cookie `tahora_ref` existe? (DevTools → Application → Cookies)\n" +
        "  Se não existe, a captura falhou — visite de novo com `?ref=CODIGO`.",
    )
    process.exitCode = 1
    return
  }

  if (!FORMATO_DO_REF.test(ref)) {
    console.error(
      `✖ CARIMBO FORA DO CONTRATO: \`${CHAVE_ATRIBUTO}\` = ${JSON.stringify(ref)}\n\n` +
        "  O webhook de afiliados exige ^[A-Z0-9]{8}$ e é CASE-SENSITIVE.\n" +
        "  Este valor será IGNORADO (o webhook responde 200 e não credita).",
    )
    process.exitCode = 1
    return
  }

  console.log(`✔ CARIMBADO: ${CHAVE_ATRIBUTO} = ${ref}`)
  console.log(
    "\n  Ao finalizar este carrinho, a Shopify converte os cart attributes em\n" +
      "  `note_attributes` do pedido — é de lá que o webhook de afiliados lê.\n" +
      "  Confirme no admin da Shopify, no pedido gerado.",
  )
}

await main()
