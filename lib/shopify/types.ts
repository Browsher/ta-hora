// Tipos da camada de dados da loja (Shopify Storefront API → UI).
// Sem `server-only` de propósito: são só TIPOS, importados via `import type`
// pelos componentes de cliente (apagados na compilação).

import type { Marca } from "./tags" // type-only; sem ciclo (tags.ts não importa daqui)

/** Dinheiro cru como vem da Shopify. */
export interface Money {
  amount:       string // "1799.90"
  currencyCode: string // "BRL"
}

/** Preço já formatado para o `PriceTag` (components/ui/PriceTag.tsx). */
export interface FormattedPrice {
  price:    string // "1.799,90" (padrão pt-BR: milhar ".", decimal ",")
  currency: string // "R$"
}

export interface ProductImage {
  url:     string
  altText: string | null
  width:   number | null
  height:  number | null
}

/** Especificação técnica derivada de um metafield (par rótulo/valor). */
export interface Spec {
  // `key` do metafield (ex.: "tipo_de_resolucao"). Aditivo (feature ficha-tecnica):
  // permite a UI juntar cada spec ao mapa `SPEC_METAFIELDS` para obter tier/ordem e
  // ao mapa de ícones. `ProductSpecs` (órfão) e demais consumidores seguem
  // compilando — só usam label/value.
  key:   string // "tipo_de_resolucao"
  label: string // "Resolução"
  value: string // "4MP / 2K"
}

/** Produto resumido — usado na vitrine `/catalogo`. */
export interface ProductCard {
  id:     string
  handle: string
  title:  string
  image:  ProductImage | null
  price:  FormattedPrice
  // ── Campos derivados no SERVIDOR (feature catalogo-consultivo) ──────────────
  //
  // Aditivos e OBRIGATÓRIOS. Compilam em todo lugar porque `normalizeProductCard`
  // é o ÚNICO construtor de `ProductCard` no codebase — todos os produtores
  // (products/acessorios/recomendados) passam por ele. Os cards vindos de queries
  // que não pedem tags/metafield (acessórios, recomendados) chegam com
  // `marca=null`, `resumo=null`, `maisRecursos=false` — inertes; esses consumidores
  // os ignoram. Se um dia alguém montar um `ProductCard` literal, o compilador
  // corretamente exige estes campos (falha desejada, não regressão).
  /** Marca resolvida por `marcaDoProduto` (tags). `null` = sem tag de marca. */
  marca:         Marca | null
  /** `custom.resumo`; `null` quando ausente/vazio (bloco renderiza sem a linha). */
  resumo:        string | null
  /** Tem a tag `mais-recursos` (chave do filtro homônimo). */
  maisRecursos:  boolean
  /** Chave de ordenação de "Melhor preço" — NUNCA exibido (o preço exibido é `price`). */
  precoNumerico: number

  // ── Destaques do bloco (feature catalogo-destaques) ─────────────────────────
  //
  // Cabeçalho PRÓPRIO, separado do bloco acima de propósito: estes campos vêm de
  // outra feature e de outros metafields. Pendurá-los no comentário do
  // `catalogo-consultivo` faria aquele comentário mentir sobre a proveniência.
  //
  // 🔴 A REGRA JÁ FOI APLICADA quando estes campos chegam aqui. Este é o lado
  // LIMPO da fronteira: `normalizeProductCard` chamou `lib/shopify/destaques.ts`
  // e os valores que não devem aparecer — "Lente única", "Aplicativo",
  // "Notificação" — ficaram para trás, no `RawProductCard`. A UI não tem como
  // renderizar o que não recebeu. Ver `normalize.ts`.
  //
  // Aditivos e OBRIGATÓRIOS pelo mesmo argumento do bloco acima:
  // `normalizeProductCard` é o único construtor, então acessórios/recomendados
  // (que não pedem estes metafields) recebem `null`/`false` e os ignoram.
  /** `custom.selo` — recomendação editorial do lojista ("Menor preço", "Mais
   *  completa"). `null` = sem tarja; o bloco não renderiza caixa vazia (Req 1.3). */
  selo:          string | null
  /** `custom.tipo_de_resolucao` — valor LITERAL ("HD", "Full HD", "4K Ultra HD",
   *  "3K Vertical"). Exibido como veio do admin, sem rótulo (Req 2.1/2.3). */
  resolucao:     string | null
  /** `custom.numero_de_lentes`, SÓ quando é diferencial (dupla/tripla).
   *  🔴 NUNCA contém "Lente única": quando a câmera tem lente única — ou o valor é
   *  desconhecido — este campo é `null`, não a string. O ícone de lentes só existe
   *  quando há o que destacar (Req 3.2/3.3). */
  lentes:        string | null
  /** VEREDITO, não valor: `custom.com_alarme === "Alarme sonoro"`.
   *  🔴 É `boolean` DE PROPÓSITO. O texto exibido é o rótulo FIXO "Alarme sonoro",
   *  nunca o metafield — e um booleano torna impossível exibir por engano o valor
   *  cru ("Aplicativo" na A31H, "Notificação" nas demais). Ver Req 4.3. */
  alarmeSonoro:  boolean
}

