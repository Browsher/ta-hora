import { SPEC_METAFIELDS } from "./specs"
import { marcaDoProduto, TAG_MAIS_RECURSOS } from "./tags"
import type {
  Money,
  FormattedPrice,
  ProductImage,
  Spec,
  ProductCard,
  Product,
} from "./types"

// ─── Tipos crus da resposta GraphQL ───────────────────────────────────────────
// (o que a Storefront API devolve, antes de normalizar)

interface RawImage {
  url:     string
  altText: string | null
  width:   number | null
  height:  number | null
}

interface RawPriceRange {
  minVariantPrice: Money
}

export interface RawProductCard {
  id:            string
  handle:        string
  title:         string
  featuredImage: RawImage | null
  priceRange:    RawPriceRange
  // OPCIONAIS de propósito: só a PRODUCTS_QUERY (catálogo) os seleciona. As
  // queries de acessórios/recomendados estendem esta interface e NÃO os pedem —
  // deixá-los opcionais mantém `RawAcessorio`/`RawRecomendado` válidos sem
  // alteração. Ausentes → normalizam para marca/resumo `null`, maisRecursos `false`.
  tags?:         string[]                   // `product.tags`
  resumo?:       { value: string } | null   // metafield aliasado `custom.resumo`
}

interface RawMetafield {
  namespace: string
  key:       string
  value:     string
}

export interface RawProduct {
  id:              string
  handle:          string
  title:           string
  descriptionHtml: string
  // `product.tags` — `[String!]!` no schema. Pode não vir se a query não pedir;
  // por isso `normalizeProduct` aplica `?? []`. É a marca da câmera.
  tags:            string[]
  images:          { nodes: RawImage[] }
  priceRange:      RawPriceRange
  // `metafields(identifiers:)` retorna a lista NA ORDEM dos identifiers, com
  // `null` para os ausentes.
  metafields:      (RawMetafield | null)[]
}

// ─── Formatação de dinheiro (correção M4: respeita currencyCode) ──────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: "R$",
  USD: "US$",
  EUR: "€",
  GBP: "£",
}

/** Converte Money cru → preço formatado para o PriceTag, respeitando a moeda. */
export function formatMoney(m: Money): FormattedPrice {
  const currency = CURRENCY_SYMBOLS[m.currencyCode] ?? m.currencyCode
  const num = Number(m.amount)
  const price = Number.isFinite(num)
    ? num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : m.amount
  return { price, currency }
}

// ─── Normalizadores ───────────────────────────────────────────────────────────

function normalizeImage(img: RawImage | null): ProductImage | null {
  if (!img) return null
  return { url: img.url, altText: img.altText, width: img.width, height: img.height }
}

export function normalizeProductCard(raw: RawProductCard): ProductCard {
  const tags = raw.tags ?? []
  return {
    id:     raw.id,
    handle: raw.handle,
    title:  raw.title,
    image:  normalizeImage(raw.featuredImage),
    price:  formatMoney(raw.priceRange.minVariantPrice),
    // ── Derivados no servidor (opção A: cliente recebe o card pronto) ─────────
    marca:        marcaDoProduto(tags),               // Marca | null
    resumo:       raw.resumo?.value?.trim() || null,  // "" / ausente → null
    maisRecursos: tags.includes(TAG_MAIS_RECURSOS),   // boolean
    // Só chave de ordenação de "Melhor preço" — NÃO é preço exibido, NÃO é conta
    // sobre dinheiro cobrado (esse é `price`, via formatMoney). Assume `amount`
    // string numérica finita (a Shopify sempre entrega assim); se um dia vier NaN,
    // a ordem de "Melhor preço" ficaria indefinida — daí o script verificar:resumo
    // e o build seguram a premissa antes de a UI depender dela.
    precoNumerico: Number(raw.priceRange.minVariantPrice.amount),
  }
}

export function normalizeProduct(raw: RawProduct): Product {
  // Uma Spec por metafield definido em SPEC_METAFIELDS QUE ESTEJA presente.
  const specs: Spec[] = SPEC_METAFIELDS.map((def) => {
    const mf = raw.metafields.find(
      (m) => m !== null && m.namespace === def.namespace && m.key === def.key,
    )
    if (!mf || !mf.value) return null
    return { label: def.label, value: mf.value }
  }).filter((s): s is Spec => s !== null)

  const images = raw.images.nodes
    .map(normalizeImage)
    .filter((i): i is ProductImage => i !== null)

  return {
    id:              raw.id,
    handle:          raw.handle,
    title:           raw.title,
    descriptionHtml: raw.descriptionHtml,
    // `?? []` defensivo: garante que `Product.tags` nunca é undefined, o que
    // seguraria o `marcaDoProduto(produto.tags)` (não explode no `.includes`).
    tags:            raw.tags ?? [],
    images,
    price:           formatMoney(raw.priceRange.minVariantPrice),
    specs,
  }
}
