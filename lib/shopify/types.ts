// Tipos da camada de dados da loja (Shopify Storefront API → UI).
// Sem `server-only` de propósito: são só TIPOS, importados via `import type`
// pelos componentes de cliente (apagados na compilação).

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
}

/** Produto completo — usado na página `/produtos/[handle]`. */
export interface Product {
  id:              string
  handle:          string
  title:           string
  descriptionHtml: string
  images:          ProductImage[]
  price:           FormattedPrice
  specs:           Spec[]
}
