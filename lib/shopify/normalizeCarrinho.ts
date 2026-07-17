import { formatMoney } from "./normalize"
import type {
  Money,
  ProductImage,
  Carrinho,
  LinhaCarrinho,
  CupomAplicado,
  DescontoAplicado,
} from "./types"

// Normalização do carrinho: resposta crua da Shopify → tipos do domínio.
//
// Sem `server-only`: aqui não há token nem fetch, só transformação de dados.
// (Quem toca o token é client.ts/carrinho.ts, e esses têm `server-only`.)
//
// REGRA QUE ATRAVESSA O ARQUIVO: dinheiro NUNCA é calculado aqui. Todo valor sai
// de um campo que a Shopify já devolveu pronto. Nada de dividir, multiplicar ou
// somar — a UI não pode divergir do valor cobrado no checkout.

// ─── Tipos crus da resposta GraphQL ───────────────────────────────────────────

interface RawImagemCarrinho {
  url:     string
  altText: string | null
  width:   number | null
  height:  number | null
}

interface RawVariante {
  id:                string
  title:             string
  availableForSale:  boolean
  /** `null` quando falta o scope de inventário — ver Req 10.7. */
  quantityAvailable: number | null
  image:             RawImagemCarrinho | null
  /** `tags` é `[String!]!` no schema — nunca null quando `product` é selecionado. */
  product:           { title: string; handle: string; tags: string[] }
}

interface RawAlocacaoDeDesconto {
  discountedAmount: Money
  /** Presente em `CartCodeDiscountAllocation` (cupom com código). */
  code?:  string
  /** Presente em `CartAutomaticDiscountAllocation` (desconto automático). */
  title?: string
}

interface RawLinha {
  id:       string
  quantity: number
  cost: {
    amountPerQuantity: Money
    /** BRUTO da linha, antes dos descontos. */
    subtotalAmount:    Money
    totalAmount:       Money
  }
  discountAllocations: RawAlocacaoDeDesconto[]
  /**
   * `merchandise` é interface. Com só `... on ProductVariant` selecionado, um
   * merchandise de outro tipo chega como objeto vazio — daí o `Partial`.
   */
  merchandise: Partial<RawVariante>
}

interface RawCupom {
  code:       string
  applicable: boolean
}

export interface RawCarrinho {
  id:            string
  checkoutUrl:   string
  totalQuantity: number
  cost: {
    subtotalAmount: Money
    totalAmount:    Money
  }
  discountCodes: RawCupom[]
  lines:         { nodes: RawLinha[] }
}

/** Um aviso de mutation (a Shopify sinaliza limite de estoque SÓ por aqui). */
export interface RawWarning {
  code:    string
  message: string
  target:  string | null
}

/** Um erro de mutation (`userErrors`). */
export interface RawUserError {
  field:   string[] | null
  message: string
  code:    string | null
}

// ─── Tradução de `warnings` para pt-BR (tarefa 7) ─────────────────────────────
//
// O cliente NUNCA vê o código cru nem a `message` da Shopify: ela vem em inglês
// ("Only 50 items were added to your cart due to availability.") e o site é pt-BR.

const MENSAGEM_DE_AVISO: Record<string, string> = {
  MERCHANDISE_NOT_ENOUGH_STOCK: "Ajustamos a quantidade ao estoque disponível.",
  DISCOUNT_NOT_FOUND:           "Cupom inválido.",
  DISCOUNT_CODE_APPLIED_TO_ORDER:
    "Este cupom se aplica ao pedido inteiro e será calculado no checkout.",
}

/** Fallback: código desconhecido vira mensagem genérica — nunca a string crua. */
const AVISO_GENERICO = "Ajustamos seu carrinho. Confira os itens e o total."

/**
 * Traduz o primeiro aviso relevante para pt-BR. `null` quando não há avisos.
 *
 * Por que isto existe: a Shopify limita quantidade em SILÊNCIO — `userErrors`
 * vem VAZIO e o único sinal é `warnings`. Sem esta tradução o cliente clica `+`
 * e o número trava sem explicação (Req 1.5, 3.12).
 */
