# Technical SEO — tahora.com.br

Audit date: 2026-08-12. Site: Next.js App Router (Turbopack build), hospedado na Vercel, prerender estático (ISR) confirmado por `X-Nextjs-Prerender: 1` + `X-Vercel-Cache: HIT` em todas as páginas testadas.

## Score: 82/100

## O que funciona

- Sitemap.xml declarado no robots.txt, válido (`urlset`, 200, XML bem formado), acessível em `https://www.tahora.com.br/sitemap.xml`, cobre as 14 URLs do site com `lastmod`/`changefreq`/`priority` coerentes.
- Todas as 14 URLs do sitemap retornam HTTP 200 (checado individualmente).
- Canonicais self-referencing corretos e absolutos em home, catálogo e páginas de produto (`<link rel="canonical" href="https://www.tahora.com.br/...">`), sem parâmetros.
- `meta name="robots" content="index, follow"` presente e correto nas páginas indexáveis; página 404 usa `noindex` corretamente.
- Redirecionamento apex→www e http→https funcionando (308 permanente), sem loops.
- Trailing slash normalizado: `/catalogo/` → 308 → `/catalogo`.
- HTTPS ativo em todo o site, com `Strict-Transport-Security: max-age=63072000` presente em 100% das respostas testadas.
- 404 real (HTTP 404, não soft-404) para URLs inexistentes, com página custom amigável e `noindex` correto.
- Viewport mobile correto: `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- Renderização: HTML já vem totalmente prerenderizado no servidor (conteúdo completo presente no primeiro response, incluindo JSON-LD, imagens, texto) — não depende de JS no cliente para indexação.
- Structured Data presente: `Product` (com `sku`, `offers.price/priceCurrency/availability/itemCondition`) e `BreadcrumbList` nas PDPs, validados como UTF-8 correto (bytes `\xc3\xa2`/`\xc3\xa7` = "â"/"ç", confirmado via inspeção de bytes brutos — não há mojibake real).
- LCP image da home tem `fetchPriority="high"` + `<link rel="preload" as="image">` correspondente — boa prática para LCP.
- Imagens abaixo da dobra usam `loading="lazy"` consistentemente.
- robots.txt permissivo e correto: `Allow: /`, `Disallow: /api/`, `Disallow: /carrinho`, `Sitemap:` declarado.
- URLs limpas, sem parâmetros de sessão/tracking, estrutura `/produtos/<slug>` semântica.

## Findings

### High

1. **Nenhum security header além de HSTS.** Testado em home, catálogo, PDP e 404 — `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy` ausentes em todas as respostas.
   - Evidência: header dump de `https://www.tahora.com.br/` só contém `Strict-Transport-Security: max-age=63072000` como header de segurança; mesmo padrão em `/catalogo`, `/produtos/camera-seguranca-a31h` e na página 404.
   - Impacto: não é um fator de ranking direto, mas Search Console/Lighthouse sinalizam como "Best Practices" reduzido, e a ausência de `X-Content-Type-Options: nosniff` e `X-Frame-Options`/CSP `frame-ancestors` expõe a superfícies de clickjacking/MIME-sniffing — relevante para e-commerce com checkout.
   - Recomendação: no Next.js, adicionar em `next.config.js` (`headers()`) ou middleware:
     - `X-Content-Type-Options: nosniff`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
     - `X-Frame-Options: SAMEORIGIN` (ou CSP `frame-ancestors 'self'`)
     - CSP começando em modo report-only dado o uso de GTM/GA4 e Shopify CDN de imagens, para mapear domínios antes de aplicar enforcement.

2. **IndexNow não implementado.** Nenhum arquivo de chave em `/`, `/.well-known/indexnow.txt`, `/indexnow.txt` ou `/api/indexnow` (todos 404).
   - Impacto: Bing e Yandex dependem de crawling agendado em vez de notificação instantânea nas 14 URLs (baixo volume, mas trivial de implementar e o site já tem `changefreq: daily/weekly` sugerindo atualizações frequentes de catálogo/preço).
   - Recomendação: gerar uma chave, publicar em `/{chave}.txt` (Next.js: rota estática ou `public/`), e disparar POST para `api.indexnow.org` a cada publish/revalidate de PDP ou preço (o app já usa ISR/ on-demand revalidation pela Vercel — bom gancho para acoplar o ping).

