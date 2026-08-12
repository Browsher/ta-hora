# Auditoria SEO completa — tahora.com.br

**Data:** 12/08/2026
**Tipo de negócio detectado:** E-commerce (schema `OnlineStore`, 7 SKUs, checkout Mercado Pago)
**Stack:** Next.js App Router na Vercel, HTML 100% pré-renderizado
**Escopo:** 14 URLs (sitemap completo) — site inteiro, sem amostragem
**Especialistas executados:** technical, content, schema, sitemap, performance, visual, geo, sxo, ecommerce, backlinks

---

## SEO Health Score: **69/100**

| Categoria | Peso | Score | Contribuição |
|---|---|---|---|
| Technical SEO | 22% | 82 | 18,0 |
| Content Quality | 23% | 68 | 15,6 |
| On-Page SEO | 20% | 78 | 15,6 |
| Schema / Structured Data | 10% | 62 | 6,2 |
| Performance (CWV) | 10% | 42 | 4,2 |
| AI Search Readiness | 10% | 61 | 6,1 |
| Images | 5% | 72 | 3,6 |
| **Total** | | | **69,4** |

### Limitações desta auditoria (declaradas)

Sem credenciais configuradas para Google (PageSpeed, CrUX, Search Console, GA4), Moz, Bing Webmaster ou DataForSEO. Consequências concretas:

- **Performance é dado de laboratório**, não de campo. INP real não foi medido — INP só existe em campo; usamos TBT como proxy.
- **Indexação não foi verificada na fonte.** Nenhum bloqueio técnico foi encontrado, mas ninguém confirmou o que o Google de fato indexou.
- **Backlinks: sem score.** O domínio não aparece no Common Crawl e nenhuma outra fonte estava disponível.
- **Sem dados de SERP ao vivo** (posições, volume, CPC). A análise competitiva é qualitativa.

---

## Diagnóstico central

O site é **bem construído tecnicamente e mal posicionado estrategicamente**. Essas são duas conclusões separadas, e confundi-las levaria a otimizar a coisa errada.

O que está certo é substancial: HTML pré-renderizado, canonicais corretos, redirects apex→www e http→https funcionando, 404 real com noindex, sitemap 100% limpo (14/14 URLs em 200, sem redirect, sem noindex, canonical batendo com `<loc>`), titles e meta descriptions únicos nas 14 páginas, breadcrumbs em texto e em JSON-LD, CNPJ e endereço no rodapé de todas as páginas, alt text descritivo de qualidade acima da média do mercado. Boa parte do trabalho de SEO on-page que quebra sites comuns já está feita aqui.

O gargalo está em outro lugar. **Uma loja de 7 SKUs OEM não vai ganhar as head terms** ("câmera de segurança wifi", "câmera wifi para casa") — o SERP entrega esses termos a listicles (Techtudo), marketplaces (Mercado Livre, Amazon, Magalu) e páginas de categoria de marcas com autoridade (Intelbras, TP-Link). Não é um problema de otimização; é incompatibilidade de tipo de página e de autoridade. Nenhuma quantidade de ajuste on-page muda isso.

Agravante encontrado pelo especialista de e-commerce: os modelos (A31H, Q6, Q8, S8) são nomenclaturas de fábrica OEM chinesa revendidas por vários lojistas sob o mesmo nome. O produto não é exclusivo; a apresentação dele precisa ser.

Dois problemas atravessam quase todos os relatórios e valem mais que qualquer correção isolada:

**1. Confiança não está estruturada.** O SXO mediu Trust como a dimensão mais baixa em todas as 9 combinações persona×página (6–14 de 25). Há depoimentos na home, mas nenhuma PDP tem prova social — nem em texto, nem em `AggregateRating`/`Review`. A PDP é exatamente onde a compra acontece e onde o comprador cético de loja desconhecida decide. Persona "Cético em Loja Desconhecida" na PDP: 47/100.

**2. Performance mobile é ruim, e mobile é o que ranqueia.** LCP de 4,7s na home e 4,9s na PDP (Poor), TBT de 1,6–2,2s nas três páginas mobile. Home desktop tira 95 de Lighthouse com LCP 0,9s — ou seja, a arquitetura não é o problema, o custo de JavaScript em CPU mobile é. JS é 80–90% do peso da página (733–908 KB).

