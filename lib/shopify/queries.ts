import "server-only"
import { SPEC_METAFIELDS } from "./specs"

// Documentos GraphQL da Storefront API. `server-only` (defesa em profundidade):
// as queries só são usadas pelo servidor via client.ts/products.ts.

export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first) {
      nodes {
        id
        handle
        title
        featuredImage { url altText width height }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query ProductByHandle($handle: String!, $identifiers: [HasMetafieldsIdentifier!]!) {
    product(handle: $handle) {
      id
      handle
      title
      descriptionHtml
      images(first: 20) { nodes { url altText width height } }
      priceRange { minVariantPrice { amount currencyCode } }
      metafields(identifiers: $identifiers) {
        namespace
        key
        value
      }
    }
  }
`

// Identificadores dos metafields de specs, derivados de SPEC_METAFIELDS.
// Passado como variável `$identifiers` para PRODUCT_BY_HANDLE_QUERY.
export const SPEC_METAFIELD_IDENTIFIERS = SPEC_METAFIELDS.map(
  ({ namespace, key }) => ({ namespace, key }),
)

/**
 * Variantes de um produto — usada só pelo carrinho, para o SERVIDOR resolver o
 * `merchandiseId` a partir do handle (o cliente nunca escolhe a variante).
 *
 * `first: 2` é DELIBERADO — não troque por `first: 1`:
 *   - 1 basta para comprar (a premissa do catálogo é 1 variante por produto);
 *   - mas são precisas 2 para DETECTAR "mais de uma variante" e disparar a
 *     salvaguarda do Req 1.8. Com `first: 1` a premissa poderia cair em silêncio
 *     e o site venderia a cor errada.
 *
 * A salvaguarda conta VARIANTES, nunca a presença de `options`: hoje os produtos
 * têm 1 variante mas MANTÊM a opção `Cor` (com um único valor) — checar `options`
 * daria falso positivo imediato.
 *
 * `quantityAvailable` pode vir `null` (depende do scope
 * `unauthenticated_read_product_inventory`) — tratar como opcional (Req 10.7).
 *
 * `product(handle:)` e NÃO `productByHandle`, que está depreciado na 2026-01.
 */
export const PRODUTO_PARA_CARRINHO_QUERY = /* GraphQL */ `
  query ProdutoParaCarrinho($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      variants(first: 2) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
        }
      }
    }
  }
`
