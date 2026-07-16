# Product — Ta Hora

## O que é

**Ta Hora** é o site/loja (storefront) de uma marca do segmento de **segurança /
vigilância** — vende **câmeras de segurança e acessórios**. (O diretório irmão
`meli-iluminacao` é de outro projeto e NÃO define a categoria desta marca.) A
base do site foi gerada por um **"Builder" visual** separado — ela "roda sozinha,
sem depender do builder" (README) — e sobre ela foi construída a **loja headless
com dados da Shopify**. É uma **loja de verdade que vamos crescer**, não um
template.

## Segmento & catálogo

- **Segmento:** segurança / vigilância eletrônica.
- **Produtos:** câmeras de segurança (ex.: internas/externas, Wi-Fi, IP) e
  acessórios (cabos, fontes, cartões, suportes, kits DVR/NVR — a definir no
  catálogo). Atributos de produto do catálogo devem refletir esse segmento
  (resolução, visão noturna, tipo de conexão, etc.), não iluminação.
- **Catálogo:** vem da **Shopify** (Storefront API), não de JSON.
- **Premissa vigente — produtos sem variantes:** cada produto publicado tem
  **exatamente 1 variante** (a opção `Cor` existe, mas com um único valor). Por
  isso não há seletor de variante. Se essa premissa cair, há salvaguarda: ver
  `npm run verificar:variantes`.

## Problema que resolve

Dar à marca uma **presença própria e um canal de venda direto**, fora dos
marketplaces: uma vitrine rápida e bonita onde o cliente **compra no próprio
site** — catálogo, carrinho e checkout — além de conhecer produtos, provas
sociais e a história da marca.

Os marketplaces (Mercado Livre, TikTok Shop) **continuam existindo como canal**.
O que muda é que o site deixou de ser apenas uma vitrine que encaminha para eles:
agora ele vende.

### Como os dois canais se relacionam (RESOLVIDO — não é conflito)

- A **Home** é dedicada à **venda direta**: `Hero`, `ProductGrid`, `CTAFinal`,
  navbar/rodapé apontando para `/catalogo`. **Não há nenhum link de marketplace
  na Home** (verificado em `layouts/_home.json`).
- A seção **`Marketplaces` aparece SÓ em `/sobre-nos`** (verificado em
  `layouts/sobre-nos.json`), e o propósito dela é **prova social / confiança** —
  mostrar a reputação da marca ("Mais de 10 mil vendas em marketplaces e agora
  com site próprio!"), não desviar a venda.
- Portanto os canais **não competem**: a reputação no Mercado Livre **trabalha a
  favor** da venda direta, dando credibilidade ao site novo. Nenhuma mudança de
  layout é necessária.

## Usuários

- **Clientes finais** que chegam pelo site (busca, redes, links de marketplace),
  navegam produtos e **compram no próprio site** — carrinho e checkout hospedado
  da Shopify (Mercado Pago como gateway). O site nunca processa pagamento.
- **A marca (dono/operador)** que edita conteúdo, adiciona páginas/seções e
  publica o site; e que gere produtos, preços, estoque e cupons **na Shopify**
  (não no código).

## Estado atual

- **Páginas de conteúdo (JSON, SSG):** Home (`layouts/_home.json`) e Sobre Nós
  (`layouts/sobre-nos.json`).
- **Rotas da loja (Shopify, ISR 300s):** `/catalogo` e `/produtos/[handle]`.
- **Seções disponíveis:** Hero, BenefitsCard, CTAFinal, FAQ, Features, Footer,
  Navbar, HowItWorks, ProductGrid, Testimonials, Marketplaces.
- **Canais referenciados:** Mercado Livre
  (`https://www.mercadolivre.com.br/pagina/cftv_ch`) e TikTok e-commerce —
  registrados na seção `Marketplaces` de `sobre-nos.json`.

## Objetivos / direção

Priorização de trabalho combinada com o usuário (mais importante primeiro):

1. **Loja headless (e-commerce)** — catálogo ✅ (spec `catalogo-loja`); **carrinho
   e checkout** com a Shopify Cart API (spec `carrinho-loja`).
2. **Deploy & performance** — hospedagem na **Vercel** (runtime/ISR), SEO,
   velocidade e acessibilidade.
3. **Conteúdo & layout** — editar os JSONs de layout, copy, páginas e tema/paleta.
4. **Novas seções/componentes** — criar seções e registrá-las no `componentMap`.

## Princípios de produto

- **Conteúdo dirigido por dados:** cada página de conteúdo é um `Layout` (JSON)
  com uma lista ordenada de `sections`. Mudar conteúdo = editar JSON, não código.
  *Exceção consciente:* a UI da loja (catálogo, carrinho) não é dirigida por JSON
  — é código, porque os dados vêm da Shopify.
- **A Shopify é a fonte da verdade comercial:** preço, estoque, totais e cupons
  vêm sempre da API — o site não calcula dinheiro nem mantém regra de cupom.
- **Acessibilidade por padrão:** o site respeita `prefers-reduced-motion` e usa
  `contrastColor` para pares de cor. *Atenção:* o `MotionConfig reducedMotion="user"`
  cobre **apenas** o `PreviewContent` (Home e Sobre Nós) — componentes fora dele
  precisam do seu próprio. Ver `tech.md` → "Sistema de efeitos".
- **Compatibilidade retroativa:** JSONs exportados por versões antigas do Builder
  devem continuar abrindo sem migração manual (ver helpers de migração em
  `lib/types.ts` e `lib/paleta.ts`).
