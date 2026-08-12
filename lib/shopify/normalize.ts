import { SPEC_METAFIELDS } from "./specs"
import { marcaDoProduto, TAG_MAIS_RECURSOS } from "./tags"
import { temLenteMultipla, temAlarmeSonoro } from "./destaques"
import { redimensionar, LARGURA_CARD, LARGURA_GALERIA, LARGURA_OG } from "./imagens"
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
  /**
   * ISO 8601 da última edição do produto no admin. Só a PRODUCTS_QUERY o pede —
   * é o `lastmod` das PDPs no sitemap. Ver o porquê em `app/sitemap.ts`.
   */
  updatedAt?:    string

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
  // `product.availableForSale` — true se alguma variante está disponível.
  // OPCIONAL no tipo de propósito: só a PRODUCT_BY_HANDLE_QUERY o seleciona, e
  // `normalizeProduct` aplica `?? true` (ver lá o porquê de degradar para
  // "disponível", e não para "esgotado").
  availableForSale?: boolean
  images:          { nodes: RawImage[] }
  priceRange:      RawPriceRange
  // `metafields(identifiers:)` retorna a lista NA ORDEM dos identifiers, com
  // `null` para os ausentes.
  metafields:      (RawMetafield | null)[]
  // Metafield ALIASADO `custom.apresentacao` (feature apresentacao-produto).
  // Opcional: só a PRODUCT_BY_HANDLE_QUERY o seleciona. Ausente → null.
  apresentacao?:   { value: string } | null
  // ── Aditivos do JSON-LD (feature product-schema) ────────────────────────────
  // Opcionais pelo mesmo motivo dos demais: só a PRODUCT_BY_HANDLE_QUERY os
  // seleciona. Ausentes → `resumo`/`sku` normalizam para `null`, e o schema
  // simplesmente omite os campos correspondentes.
  /** Metafield aliasado `custom.resumo` — vira a `description` do schema. */
  resumo?:         { value: string } | null
  /** `variants(first: 1) { nodes { sku } }` — o SKU da variante vendida. */
  variants?:       { nodes: { sku: string | null }[] }
  /** Metafield aliasado `custom.numero_de_lentes` — alimenta o title derivado. */
  lentes?:         { value: string } | null
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

/**
 * Raw → `ProductImage`, JÁ redimensionada para o contexto de exibição.
 *
 * 🔴 `largura` É PARÂMETRO OBRIGATÓRIO, e isso é decisão registrada. Esta função
 * é chamada pelos DOIS caminhos abaixo — card e galeria — e não tem como saber de
 * qual veio: a URL, o alt e as dimensões são idênticos nos dois casos. Quem sabe
 * o tamanho de exibição é o CHAMADOR, então é ele quem informa. Um default aqui
 * seria a função adivinhando o contexto, que é justamente o erro a evitar.
 *
 * O recálculo de `width`/`height` acontece dentro de `redimensionar` — ver lá o
 * porquê de a URL e as dimensões nunca poderem divergir.
 */
function normalizeImage(img: RawImage | null, largura: number): ProductImage | null {
  return redimensionar(img, largura)
}

