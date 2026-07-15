import "server-only"

import { storefrontFetch } from "./client"
import {
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  SPEC_METAFIELD_IDENTIFIERS,
} from "./queries"
import {
  normalizeProductCard,
  normalizeProduct,
  type RawProductCard,
  type RawProduct,
} from "./normalize"
import type { ProductCard, Product } from "./types"

// API de dados de alto nível consumida pelas rotas. `server-only` (defesa em
// profundidade M1): garante que a spec do carrinho — ou qualquer código de
// cliente — não importe isto por engano e arraste o token pro bundle.

const CATALOG_REVALIDATE = 300 // segundos (ISR ≤ 5 min)

/** Todos os produtos da loja, resumidos para a vitrine. */
export async function getProducts(): Promise<ProductCard[]> {
  const data = await storefrontFetch<{ products: { nodes: RawProductCard[] } }>(
    PRODUCTS_QUERY,
    { first: 100 },
    { revalidate: CATALOG_REVALIDATE },
  )
  return data.products.nodes.map(normalizeProductCard)
}

/** Um produto pelo handle. Retorna `null` quando o produto não existe. */
export async function getProductByHandle(handle: string): Promise<Product | null> {
  const data = await storefrontFetch<{ product: RawProduct | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle, identifiers: SPEC_METAFIELD_IDENTIFIERS },
    { revalidate: CATALOG_REVALIDATE },
  )
  if (!data.product) return null
  return normalizeProduct(data.product)
}
