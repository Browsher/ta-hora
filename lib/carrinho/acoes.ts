"use server"

import {
  lerCarrinhoPorId,
  criarCarrinhoCom,
  adicionarLinhas,
  atualizarLinhas,
  removerLinhas,
  definirCupons,
  buscarVarianteParaCarrinho,
  ERRO_DA_SHOPIFY,
} from "@/lib/shopify/carrinho"
import {
  lerIdDoCarrinho,
  gravarIdDoCarrinho,
  descartarIdDoCarrinho,
} from "./cookie"
import type { ResultadoCarrinho } from "@/lib/shopify/types"

// A FRONTEIRA cliente/servidor. Esta é a ÚNICA superfície que o cliente toca.
//
// Sem `server-only` de propósito: é justamente o módulo que o cliente importa.
// A proteção aqui não é `server-only`, é a FORMA — o cliente só pode chamar
// estas funções, com estes argumentos. Ele não escolhe query, endpoint, versão
// de API nem `merchandiseId`. Não é um proxy GraphQL genérico.
//
// Ressalva honesta: Server Actions SÃO endpoints HTTP por baixo (POST com action
// id). Elas não são "privadas" — são fechadas em FORMA. O que protege o carrinho
// de terceiros não é a action, é o cookie `httpOnly`: sem ele, uma chamada não
// tem a qual carrinho se referir.
//
// Toda action devolve `ResultadoCarrinho` e NUNCA lança: quem chama é um
// `useEffect` que roda em TODA página com navbar — inclusive a Home estática.
// Uma exceção aqui viraria erro na Home (Req 4.7).

// ─── Mensagens (tarefa 14) ────────────────────────────────────────────────────
//
// NENHUMA mensagem interpola token, endpoint ou string crua da Shopify (Req 8.5).
// `storefrontFetch` lança erros que CONTÊM o endpoint — por isso nada do `catch`
// é repassado ao cliente; ele vira uma mensagem fixa.

const ERRO_GENERICO   = "Não foi possível atualizar seu carrinho. Tente novamente."
const ERRO_INDISPONIVEL = "Produto indisponível no momento."

const VAZIO: ResultadoCarrinho = { carrinho: null, aviso: null, erro: null }

/** Falha amigável — descarta qualquer detalhe técnico da origem. */
const falha = (mensagem = ERRO_GENERICO): ResultadoCarrinho => ({
  carrinho: null,
  aviso:    null,
  erro:     mensagem,
})

/**
 * Envolve uma operação: rede fora, env ausente ou erro da Shopify → falha
 * amigável, com o carrinho anterior intacto do lado da Shopify (Req 1.9, 3.11,
 * 8.6).
 */
async function comTratamentoDeErro(
  operacao: () => Promise<ResultadoCarrinho>,
): Promise<ResultadoCarrinho> {
  try {
    const r = await operacao()
    // Traduz SÓ o sentinela da camada de dados — nunca "qualquer erro não-nulo".
    // As actions têm mensagens próprias e específicas (ex.: ERRO_INDISPONIVEL,
    // Req 1.6); trocar todas por ERRO_GENERICO transformaria um diagnóstico útil
    // em "tente novamente". Foi exatamente esse o bug na 1ª versão desta função.
    return r.erro === ERRO_DA_SHOPIFY ? { ...r, erro: ERRO_GENERICO } : r
  } catch {
    // Deliberadamente sem `console.error(e)`: a mensagem de `storefrontFetch`
    // inclui o endpoint. Nada daqui vai para o cliente nem para o log.
    return falha()
  }
}

// ─── Leitura (tarefa 11) ──────────────────────────────────────────────────────

/**
 * Estado atual do carrinho da sessão.
 *
 * CURTO-CIRCUITA sem cookie: devolve `{ carrinho: null }` SEM tocar a Shopify.
 * Isso importa — como o cookie é `httpOnly`, o cliente não sabe se existe
 * carrinho, então TODA visita à Home chama esta action. Sem o curto-circuito,
 * cada visitante novo geraria uma chamada inútil à Shopify.
 *
 * NUNCA lança: sem cookie, sem env ou Shopify fora → `{ carrinho: null }` e a
 * navbar renderiza sem contador e SEM erro (Req 4.7).
 */
export async function lerCarrinho(): Promise<ResultadoCarrinho> {
  const cartId = await lerIdDoCarrinho()
  if (!cartId) return VAZIO

  return comTratamentoDeErro(async () => {
    const r = await lerCarrinhoPorId(cartId)
    // `cart: null` = expirado/inexistente/finalizado. Autocorrige para vazio,
    // sem erro ao cliente (Req 2.3/2.6).
    if (!r.carrinho) {
      await descartarIdDoCarrinho()
      return VAZIO
    }
    return r
  })
}

// ─── Adicionar (tarefa 11) ────────────────────────────────────────────────────

/**
 * Adiciona 1 unidade do produto ao carrinho.
 *
 * Recebe `handle`, NUNCA `merchandiseId` — decisão de segurança: o servidor
 * resolve a variante, então o cliente não pode injetar a variante de outro
 * produto (ou de um despublicado).
 *
 * Custo: 2 round-trips (resolver variante + mutation). É consequência direta e
 * aceita da decisão acima — ver NFR Performance.
 */
