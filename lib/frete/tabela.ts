// Tabela de frete da loja: zona → opções (nome, prazo, valor).
//
// ─── ⚠️ EXCEÇÃO DECLARADA à regra de `lib/shopify/types.ts:151` ───────────────
//
// A regra é "TODO DINHEIRO VEM DA SHOPIFY, e a UI NUNCA faz aritmética com ele.
// O valor exibido não pode divergir do cobrado". Aqui há dinheiro escrito no
// código. É a segunda exceção do projeto (a primeira é `lib/parcelamento.ts`), e
// ela é MAIS ARRISCADA que a primeira — a parcela é derivada de um preço que
// vem da Shopify, enquanto isto aqui é uma cópia manual de um dado que mora lá.
//
// Nenhuma aritmética acontece neste arquivo: os valores são transcritos, não
// calculados. O que existe é o risco de CÓPIA DESATUALIZADA, tratado abaixo.
//
// ─── 🔴 RISCO CONHECIDO E ACEITO: O PRAZO NÃO TEM TRAVA AUTOMÁTICA ────────────
//
// Decisão do lojista em 10/08/2026, com o risco declarado por ele.
//
//   VALOR  → protegido. `npm run verificar:frete` sonda a Shopify de verdade e
//            falha se qualquer valor daqui divergir do que a loja cobra.
//   PRAZO  → DESPROTEGIDO. Nada verifica. Se o prazo mudar na Shopify e ninguém
//            editar este arquivo, a PDP anuncia um prazo que a loja não cumpre,
//            indefinidamente e em silêncio.
//
// Por que não há trava: o prazo NÃO EXISTE na Storefront API. `CartDeliveryOption`
// tem só code, deliveryMethodType, description, estimatedCost, handle e title —
// medido em 10/08/2026, e `description` volta vazio em tarifa manual. A única
// forma de trazer o prazo da Shopify seria escrevê-lo no NOME da tarifa
// ("Expresso (1 a 3 dias úteis)") e ler o `title`. Foi avaliado e RECUSADO pelo
// lojista: a Shopify já mostra o prazo por baixo do nome no checkout, e o nome
// repetiria a informação bem na hora do pagamento.
//
// 🔴 PORTANTO: MUDOU PRAZO NO ADMIN DA SHOPIFY? EDITE ESTE ARQUIVO NA MESMA HORA.
// Não existe segunda chance — nenhum teste, nenhum build e nenhum check vai
// lembrar você. É o único dado do site nessa condição.

import type { UF } from "./faixas"

/** As 6 zonas de frete configuradas na Shopify. */
export type Zona = "SP" | "SUDESTE" | "SUL" | "CENTRO_OESTE" | "NORDESTE" | "NORTE"

export interface OpcaoFrete {
  /**
   * Como o cliente lê — não o nome interno da tarifa na Shopify (lá é
   * "FRETE EXPRESSO"/"FRETE COMUM", em caixa alta).
   *
   * 🔴 UNIÃO FECHADA, e de propósito: a `CalculadoraFrete` escolhe ícone e cor
   * a partir deste campo, com `switch` exaustivo. Uma terceira modalidade não
   * compila até alguém decidir COMO ela aparece na tela — que é melhor do que
   * nascer sem ícone, ou com o ícone do vizinho por causa de um `else`.
   */
  nome: "Expresso" | "Comum"
  /** Prazos em DIAS ÚTEIS, inclusive nas duas pontas. */
  prazoMin: number
  prazoMax: number
  /**
   * Valor em BRL. Transcrito do admin da Shopify, conferido pelo carrinho-sonda
   * em 10/08/2026 (6/6 conferem). Nunca calculado.
   */
  valor: number
}

/**
 * UF → zona.
 *
 * 🔴 São Paulo é ZONA PRÓPRIA, e é o estado INTEIRO (faixa 01000–19999), não só
 * a capital — confirmado pelo lojista em 10/08/2026. Alguém que leia "São Paulo"
 * e pense na cidade vai querer restringir a faixa: não restrinja.
 */
