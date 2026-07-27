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

// Handle da coleção MANUAL que dirige a ordem do /catalogo. O lojista arrasta os
// produtos nesta coleção no admin (populares no topo) e o catálogo reflete. Se
// renomear/trocar a coleção, mude aqui — e confirme que ela está publicada no
// canal Storefront (senão `collection` vem null → catálogo vazio).
const CATALOGO_COLLECTION_HANDLE = "cameras"

/** Produtos do catálogo, na ORDEM MANUAL da coleção, resumidos para a vitrine. */
export async function getProducts(): Promise<ProductCard[]> {
  const data = await storefrontFetch<{
    collection: { products: { nodes: RawProductCard[] } } | null
  }>(
    PRODUCTS_QUERY,
    { handle: CATALOGO_COLLECTION_HANDLE, first: 100 },
    { revalidate: CATALOG_REVALIDATE },
  )
  // `collection` null = handle errado ou coleção não publicada no canal Storefront.
  // Degrada para vazio (estado "Nenhum produto disponível"), nunca quebra.
  return data.collection?.products.nodes.map(normalizeProductCard) ?? []
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
