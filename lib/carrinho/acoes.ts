"use server"

import {
  lerCarrinhoPorId,
  criarCarrinhoCom,
  adicionarLinhas,
  atualizarLinhas,
  removerLinhas,
  definirCupons,
  atualizarAtributos,
  buscarVarianteParaCarrinho,
  ERRO_DA_SHOPIFY,
} from "@/lib/shopify/carrinho"
import { buscarAcessoriosPorTag } from "@/lib/shopify/acessorios"
import {
  lerIdDoCarrinho,
  gravarIdDoCarrinho,
  descartarIdDoCarrinho,
} from "./cookie"
import { lerRefDeAfiliado } from "@/lib/afiliados/cookie"
import { CHAVE_ATRIBUTO } from "@/lib/afiliados/ref"
import type { ResultadoCarrinho, ProductCard } from "@/lib/shopify/types"

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

// ─── Rastreamento de afiliados (spec rastreamento-afiliados) ─────────────────
//
// O carimbo `afiliado_ref` no carrinho, para o pedido chegar ao webhook do
// sistema de afiliados com a atribuição. Três princípios governam tudo abaixo:
//
//   1. SEM COOKIE, NADA MUDA. Sem ref válido não há mutation extra, não há
//      round-trip extra e o comportamento é byte a byte o de antes da feature.
//   2. O CARIMBO NUNCA ATRAPALHA A VENDA. Toda falha de rastreamento é
//      silenciosa e devolve o carrinho que existiria sem ele. O pior caso
//      aceito é "venda sem crédito"; "venda perdida" é inaceitável.
//   3. IDEMPOTÊNCIA DE GRAÇA. O fragmento traz `attributes`, então saber o ref
//      atual não custa rede: só carimbamos quando DIVERGE.

/**
 * Garante que o carrinho carregue o ref do cookie — e devolve o carrinho que o
 * cliente deve ver.
 *
 * `afiliadoRefAtual` é o que a operação anterior JÁ leu do carrinho (vem junto
 * do resultado, sem round-trip). `resultado` é o que devolvemos se não houver
 * nada a fazer — ou se o carimbo falhar.
 *
 * ⚠️⚠️ POR QUE `try/catch` AQUI NÃO BASTA — leia antes de "simplificar".
 *
 * `atualizarAtributos` roda sobre `executarMutation`, que **NÃO LANÇA** quando a
 * Shopify devolve `userErrors`: ele devolve um `ResultadoCarrinho` com
 * `erro: ERRO_DA_SHOPIFY` e, possivelmente, `carrinho: null`. Um `catch` nunca
 * veria isso. E como esta função roda dentro do `lerCarrinho()`, que o
 * `CarrinhoProvider` dispara no mount de TODA página:
 *
 *   • propagar aquele `erro` faria o `comTratamentoDeErro` traduzi-lo para
 *     "Não foi possível atualizar seu carrinho" — no site inteiro, para todo
 *     visitante com cookie de afiliado;
 *   • propagar aquele `carrinho: null` ESVAZIARIA o drawer de quem tem itens.
 *
 * Por isso a regra é de ACEITE, não de exceção: só usamos a resposta do carimbo
 * quando ela é inequivocamente boa (`erro === null && carrinho !== null`).
 * Qualquer outra coisa — erro, userError, carrinho nulo ou exceção — devolve o
 * `resultado` original INTACTO. O `try/catch` existe por cima disso, para a
 * rede caindo; ele não substitui a checagem.
 */
