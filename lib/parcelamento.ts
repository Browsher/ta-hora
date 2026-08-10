// Parcelamento do cartão de crédito — fonte ÚNICA da regra e do texto exibido.
//
// Por que este módulo existe: o parcelamento aparece em DOIS lugares da mesma
// página de produto — o `<PriceTag>` no corpo e a `description` da
// `generateMetadata`. Enquanto a meta prometia "até 12x" e o corpo não mostrava
// nada, não havia como divergirem: um dos dois não existia. No instante em que a
// PDP passa a exibir a parcela, passam a existir duas fontes para o mesmo fato —
// e a que ninguém vê na tela (a meta) é a que apodrece primeiro. Ambas chamam
// `parcelamento()`; divergirem passa a exigir editar duas chamadas em sentidos
// opostos.
//
// ⚠️ EXCEÇÃO DECLARADA à regra de `lib/shopify/types.ts:124` — "TODO DINHEIRO VEM
// DA SHOPIFY, e a UI NUNCA faz aritmética com ele. O valor exibido não pode
// divergir do cobrado."
//
// Aquela regra protege o VALOR COBRADO: subtotal, total, preço de linha — tudo o
// que precisa fechar com a fatura, e que por isso vem pronto da Shopify. A
// parcela não é valor cobrado pela Shopify: é a projeção de um plano de cartão
// oferecido pelo Mercado Pago dentro do checkout. Nenhum total é recalculado
// aqui, e este módulo NUNCA exibe `parcelas × valorParcela` (ver "Arredondamento"
// abaixo) — só a parcela isolada.
//
// Fatos confirmados na conta do Mercado Pago em 10/08/2026:
//   - até 3x SEM ACRÉSCIMO para o cliente (o custo de 6,61% é da loja)
//   - até 12x NO TOTAL, e da 4ª em diante QUEM PAGA O ACRÉSCIMO É O CLIENTE
//   - Mercado Pago é o ÚNICO meio de pagamento ativo no checkout
//
// 🔴 A taxa de 6,61% NÃO aparece neste arquivo de propósito. É custo da loja,
// não do comprador — não entra em conta que produza texto exibido. Se um dia
// alguém precisar dela para margem, ela mora em outro lugar, não aqui.
//
// ─── 🔴 NUNCA ESCREVA "12x SEM JUROS" ─────────────────────────────────────────
//
// São DOIS tetos diferentes, e confundi-los é o defeito mais caro que este
// arquivo existe para impedir:
//
//     PARCELAS_MAX        = 3    ← teto SEM JUROS  (a loja absorve os 6,61%)
//     PARCELAS_COM_JUROS  = 12   ← teto TOTAL      (o CLIENTE paga o acréscimo)
//
// Ler os dois lado a lado e "completar" a informação para "12x sem juros" é
// exatamente o erro que já esteve no ar por meses. As 3 primeiras são sem juros
// porque a LOJA paga a taxa; da 4ª em diante o custo é do COMPRADOR, com taxa
// definida pelo Mercado Pago no momento do checkout.
//
// Consequência prática: NENHUM texto deste módulo exibe o VALOR de uma parcela
// acima de 3. Não sabemos a taxa do MP, e não vamos estimá-la — anunciar "12x de
// R$ X" com um X inventado é publicidade enganosa. Acima de 3, só a CONTAGEM
// ("em até 12x"), nunca o valor.

/**
 * Máximo de parcelas **SEM ACRÉSCIMO PARA O CLIENTE** — não é o teto de parcelas
 * da loja (esse é `PARCELAS_COM_JUROS`, abaixo).
 *
 * Confirmado na conta do Mercado Pago em 10/08/2026. Mudar a configuração no
 * painel do MP sem mudar esta constante faz o site prometer o que o checkout não
 * cumpre — foi exatamente assim que o "12x" ficou no ar.
 */
export const PARCELAS_MAX = 3