---

## Technical SEO — 82/100

### O que funciona
- Sitemap válido, declarado no robots.txt, 14/14 URLs em HTTP 200, sem redirects, sem noindex
- Canonicais self-referencing absolutos e corretos em home, catálogo e PDPs
- `meta robots: index, follow` correto; `noindex` correto na 404
- Redirect apex→www e http→https operando (308, sem loop); trailing slash normalizado
- HSTS presente em 100% das respostas
- 404 real (não soft-404), com página custom
- HTML totalmente pré-renderizado (`X-Nextjs-Prerender: 1`) — indexação não depende de JS
- TTFB de 10–60ms, edge cache da Vercel funcionando
- `loading="lazy"` consistente abaixo da dobra

### Findings
| # | Sev. | Finding | Evidência | Recomendação |
|---|---|---|---|---|
| T1 | **High** | Nenhum security header além de HSTS | home, catálogo, PDP e 404 testadas: sem CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` | Adicionar via `headers()` no `next.config`; CSP em report-only primeiro (há GA4 + CDN Shopify) |
| T2 | **High** | IndexNow não implementado | `/.well-known/indexnow.txt`, `/indexnow.txt`, `/api/indexnow` → todos 404 | Publicar chave e disparar POST na revalidação de PDP/preço |
| T3 | Medium | Cadeia de 2 redirects no apex HTTP | `http://tahora.com.br/` → `https://tahora.com.br/` → `https://www.tahora.com.br/` | Redirect direto no domain settings da Vercel |
| T4 | Medium | `Disallow: /carrinho` aponta para rota inexistente | `/carrinho` retorna 404 (`X-Matched-Path: /404`) — o carrinho é drawer client-side | Remover a regra morta |
| T5 | Low | Imagens de PDP sem `width`/`height` no HTML | dependem do CSS do container | Confirmar `aspect-ratio` fixo ou migrar para `next/image` |

---

## Content Quality — 68/100 · On-Page SEO — 78/100

### O que funciona
- Titles únicos (17–60 chars) e meta descriptions únicas (110–155 chars) nas 14 páginas
- H1 único por página, hierarquia H2/H3 consistente
- CNPJ, endereço e telefone no rodapé sitewide
- **A duplicação entre PDPs é menor do que o esperado para 7 SKUs da mesma categoria**: similaridade textual par-a-par de 12% a 59% (medida com `difflib`). A narrativa "SOBRE ESTE PRODUTO" é genuinamente diferente por produto — não é template com find-replace
- Garantia (3 meses), nota fiscal e 7 dias para devolução repetidos em todas as PDPs
- Tom pt-BR coloquial e concreto, adequado ao público leigo

### Findings
| # | Sev. | Finding | Evidência | Recomendação |
|---|---|---|---|---|
| C1 | Medium | Bullet idêntica em 7/7 PDPs | "Enxergue à noite em cores, e não só em sombras, com visão noturna colorida" — verbatim | Variar por modelo com o dado real de cada um |
| C2 | Medium | Bloco "Vale saber antes de comprar" quase idêntico em 6/7 PDPs | varia só "presa/fixada" e 1–2 detalhes | Converter em dado estruturado (ficha) ou reescrever com specs únicas |
| C3 | Medium | `/catalogo` com 202 palavras | H1 + 7 H2 com nome/preço, sem texto que ajude a escolher | Adicionar comparativo e orientação por caso de uso |
| C4 | Medium | Nenhum sinal de Expertise verificável | sem autoria, sem evidência de teste real, sem foto/vídeo próprios dos produtos | Fotos e vídeo próprios; quem testou e como |
| C5 | Low | Erro de dado na PDP Q8 | campo "Linha" mostra `EseeCloud`; nas outras 6 mostra "Câmera Segurança Wi-Fi" | Corrigir — é sinal de QA fraco visível ao cliente |
| C6 | Low | Depoimentos da home sem markup | só `OnlineStore` na home | Ver S2 |