async function recarimbar(
  cartId:           string,
  resultado:        ResultadoCarrinho,
  afiliadoRefAtual: string | null,
): Promise<ResultadoCarrinho> {
  try {
    const ref = await lerRefDeAfiliado()

    // Sem ref (visitante orgânico, cookie expirado ou valor adulterado): nada a
    // fazer, e nenhuma chamada à Shopify (princípio 1).
    if (!ref) return resultado

    // Já carimbado com o mesmo valor: nada a fazer (princípio 3).
    if (ref === afiliadoRefAtual) return resultado

    // Cookie ausente + carrinho carimbado NÃO cai aqui (sai no `!ref` acima), e
    // isso é deliberado: nunca REMOVEMOS um carimbo. Ele valeu na janela em que
    // aconteceu; um cookie que expirou depois não descredita a atribuição.
    const carimbado = await atualizarAtributos(cartId, [
      // Só `afiliado_ref`. NÃO adicionar `afiliado_ref_ts`: o webhook o ignora
      // (Req 3.9), e a mutation SUBSTITUI a lista inteira de attributes.
      { key: CHAVE_ATRIBUTO, value: ref },
    ])

    // A CHECAGEM DE ACEITE — ver o aviso grande acima. Não relaxe para
    // `carimbado.carrinho ?? resultado.carrinho`: um `erro` não-nulo ainda
    // subiria.
    if (carimbado.erro === null && carimbado.carrinho !== null) {
      // ⚠️ SÓ O CARRINHO vem do carimbo. `aviso` e `erro` são SEMPRE os da
      // operação original — é a MESMA armadilha da purga do cupom, algumas
      // funções abaixo: a 2ª mutation responde `aviso: null`, e propagá-la
      // inteira APAGARIA a mensagem que o cliente ainda não leu.
      //
      // Concreto: cliente pede 99 unidades, a Shopify limita ao estoque e avisa
      // "Ajustamos a quantidade ao estoque disponível" — e o recarimbo, rodando
      // logo em seguida, engoliria esse aviso. O número na tela mudaria sozinho,
      // sem explicação. Um `erro` do `cartLinesAdd` sumiria do mesmo jeito.
      return {
        carrinho: carimbado.carrinho,
        aviso:    resultado.aviso,
        erro:     resultado.erro,
      }
    }

    return resultado
  } catch {
    // Rede caindo, env ausente, o que for. Deliberadamente sem `console.error`:
    // a mensagem de `storefrontFetch` inclui o endpoint, e isto rodaria a cada
    // carga de página.
    return resultado
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
    const { resultado, afiliadoRef } = await lerCarrinhoPorId(cartId)
    // `cart: null` = expirado/inexistente/finalizado. Autocorrige para vazio,
    // sem erro ao cliente (Req 2.3/2.6).
    if (!resultado.carrinho) {
      await descartarIdDoCarrinho()
      return VAZIO
    }

    // ⚠️ ESTE É O PONTO DE SINCRONIZAÇÃO DO REF — e ele mora numa função de
    // LEITURA de propósito. O motivo é estrutural: o `CarrinhoProvider` dispara
    // `lerCarrinho()` no mount de TODA página, e chegar por um link de afiliado
    // é sempre uma navegação completa (o proxy redireciona). Então o cookie já
    // existe quando a página monta, e o recarimbo acontece ANTES de qualquer
    // clique — inclusive no cenário "cliente já tinha carrinho, chega com ref
    // novo e vai direto ao checkout sem adicionar nada" (Req 3.8), que nenhum
    // gancho no `adicionarItem` alcançaria. Não existe caminho até o botão de
    // finalizar que não passe por um mount.
    return recarimbar(cartId, resultado, afiliadoRef)
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

    const { resultado, afiliadoRef } = await adicionarLinhas(
      cartId,
      variante.merchandiseId,
    )

    // Carrinho expirado/finalizado no meio do caminho: descarta e recria, SEM
    // erro para o cliente — ele só queria comprar (Req 2.3/2.6).
    //
    // Não precisa de recarimbo: a recriação passa pelo `criarEGravar`, que já
    // nasce carimbado.
    if (!resultado.carrinho && !resultado.erro) {
      await descartarIdDoCarrinho()
      return criarEGravar(variante.merchandiseId)
    }

    // Cinto-e-suspensório: a fonte principal do carimbo em carrinho existente é
    // o `lerCarrinho()` acima, que roda no mount. Este aqui cobre o caso raro de
    // aquele repair ter falhado por rede. Custa ZERO quando já está
    // sincronizado — o `afiliadoRef` veio junto da resposta do `cartLinesAdd`.
    return recarimbar(cartId, resultado, afiliadoRef)
  })
}

