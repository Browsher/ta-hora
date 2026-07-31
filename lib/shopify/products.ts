import "server-only"

import { storefrontFetch } from "./client"
import {
  PRODUCTS_QUERY,
  VITRINE_HOME_QUERY,
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

// Handle da coleção MANUAL que dirige a VITRINE DA HOME (seção "Nossos Produtos").
// Coleção DIFERENTE da do catálogo, de propósito: o lojista escolhe na Shopify o
// que vai na porta da frente sem mexer no catálogo inteiro. Mesmas condições de
// `cameras`: se renomear/trocar, mude aqui — e confirme que está publicada no
// canal Storefront (senão `collection` vem null → a seção some da Home).
//
// ⚠️ NOME: o código chama isto de "vitrine da Home", não de "destaques", embora o
// handle na loja seja `destaques`. `lib/shopify/destaques.ts` JÁ EXISTE e é outra
// coisa (as regras de destaques de SPEC do bloco do /catalogo). Um `getDestaques()`
// aqui seria armadilha de leitura permanente.
const HOME_COLLECTION_HANDLE = "destaques"

// Teto de produtos que a vitrine da Home pede à API. A loja inteira tem 7 câmeras;
// 12 é folga confortável para qualquer curadoria plausível e ainda assim LIMITA o
// HTML que a Home entrega inteiro ao Google (todos os produtos vão no HTML do
// servidor — o carrossel do mobile é apresentação, não filtro). Sem teto, arrastar
// 50 produtos no admin transformaria a Home num catálogo.
//
// ⚠️ O teto se aplica NA QUERY, o filtro de esgotados DEPOIS: 12 pedidos com 2
// esgotados dão 10 na tela, não 12. É consequência aceita e declarada.
// Passar de 12 na coleção não dá erro nenhum — o 13º simplesmente nunca aparece.
// Quem faz barulho nesse caso é `npm run verificar:vitrine`, que busca ACIMA
// deste teto justamente para conseguir avisar.
const HOME_VITRINE_TETO = 12

/** A resposta crua da vitrine: `RawProductCard` + o campo que só serve p/ filtrar. */
interface RawVitrineProduto extends RawProductCard {
  availableForSale: boolean
}

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

/**
 * Produtos da vitrine da Home ("Nossos Produtos"), na ORDEM MANUAL da coleção
 * `destaques`, já sem os esgotados.
 *
 * Molde literal do `getProducts()` acima — mesma `storefrontFetch`, mesmo
 * `{ revalidate }`, mesmo `collection?... ?? []` para a coleção nula.
 *
 * **Pode lançar** (rede/Shopify fora): quem degrada para "sem seção" é a rota
 * (`app/page.tsx`, try/catch → `[]`). A Home nunca cai por causa da loja.
 */
export async function getVitrineHome(): Promise<ProductCard[]> {
  const data = await storefrontFetch<{
    collection: { products: { nodes: RawVitrineProduto[] } } | null
  }>(
    VITRINE_HOME_QUERY,
    { handle: HOME_COLLECTION_HANDLE, first: HOME_VITRINE_TETO },
    { revalidate: CATALOG_REVALIDATE },
  )

  // `collection` null = handle errado ou coleção fora do canal Storefront.
  // Degrada para vazio (a seção não renderiza), nunca quebra a Home.
  return (
    data.collection?.products.nodes
      // Nunca mostrar na porta da frente o que não se pode comprar. Filtro em JS,
      // ANTES de normalizar — mesmo precedente de `recomendados.ts`, sobre o mesmo
      // campo pedido na mesma requisição. `normalizeProductCard` ignora o extra,
      // então `normalize.ts` NÃO precisou mudar.
      .filter((p) => p.availableForSale)
      // SEM `.sort()` de propósito: a ordem devolvida pela API É a ordem manual
      // que o lojista arrastou no admin. Reordenar aqui seria o código roubando a
      // decisão de quem cuida da loja.
      .map(normalizeProductCard) ?? []
  )
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

/**
 * O handle tem PÁGINA no site?
 *
 * A coleção `cameras` é a fonte única de "o que tem página" — a MESMA que já
 * governa o /catalogo, o `generateStaticParams` e o /sitemap.xml. Acessórios
 * (cartão de memória, cabo) vivem fora dela de propósito: existem na Shopify e
 * são sugeridos no drawer POR TAG (`acessorio`), mas não têm PDP.
 *
 * Sem esta guarda, `dynamicParams = true` renderiza uma PDP completa para
 * qualquer handle que exista na loja — inclusive os acessórios, que nunca
 * aparecem no catálogo nem no sitemap. A URL direta era a única porta aberta.
 *
 * 🔴 DEGRADA PARA "DEIXA PASSAR", e isto é o ponto mais importante da função.
 * Shopify fora do ar, coleção despublicada do canal Storefront, ou qualquer
 * falha de rede → `getProducts()` devolve `[]` ou lança. Se lista vazia
 * significasse "nada tem página", uma instabilidade da Shopify 404-aria as 7
 * PDPs de uma vez: trocaríamos duas páginas vazando por A LOJA INTEIRA fora do
 * ar. Só bloqueia quando a lista veio PREENCHIDA e o handle não está nela.
 *
 * ⚠️ CUSTO REAL, MEDIDO — não presuma dedup. `storefrontFetch` faz POST sem
 * `force-cache`, e desde o Next 15 o `fetch` não cacheia por default: o
 * `next: { revalidate }` deste client é INERTE (ver o bloco de cache no topo de
 * `client.ts`). Ou seja, NÃO há Data Cache compartilhado entre o catálogo, o
 * sitemap e esta guarda.
 *
 * Medido em build limpo (31/07/2026), contando acessos reais à rede:
 *   sem a guarda → 3 × PRODUCTS_QUERY   (generateStaticParams, sitemap, catálogo)
 *   com a guarda → 10 × PRODUCTS_QUERY  (+1 por PDP renderizada)
 *
 * O que segura o custo NÃO é cache de fetch, é o ISR do route segment
 * (`export const revalidate = 300` na PDP): a página é servida do HTML
 * pré-renderizado e só re-renderiza a cada 5 min. Então é +1 requisição por
 * revalidação de PDP, não por visita — teto de 7 a cada 300s no catálogo atual.
 */
export async function handleTemPagina(handle: string): Promise<boolean> {
  let vendaveis
  try {
    vendaveis = await getProducts()
  } catch {
    // Falha de rede/Shopify: não é papel desta guarda derrubar a página.
    return true
  }
  // Lista vazia = não sabemos nada, e "não sei" nunca vira 404.
  if (vendaveis.length === 0) return true
  return vendaveis.some((p) => p.handle === handle)
}