Contagem de palavras: home 514, catálogo 202, sobre-nós 239, suporte 212, trocas 805, política 2.889, termos 3.975, PDPs 402–436 cada.

---

## Schema / Structured Data — 62/100

### O que funciona
- `Product` + `Offer` válidos e server-rendered nas 7 PDPs (name, image absoluta, description, sku, price, `priceCurrency: BRL`, availability, url, itemCondition), sem placeholders
- `BreadcrumbList` correto em `/catalogo` e nas 7 PDPs (posições sequenciais, URLs absolutas)
- Home com `legalName`, CNPJ, endereço completo, telefone, email, logo e `sameAs` (Mercado Livre, Shopee, Instagram)
- **Nenhum `aggregateRating` ou `review` inventado** — correto, dado que não há avaliações reais coletadas
- Nenhum `HowTo` (deprecado) nem `FAQPage` no site

### Findings
| # | Sev. | Finding | Evidência | Recomendação |
|---|---|---|---|---|
| S1 | **High** | `Offer` sem `brand`, `priceValidUntil`, `shippingDetails`, `hasMerchantReturnPolicy` | 7/7 PDPs | Não bloqueia o rich result básico, mas são as propriedades que sustentam exibição de preço/frete/devolução e são exigidas pelo Merchant Center. Snippets prontos em `findings/schema.md` — **os valores de prazo ali são placeholders estruturais, confira contra a política real antes de publicar** |
| S2 | **High** | Nenhuma prova social estruturada em nenhuma página | sem `AggregateRating`/`Review` nas 7 PDPs; depoimentos só na home, sem markup | Coletar avaliações reais e marcá-las. Nunca marcar avaliação que não exista |
| S3 | Medium | Sem `gtin`/`mpn`, só `sku` interno | 7/7 PDPs | Adicionar `mpn` (ou `gtin` se houver EAN de fábrica) — o Merchant Center desprioriza itens sem identificador |
| S4 | Medium | `OnlineStore` sem `@id` estável; `Offer.seller` é entidade solta | `{"@type":"Organization","name":"Ta Hora"}` sem link para os dados ricos da home | Usar `@id: https://www.tahora.com.br/#organization` e referenciar nas PDPs |
| S5 | Low | Páginas institucionais sem JSON-LD | `/sobre-nos`, `/suporte`, políticas | Estender `BreadcrumbList` por consistência |
| S6 | Info | `/catalogo` sem `ItemList`/`CollectionPage` | — | Sem SERP feature associada; opcional |

**Nota sobre FAQ:** dois especialistas recomendaram adicionar `FAQPage`. **Descartado.** O Google aposentou os rich results de FAQ para todos os sites em 07/05/2026 — não há feature de SERP a capturar. Se `/suporte` tiver Q&A genuíno de usuários, `QAPage` é o tipo correto; caso contrário, não vale o esforço.

---

## Performance (CWV) — 42/100

**Dados de laboratório** (Lighthouse 13.4.1, Chromium headless local). Sem chave do Google, CrUX e PSI não estavam disponíveis. INP real não foi medido — é métrica exclusivamente de campo.

| Página | Disp. | Score LH | LCP | TBT (proxy INP) | CLS | TTFB | Peso |
|---|---|---|---|---|---|---|---|
| Home | Mobile | 54 | **4,7s Poor** | 2.130ms | 0,002 Good | 60ms | 873 KB / 22 req |
| Home | Desktop | 95 | 0,9s Good | 170ms | 0,000 Good | 10ms | 873 KB / 22 req |
| Catálogo | Mobile | 68 | **2,7s N.I.** | 2.190ms | 0,000 Good | 10ms | 1.016 KB / 36 req |
| PDP A31H | Mobile | 55 | **4,9s Poor** | 1.620ms | 0,000 Good | 10ms | 1.414 KB / 41 req |

Catálogo e PDP em desktop não foram medidos (risco baixo, dado o 95 da home desktop).

### O que funciona
- CLS praticamente zero em tudo (0,000–0,002)
- Preload + `fetchPriority="high"` no hero da home implementado corretamente e confirmado como o LCP real
- TTFB de 10–60ms