/** Produto completo — usado na página `/produtos/[handle]`. */
export interface Product {
  id:              string
  handle:          string
  title:           string
  descriptionHtml: string
  /**
   * Tags do produto (`product.tags`). É o que permite descobrir a **marca**
   * (`eseecloud`/`icsee`) para a seção "Você também pode gostar"
   * (produtos-recomendados). Nunca `undefined`: schema `[String!]!` + `?? []`
   * em `normalizeProduct`.
   */
  tags:            string[]
  /**
   * Alguma variante está à venda? (`product.availableForSale` da Storefront API.)
   *
   * Existe para a UI poder desabilitar o botão de compra ANTES do clique — na PDP
   * e na barra fixa de mobile. **Não** é autorização de venda: quem decide se o
   * item entra no carrinho continua sendo `resolverVariante` no servidor
   * (`lib/shopify/carrinho.ts`), que relê o estoque no momento da adição. Este
   * campo vem do ISR e pode estar até `revalidate` segundos velho.
   *
   * Nunca `undefined`: `normalizeProduct` aplica `?? true` (fail-open — ver lá).
   */
  disponivel:      boolean
  /** Fotos da galeria, redimensionadas para `LARGURA_GALERIA` (ver `imagens.ts`). */
  images:          ProductImage[]
  /**
   * A primeira foto do produto em `LARGURA_OG` (1200 px), para o `og:image`.
   *
   * Campo PRÓPRIO, e não `images[0]`, porque o Open Graph tem exigência de
   * tamanho diferente da galeria: 1200 px contra 800. As duas variantes saem do
   * MESMO original cru em `normalizeProduct` — derivar uma da outra pediria
   * upscale, que a Shopify não faz, e o `og:image:width` passaria a declarar um
   * tamanho que o arquivo não tem. Ver o comentário em `normalize.ts`.
   *
   * `null` quando o produto não tem foto cadastrada → a PDP cai na arte genérica
   * do site (`/uploads/og-image.webp`).
   */
  ogImage:         ProductImage | null
  price:           FormattedPrice
  /**
   * Mesmo campo (e mesma origem) do `precoNumerico` do `ProductCard` acima, agora
   * também no produto completo: `priceRange.minVariantPrice.amount` como número.
   *
   * Existe para o PARCELAMENTO da PDP (`lib/parcelamento.ts`), que precisa dividir
   * o preço e não pode fazê-lo a partir de `price.price` — esse já é texto pt-BR
   * formatado ("1.799,90"), e desparsear ponto de milhar e vírgula decimal de
   * volta para número é um bug esperando um produto de quatro dígitos.
   *
   * 🔴 NUNCA é o preço EXIBIDO — esse é `price`, via `formatMoney`. E não é valor
   * cobrado: a regra de aritmética logo abaixo (linha ~124) continua valendo para
   * tudo que fecha com a fatura. Ver a exceção declarada no topo de
   * `lib/parcelamento.ts`.
   */
  precoNumerico:   number
  /**
   * Código ISO da moeda ("BRL"), CRU como a Shopify devolve.
   *
   * Existe para o `priceCurrency` do JSON-LD (`lib/seo/produtoSchema.ts`), que
   * exige o código — `price.currency` é o SÍMBOLO de exibição ("R$") e o
   * schema.org não o aceita. Mesmo precedente de `precoNumerico`: valor cru para
   * a máquina, valor formatado para o humano, um não substitui o outro.
   */
  moeda:           string
  /**
   * `custom.resumo` — a linha consultiva do lojista, a MESMA que o bloco do
   * `/catalogo` exibe. Na PDP não é exibida: alimenta a `description` do JSON-LD.
   *
   * `null` quando ausente ou vazio → o schema OMITE o campo `description`.
   */
  resumo:          string | null
  /**
   * SKU da variante vendida (`variants.nodes[0].sku`).
   *
   * `null` quando não cadastrado na Shopify — hoje o caso de A31H e A38 (medido
   * em 11/08/2026) → o schema omite o campo em vez de inventar identificador.
   */
  sku:             string | null
  /**
   * `custom.numero_de_lentes` CRU — "Lente única" | "Lente dupla" | "Lente tripla".
   *
   * 🔴 MESMO NOME de `ProductCard.lentes`, SEMÂNTICA DIFERENTE. Lá o valor já
   * passou por `temLenteMultipla` e é `null` quando é lente única (o card só
   * exibe o que é diferencial). Aqui o valor CHEGA CRU, inclusive "Lente única",
   * porque quem decide o que vira descritor de title é `lib/seo/tituloProduto.ts`.
   * Não passe um pelo outro.
   *
   * Vem por alias próprio, FORA de `SPEC_METAFIELDS`, para não aparecer na Ficha
   * Técnica — decisão registrada de 11/08/2026. Ver o comentário na query.
   */
  lentes:          string | null
  specs:           Spec[]
  /**
   * Texto de apresentação do produto (`custom.apresentacao`), CRU — com os `\n`
   * como vieram da Shopify. Quem interpreta a convenção de blocos é
   * `lib/apresentacao.ts`; aqui é só transporte.
   *
   * `null` quando o metafield está ausente, vazio ou só com espaços — e é isso
   * que faz a seção não renderizar. Ver `ApresentacaoProduto`.
   */
  apresentacao:    string | null
}

