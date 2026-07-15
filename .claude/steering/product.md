# Product — Ta Hora

## O que é

**Ta Hora** é o site/loja (storefront) de uma marca do segmento de **segurança /
vigilância** — vende **câmeras de segurança e acessórios**. (O diretório irmão
`meli-iluminacao` é de outro projeto e NÃO define a categoria desta marca.) O
site é o **export/build de um "Builder" visual** separado — ele "roda sozinho,
sem depender do builder"
(README). Este repositório é o **ponto de partida da loja headless** e, a partir
daqui, é uma **loja de verdade que vamos crescer** (não apenas um template).

## Segmento & catálogo

- **Segmento:** segurança / vigilância eletrônica.
- **Produtos:** câmeras de segurança (ex.: internas/externas, Wi-Fi, IP) e
  acessórios (cabos, fontes, cartões, suportes, kits DVR/NVR — a definir no
  catálogo). Atributos de produto do catálogo devem refletir esse segmento
  (resolução, visão noturna, tipo de conexão, etc.), não iluminação.
- **URLs das lojas nos marketplaces (Mercado Livre / TikTok Shop):** _a registrar
  depois, no trabalho da página "Sobre Nós"._

## Problema que resolve

Dar à marca uma presença própria fora dos marketplaces — uma vitrine rápida,
bonita e hospedável em qualquer lugar — que canaliza tráfego para os canais de
venda (Mercado Livre, TikTok Shop) e apresenta produtos, provas sociais e a
história da marca.

## Usuários

- **Clientes finais** que chegam pelo site (busca, redes, links de marketplace)
  e navegam produtos / vão para o checkout nos marketplaces.
- **A marca (dono/operador)** que edita conteúdo, adiciona páginas/seções e
  publica o site estático.

## Estado atual

- **Páginas:** Home (`layouts/_home.json`) e Sobre Nós (`layouts/sobre-nos.json`).
- **Seções disponíveis:** Hero, BenefitsCard, CTAFinal, FAQ, Features, Footer,
  Navbar, HowItWorks, ProductGrid, Testimonials, Marketplaces.
- **Canais referenciados:** Mercado Livre e TikTok e-commerce (`public/uploads/`).

## Objetivos / direção

Priorização de trabalho combinada com o usuário (mais importante primeiro):

1. **Loja headless (e-commerce)** — catálogo, carrinho e checkout com dados da
   **Shopify** (Storefront API). Exige runtime SSR/ISR (ver `tech.md` → "Modelo de
   build") — sai do static export atual.
2. **Deploy & performance** — hospedagem na **Vercel** (runtime/ISR),
   SEO, velocidade e acessibilidade.
3. **Conteúdo & layout** — editar os JSONs de layout, copy, páginas e tema/paleta.
4. **Novas seções/componentes** — criar seções e registrá-las no `componentMap`.

## Princípios de produto

- **Conteúdo dirigido por dados:** cada página é um `Layout` (JSON) com uma lista
  ordenada de `sections`. Mudar conteúdo = editar JSON, não código.
- **Acessibilidade por padrão:** o site respeita `prefers-reduced-motion`
  (`MotionConfig reducedMotion="user"`) e usa `contrastColor` para pares de cor.
- **Compatibilidade retroativa:** JSONs exportados por versões antigas do Builder
  devem continuar abrindo sem migração manual (ver helpers de migração em
  `lib/types.ts` e `lib/paleta.ts`).