### Findings
| # | Sev. | Finding | Evidência | Recomendação |
|---|---|---|---|---|
| P1 | **High** | LCP mobile Poor na home (4,7s) e PDP (4,9s) | Lighthouse mobile | Home: a imagem já está priorizada, o gargalo é JS bloqueando a main thread antes do paint. Catálogo/PDP: a imagem do CDN Shopify é o LCP e não tem prioridade |
| P2 | **High** | TBT de 1,6–2,2s em mobile nas 3 páginas | `mainthread-work-breakdown` 4,8–6,8s/página; chunk `329j824l1odqw.js` é o maior custo, maior que o GA4 | Code-splitting nesse chunk. TBT nesse patamar é sinal forte (não confirmado) de INP "Poor" no campo |
| P3 | Medium-High | JS é 80–90% do peso | 733 KB (home), 908 KB (catálogo e PDP); dezenas de KB de `unused-javascript` | Auditar bundle, remover não usado |
| P4 | Medium | GA4 consome 600–900ms de main thread e 52–62 KB não usados por página | Lighthouse | `strategy="lazyOnload"` no `<Script>` do gtag |
| P5 | Medium | Imagem LCP de catálogo/PDP sem `fetchPriority`/preload | diferente da home | Replicar o padrão do hero |

---

## Images — 72/100

Alt text é o ponto alto: descritivo, específico e detalhado nas 7 PDPs e no catálogo — bem acima do padrão de e-commerce. Formatos WebP em uso. Os problemas são de layout e de conteúdo dentro da imagem, não de peso.

- **Medium** — Texto essencial embutido em imagem na PDP: infográficos "01 Duas lentes, mais segurança" e "02 Mais cobertura, mais controle" trazem specs (Full HD, PTZ, zoom 4x) só como pixel. Invisível para busca e para leitor de tela. Migrar para HTML ou duplicar abaixo da imagem.
- **Low** — `<img>` sem `width`/`height` explícitos (o CLS medido está ótimo, então é prevenção, não correção).

---

## AI Search Readiness (GEO) — 61/100

| Dimensão | Peso | Nota |
|---|---|---|
| Citabilidade | 25% | 60 |
| Estrutura/legibilidade | 20% | 65 |
| Conteúdo multimodal | 15% | 45 |
| Autoridade e marca | 20% | 40 |
| Acessibilidade técnica | 20% | 90 |

### O que funciona
- `robots.txt` permissivo — nenhum crawler de IA bloqueado (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Bingbot)
- SSR completo: o HTML bruto já entrega specs, FAQ e schema, sem gap para crawler sem JS
- Specs em texto label:valor, FAQ em blocos autocontidos de 134–167 palavras (comprimento ideal para citação)

### Findings
| # | Sev. | Finding | Recomendação |
|---|---|---|---|
| G1 | **High** | Sem conteúdo comparativo entre os 7 modelos | `/catalogo` tem 219 palavras e nenhuma tabela. É o que um assistente precisa para recomendar um produto |
| G2 | Medium | Campo "Resolução" não é comparável | varia entre `HD`/`Full HD`/`4K Ultra HD`/`3K Vertical` (marketing, não medida); os outros 6 campos de spec são "Sim" idêntico nos 7 modelos | Usar unidades objetivas: MP, metros de alcance IV, graus de FOV |
| G3 | Medium | Sem presença de marca verificável fora do site | `sameAs` só com Mercado Livre, Shopee, Instagram | YouTube tem a correlação mais forte com citação por IA e é provavelmente o maior gargalo de autoridade |
| G4 | Low | `llms.txt` ausente (404) | Opcional, o Google ignora. Não priorizar |

Os scores por plataforma estimados pelo especialista (Google AIO ~55, ChatGPT ~50, Perplexity ~55, Bing Copilot ~50) são estruturais, **não são citações observadas** — não havia ferramenta de rastreamento de menção nesta sessão.

---

## SXO — Search Experience

**Achado principal:** o site é tecnicamente correto mas mira termos cujo tipo de página vencedor ele não oferece e cuja autoridade ele não tem.