export async function adicionarItem(handle: string): Promise<ResultadoCarrinho> {
  return comTratamentoDeErro(async () => {
    const variante = await buscarVarianteParaCarrinho(handle)

    // Produto inexistente ou sem nenhuma variante comprável (Req 1.6).
    if (!variante.merchandiseId) return falha(ERRO_INDISPONIVEL)

    const cartId = await lerIdDoCarrinho()

    // Sem carrinho → cria JÁ COM a linha: UMA mutation (Req 1.2).
    if (!cartId) return criarEGravar(variante.merchandiseId)

    const r = await adicionarLinhas(cartId, variante.merchandiseId)

    // Carrinho expirado/finalizado no meio do caminho: descarta e recria, SEM
    // erro para o cliente — ele só queria comprar (Req 2.3/2.6).
    if (!r.carrinho && !r.erro) {
      await descartarIdDoCarrinho()
      return criarEGravar(variante.merchandiseId)
    }

    return r
  })
}

/** Cria o carrinho e grava o cookie. O `id` não sai daqui. */
async function criarEGravar(merchandiseId: string): Promise<ResultadoCarrinho> {
  const { id, resultado } = await criarCarrinhoCom(merchandiseId)
  if (id) await gravarIdDoCarrinho(id)
  return resultado
}

// ─── Editar (tarefa 12) ───────────────────────────────────────────────────────

/**
 * Altera a quantidade de uma linha. Quantidade 0 → remove a linha (Req 3.5, o
 * `−` em 1).
 *
 * O `lineId` vem do cliente, mas o `cartId` vem do COOKIE — é isso que impede
 * mexer no carrinho alheio: um `lineId` de outro carrinho simplesmente não
 * pertence a este `cartId` e a mutation falha.
 */
export async function atualizarQuantidade(
  lineId:     string,
  quantidade: number,
): Promise<ResultadoCarrinho> {
  const cartId = await lerIdDoCarrinho()
  if (!cartId) return VAZIO // nada a atualizar; não é erro

  if (quantidade <= 0) return removerLinha(lineId)

  return comTratamentoDeErro(() => atualizarLinhas(cartId, lineId, quantidade))
}

export async function removerLinha(lineId: string): Promise<ResultadoCarrinho> {
  const cartId = await lerIdDoCarrinho()
  if (!cartId) return VAZIO

  return comTratamentoDeErro(() => removerLinhas(cartId, lineId))
}

// ─── Cupom (tarefa 13) ────────────────────────────────────────────────────────

/**
 * Aplica um cupom. A Shopify valida — o site não tem regra nem lista (Req 5.6).
 *
 * A mutation SUBSTITUI a lista inteira, então mandamos `[...atuais, novo]`.
 *
 * ⚠️ A PURGA e o aviso: a Shopify ACEITA um código inválido (`userErrors: []`),
 * avisa `DISCOUNT_NOT_FOUND` e DEIXA o código no carrinho com
 * `applicable: false`. Purgamos reenviando a lista sem ele — e é aqui que mora a
 * armadilha: a 2ª mutation devolve `aviso: null`. Propagar o resultado dela
 * APAGARIA o "Cupom inválido" antes de o cliente ler, quebrando o Req 5.4 em
 * silêncio. Por isso o `aviso` devolvido é SEMPRE o da PRIMEIRA resposta; a
 * segunda contribui só com o carrinho limpo.
 */
export async function aplicarCupom(codigo: string): Promise<ResultadoCarrinho> {
  const cartId = await lerIdDoCarrinho()
  if (!cartId) return falha("Adicione um item ao carrinho antes de aplicar o cupom.")

  const limpo = codigo.trim()
  if (!limpo) return VAZIO

  return comTratamentoDeErro(async () => {
    const atuais = await cuponsAtuais(cartId)
    const desejados = atuais.includes(limpo) ? atuais : [...atuais, limpo]

    const { resultado, naoAplicaveis } = await definirCupons(cartId, desejados)
    if (naoAplicaveis.length === 0) return resultado

    // Purga — mantendo o aviso da PRIMEIRA resposta (ver o comentário acima).
    const purgados = desejados.filter((c) => !naoAplicaveis.includes(c))
    const { resultado: aposPurga } = await definirCupons(cartId, purgados)

    return {
      carrinho: aposPurga.carrinho,
      aviso:    resultado.aviso ?? "Cupom inválido.",
      erro:     null,
    }
  })
}

export async function removerCupom(codigo: string): Promise<ResultadoCarrinho> {
  const cartId = await lerIdDoCarrinho()
  if (!cartId) return VAZIO

  return comTratamentoDeErro(async () => {
    const atuais = await cuponsAtuais(cartId)
    // Lista vazia é `[]`, NUNCA `null` (o argumento é `[String!]!`).
    const { resultado } = await definirCupons(
      cartId,
      atuais.filter((c) => c !== codigo),
    )
    return resultado
  })
}

/** Cupons aplicáveis hoje — a mutation substitui a lista, então precisa deles. */
async function cuponsAtuais(cartId: string): Promise<string[]> {
  const r = await lerCarrinhoPorId(cartId)
  return r.carrinho?.cupons.map((c) => c.codigo) ?? []
}
