import "server-only"

import { storefrontFetch } from "./client"
import { ACESSORIOS_QUERY } from "./queries"
import { TAG_ACESSORIO } from "./tags"
import { normalizeProductCard, type RawProductCard } from "./normalize"
import type { ProductCard } from "./types"

// Única camada que busca acessórios. `server-only`: o build FALHA se um
// componente de cliente importar isto — o token nunca entra no bundle.
//
// Nenhuma versão de API aqui: `storefrontFetch` resolve
// `SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION`.
//
// Esta camada NÃO conhece cookie nem carrinho: é leitura de catálogo. Quem
// decide QUANDO chamar (só com câmera no carrinho) é o cliente, e ele consegue
// porque o fragmento do carrinho traz `tags` na linha.

/** Teto da Storefront API — verificado: `first: 251` responde "first cannot exceed 250". */
const TETO_DA_API = 250

/** A resposta crua: `RawProductCard` + o campo que só serve para filtrar. */
interface RawAcessorio extends RawProductCard {
  availableForSale: boolean
}

/**
 * Produtos com a tag de acessório, disponíveis para venda.
 *
 * A string de busca é montada AQUI, no servidor, a partir da constante — o
 * cliente não escolhe tag, query, endpoint nem versão (a action que expõe isto
 * não tem argumentos).
 */
export async function buscarAcessoriosPorTag(): Promise<ProductCard[]> {
  const data = await storefrontFetch<{ products: { nodes: RawAcessorio[] } }>(
    ACESSORIOS_QUERY,
    { query: `tag:${TAG_ACESSORIO}`, first: TETO_DA_API },
    // Sem cache. É dado de catálogo (seria cacheável em tese), mas o projeto
    // proíbe `force-cache`/`fetchCache` sem exceção — e a exceção "só aqui" é
    // exatamente como uma proibição dessas morre. Quem evita a rebusca é o memo
    // do CarrinhoProvider: uma busca por carga de página, só quando há gatilho.
    { semCache: true },
  )

  return data.products.nodes
    // Filtro em JS, não na string de busca: aqui dá para LER que ele filtra.
    // Nunca sugerir o que não se pode comprar — gasta a atenção do cliente no
    // único momento em que ela vale dinheiro.
    .filter((p) => p.availableForSale)
    // `normalizeProductCard` ignora `availableForSale`: ele é critério do
    // servidor, não dado de exibição. Um acessório indisponível não chega ao
    // cliente, então o campo não teria leitor.
    .map(normalizeProductCard)
}