| Página | Tipo atual | Tipo que o SERP premia | Veredicto |
|---|---|---|---|
| Home | Landing/Hybrid | Listicle/Comparison | **High** — execução boa, alvo incompatível |
| Catálogo | Category/Listing | Category/Comparison | **Medium** — tipo certo, falta estrutura comparativa |
| PDP | Product Page | Product Page | **High na execução** — tipo certo, sem prova social |

Dois achados específicos merecem decisão:

- **O SKU foi renomeado de "A31" para "A31H"**, e "A31" é o nome OEM que fabricante e revendedores usam. A renomeação perdeu a cauda longa de modelo — que é justamente o espaço ganhável.
- `site:tahora.com.br` não retornou resultados na verificação do especialista, que levantou risco de indexação. **Verificado no Search Console em 12/08/2026: as páginas estão indexadas.** Era limitação do método de consulta, não bloqueio — consistente com o que o especialista técnico já havia apurado. Item encerrado.

**Espaço realisticamente ganhável:** cauda longa por modelo e por uso ("câmera lâmpada wifi sem fio", "câmera A31 vale a pena", "como configurar iCSee", "câmera sem mensalidade"), busca de marca, e conteúdo informacional que marketplaces não atendem com profundidade.

---

## Backlinks — sem score (dados insuficientes)

Tier 0: apenas Common Crawl e crawler de verificação disponíveis.

- **Medido:** o domínio **não está** no Common Crawl Web Graph (`in_crawl: false`, release cc-main-2026-jan-feb-mar). Isso significa ausência de crawl, **não** autoridade zero — é o esperado para um site novo.
- **Não medido:** DA/PA, referring domains, spam score, âncoras, follow/nofollow, velocidade de link, menções não linkadas. O especialista tentou buscar menções via Bing e recebeu resposta genérica (bloqueio anti-bot) — **descartou o resultado em vez de reportar "zero menções"**, o que teria sido uma inferência apresentada como fato. Decisão correta.

Uma chave gratuita do Moz (2.500 linhas/mês) é o maior custo-benefício para destravar DA/PA e spam score.

---

## Sitemap

Limpo. XML válido, declarado no robots.txt, 14/14 em 200, canonical batendo com `<loc>` em todas, cobertura 1:1 com os links do catálogo, nenhuma órfã. Dois ajustes menores:

- **Low** — `lastmod` idêntico ao milissegundo nas 14 URLs (`2026-08-12T13:08:38.938Z`): é timestamp de build, não data real de modificação. Um valor sistematicamente falso pode fazer o Google descontar o campo no domínio inteiro. Usar `updatedAt` real ou omitir.
- **Info** — `changefreq` e `priority` são ignorados pelo Google. Podem sair.

A hipótese de redirect na home (`<loc>` sem barra final) foi **testada e descartada**: as duas formas retornam 200 com mesmo Etag, sem redirect.

---

## Visual e mobile

Screenshots em `screenshots/` (12 arquivos, 3 páginas × 2 viewports × fold/full). Presets do script: desktop 1920×1080, mobile 375×812.

### O que funciona
- Home mobile e desktop: H1, subcopy, prova social e ambos os CTAs acima da dobra
- PDP desktop: nome, preço, parcelamento, selos e CTA acima da dobra
- Sem overflow horizontal em nenhuma das 6 capturas

### Findings
- **Medium** — PDP mobile: o CTA "Adicionar ao carrinho" aparece como uma faixa de ~10px no rodapé da viewport. Compactar o bloco imagem/preço ou usar CTA sticky.
- **Low** — Catálogo mobile: chips de filtro ocupam 2 linhas e empurram preço e "Ver detalhes" do primeiro produto para fora da dobra.
- **Low** — Home mobile: hero sem foto de produto acima da dobra (o desktop tem).
- **Informativo** — As capturas full-page da home mostram grandes vãos brancos; provável artefato de reveal-on-scroll que não dispara em captura full-page. Vale confirmar com scroll real; se o mesmo padrão afetar conexões lentas, vira problema real.