/**
 * Máximo de parcelas **NO TOTAL**, com juros pagos pelo CLIENTE da 4ª em diante.
 *
 * 🔴 Existe para ser EXIBIDO SÓ COMO CONTAGEM — "em até 12x", nunca "12x de R$ X"
 * e nunca "12x sem juros". Ver o bloco no topo do arquivo antes de usar esta
 * constante em qualquer texto novo.
 *
 * A taxa aplicada acima de 3x é do Mercado Pago, varia, e NÃO é conhecida por
 * este código. Não estime.
 */
export const PARCELAS_COM_JUROS = 12

/**
 * Piso do valor da parcela, em BRL.
 *
 * ⚠️ PREMISSA NÃO VERIFICADA. Veio do operador como "~R$ 5" e não foi confirmada
 * na documentação do Mercado Pago. Está aqui, nomeada e num lugar só, porque o
 * comportamento importa: com o piso, um produto barato oferece menos parcelas em
 * vez de anunciar uma parcela que o checkout recusa.
 *
 * Hoje NENHUM produto do catálogo chega perto — o mais barato é a Camera Lampada
 * (~R$78, que dá 3× de ~R$26). O piso existe para o dia em que um acessório
 * ganhar PDP: o "Cartão de memoria 64GB" e o "Cabo Externor 5 Metros" já existem
 * na Shopify, apenas fora da coleção com página (ver `handleTemPagina`).
 */
export const PARCELA_MINIMA = 5

export interface Parcelamento {
  /** Quantas parcelas SEM JUROS cabem no piso — no máximo `PARCELAS_MAX`. */
  parcelas:     number
  /** Valor de UMA parcela sem juros, já arredondado para cima no centavo. */
  valorParcela: number
  /**
   * Só a cláusula sem juros: `"3x de R$ 61,67 sem juros"`.
   *
   * Use onde o espaço é escasso e a condição completa está a um scroll — hoje, a
   * barra de compra fixa do mobile (`BarraCompraMobile`), onde a coluna do preço
   * tem ~234px em 390px e o texto completo trunca em 320px.
   */
  texto:        string
  /**
   * Rótulo de UI, com os 12x: `"3x de R$ 61,67 sem juros · ou em até 12x"`.
   *
   * O `·` é separador de LISTA VISUAL — em frase corrida ele lê torto; para prosa
   * use `textoProsa`. Hoje alimenta o `<PriceTag>` da PDP.
   */
  textoUI:      string
  /**
   * Mesma informação em prosa: `"3x de R$ 61,67 sem juros (ou em até 12x)"`.
   *
   * Para meta description e qualquer frase corrida, onde o texto entra no meio de
   * uma oração e precisa continuar depois ("… no Ta Hora.").
   */
  textoProsa:   string
}

/**
 * Calcula o parcelamento exibível a partir do preço numérico do produto.
 *
 * ── Arredondamento ────────────────────────────────────────────────────────────
 * `preço ÷ 3` quase nunca fecha em centavos (R$ 185,00 ÷ 3 = 61,6666…), e o
 * Mercado Pago resolve a sobra ajustando UMA das parcelas. Arredondamos para
 * CIMA (`ceil` no centavo), nunca para baixo: R$ 185,00 → exibimos "3x de
 * R$ 61,67", e o MP cobra 61,67 + 61,67 + 61,66.
 *
 * A divergência fica em no máximo 1 centavo e SEMPRE na direção segura — o
 * cliente encontra no checkout o valor exato ou um centavo a menos, nunca a
 * mais. Surpresa para baixo não gera reclamação; para cima, gera reclamação e
 * risco de publicidade enganosa.
 *
 * 🔴 Por isso mesmo, NUNCA exiba `parcelas × valorParcela` como total: daria
 * R$ 185,01 num produto de R$ 185,00. Aí sim seria divergir do valor cobrado, e
 * a exceção declarada no topo deste arquivo não cobriria.
 *
 * ── Piso ──────────────────────────────────────────────────────────────────────
 * Reduz o número de parcelas até a parcela caber em `PARCELA_MINIMA`. R$ 12,00
 * não vira "3x de R$ 4,00": vira "2x de R$ 6,00". Abaixo do piso em 1x, devolve
 * `null` — e a UI simplesmente não renderiza a linha, em vez de mostrar texto
 * quebrado (`installments` do `PriceTag` é opcional; ausente, some).
 *
 * @param preco Preço em BRL como número (ex.: 185). Vem de `Product.precoNumerico`
 *              / `ProductCard.precoNumerico`, NUNCA de desparsear o texto pt-BR
 *              já formatado ("1.799,90").
 * @returns `null` quando não há parcelamento exibível (preço inválido, zero,
 *          negativo, ou abaixo do piso).
 */