// ─── Carrinho ─────────────────────────────────────────────────────────────────
//
// Regra que atravessa todos os tipos abaixo: TODO DINHEIRO VEM DA SHOPIFY, e a
// UI NUNCA faz aritmética com ele. O valor exibido não pode divergir do cobrado.

/** Uma linha do carrinho, já formatada para exibição. */
export interface LinhaCarrinho {
  /** `gid://shopify/CartLine/...` — usado nas mutations de update/remove. */
  id:            string
  quantidade:    number
  /** `merchandise.availableForSale` — linha indisponível é sinalizada na UI. */
  disponivel:    boolean
  /**
   * `merchandise.quantityAvailable`. **Pode ser `null`**: só vem preenchido se o
   * app tiver o scope `unauthenticated_read_product_inventory`. `null` → o `+`
   * não desabilita e o limite chega pelo `aviso` de `warnings` (Req 10.7).
   */
  estoqueMaximo: number | null
  titulo:        string
  /** Link de volta ao produto (`/produtos/[handle]`). */
  handle:        string
  /**
   * Tags do produto (`merchandise.product.tags`).
   *
   * É o que permite avaliar o gatilho da sugestão de acessórios **sem rede**: o
   * cliente já recebe a linha, então saber se há uma câmera no carrinho custa
   * zero chamadas. Sem isto, seria preciso buscar as câmeras só para descobrir
   * se vale a pena buscar os acessórios — galinha e ovo.
   *
   * **Nunca `undefined`:** o schema declara `Product.tags` como `[String!]!`
   * (verificado) e `normalizeLinha` — o único construtor de `LinhaCarrinho` —
   * aplica `?? []`. É o que segura o `.includes()` do gatilho.
   */
  tags:          string[]
  imagem:        ProductImage | null
  /** `cost.amountPerQuantity` — VEM da Shopify. NUNCA `precoTotal / quantidade`. */
  precoUnitario: FormattedPrice
  /** `cost.totalAmount` DA LINHA — vem pronto, não é calculado aqui. */
  precoTotal:    FormattedPrice
  /**
   * `discountAllocations[].discountedAmount` — LISTA, deliberadamente NÃO somada.
   * Colapsar num total seria aritmética local, justo o que a regra proíbe. Se um
   * dia for preciso um total de desconto, ele vem da Shopify, não de um `reduce`.
   */
  descontos:     FormattedPrice[]
}