export function traduzirAvisos(warnings: RawWarning[] | null | undefined): string | null {
  if (!warnings || warnings.length === 0) return null
  const primeiro = warnings[0]
  return MENSAGEM_DE_AVISO[primeiro.code] ?? AVISO_GENERICO
}

// ─── Normalizadores ───────────────────────────────────────────────────────────

function normalizeImagemCarrinho(img: RawImagemCarrinho | null | undefined): ProductImage | null {
  if (!img) return null
  return { url: img.url, altText: img.altText, width: img.width, height: img.height }
}

function normalizeLinha(raw: RawLinha): LinhaCarrinho {
  const v = raw.merchandise

  return {
    id:            raw.id,
    quantidade:    raw.quantity,
    disponivel:    v.availableForSale ?? false,
    estoqueMaximo: v.quantityAvailable ?? null,
    titulo:        v.product?.title ?? "Produto",
    handle:        v.product?.handle ?? "",
    // `?? []` é a ÚNICA guarda do gatilho: o provider faz
    // `l.tags.includes(TAG_CAMERA)`, e `undefined.includes()` derrubaria o
    // drawer inteiro. `merchandise` é `Partial<RawVariante>` porque só
    // selecionamos `... on ProductVariant` — se um dia vier outro tipo de
    // merchandise, `product` (e `tags`) somem. Esta linha é o que segura isso.
    tags:          v.product?.tags ?? [],
    imagem:        normalizeImagemCarrinho(v.image),
    // Preço unitário VEM da Shopify (`amountPerQuantity`). Jamais
    // `totalAmount / quantidade` — ver a regra no topo do arquivo.
    precoUnitario: formatMoney(raw.cost.amountPerQuantity),
    precoTotal:    formatMoney(raw.cost.totalAmount),
    // LISTA, deliberadamente não somada: colapsar num total seria aritmética
    // local. Se um dia for preciso um total de desconto, ele vem da Shopify.
    descontos:     raw.discountAllocations.map((d) => formatMoney(d.discountedAmount)),
  }
}

// ─── Agregação de descontos ───────────────────────────────────────────────────
//
// ⚠️ EXCEÇÃO DECLARADA à regra "dinheiro nunca é somado localmente".
//
// A regra continua valendo para o que é COBRADO: `total` é `cost.totalAmount`,
// da Shopify, intocado. O que se soma aqui é o INFORMATIVO ("você economizou X",
// "era Y antes") — e não há alternativa, o que foi medido, não suposto:
//
//   - `Cart.discountAllocations` (o agregado pronto) é DEPRECIADO **e devolve
//     `[]`** na loja real. Não serve nem violando o Req 10.3.
//   - A própria depreciação manda usar `lines[].discountAllocations
//     (lineLevelOnly: false)` — argumento que **não existe na 2026-01** (o
//     Dev MCP rejeita). A orientação é para uma versão futura.
//   - Não existe `cost.subtotalAmountBeforeDiscounts` (verificado no schema).
//
// Ou seja: a própria Shopify prescreve agregar as alocações das linhas. Os
// VALORES continuam sendo dela; só a soma é nossa. E `conferido` abaixo cobre o
// risco que a regra existe para evitar.
//
// Soma em CENTAVOS: `0.1 + 0.2 !== 0.3` em ponto flutuante, e "R$ 159,99" em vez
// de "R$ 160,00" num carrinho seria exatamente o tipo de divergência que a regra
// proíbe.

const paraCentavos = (m: Money): number => Math.round(Number(m.amount) * 100)

const deCentavos = (centavos: number, currencyCode: string): Money => ({
  amount: (centavos / 100).toFixed(2),
  currencyCode,
})

/** Chave de agrupamento: mesmo cupom/desconto entre linhas vira uma linha só. */
const origemDoDesconto = (a: RawAlocacaoDeDesconto): string =>
  a.code ?? a.title ?? "desconto"