export function parcelamento(preco: number): Parcelamento | null {
  if (!Number.isFinite(preco) || preco <= 0) return null

  // Maior número de parcelas (até o máximo) cuja parcela ainda alcança o piso.
  // `floor` aqui e `ceil` no valor não se contradizem: este decide QUANTAS
  // parcelas cabem (pergunta sobre o piso), o outro decide o valor EXIBIDO.
  const parcelas = Math.min(PARCELAS_MAX, Math.floor(preco / PARCELA_MINIMA))
  // `< 2`, não `< 1`: "1x de R$ 9,99 sem juros" repetiria, logo abaixo do preço,
  // o número que o cliente acabou de ler — e "1x sem juros" não é parcelamento,
  // é pagar à vista. Sem parcela real para anunciar, a linha não existe.
  if (parcelas < 2) return null

  // Centavos inteiros, arredondados para cima. O `Math.round` externo remove o
  // ruído de ponto flutuante ANTES do `ceil` — sem ele, 185/3*100 = 6166,6666…7
  // e casos como 0,1+0,2 fazem o `ceil` subir um centavo indevido.
  const valorParcela = Math.ceil(Math.round((preco / parcelas) * 1e4) / 100) / 100

  const semJuros = `${parcelas}x de ${formatarBRL(valorParcela)} sem juros`

  // ⚠️ A cláusula dos 12x é CONDICIONAL — o mesmo piso que corta as parcelas sem
  // juros corta as com juros. Um acessório de R$ 30 comporta 6 parcelas de R$ 5,
  // não 12: anunciar "ou em até 12x" ali seria prometer um plano que o checkout
  // não oferece, que é o defeito que este módulo inteiro existe para impedir.
  //
  // Compara contra o preço À VISTA, não contra o preço com juros. É a direção
  // conservadora: os juros AUMENTAM o valor da parcela, então uma parcela que
  // passa no piso à vista passa com juros também. Estimar o valor com juros exigiria
  // a taxa do MP, que não temos (ver o bloco no topo).
  //
  // Hoje nenhum produto com PDP cai neste ramo — o mais barato é a Camera Lampada
  // (~R$78 → 15 parcelas de R$5 cabem). O ramo existe para o dia em que um
  // acessório ganhar página; ver a mesma nota em `PARCELA_MINIMA`.
  const cabemDozeParcelas = Math.floor(preco / PARCELA_MINIMA) >= PARCELAS_COM_JUROS

  return {
    parcelas,
    valorParcela,
    texto:      semJuros,
    textoUI:    cabemDozeParcelas ? `${semJuros} · ou em até ${PARCELAS_COM_JUROS}x` : semJuros,
    textoProsa: cabemDozeParcelas ? `${semJuros} (ou em até ${PARCELAS_COM_JUROS}x)` : semJuros,
  }
}

/** "R$ 61,67" — mesmo padrão pt-BR do `formatMoney` de `lib/shopify/normalize.ts`. */
function formatarBRL(valor: number): string {
  return `R$ ${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
