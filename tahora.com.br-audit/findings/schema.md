# Schema / Structured Data — auditoria tahora.com.br

Data: 2026-08-12 · 14 URLs verificadas (SSR confirmado: `mode_used: rendered` com `content` == `raw_content` para os blocos JSON-LD; nenhum bloco é injetado apenas client-side).

## Score: 62/100

## Sumário de detecção

| Página | Blocos JSON-LD | @type detectados |
|---|---|---|
| `/` | 1 | `OnlineStore` (com `PostalAddress` embutido) |
| `/catalogo` | 1 | `BreadcrumbList` |
| `/sobre-nos` | 0 | — |
| `/suporte` | 0 | — |
| `/politica-de-privacidade` | 0 | — |
| `/termos-de-uso` | 0 | — |
| `/trocas-e-devolucoes` | 0 | — |
| `/produtos/camera-seguranca-a31h` | 2 | `Product`+`Offer`, `BreadcrumbList` |
| `/produtos/camera-seguranca-es-p9` | 2 | `Product`+`Offer`, `BreadcrumbList` |
| `/produtos/camera-seguranca-q6` | 2 | `Product`+`Offer`, `BreadcrumbList` |
| `/produtos/camera-lampada` | 2 | `Product`+`Offer`, `BreadcrumbList` |
| `/produtos/camera-seguranca-a38` | 2 | `Product`+`Offer`, `BreadcrumbList` |
| `/produtos/camera-seguranca-q8` | 2 | `Product`+`Offer`, `BreadcrumbList` |
| `/produtos/camera-seguranca-s8` | 2 | `Product`+`Offer`, `BreadcrumbList` |

Nenhum `FAQPage`, `HowTo` ou `SpecialAnnouncement` encontrado em nenhuma página — nada a sinalizar nas regras de depreciação/aposentadoria.

## O que funciona

- **Todas as 7 PDPs têm `Product`+`Offer` válidos**: `name`, `image` (URL absoluta), `description`, `sku`, `offers.price`, `offers.priceCurrency` (`BRL`), `offers.availability`, `offers.url` (absoluta) e `offers.itemCondition` presentes e bem formados. Nenhum placeholder, `@context` correto (`https://schema.org`), sem `http://`.
- **`BreadcrumbList` implementado corretamente** em `/catalogo` e nas 7 PDPs: `position` sequencial a partir de 1, `name` coerente com a página, `item` com URL absoluta em todos os níveis exceto o último (prática aceita — o item atual não precisa de `item`/URL própria).
- **Home com dados de negócio ricos**: `legalName`, `taxID` (CNPJ), endereço completo (`PostalAddress`), `telephone`, `email`, `logo` e `sameAs` (Mercado Livre, Shopee, Instagram) — bom insumo para Knowledge Panel/Logo rich result.
- Nenhuma avaliação/nota inventada — correto não ter `aggregateRating`/`review` já que não há avaliações reais coletadas.

## Findings

### 1. [High] Nenhuma PDP tem `brand`, `priceValidUntil`, `shippingDetails` ou `hasMerchantReturnPolicy`
**Evidência**: as 7 PDPs (`a31h`, `es-p9`, `q6`, `camera-lampada`, `a38`, `q8`, `s8`) têm o mesmo padrão de `Offer` — apenas `price`, `priceCurrency`, `availability`, `itemCondition`, `url`, `seller.name`. Nenhuma dessas 4 propriedades aparece em nenhum bloco.
**Impacto**: não bloqueiam o rich result básico de Product (os únicos obrigatórios são `name` + `offers.price`/`priceCurrency`), mas são as propriedades que o Google mais cobra hoje para manter/expandir a exibição de preço, frete e política de devolução no snippet, e são obrigatórias para Merchant Center / listagens gratuitas do Shopping. `priceValidUntil` ausente é o item mais sensível: sem ele o Google pode considerar o preço "stale" com o tempo.
**Recomendação**: adicionar as 4 propriedades no gerador de JSON-LD das PDPs (provavelmente um único template compartilhado, já que o padrão se repete 1:1 nas 7 páginas). Ver snippet completo na seção "JSON-LD proposto" abaixo.