function agregarDescontos(linhas: RawLinha[]): DescontoAplicado[] {
  const porOrigem = new Map<string, { codigo: string | null; titulo: string | null; centavos: number; moeda: string }>()

  for (const linha of linhas) {
    for (const a of linha.discountAllocations) {
      const chave = origemDoDesconto(a)
      const atual = porOrigem.get(chave)
      if (atual) {
        atual.centavos += paraCentavos(a.discountedAmount)
      } else {
        porOrigem.set(chave, {
          codigo:   a.code ?? null,
          titulo:   a.title ?? null,
          centavos: paraCentavos(a.discountedAmount),
          moeda:    a.discountedAmount.currencyCode,
        })
      }
    }
  }

  return [...porOrigem.values()]
    .filter((d) => d.centavos > 0)
    .map((d) => ({
      codigo: d.codigo,
      titulo: d.titulo,
      valor:  formatMoney(deCentavos(d.centavos, d.moeda)),
    }))
}

/**
 * Raw → `Carrinho`.
 *
 * O `id` do carrinho é DESCARTADO de propósito: ele não existe no tipo
 * `Carrinho` e fica só no cookie `httpOnly` (Req 2.4). Quem precisa dele é a
 * camada de dados, que o lê da resposta crua antes de chamar esta função.
 */
export function normalizeCarrinho(raw: RawCarrinho): Carrinho {
  // Só os aplicáveis: a Shopify ACEITA um cupom inválido e o deixa no carrinho
  // com `applicable: false`. Sem este filtro, um código rejeitado apareceria
  // listado como se estivesse valendo (Req 5.4).
  const cupons: CupomAplicado[] = raw.discountCodes
    .filter((c) => c.applicable)
    .map((c) => ({ codigo: c.code }))

  const linhas    = raw.lines.nodes
  const descontos = agregarDescontos(linhas)
  const moeda     = raw.cost.totalAmount.currencyCode

  // Subtotal BRUTO = soma do bruto de cada linha (`line.cost.subtotalAmount`).
  // NÃO é `cart.cost.subtotalAmount`, que já vem líquido — usá-lo faria a coluna
  // do drawer não fechar (medido: subtotal 1440 − desconto 160 ≠ total 1440).
  const brutoEmCentavos     = linhas.reduce((s, l) => s + paraCentavos(l.cost.subtotalAmount), 0)
  const descontoEmCentavos  = linhas.reduce(
    (s, l) => s + l.discountAllocations.reduce((t, a) => t + paraCentavos(a.discountedAmount), 0),
    0,
  )
  const totalEmCentavos = paraCentavos(raw.cost.totalAmount)

  // Trava de segurança: só exibimos a conta derivada se ela BATER com o total que
  // a Shopify cobra. Se um dia entrar imposto, frete ou um desconto que não
  // apareça nas linhas, a identidade quebra — e aí é melhor mostrar só o total
  // verdadeiro do que uma coluna que mente. É isto que mantém a regra "a UI nunca
  // diverge do valor cobrado" válida, mesmo com a soma local acima.
  const conferido = brutoEmCentavos - descontoEmCentavos === totalEmCentavos

  return {
    checkoutUrl: raw.checkoutUrl,
    totalItens:  raw.totalQuantity,
    subtotal: conferido
      ? formatMoney(deCentavos(brutoEmCentavos, moeda))
      : formatMoney(raw.cost.subtotalAmount),
    total:       formatMoney(raw.cost.totalAmount),
    descontos:   conferido ? descontos : [],
    linhas:      linhas.map(normalizeLinha),
    cupons,
  }
}

/** Códigos que a Shopify aceitou mas marcou como NÃO aplicáveis (para purga). */
export function cuponsNaoAplicaveis(raw: RawCarrinho): string[] {
  return raw.discountCodes.filter((c) => !c.applicable).map((c) => c.code)
}
