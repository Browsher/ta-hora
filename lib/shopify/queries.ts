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