### 2. [Medium] `sku` presente, mas sem `gtin`/`gtin13`/`mpn`
**Evidência**: todos os produtos têm `sku` (`IC-A31H`, `ES-P9`, `ES-Q6`, `IC-8177`, `IC-A38`, `ES-Q8`, `ES-S8`) mas nenhum tem `gtin`/`gtin8`/`gtin13`/`gtin14` ou `mpn`.
**Impacto**: recomendado, não obrigatório, para rich results de Search — mas é o campo que o Google usa para casar produto com feed do Merchant Center e evitar duplicação/"missing identifier" warnings caso a loja rode Shopping Ads.
**Recomendação**: se os fabricantes das câmeras (fornecedor OEM) disponibilizarem EAN/GTIN, incluir. Caso não exista GTIN oficial (comum em white-label importado), usar `mpn` com o próprio SKU interno é aceitável e documentado pelo Google.

### 3. [Medium] `Organization`/`OnlineStore` da home sem `contactPoint` e sem `@id`
**Evidência**: bloco único da home usa `@type: "OnlineStore"` (subtipo válido de `Organization` via `LocalBusiness > Store > OnlineStore`), com `telephone` e `email` soltos no nível raiz, mas sem `ContactPoint` estruturado (`contactType`, `areaServed`, `availableLanguage`) e sem `@id` para permitir que outras páginas (ex.: `Offer.seller`) referenciem a mesma entidade por link em vez de repetir só `name`.
**Impacto**: baixo/médio — não é obrigatório, mas `contactPoint` é a propriedade recomendada pelo Google para Organization quando o objetivo é atendimento ao cliente, e `@id` estável é boa prática para permitir que o Google conecte a entidade da home ao `seller` citado em cada PDP (hoje o `seller` das PDPs é só `{"@type":"Organization","name":"Ta Hora"}`, uma entidade "solta" sem link para os dados ricos da home).
**Recomendação**: adicionar `contactPoint` e um `@id` estável (`https://www.tahora.com.br/#organization`) no bloco da home, e referenciar esse mesmo `@id` no `seller` das PDPs.

### 4. [Low] 5 páginas estáticas sem nenhum JSON-LD
**Evidência**: `/sobre-nos`, `/suporte`, `/politica-de-privacidade`, `/termos-de-uso`, `/trocas-e-devolucoes` retornam `block_count: 0`.
**Impacto**: baixo — não são páginas candidatas a rich results por si só. Oportunidade menor de `BreadcrumbList` consistente com o resto do site (o site já tem o padrão implementado em PDP/catálogo, só falta estender) e, em `/suporte`, se o conteúdo for genuinamente perguntas de usuários (não é FAQ institucional), avaliar `QAPage` — não `FAQPage` (sem benefício de SERP e a diretriz do projeto veda recomendar FAQPage novo por ganho de rich result).
**Recomendação**: adicionar `BreadcrumbList` nessas 5 páginas para consistência (baixo esforço, reaproveita o componente já usado no catálogo/PDP). Não é prioridade.

### 5. [Info] Catálogo sem `ItemList`/`CollectionPage`
**Evidência**: `/catalogo` só tem o `BreadcrumbList`; a listagem de produtos em si não está marcada como `ItemList` ou `CollectionPage`.
**Impacto**: nenhum rich result específico depende disso hoje (Google não usa `ItemList` de catálogo para SERP feature própria fora de casos de carrossel). Puramente informativo.
**Recomendação**: opcional, baixa prioridade.

### 6. [Info] Nenhum `FAQPage` encontrado
**Evidência**: nenhuma das 14 páginas tem `FAQPage`, apesar do commit `17f3b69` mencionar "perguntas do FAQ como h3" (aparentemente apenas mudança de heading semântico, sem marcação estruturada).
**Nota de política**: não há necessidade de ação. O Google aposentou rich results de FAQ para todos os sites em 07/05/2026 — não recomendamos criar `FAQPage` novo por ganho de SERP (só valeria por um benefício de AI/GEO ainda não confirmado, e mesmo assim é decisão do usuário). Se decidirem marcar as perguntas de `/suporte`, usar `QAPage` apenas se forem perguntas reais de usuários (não institucionais).

