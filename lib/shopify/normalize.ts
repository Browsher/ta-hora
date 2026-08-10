import { SPEC_METAFIELDS } from "./specs"
import { marcaDoProduto, TAG_MAIS_RECURSOS } from "./tags"
import { temLenteMultipla, temAlarmeSonoro } from "./destaques"
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

  // ── Destaques do bloco (feature catalogo-destaques) — opcionais pelo MESMO
  //    motivo acima: só a PRODUCTS_QUERY os seleciona.
  //
  // 🔴 ESTES 4 SÃO VALORES CRUS, direto da Shopify — NENHUM passou pelas regras de
  // `destaques.ts`. Este é o lado SUJO da fronteira: aqui ainda existem
  // "Lente única", "Aplicativo" e "Notificação". No `ProductCard`, não existem mais.
  selo?:         { value: string } | null   // `custom.selo`
  resolucao?:    { value: string } | null   // `custom.tipo_de_resolucao`
  // ⚠️ MESMO NOME de `ProductCard.lentes`, SEMÂNTICA OPOSTA. Este é o valor cru e
  // INCLUI "Lente única"; o do `ProductCard` nunca inclui. Não passe um pelo
  // outro — é justamente por esse risco que o campo do alarme abaixo tem nome
  // diferente do seu veredito (`alarme` cru vs `alarmeSonoro` decidido).
  lentes?:       { value: string } | null   // `custom.numero_de_lentes`
  alarme?:       { value: string } | null   // `custom.com_alarme` (CRU: "Aplicativo"…)
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
  // Metafield ALIASADO `custom.apresentacao` (feature apresentacao-produto).
  // Opcional: só a PRODUCT_BY_HANDLE_QUERY o seleciona. Ausente → null.
  apresentacao?:   { value: string } | null
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

    // ── Destaques do bloco (feature catalogo-destaques) ──────────────────────
    //
    // 🔴 AQUI É A FRONTEIRA. Acima desta linha o `raw` ainda tem "Lente única",
    // "Aplicativo" e "Notificação"; abaixo dela, o `ProductCard` não tem mais. A
    // decisão de "aparece ou não" é tomada NO SERVIDOR, de propósito: o valor que
    // não deve ser exibido nunca chega ao cliente, então nenhum refactor futuro
    // da UI consegue renderizá-lo por engano (Req 3.2, 4.2).
    selo:      raw.selo?.value?.trim()      || null,
    resolucao: raw.resolucao?.value?.trim() || null,
    // Lentes: o valor só SOBREVIVE se disparar. "Lente única" → null.
    // O `trim()` exibido é o mesmo texto que o gatilho avaliou.
    lentes: temLenteMultipla(raw.lentes?.value)
      ? raw.lentes!.value.trim()
      : null,
    // Alarme: VEREDITO, não valor — o "Aplicativo" da A31H morre exatamente aqui.
    alarmeSonoro: temAlarmeSonoro(raw.alarme?.value),
  }
}

export function normalizeProduct(raw: RawProduct): Product {
  // Uma Spec por metafield definido em SPEC_METAFIELDS QUE ESTEJA presente.
  const specs: Spec[] = SPEC_METAFIELDS.map((def) => {
    const mf = raw.metafields.find(
      (m) => m !== null && m.namespace === def.namespace && m.key === def.key,
    )
    if (!mf || !mf.value) return null
    // `key` novo (feature ficha-tecnica): a UI junta com SPEC_METAFIELDS por ele
    // para tier/ordem/ícone. A omissão de ausentes/`!value` acima é o "some se
    // vazio" por spec — preservada.
    return { key: def.key, label: def.label, value: mf.value }
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
    // Mesma origem e mesma premissa do `precoNumerico` de `normalizeProductCard`
    // (string numérica finita vinda da Shopify). Aqui alimenta o parcelamento da
    // PDP; não é preço exibido nem valor cobrado. Ver `lib/parcelamento.ts`.
    precoNumerico:   Number(raw.priceRange.minVariantPrice.amount),
    specs,
    // "" / só espaços / ausente → null. Mesma linha do `resumo` em
    // `normalizeProductCard`: é o `|| null` aqui que faz a seção sumir sozinha
    // lá na frente, sem o componente precisar saber de metafield.
    apresentacao:    raw.apresentacao?.value?.trim() || null,
  }
}
