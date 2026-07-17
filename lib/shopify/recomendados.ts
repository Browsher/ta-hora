import "server-only"

import { storefrontFetch } from "./client"
import { RECOMENDADOS_QUERY } from "./queries"
import { MARCAS } from "./tags"
import { normalizeProductCard, type RawProductCard } from "./normalize"
import type { ProductCard } from "./types"

// Única camada que busca os recomendados da seção "Você também pode gostar".
// `server-only`: o build FALHA se um componente de cliente importar isto — o
// token nunca entra no bundle. Só a página de produto (Server Component) importa.
//
// Nenhuma versão de API aqui: `storefrontFetch` resolve
// `SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION`.

/** Teto da Storefront API — `first: 251` responde "first cannot exceed 250". */
const TETO_DA_API = 250

/** Máximo exibido na seção. Acima disto vira carrossel (fora de escopo hoje). */
const MAX_RECOMENDADOS = 4

/** A resposta crua: `RawProductCard` + o campo que só serve para filtrar. */
interface RawRecomendado extends RawProductCard {
  availableForSale: boolean
}

/**
 * Até 4 OUTRAS câmeras da mesma marca, disponíveis para venda.
 *
 * `marca` é tipada como elemento de `MARCAS` (`"eseecloud" | "icsee"`) — trava no
 * compilador que ninguém passe grafia arbitrária. A string de busca é montada
 * AQUI, no servidor, a partir dela; o cliente nunca escolhe a busca.
 *
 * **Pode lançar** (rede/Shopify fora): quem degrada para "sem seção" é a página
 * (`try/catch` → `[]`). Um extra comercial não pode derrubar a página que vende.
 */
export async function buscarRecomendados(
  marca: (typeof MARCAS)[number],
  handleAtual: string,
): Promise<ProductCard[]> {
  const data = await storefrontFetch<{ products: { nodes: RawRecomendado[] } }>(
    RECOMENDADOS_QUERY,
    { query: `tag:${marca}`, first: TETO_DA_API },
    // { revalidate: 300 }, NUNCA semCache/force-cache: esta busca roda no render
    // da página, cujo `export const revalidate = 300` já captura o resultado no
    // snapshot do ISR. O cache "leve" é o da PÁGINA, não do fetch (que, sendo
    // POST, nem cacheia — ver client.ts). Bater com o `getProductByHandle` ao lado.
    { revalidate: 300 },
  )

  return data.products.nodes
    // Ordem DELIBERADA: filtra disponível → exclui o atual → corta em 4.
    // 1) Nunca recomendar o que não se pode comprar.
    .filter((p) => p.availableForSale)
    // 2) Excluir o próprio produto ANTES de cortar — senão poderiam sair 3
    //    outras + ele mesmo. `handle` é o identificador estável da rota.
    .filter((p) => p.handle !== handleAtual)
    // 3) Cortar no máximo. A ordem é a devolvida pela API (sem curadoria própria).
    .slice(0, MAX_RECOMENDADOS)
    // `normalizeProductCard` ignora `availableForSale`: critério do servidor, não
    // dado de exibição. Preço já formatado em pt-BR sai daqui.
    .map(normalizeProductCard)
}