### Medium

3. **Cadeia de redirect de 2 saltos no apex HTTP.** `http://tahora.com.br/` → 308 → `https://tahora.com.br/` → 308 → `https://www.tahora.com.br/` (2 redirects até a URL canônica). `http://www.tahora.com.br/` já é direto (1 salto).
   - Evidência: `curl -I http://tahora.com.br/` devolve `Location: https://tahora.com.br/` (apex, sem www); só a segunda resposta redireciona para `www`.
   - Impacto: latência extra e diluição marginal de link equity para quem linka o domínio nu sem `www`; baixo volume de tráfego esperado nesse padrão, mas fácil de corrigir.
   - Recomendação: configurar o redirect do domínio apex na Vercel para ir direto a `https://www.tahora.com.br/` (pular o hop intermediário), ou usar `permanent-redirect` no domain settings apontando direto para o host canônico com upgrade de esquema incluso.

4. **`Disallow: /carrinho` no robots.txt aponta para uma rota que não existe como página.** `/carrinho` responde HTTP 404 (`X-Matched-Path: /404`) — o carrinho é um drawer/modal client-side (`CarrinhoDrawer`), não uma rota Next.js própria.
   - Impacto: não é danoso, mas é uma regra morta/confusa em robots.txt; se o `/api/` do carrinho for a real preocupação, a rota já está coberta por `Disallow: /api/`.
   - Recomendação: remover `Disallow: /carrinho` do robots.txt (rota inexistente) ou confirmar se há planos de rota `/carrinho` SSR futura — se sim, manter; se não, limpar.

5. **JSON-LD `Product` sem `brand` e sem `aggregateRating`/`review`.** Apenas `name`, `image`, `description`, `sku`, `offers` presentes.
   - Impacto: `brand` é campo recomendado pelo Google para elegibilidade em Merchant/rich results de produto; sem ele, PDPs têm chance reduzida de exibir rich snippet completo mesmo com `offers` válido.
   - Recomendação: adicionar `"brand": {"@type": "Brand", "name": "Ta Hora"}` (ou marca real do fabricante, se aplicável) ao schema `Product` de cada PDP; considerar `aggregateRating` quando houver avaliações reais (não fabricar dados).

### Low

6. **Imagens de produto sem atributos `width`/`height` explícitos no `<img>`.** Todas as imagens de galeria em PDP usam `style="width:100%;height:100%;object-fit:cover"` sem `width`/`height` HTML attributes nem `sizes`; dimensionamento depende inteiramente do container CSS.
   - Impacto: risco de CLS se o container pai não tiver `aspect-ratio`/altura fixa antes da imagem carregar — não foi possível confirmar CLS real sem medição em campo/lab, mas o padrão de código é um risco potencial listado explicitamente no seu skill de CWV.
   - Recomendação: confirmar que os containers de imagem têm `aspect-ratio` CSS fixo (parece ser o caso pelo padrão de layout visto), ou preferir `next/image` com `width`/`height` explícitos para eliminar a ambiguidade e ganhar otimização automática de formato/tamanho.

7. **`Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`** em todas as páginas HTML — comportamento padrão do Next.js App Router para RSC, não é um problema, mas vale monitorar se algum CDN/proxy externo (ex.: WAF corporativo do cliente) normaliza mal esse header, já que ele pode fragmentar cache por variações de client hints em CDNs mal configuradas. Nenhuma evidência de problema real hoje — listado como observação, não como bug.

### Info

- FID não é mais reportado por nenhuma ferramenta de campo (removido do CrUX/PSI em set/2024); INP é a métrica de interatividade vigente — nenhuma referência a FID encontrada no código-fonte ou GTM do site, o que está correto.
- robots.txt e sitemap.xml não têm cache headers agressivos (`max-age=0, must-revalidate`), o que é adequado para arquivos que mudam com o catálogo.
- Não há páginas órfãs adicionais detectadas além de `/carrinho` (que é 404, não uma página real) — todas as rotas de produto testadas (14/14) batem com o sitemap.