const ZONA_DA_UF: Record<UF, Zona> = {
  SP: "SP",

  RJ: "SUDESTE", ES: "SUDESTE", MG: "SUDESTE",

  PR: "SUL", SC: "SUL", RS: "SUL",

  DF: "CENTRO_OESTE", GO: "CENTRO_OESTE", MT: "CENTRO_OESTE", MS: "CENTRO_OESTE",

  BA: "NORDESTE", SE: "NORDESTE", PE: "NORDESTE", AL: "NORDESTE",
  PB: "NORDESTE", RN: "NORDESTE", CE: "NORDESTE", PI: "NORDESTE",
  MA: "NORDESTE",

  PA: "NORTE", AP: "NORTE", AM: "NORTE", RR: "NORTE",
  AC: "NORTE", RO: "NORTE", TO: "NORTE",
}

/**
 * As opções por zona.
 *
 * 🔴 ORDEM = ORDEM DE EXIBIÇÃO, e o expresso vem primeiro por decisão do lojista
 * (10/08/2026). Não reordenar para "mais barato primeiro" sem falar com ele.
 *
 * São Paulo tem UMA opção só, e isso é deliberado: o prazo já é curto e o
 * lojista optou por não oferecer duas. Uma zona com um item não é bug.
 */
const OPCOES_DA_ZONA: Record<Zona, readonly OpcaoFrete[]> = {
  SP: [
    { nome: "Expresso", prazoMin: 1, prazoMax: 3, valor: 14.9 },
  ],
  SUDESTE: [
    { nome: "Expresso", prazoMin: 2, prazoMax: 3, valor: 29.9 },
    { nome: "Comum",    prazoMin: 4, prazoMax: 6, valor: 19.9 },
  ],
  SUL: [
    { nome: "Expresso", prazoMin: 2, prazoMax: 3, valor: 29.9 },
    { nome: "Comum",    prazoMin: 5, prazoMax: 8, valor: 19.9 },
  ],
  CENTRO_OESTE: [
    { nome: "Expresso", prazoMin: 3, prazoMax: 5, valor: 49.9 },
    { nome: "Comum",    prazoMin: 6, prazoMax: 9, valor: 39.9 },
  ],
  NORDESTE: [
    { nome: "Expresso", prazoMin: 4, prazoMax:  6, valor: 59.9 },
    { nome: "Comum",    prazoMin: 9, prazoMax: 12, valor: 49.9 },
  ],
  NORTE: [
    { nome: "Expresso", prazoMin:  6, prazoMax:  9, valor: 59.9 },
    { nome: "Comum",    prazoMin: 16, prazoMax: 20, valor: 49.9 },
  ],
}

/**
 * UF representativa de cada zona — a que o `verificar:frete` usa para sondar.
 *
 * Uma por zona basta porque a Shopify casa a tarifa por PROVÍNCIA e todas as UFs
 * de uma zona caem na mesma tarifa (medido em 10/08/2026: país+CEP sem
 * `provinceCode` devolve ZERO opções, então é a província que decide).
 *
 * ⚠️ Limite honesto: sondar uma UF por zona não pega o caso de alguém, no admin,
 * tirar UMA UF de uma zona (mover só o Piauí para outra). O check continuaria
 * verde. Cobrir isso exigiria 27 sondas — 27 carrinhos por rodada — e o modo de
 * falha realista é "mudei o preço da zona", não "reparticionei o mapa".
 */
export const UF_SONDA: Record<Zona, UF> = {
  SP:           "SP",
  SUDESTE:      "RJ",
  SUL:          "RS",
  CENTRO_OESTE: "GO",
  NORDESTE:     "BA",
  NORTE:        "AM",
}

export function zonaDaUf(uf: UF): Zona {
  return ZONA_DA_UF[uf]
}

/**
 * Opções de uma zona. Devolve `[]` só se a zona ficar sem tarifa — hoje nenhuma
 * fica, mas a UI tem o ramo (ver `consultar.ts`), porque desligar uma tarifa no
 * admin é uma edição de um clique.
 */
export function opcoesDaZona(zona: Zona): readonly OpcaoFrete[] {
  return OPCOES_DA_ZONA[zona] ?? []
}

/** "14,90" — mesmo padrão pt-BR do `formatMoney` de `lib/shopify/normalize.ts`. */
export function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** "1 a 3 dias úteis" / "1 dia útil" quando as pontas coincidem. */
export function textoDoPrazo(o: OpcaoFrete): string {
  if (o.prazoMin === o.prazoMax) {
    return o.prazoMin === 1 ? "1 dia útil" : `${o.prazoMin} dias úteis`
  }
  return `${o.prazoMin} a ${o.prazoMax} dias úteis`
}
