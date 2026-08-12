# Performance / Core Web Vitals — tahora.com.br

**Método:** dados de LABORATÓRIO (Lighthouse 13.4.1 via CLI local, Chromium headless), NÃO dados de campo (CrUX). Não há chave de API do Google configurada neste ambiente, então PageSpeed Insights / CrUX API não estavam disponíveis. Os números abaixo refletem uma única execução simulada por página/dispositivo (mobile: emulação Moto G Power + rede/CPU throttling "simulate" padrão do Lighthouse; desktop: `--preset=desktop`, sem throttling de rede/CPU). **Todo peso de imagem foi medido normalmente pelo Chromium real (envia `Accept: image/webp,...` nativamente), então não há o viés de CDN servindo original sem negociação de conteúdo.**

Escopo efetivamente medido (reduzido por custo/tempo, conforme combinado): mobile das 3 páginas + desktop apenas da home. Catálogo e PDP em desktop **não foram medidos** — dado o desktop da home já saiu excelente (score 95) e a maior parte do tráfego/risco de CWV em e-commerce está em mobile, a lacuna é de baixo risco, mas fica registrada.

## Números medidos

| Página | Dispositivo | Score Lighthouse | LCP | TBT (proxy de INP em lab) | CLS | TTFB | Peso total | Requests |
|---|---|---|---|---|---|---|---|---|
| Home (`/`) | Mobile | 54 | **4.7s (Poor)** | 2.130ms | 0.002 (Good) | 60ms | 873 KB (22 req) | — |
| Home (`/`) | Desktop | 95 | 0.9s (Good) | 170ms | 0.000 (Good) | 10ms | 873 KB (22 req) | — |
| Catálogo (`/catalogo`) | Mobile | 68 | **2.7s (Needs Improvement)** | 2.190ms | 0.000 (Good) | 10ms | 1.016 KB (36 req) | — |
| PDP A31H (`/produtos/camera-seguranca-a31h`) | Mobile | 55 | **4.9s (Poor)** | 1.620ms | 0.000 (Good) | 10ms | 1.414 KB (41 req) | — |

Lighthouse (lab, mesmo em v13 com auditorias "insight-based") não mede INP real — INP é estritamente um metric de campo (requer interação real do usuário). A tabela usa **Total Blocking Time (TBT)** como proxy de laboratório mais próximo. TBT de 1,6–2,2s é extremamente alto e é fortemente preditivo de INP "Poor" (>500ms) no campo para usuários em aparelhos médios/baixos — não é possível confirmar sem CrUX, mas o sinal é forte e consistente nas 3 páginas.

### LCP: qual elemento é, por página

- **Home (mobile):** o elemento LCP É de fato `<img src="/uploads/Promocao_placa.webp" fetchpriority="high">` dentro de `div.hero-split__midia` — confirma a hipótese. O preload com `fetchPriority="high"` está funcionando corretamente (`priorityHinted: true`, `requestDiscoverable: true`, não é lazy). Ainda assim o LCP fecha em 4.7s (Poor). O breakdown do Lighthouse (trace observado, não o valor Lantern simulado usado no numeric score) atribui só ~200ms a TTFB, ~236ms a delay de carregamento do recurso e ~134ms ao download da imagem — a imagem em si não é o gargalo. O grosso do tempo até a pintura vem de JavaScript bloqueando a main thread antes do paint (compatível com TBT de 2,1s na mesma página).
- **Catálogo (mobile):** o elemento LCP é uma imagem de produto hospedada em `cdn.shopify.com` (`A31H3_4.png`) dentro do primeiro card do grid. **Não tem `fetchpriority="high"` nem preload** — Lighthouse sinaliza explicitamente `"fetchpriority=high should be applied to the image preload request": false`.
- **PDP A31H (mobile):** mesmo padrão — a imagem principal do produto (`cdn.shopify.com/.../A31H3_4.png`) é o LCP e também não tem `fetchpriority="high"`/preload.

### Peso e composição

- **JavaScript é o maior custo de bytes em todas as páginas**: Home 733 KB de script (14 requests) sobre 873 KB totais; Catálogo 908 KB de script sobre 1.016 KB; PDP 908 KB de script sobre 1.414 KB. Em nenhuma página o script cai abaixo de 80% do peso total.
- **Third-party**: Home 211 KB / 5 requests; Catálogo 255 KB / 8 requests; PDP 656 KB / 14 requests (maior carga de terceiros do site). O GA4 (`googletagmanager.com/gtag/js?id=G-JJZCVTKPQM`) aparece em todas as páginas com 600–900ms de tempo de main thread (`bootup-time`) e 53–62 KB de JS não utilizado (`unused-javascript`). Consistente com a nota já registrada de que o site só tem GA4 (sem Meta Pixel).
- **Chunk único domina o main thread em todas as páginas**: `329j824l1odqw.js` aparece no topo do `bootup-time` em Home (2.037ms), Catálogo (1.909ms) e PDP (1.558ms) — é o maior candidato a "long task" isolado do bundle da aplicação, maior até que o GA4.
- **Imagens**: Home 133 KB (4 imagens) — leve; Catálogo 95 KB (6 imagens); PDP 497 KB (12 imagens) — a PDP carrega bem mais imagem (galeria de produto), mas ainda assim script > imagem em peso.
- **CSS/render-blocking**: só 1 stylesheet por página (~7-8 KB), Lighthouse aponta ~160-175ms de savings possíveis com defer/inline, impacto pequeno comparado ao JS.

### O que funciona