export function normalizeProductCard(raw: RawProductCard): ProductCard {
  const tags = raw.tags ?? []
  return {
    id:     raw.id,
    handle: raw.handle,
    title:  raw.title,
    // Card: `/catalogo`, vitrine da home, recomendados e acessórios. Todos
    // exibem a ~200-300 px, então 400 cobre tela 2x. (Os acessórios do drawer
    // aparecem a 44 px e ficam sobredimensionados — são 2 imagens, e dar largura
    // própria a eles exigiria um segundo construtor de `ProductCard`, que é o
    // preço errado a pagar. Ver o comentário de "único construtor" em types.ts.)
    image:  normalizeImage(raw.featuredImage, LARGURA_CARD),
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

    // `null` nas queries que não pedem `updatedAt` (acessórios, recomendados,
    // vitrine) — inerte, do mesmo jeito que `marca`/`resumo`. Quem consome é o
    // sitemap, que só usa os cards vindos de `getProducts()`.
    atualizadoEm: raw.updatedAt ?? null,

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
    .map((img) => normalizeImage(img, LARGURA_GALERIA))
    .filter((i): i is ProductImage => i !== null)

  // Imagem do `og:image`, derivada da PRIMEIRA FOTO CRUA — não de `images[0]`.
  //
  // 🔴 A ORDEM IMPORTA E A ORIGEM TAMBÉM. O Open Graph pede 1200 px e a galeria
  // usa 800. Redimensionar `images[0]` (que já é 800) para 1200 seria pedir
  // upscale: a Shopify não faz upscale, devolveria os mesmos 800 px, e o
  // `og:image:width` sairia declarando 1200 para um arquivo de 800 — exatamente
  // a divergência que `redimensionar` existe para impedir. Partindo do cru, as
  // duas variantes são calculadas do MESMO original, cada uma com as dimensões
  // que de fato tem.
  //
  // `null` quando o produto não tem foto — a PDP cai na arte genérica do site.
  const ogImage = normalizeImage(raw.images.nodes[0] ?? null, LARGURA_OG)

  return {
    id:              raw.id,
    handle:          raw.handle,
    title:           raw.title,
    descriptionHtml: raw.descriptionHtml,
    // `?? []` defensivo: garante que `Product.tags` nunca é undefined, o que
    // seguraria o `marcaDoProduto(produto.tags)` (não explode no `.includes`).
    tags:            raw.tags ?? [],
    // 🔴 `?? true` — DEGRADA PARA "DISPONÍVEL", mesma escolha do `handleTemPagina`
    // (lib/shopify/products.ts). Campo ausente significa "a query não perguntou",
    // não "acabou o estoque": degradar para `false` marcaria a loja inteira como
    // esgotada por um campo esquecido numa query, que é o pior erro possível aqui.
    // Fail-open custa o comportamento de ANTES desta feature (botão vivo, erro no
    // drawer); fail-closed derruba a venda de tudo.
    disponivel:      raw.availableForSale ?? true,
    images,
    ogImage,
    price:           formatMoney(raw.priceRange.minVariantPrice),
    // Mesma origem e mesma premissa do `precoNumerico` de `normalizeProductCard`
    // (string numérica finita vinda da Shopify). Aqui alimenta o parcelamento da
    // PDP; não é preço exibido nem valor cobrado. Ver `lib/parcelamento.ts`.
    precoNumerico:   Number(raw.priceRange.minVariantPrice.amount),
    // Código ISO cru ("BRL") — o `formatMoney` acima o converte no símbolo "R$"
    // para exibição, e o JSON-LD precisa do código. Ver `moeda` em types.ts.
    moeda:           raw.priceRange.minVariantPrice.currencyCode,
    // "" / só espaços / ausente → null, mesma linha do `resumo` de
    // `normalizeProductCard`. É o `|| null` que faz o schema OMITIR o campo.
    resumo:          raw.resumo?.value?.trim() || null,
    // `?? null` no fim: produto sem variante selecionada (query que não pediu)
    // ou SKU não cadastrado caem no mesmo `null`, e o schema omite o campo.
    sku:             raw.variants?.nodes[0]?.sku?.trim() || null,
    // CRU ("Lente dupla"), não veredito — ao contrário do `lentes` de
    // `normalizeProductCard`, que já aplicou `temLenteMultipla` e vira `null`
    // quando é lente única. Aqui o valor bruto atravessa porque quem decide o
    // descritor é `lib/seo/tituloProduto.ts`. Mesmo nome, semânticas diferentes —
    // ver o aviso em `RawProductCard.lentes` no topo deste arquivo.
    lentes:          raw.lentes?.value?.trim() || null,
    specs,
    // "" / só espaços / ausente → null. Mesma linha do `resumo` em
    // `normalizeProductCard`: é o `|| null` aqui que faz a seção sumir sozinha
    // lá na frente, sem o componente precisar saber de metafield.
    apresentacao:    raw.apresentacao?.value?.trim() || null,
  }
}
