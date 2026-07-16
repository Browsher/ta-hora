import "server-only"

// Documentos GraphQL do carrinho (Storefront API). `server-only`: só a camada de
// dados (carrinho.ts) os usa, e ela detém o token.
//
// TODAS as operações abaixo foram validadas contra o schema 2026-01 via Dev MCP
// (`validate_graphql_codeblocks`, api: storefront-graphql). Os detalhes abaixo
// não são estilo — cada um veio de um erro real ou de um comportamento medido:
//
//  1. `warnings` em TODA mutation. O limite de estoque da Shopify é SILENCIOSO:
//     pedir quantity 9999 devolve `userErrors: []` (nenhum erro), limita a
//     quantidade e avisa SÓ em `warnings` (MERCHANDISE_NOT_ENOUGH_STOCK). Quem
//     só olha `userErrors` mostra "sucesso" enquanto o cliente clica + e o
//     número trava mudo. Mesma coisa no cupom inválido (DISCOUNT_NOT_FOUND).
//  2. `$discountCodes: [String!]!` — NÃO-NULO. Escrever `[String!]` é erro de
//     schema na 2026-01 (pego pelo Dev MCP). Remover cupom = enviar `[]`, nunca
//     `null`.
//  3. `merchandise` é INTERFACE → precisa do `... on ProductVariant`.
//  4. `product(handle:)`, nunca `productByHandle` (depreciado na 2026-01).
//  5. Depreciação é por TIPO, não por nome: `Cart.discountAllocations` é
//     depreciado, mas `BaseCartLine.discountAllocations` (usado abaixo, na
//     linha) NÃO é — é vivo, e é como se mostra o efeito do cupom por linha.
//
// PROIBIDOS (depreciados na 2026-01): `Cart.estimatedCost`,
// `Cart.discountAllocations`, `BaseCartLine.estimatedCost`, `totalDutyAmount`,
// `totalTaxAmount` e os `*Estimated`.

/**
 * Campos do carrinho, compartilhados pela query e por todas as mutations.
 *
 * `cost.amountPerQuantity` na linha existe para o preço unitário vir PRONTO da
 * Shopify — a UI não pode calcular `totalAmount / quantidade` (dinheiro nunca é
 * derivado localmente; o valor exibido não pode divergir do cobrado).
 */
const CAMPOS_DO_CARRINHO = /* GraphQL */ `
  fragment CamposDoCarrinho on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount    { amount currencyCode }
    }
    discountCodes {
      code
      applicable
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          amountPerQuantity { amount currencyCode }
          totalAmount       { amount currencyCode }
        }
        discountAllocations {
          discountedAmount { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            quantityAvailable
            image { url altText width height }
            product { title handle }
          }
        }
      }
    }
  }
`

/** Erros e avisos — selecionados juntos em TODA mutation (ver nota 1 no topo). */
const RETORNO_DA_MUTATION = /* GraphQL */ `
  cart { ...CamposDoCarrinho }
  userErrors { field message code }
  warnings   { code message target }
`

export const CARRINHO_QUERY = /* GraphQL */ `
  ${CAMPOS_DO_CARRINHO}
  query Carrinho($id: ID!) {
    cart(id: $id) { ...CamposDoCarrinho }
  }
`

/**
 * Cria o carrinho JÁ COM as linhas — um único round-trip (Req 1.2).
 * Nunca `cartCreate` seguido de `cartLinesAdd`.
 */
export const CRIAR_CARRINHO_MUTATION = /* GraphQL */ `
  ${CAMPOS_DO_CARRINHO}
  mutation CriarCarrinho($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      ${RETORNO_DA_MUTATION}
    }
  }
`

export const ADICIONAR_LINHAS_MUTATION = /* GraphQL */ `
  ${CAMPOS_DO_CARRINHO}
  mutation AdicionarLinhas($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      ${RETORNO_DA_MUTATION}
    }
  }
`

export const ATUALIZAR_LINHAS_MUTATION = /* GraphQL */ `
  ${CAMPOS_DO_CARRINHO}
  mutation AtualizarLinhas($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      ${RETORNO_DA_MUTATION}
    }
  }
`

export const REMOVER_LINHAS_MUTATION = /* GraphQL */ `
  ${CAMPOS_DO_CARRINHO}
  mutation RemoverLinhas($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      ${RETORNO_DA_MUTATION}
    }
  }
`

/**
 * A mutation SUBSTITUI a lista inteira de cupons (não faz merge).
 * Aplicar = enviar `[...atuais, novo]`. Remover = enviar a lista sem ele.
 * Lista vazia = `[]` — NUNCA `null` (o argumento é `[String!]!`, nota 2).
 */
export const DEFINIR_CUPONS_MUTATION = /* GraphQL */ `
  ${CAMPOS_DO_CARRINHO}
  mutation DefinirCupons($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      ${RETORNO_DA_MUTATION}
    }
  }
`
