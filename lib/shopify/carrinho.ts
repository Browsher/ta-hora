import "server-only"

import { storefrontFetch } from "./client"
import { PRODUTO_PARA_CARRINHO_QUERY } from "./queries"
import {
  CARRINHO_QUERY,
  CRIAR_CARRINHO_MUTATION,
  ADICIONAR_LINHAS_MUTATION,
  ATUALIZAR_LINHAS_MUTATION,
  REMOVER_LINHAS_MUTATION,
  DEFINIR_CUPONS_MUTATION,
} from "./queriesCarrinho"
import {
  normalizeCarrinho,
  traduzirAvisos,
  cuponsNaoAplicaveis,
  type RawCarrinho,
  type RawWarning,
  type RawUserError,
} from "./normalizeCarrinho"
import type { ResultadoCarrinho } from "./types"

// Única camada que fala GraphQL de carrinho. `server-only`: o build FALHA se um
// componente de cliente importar isto — o token nunca entra no bundle.
//
// Nenhuma versão de API aqui: `storefrontFetch` resolve
// `SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION` (Req 10.4).
//
// TODA chamada usa `{ semCache: true }` — carrinho jamais é cacheado (Req 8.4).
// Ver o comentário de cache em client.ts antes de mexer nisso.
//
// Esta camada NÃO conhece cookie nem `"use server"`: ela recebe o `cartId` e
// devolve dados. Quem lê/grava o cookie é o Bloco 3 (`lib/carrinho/acoes.ts`).

// ─── Formas das respostas ─────────────────────────────────────────────────────

interface RespostaDeMutation {
  cart:       RawCarrinho | null
  userErrors: RawUserError[]
  warnings:   RawWarning[]
}

/** Toda mutation devolve o payload sob a própria chave — normalizado aqui. */
type EnvelopeDeMutation<K extends string> = Record<K, RespostaDeMutation>