- **CLS excelente em todas as páginas e dispositivos** (0.000–0.002) — sem indício de layout shift por imagem sem dimensão, fonte ou conteúdo injetado tardiamente.
- **Preload + fetchPriority=high da imagem hero da home está implementado corretamente** e o Lighthouse confirma que o elemento LCP é exatamente essa imagem, descoberta no HTML inicial, sem lazy-load — a técnica está certa, o problema é o que compete com ela (JS bloqueando).
- **Desktop da home está com CWV excelentes** (LCP 0.9s, TBT 170ms, score 95) — mostra que o problema mobile é primariamente de CPU/rede em throttling, não de arquitetura da página.
- **TTFB baixo em todas as páginas** (10-60ms) — Vercel/Next.js App Router com cache de borda (`X-Vercel-Cache: HIT`, `Age: 297` visto na home) está entregando HTML rapidamente; TTFB não é gargalo.

## Findings

### 1. LCP mobile "Poor" na Home e na PDP, "Needs Improvement" no Catálogo — Severidade: Alta
**Evidência:** Home 4.7s, PDP 4.9s (ambos acima do limiar Poor de 4.0s), Catálogo 2.7s (dentro da faixa Needs Improvement 2.5–4.0s). Google avalia o **p75** de campo — mesmo que a mediana de campo seja melhor que o lab, esses números de lab indicam risco real de não passar no p75 em conexões/aparelhos medianos a ruins, que são maioria do tráfego mobile no Brasil.
**Recomendação:** na Home, o gargalo já não é a imagem (que está corretamente priorizada) e sim JavaScript bloqueando a main thread antes do paint — ver finding #3. No Catálogo e na PDP, aplicar `fetchPriority="high"` e/ou `<link rel="preload">` na imagem de produto que é o LCP de cada página (mesma técnica já usada na home), e considerar servir essas imagens de produto via um loader de imagem com dimensões fixas para evitar reflow adicional.

### 2. TBT extremamente alto em mobile (1.6–2.2s) em todas as páginas — proxy de INP provavelmente "Poor" no campo — Severidade: Alta
**Evidência:** TBT Home 2.130ms, Catálogo 2.190ms, PDP 1.620ms. `mainthread-work-breakdown` de 4.8–6.8s por página. Não há dado de INP de campo disponível (sem CrUX), mas TBT nessa faixa é um sinal forte de INP ruim em aparelhos médios/baixos.
**Recomendação:** Investigar o chunk `329j824l1odqw.js` (maior custo de main thread em todas as 3 páginas, até maior que o próprio GA4) — provavelmente um bundle vendor/framework compartilhado; avaliar code-splitting adicional, lazy-loading de componentes não críticos acima da dobra, e mover trabalho não essencial para depois do primeiro paint. Revisar também se há polyfills ou parsing desnecessário nesse chunk.

### 3. JavaScript domina o peso da página (80–90% do total) em todas as páginas — Severidade: Média-Alta
**Evidência:** Home 733/873 KB de script, Catálogo 908/1.016 KB, PDP 908/1.414 KB. `unused-javascript` mostra dezenas de KB de código não utilizado por página (ex.: 124 KB não usados no chunk `3t8atguvs-5uq.js` da PDP).
**Recomendação:** Auditar bundle com `next build --profile` / bundle analyzer para identificar código morto e dependências grandes carregadas globalmente quando poderiam ser por rota. Priorizar CSS crítico inline + defer do stylesheet único (economia estimada de ~160-175ms pelo próprio Lighthouse, ganho pequeno mas gratuito).

### 4. GA4 consome 600-900ms de main thread e ~53-62 KB de JS não usado em todas as páginas — Severidade: Média
**Evidência:** `gtag/js?id=G-JJZCVTKPQM` presente no top-5 de `bootup-time` em Home (617ms), Catálogo (903ms) e PDP (638ms); `unused-javascript` mostra 52-62 KB de código do gtag.js não utilizado no carregamento da página.
**Recomendação:** carregar o gtag com `strategy="afterInteractive"` ou `"lazyOnload"` (Next.js `<Script>`) se ainda não estiver, e considerar Server-Side GTM / Measurement Protocol para reduzir o payload no cliente. Não é o maior ofensor (perde para o chunk de app), mas é o único item claramente de terceiro identificado e fácil de isolar/medir separadamente.

### 5. Imagens LCP de Catálogo/PDP sem `fetchPriority`/preload, diferente da Home — Severidade: Média
**Evidência:** Lighthouse `lcp-discovery-insight` reporta `priorityHinted: false` para as imagens LCP do Catálogo e da PDP (ambas hospedadas em `cdn.shopify.com`), enquanto a Home tem `priorityHinted: true`.
**Recomendação:** replicar o padrão já usado na Home (preload + `fetchPriority="high"` na primeira imagem do grid do catálogo e na imagem principal da PDP). Ganho esperado limitado no lab (resourceLoadDelay já é baixo: 88-54ms) mas remove uma variável e é consistente com a boa prática já adotada alhures no site.

### 6. Desktop e Catálogo/PDP desktop não medidos neste ciclo — Severidade: Informativo (gap de cobertura)
**Evidência:** por decisão de escopo (custo/tempo), apenas a home foi medida em desktop (score 95, CWV bons). Catálogo e PDP desktop ficaram de fora.
**Recomendação:** medir em ciclo futuro, mas risco é baixo dado que (a) desktop tende a ter mais CPU/rede disponível que mobile e (b) a home desktop já mostrou que a arquitetura da página em si é rápida quando não throttled — o problema concentrado é mobile.