/**
 * Cria o carrinho e grava o cookie. O `id` não sai daqui.
 *
 * É o funil dos DOIS caminhos de criação: carrinho novo e recriação silenciosa
 * de um carrinho expirado/finalizado. Por isso o carimbo mora aqui — cobre os
 * dois de uma vez.
 */
async function criarEGravar(merchandiseId: string): Promise<ResultadoCarrinho> {
  // `lerRefDeAfiliado` já valida o cookie (`^[A-Z0-9]{8}$`): um valor forjado
  // vira `null` e nunca chega à Shopify.
  const ref = await lerRefDeAfiliado().catch(() => null)

  if (ref) {
    const comCarimbo = await criarCarrinhoCom(merchandiseId, 1, [
      // Só `afiliado_ref` — sem `afiliado_ref_ts` (Req 3.9).
      { key: CHAVE_ATRIBUTO, value: ref },
    ])

    if (comCarimbo.id) {
      await gravarIdDoCarrinho(comCarimbo.id)
      return comCarimbo.resultado
    }

    // A criação COM attributes falhou. RETENTA UMA VEZ SEM ELES (Req 4.2): é
    // melhor um carrinho sem crédito que nenhum carrinho. O read-repair do
    // `lerCarrinho()` tenta carimbar de novo na próxima carga de página.
    //
    // Trade honesto: este retry também dispara em falhas alheias ao attribute
    // (produto indisponível, rede), gastando 1 round-trip num caminho já raro.
    // Aceito — a alternativa seria diagnosticar a causa do erro para decidir, e
    // errar esse diagnóstico custaria a venda.
  }

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
  const { resultado } = await lerCarrinhoPorId(cartId)
  return resultado.carrinho?.cupons.map((c) => c.codigo) ?? []
}

// ─── Acessórios sugeridos (tarefa 9) ──────────────────────────────────────────

/**
 * Os acessórios da loja, disponíveis para venda.
 *
 * **SEM ARGUMENTOS, de propósito.** É a garantia — na assinatura — de que o
 * cliente não escolhe tag, query, endpoint nem versão de API. A tag vem de
 * `lib/shopify/tags.ts` e a busca é montada no servidor. Um parâmetro `tag`
 * aqui transformaria a fronteira fechada num proxy de busca.
 *
 * **NUNCA lança: falha vira `[]`.** Sem carrinho, sem env, Shopify fora, rede
 * caindo — tudo devolve lista vazia, e o cliente simplesmente não vê a seção. A
 * sugestão é um extra comercial; ela não pode derrubar a compra, que é o caminho
 * da receita. Mesmo princípio do `lerCarrinho()` acima.
 *
 * **Não lê o cookie e não toca o carrinho** — é leitura de catálogo. Mora neste
 * arquivo porque **esta é a fronteira do cliente**: criar um segundo módulo de
 * actions para uma função dividiria a superfície sem ganho nenhum.
 *
 * Quem decide QUANDO chamar é o `CarrinhoProvider`: só quando há uma câmera no
 * carrinho, e uma vez por carga de página. Ele consegue saber disso sem rede
 * porque o fragmento do carrinho traz `tags` na linha.
 */
export async function buscarAcessorios(): Promise<ProductCard[]> {
  try {
    return await buscarAcessoriosPorTag()
  } catch {
    // Deliberadamente sem `console.error(e)`: a mensagem de `storefrontFetch`
    // inclui o endpoint. Nada daqui vai para o cliente nem para o log.
    return []
  }
}
