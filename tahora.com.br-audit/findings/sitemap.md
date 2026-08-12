# Auditoria de Sitemap — tahora.com.br

URL: `https://www.tahora.com.br/sitemap.xml` | Declarado em robots.txt (`Sitemap:` presente) | 14 URLs, arquivo único (sem index), muito abaixo dos limites de 50.000 URLs / 50 MB.

## O que funciona

- XML bem formado (`urlset` válido, namespace correto), parse sem erros.
- Declarado corretamente em `robots.txt` (`Sitemap: https://www.tahora.com.br/sitemap.xml`), e `robots.txt` não bloqueia nenhuma rota presente no sitemap (só `/api/` e `/carrinho`, ambas fora do sitemap, corretamente).
- Todas as 14 URLs retornam **HTTP 200**, sem cadeia de redirect (`curl -w %{redirect_url}` vazio em todas).
- Todas as 14 páginas têm `<meta name="robots" content="index, follow">` — nenhuma noindexada.
- `<link rel="canonical">` de cada página bate exatamente com o `<loc>` correspondente no sitemap (self-referencing canonical), inclusive a home, cujo canonical é `https://www.tahora.com.br` sem barra final — mesmo valor do `<loc>`.
- Cobertura completa: todos os links internos extraídos do `/catalogo` (10 rotas únicas: home, catalogo, 6 produtos, sobre-nos, suporte, políticas) mais as páginas legais batem 1:1 com as 14 entradas do sitemap. Nenhuma página indexável ficou de fora, nenhuma URL órfã/404/redirect encontrada no sitemap.
- Volume (14 URLs) muito abaixo do limite de 50.000 URLs / 50 MB — não há necessidade de sitemap index.

## Findings

### 1. `<loc>` da home sem barra final não é um problema real — investigado e descartado
**Severidade:** Info (não é bug)
**Evidência:** `curl -sI https://www.tahora.com.br` e `curl -sI https://www.tahora.com.br/` retornam ambos `200 OK`, `X-Matched-Path: /`, mesmo `Content-Length` (79261) e mesmo `Etag` — Next.js/Vercel serve o mesmo conteúdo pré-renderizado para as duas formas, sem redirect HTTP entre elas. O `<link rel="canonical">` de ambas as respostas aponta para a forma sem barra (`https://www.tahora.com.br`), idêntica ao `<loc>` do sitemap.
**Conclusão:** não há inconsistência de canonicalização nem redirect dentro do sitemap. A hipótese original (redirect na entrada do sitemap) não se confirmou. Manter como está.

### 2. `lastmod` idêntico em todas as URLs (timestamp de build, não de conteúdo)
**Severidade:** Baixa
**Evidência:** as 14 entradas trazem exatamente `2026-08-12T13:08:38.938Z` — mesmo milissegundo — para a home, o catálogo, as 6 PDPs e as páginas institucionais/legais. É improvável que produto, home e política de privacidade tenham sido "modificados significativamente" no mesmo instante; o valor parece gerado dinamicamente a cada build/deploy (`new Date()` no momento da geração do sitemap), não refletindo a data real da última alteração de conteúdo.
**Recomendação:** gerar `lastmod` a partir da data real de modificação de cada conteúdo (ex.: `updatedAt` do produto no CMS/Shopify, ou data do último commit relevante à página). Se não houver como rastrear por página, é preferível omitir `lastmod` a fornecer um valor falso — Google já descontou a confiança em `lastmod` de sitemaps que mentem sistematicamente, e isso pode fazer o Google ignorar o campo para todo o domínio.

### 3. `changefreq` e `priority` preenchidos — tags obsoletas ignoradas pelo Google
**Severidade:** Info
**Evidência:** todas as 14 URLs trazem `<changefreq>` (daily/weekly/monthly/yearly) e `<priority>` (1 a 0.3).
**Recomendação:** Google confirma publicamente que ignora ambos os campos há anos; Bing também os ignora amplamente. Podem ser removidos para simplificar a geração do sitemap sem qualquer perda de sinal. Não é urgente, mas reduz manutenção e o tamanho do arquivo.

## Sem quality gate de location pages
Não há páginas de localização programáticas no site (14 URLs = home, catálogo, 6 PDPs, institucional/legal) — os gates de 30+/50+ páginas de location não se aplicam.

## Resumo por severidade
| Severidade | Item |
|---|---|
| Baixa | `lastmod` idêntico/artificial em todas as URLs (timestamp de build) |
| Info | `changefreq`/`priority` presentes mas ignorados pelo Google — podem ser removidos |
| Info | `<loc>` da home sem barra final — investigado, não é redirect nem problema de canonical |
