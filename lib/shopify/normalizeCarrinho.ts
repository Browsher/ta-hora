import { formatMoney } from "./normalize"
import type {
  Money,
  ProductImage,
  Carrinho,
  LinhaCarrinho,
  CupomAplicado,
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
  product:           { title: string; handle: string }
}

interface RawLinha {
  id:       string
  quantity: number
  cost: {
    amountPerQuantity: Money
    totalAmount:       Money
  }
  discountAllocations: { discountedAmount: Money }[]
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

  return {
    checkoutUrl: raw.checkoutUrl,
    totalItens:  raw.totalQuantity,
    subtotal:    formatMoney(raw.cost.subtotalAmount),
    total:       formatMoney(raw.cost.totalAmount),
    linhas:      raw.lines.nodes.map(normalizeLinha),
    cupons,
  }
}

/** Códigos que a Shopify aceitou mas marcou como NÃO aplicáveis (para purga). */
export function cuponsNaoAplicaveis(raw: RawCarrinho): string[] {
  return raw.discountCodes.filter((c) => !c.applicable).map((c) => c.code)
}