/** Cupom que a Shopify considerou aplicável (`applicable: true`). */
export interface CupomAplicado {
  codigo: string
}

/**
 * Um desconto ativo no carrinho, agregado por origem — o "você economizou".
 *
 * Vem de `lines[].discountAllocations`, somando as alocações da MESMA origem
 * entre as linhas. Ver a nota "Exceção declarada à regra de aritmética" abaixo.
 */
export interface DescontoAplicado {
  /** Código do cupom (`CartCodeDiscountAllocation`). `null` = desconto automático. */
  codigo: string | null
  /** Rótulo do desconto automático (`CartAutomaticDiscountAllocation`). */
  titulo: string | null
  valor:  FormattedPrice
}

/**
 * Carrinho normalizado.
 *
 * **NÃO contém o `id`** — ele fica no cookie `httpOnly` e o servidor é quem sabe
 * qual carrinho é o da sessão. Não ter o campo evita que ele vaze em log, estado
 * ou props por descuido.
 *
 * ⚠️ Fronteira honesta (não confunda com o que isto NÃO garante): o `checkoutUrl`
 * abaixo **contém** o token do carrinho — verificado ao vivo:
 *   `checkoutUrl = https://<loja>/cart/c/<token>?key=<key>` e
 *   `cart.id     = gid://shopify/Cart/<MESMO token>?key=<MESMA key>`
 * Ou seja, o valor do ID **chega ao navegador de qualquer forma** (o Req 7.2
 * exige levar o cliente ao `checkoutUrl`). Isso é aceito e decidido: a capability
 * é do carrinho do PRÓPRIO visitante, e a credencial que importa — o token da
 * Storefront API — continua server-only. Ver design → "Decisão: link direto".
 */
export interface Carrinho {
  checkoutUrl: string
  /** `cart.totalQuantity` — o contador da navbar. */
  totalItens:  number
  /**
   * Subtotal **BRUTO**, antes dos descontos — soma de `line.cost.subtotalAmount`.
   *
   * ⚠️ NÃO é `cart.cost.subtotalAmount`. Medido na loja: com um cupom de 10%,
   * `cart.cost.subtotalAmount` já vem LÍQUIDO (1440), igual ao total. Exibi-lo
   * como "Subtotal" acima de um "Desconto −160" e um "Total 1440" produziria uma
   * coluna que não fecha (1440 − 160 ≠ 1440). O bruto é o que faz a conta ler.
   */
  subtotal:    FormattedPrice
  /** `cost.totalAmount` — **o valor cobrado**, sempre da Shopify, nunca derivado. */
  total:       FormattedPrice
  /** Descontos ativos, agregados por origem. Vazio = nenhum desconto. */
  descontos:   DescontoAplicado[]
  linhas:      LinhaCarrinho[]
  /** Só os `applicable: true` — código rejeitado não aparece como aplicado. */
  cupons:      CupomAplicado[]
}

/** Retorno único de toda ação de carrinho. */
export interface ResultadoCarrinho {
  /** `null` = sem carrinho (vazio, expirado, finalizado ou Shopify indisponível). */
  carrinho: Carrinho | null
  /**
   * Derivado de `warnings` (não de `userErrors`), traduzido para pt-BR.
   * Existe porque a Shopify limita estoque em SILÊNCIO: `userErrors` vem VAZIO e
   * o único sinal é `warnings: MERCHANDISE_NOT_ENOUGH_STOCK`. Sem isto o `+`
   * travaria mudo (Req 1.5, 3.12).
   */
  aviso:    string | null
  /** Falha amigável. NUNCA interpola token ou endpoint (Req 8.5). */
  erro:     string | null
}