interface RespostaDeVariante {
  product: {
    id:     string
    handle: string
    title:  string
    variants: {
      nodes: {
        id:                string
        title:             string
        availableForSale:  boolean
        quantityAvailable: number | null
      }[]
    }
  } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEM_CARRINHO: ResultadoCarrinho = { carrinho: null, aviso: null, erro: null }

/**
 * Payload cru → `ResultadoCarrinho`.
 *
 * A ordem importa: `userErrors` primeiro (falha de verdade), depois `warnings`
 * (a limitação SILENCIOSA de estoque, que chega com `userErrors` vazio).
 */
function paraResultado(payload: RespostaDeMutation): ResultadoCarrinho {
  const erro = payload.userErrors?.[0]?.message ?? null

  return {
    carrinho: payload.cart ? normalizeCarrinho(payload.cart) : null,
    aviso:    traduzirAvisos(payload.warnings),
    // `userErrors` vem em inglês, da Shopify. Não repassamos a string crua ao
    // cliente; quem traduz para mensagem amigável é a action (Bloco 3, tarefa
    // 14). Aqui só sinalizamos QUE houve erro.
    erro:     erro ? "erro-da-shopify" : null,
  }
}

/** Executa uma mutation de carrinho e normaliza o envelope. */
async function executarMutation<K extends string>(
  documento: string,
  chave:     K,
  variables: Record<string, unknown>,
): Promise<ResultadoCarrinho> {
  const data = await storefrontFetch<EnvelopeDeMutation<K>>(
    documento,
    variables,
    { semCache: true },
  )
  return paraResultado(data[chave])
}

// ─── Operações (tarefa 8) ─────────────────────────────────────────────────────

/**
 * Lê um carrinho pelo ID.
 *
 * `cart: null` (inexistente, expirado ou já finalizado em checkout) NÃO é erro:
 * é o único sinal disponível — a 2026-01 não expõe flag de "carrinho concluído".
 * A action descarta o cookie e trata como vazio, sem mostrar erro (Req 2.3/2.6).
 */
export async function lerCarrinhoPorId(cartId: string): Promise<ResultadoCarrinho> {
  const data = await storefrontFetch<{ cart: RawCarrinho | null }>(
    CARRINHO_QUERY,
    { id: cartId },
    { semCache: true },
  )
  if (!data.cart) return SEM_CARRINHO
  return { carrinho: normalizeCarrinho(data.cart), aviso: null, erro: null }
}

/**
 * Cria o carrinho JÁ COM as linhas — UMA mutation (Req 1.2), nunca `cartCreate`
 * seguido de `cartLinesAdd`.
 *
 * Devolve o `id` CRU junto do resultado: a action precisa dele para gravar o
 * cookie, mas ele não entra no tipo `Carrinho` e não cruza a fronteira para o
 * cliente. Este retorno é interno da camada `server-only`.
 */
export async function criarCarrinhoCom(
  merchandiseId: string,
  quantidade = 1,
): Promise<{ id: string | null; resultado: ResultadoCarrinho }> {
  const data = await storefrontFetch<EnvelopeDeMutation<"cartCreate">>(
    CRIAR_CARRINHO_MUTATION,
    { lines: [{ merchandiseId, quantity: quantidade }] },
    { semCache: true },
  )
  const payload = data.cartCreate
  return { id: payload.cart?.id ?? null, resultado: paraResultado(payload) }
}

export async function adicionarLinhas(
  cartId:        string,
  merchandiseId: string,
  quantidade = 1,
): Promise<ResultadoCarrinho> {
  return executarMutation(ADICIONAR_LINHAS_MUTATION, "cartLinesAdd", {
    cartId,
    lines: [{ merchandiseId, quantity: quantidade }],
  })
}

export async function atualizarLinhas(
  cartId:     string,
  lineId:     string,
  quantidade: number,
): Promise<ResultadoCarrinho> {
  return executarMutation(ATUALIZAR_LINHAS_MUTATION, "cartLinesUpdate", {
    cartId,
    lines: [{ id: lineId, quantity: quantidade }],
  })
}

export async function removerLinhas(cartId: string, lineId: string): Promise<ResultadoCarrinho> {
  return executarMutation(REMOVER_LINHAS_MUTATION, "cartLinesRemove", {
    cartId,
    lineIds: [lineId],
  })
}

/**
 * Define a lista COMPLETA de cupons — a mutation SUBSTITUI, não faz merge.
 * Lista vazia = `[]`, nunca `null` (o argumento é `[String!]!`).
 *
 * Devolve também os códigos que a Shopify marcou como NÃO aplicáveis, para a
 * action purgar o carrinho (Bloco 3, tarefa 13) — a Shopify aceita um cupom
 * inválido e o DEIXA no carrinho com `applicable: false`.
 */
export async function definirCupons(
  cartId:  string,
  codigos: string[],
): Promise<{ resultado: ResultadoCarrinho; naoAplicaveis: string[] }> {
  const data = await storefrontFetch<EnvelopeDeMutation<"cartDiscountCodesUpdate">>(
    DEFINIR_CUPONS_MUTATION,
    { cartId, discountCodes: codigos },
    { semCache: true },
  )
  const payload = data.cartDiscountCodesUpdate
  return {
    resultado:     paraResultado(payload),
    naoAplicaveis: payload.cart ? cuponsNaoAplicaveis(payload.cart) : [],
  }
}

// ─── Resolução de variante (tarefa 9) ─────────────────────────────────────────

/** O que o servidor descobriu sobre o produto — o cliente nunca vê isto. */
export interface VarianteParaCarrinho {
  /** `merchandiseId` da variante escolhida. `null` = nada comprável. */
  merchandiseId: string | null
  /** Quantas variantes o produto tem (para a salvaguarda do Req 1.8). */
  totalVariantes: number
  /** `false` quando o produto existe mas nenhuma variante está disponível. */
  disponivel: boolean
  /** `true` quando o handle não existe na loja. */
  inexistente: boolean
}

/**
 * Resolve o `merchandiseId` a partir do handle — no SERVIDOR.
 *
 * É uma decisão de segurança, não conveniência: o cliente manda `handle`, nunca
 * `merchandiseId`. Assim ele não pode injetar a variante de outro produto (ou
 * de um despublicado).
 *
 * Escolhe a PRIMEIRA VARIANTE DISPONÍVEL, não a primeira (Req 1.7): se a
 * primeira estiver esgotada e a segunda disponível, vender a segunda é o
 * comportamento correto.
 *
 * `totalVariantes` conta VARIANTES, jamais `options`: hoje os produtos têm 1
 * variante mas mantêm a opção `Cor` com um valor único — checar `options` daria
 * falso positivo imediato (Req 1.8).
 */
export async function buscarVarianteParaCarrinho(
  handle: string,
): Promise<VarianteParaCarrinho> {
  const data = await storefrontFetch<RespostaDeVariante>(
    PRODUTO_PARA_CARRINHO_QUERY,
    { handle },
    // Sem cache também aqui: é dado de catálogo (seria cacheável), mas cachear
    // traria `availableForSale` velho JUSTO no momento da compra. 1 round-trip
    // extra é melhor que vender item esgotado (NFR Performance, exceção declarada).
    { semCache: true },
  )

  if (!data.product) {
    return { merchandiseId: null, totalVariantes: 0, disponivel: false, inexistente: true }
  }

  const variantes = data.product.variants.nodes
  const escolhida = variantes.find((v) => v.availableForSale) ?? null

  return {
    merchandiseId:  escolhida?.id ?? null,
    totalVariantes: variantes.length,
    disponivel:     escolhida !== null,
    inexistente:    false,
  }
}