## Coerência entre blocos

- `@id`: nenhum bloco em nenhuma página usa `@id`. Não há erro de inconsistência (porque não há referências cruzadas hoje), mas também não há aproveitamento do grafo — ver Finding 3.
- `seller` nas PDPs é sempre `{"@type":"Organization","name":"Ta Hora"}`, idêntico em texto ao `name` da `OnlineStore` da home, então não há conflito de dados — só falta o link estrutural.
- URLs absolutas: 100% consistentes (`https://www.tahora.com.br/...`) em `Offer.url` e `BreadcrumbList.item`.
- `priceCurrency`: `BRL` em 100% das PDPs. Correto para loja brasileira.
- `availability`: `https://schema.org/InStock` em 100% das PDPs — verificar se isso é atualizado dinamicamente quando um SKU esgota (fora do escopo desta auditoria de markup, mas vale checar no backend/Shopify sync).

---

## JSON-LD proposto

### PDP — `Offer` completo (exemplo com dados reais da A31H; aplicar o mesmo padrão nas outras 6 PDPs trocando os valores)

Adições em relação ao bloco atual: `brand`, `offers.priceValidUntil`, `offers.shippingDetails`, `offers.hasMerchantReturnPolicy`, `offers.seller` com `@id` linkado à home.

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Câmera Segurança Wi-Fi Full HD Dupla Lente A31H",
  "image": [
    "https://cdn.shopify.com/s/files/1/0960/8157/6120/files/A31H3_4.png?v=1785431238&width=1200"
  ],
  "description": "Dupla lente com detecção inteligente, pra quem quer mais controle sem complicar.",
  "sku": "IC-A31H",
  "mpn": "IC-A31H",
  "brand": {
    "@type": "Brand",
    "name": "Ta Hora"
  },
  "offers": {
    "@type": "Offer",
    "price": "185.00",
    "priceCurrency": "BRL",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "url": "https://www.tahora.com.br/produtos/camera-seguranca-a31h",
    "seller": {
      "@type": "Organization",
      "@id": "https://www.tahora.com.br/#organization",
      "name": "Ta Hora"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0",
        "currency": "BRL"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "BR"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "DAY"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 3,
          "maxValue": 10,
          "unitCode": "DAY"
        }
      }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "BR",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 7,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    }
  }
}
```

**Atenção antes de publicar**: os valores de `priceValidUntil` (data fixa — recalcular periodicamente ou automatizar), `shippingRate`/`deliveryTime` e `merchantReturnDays`/`returnFees` acima são placeholders estruturais baseados no texto público de `/trocas-e-devolucoes` e no frete padrão do checkout — confirme os números reais (prazo de troca em dias, se o frete é sempre grátis ou varia por região/CEP, quem paga o frete de devolução) antes de colar em produção. Não copiar os valores de exemplo sem validar contra a política vigente da loja.

### Home — `Organization` com `contactPoint` e `@id` (mantendo `OnlineStore` como tipo, que já é válido)

```json
{
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": "https://www.tahora.com.br/#organization",
  "name": "Ta Hora",
  "legalName": "CH CFTV & Eletrônicos",
  "taxID": "46.340.461/0001-04",
  "url": "https://www.tahora.com.br",
  "logo": "https://www.tahora.com.br/uploads/logo-tahora.png",
  "telephone": "+55 11 98418-8541",
  "email": "icamera6688@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua André de Leão, 78 — Brás",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "postalCode": "03101-010",
    "addressCountry": "BR"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+55 11 98418-8541",
    "contactType": "customer service",
    "areaServed": "BR",
    "availableLanguage": ["Portuguese"]
  },
  "sameAs": [
    "https://www.mercadolivre.com.br/pagina/cftv_ch",
    "https://shopee.com.br/shop/1139914848",
    "https://instagram.com/tahora.com.br"
  ]
}
```

### Páginas estáticas — `BreadcrumbList` (exemplo `/sobre-nos`, replicar trocando `name`/`item`)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://www.tahora.com.br"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Sobre nós"
    }
  ]
}
```
