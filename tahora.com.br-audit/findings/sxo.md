# SXO — Search Experience Optimization (Tá Hora)

Método: SERP backwards analysis para 7 consultas comerciais (WebSearch), classificação de tipo de página via taxonomia de 8 tipos, parse de `/`, `/catalogo` e PDP `A31H` via `render_page.py`/`parse_html.py`.

## Achado central (líder): mismatch estrutural, não técnico

O site está tecnicamente correto (Product/BreadcrumbList/OnlineStore schema, títulos, meta descriptions, FAQ) mas está mirando **head terms que o Google não entrega a lojas de 7 SKUs**. `site:tahora.com.br` no Google não retorna nenhuma página do domínio — sinal de autoridade/indexação essencialmente zero. Para o público leigo-ansioso que a home já mira bem em copy, isso significa: mesmo com a página certa, não há força de domínio para competir nos termos de cabeça.

## SERP consenso por consulta

| Consulta | Tipo de página dominante | % aprox. | Quem ocupa o SERP |
|---|---|---|---|
| "câmera de segurança wifi" | Listicle/Comparison + Category page de marca | ~60% listicle / 40% categoria | Techtudo, Intelbras (loja + institucional), TP-Link, Amazon busca, Tudo Forte |
| "câmera wifi para casa" | Listicle/Comparison | ~57% | Techtudo, guiadeferramenta, melhoresdotech, amoprodutinhos + PDP Positivo (marca grande) |
| "câmera de segurança sem fio" | Marketplace listing + Blog informativo | ~43%/43% | Mercado Livre, Magazine Luiza, Tudo Forte, blog SuperSeg |
| "melhor câmera de segurança wifi 2026" | Listicle/Comparison (quase puro) | ~90% | Techtudo, oguiaferramenta, ocomparador, Techinter + 3 vídeos YouTube |
| "câmera lâmpada" | Blog informativo + PDP de revenda | ~40%/40% | Promobit, Leroy Merlin blog, Techtudo + SEGCFTV, Empório Forte, Infortec (PDPs de revendedores pequenos) |
| "câmera wifi barata sem mensalidade" | Listicle/Comparison + Marketplace | ~60%/dominante | TechInsider, Aceletech, DicaSmart, Techinter + Amazon/ML |
| "A31"/"ICSee A31" (nome do OEM) | PDP de fabricante + revendedores pequenos + marketplace | dominante | icseecam.com (fabricante), Realtek, ED Cabos, Shopee |

**Tipo de página que a Tá Hora oferece:** Landing/Hybrid na home (hero + CTA + prova social + FAQ), Category/Listing no catálogo, Product Page nas PDPs — sem nenhum Comparison Page ou Blog Post no site.

## Page-Type Mismatch Detection

**Home (`/`) — Severidade: HIGH.** Title/H1 miram o head term "câmera de segurança wifi" com uma página tipo Landing/Hybrid, mas o SERP para esse termo é dominado por Listicle/Comparison e páginas de categoria de marcas com autoridade grande (Intelbras, TP-Link). Mismatch de tipo per taxonomia: "Landing Page sem profundidade educacional" = MEDIUM, mas combinado com autoridade zero, o efeito prático é CRITICAL — a home não tem chance real de rankear para esse termo independentemente de otimização on-page.

**Catálogo (`/catalogo`) — Severidade: MEDIUM.** Estruturalmente é um Category/Listing page, o que está alinhado com parte do SERP (Intelbras loja, TP-Link categoria, Amazon busca). O problema não é o tipo, é a ausência de elementos de Comparison Page (tabela de features lado a lado, "melhor para X") que dominam esse cluster de consultas — a página lista 7 produtos com preço, mas não ajuda a decidir *qual* comprar (H3 vazio, sem "ideal para área interna/externa" filtrado, sem tabela comparativa).

**PDP (ex.: A31H) — Severidade: ALIGNED (tipo) / HIGH (execução).** Product Page é exatamente o tipo que ganha para buscas de modelo (ex. "A31", "ICSee A31"). Mas dois problemas structurais:
1. **Nome de modelo inventado.** O OEM chama esse produto de "A31" (fabricante iCSee, revendedores Realtek/ED Cabos usam "A31"); a Tá Hora vende como "A31H". Qualquer busca por "câmera A31" ou "ICSee A31" — que tem demanda real e concorrência fraca (revendedores pequenos, não big-box) — não encontra a Tá Hora.
2. **Zero schema de review/rating.** O `Product` schema não tem `aggregateRating`/`review`, então não há estrelas no snippet do Google nem prova social estruturada — justamente o elemento "required" da taxonomia para Product Page ("customer reviews with star ratings") que falta.

## User Stories (derivadas de sinais do SERP)

1. Como **comprador leigo e ansioso** (persona ativada pelo H1 atual), quero saber se instalo sozinho sem furar parede, porque tive uma tentativa de invasão recente, mas estou bloqueado por **confusão técnica** — resolvido parcialmente pelo FAQ da home ("Consigo instalar sozinho ou preciso de técnico?"), mas ausente na PDP e no catálogo.
   *(Sinal: PAA cluster procedural dominante nos listicles — "como instalar câmera wifi sem fio"; H3 FAQ da home já responde isso, mas não está replicado onde a decisão de compra acontece — PDP/catálogo.)*

2. Como **comparador de preço** (ativado pela dominância de listicles "melhores câmeras 2026" e marketplaces), quero ver os 7 modelos lado a lado com diferença clara (interna x externa, com/sem holofote, 4K), porque não quero pagar a mais por recurso que não uso, mas estou bloqueado por **fadiga de comparação** — o catálogo lista os 7 produtos mas sem tabela de diferenciação nem filtro.
   *(Sinal: título do catálogo já promete isso — "interna, externa, com holofote, 4K" — mas a página não entrega uma estrutura comparativa, só cards.)*

3. Como **cético em relação a loja desconhecida** (ativado por `site:tahora.com.br` não retornar nada e pela ausência de reviews no Product schema), quero validar que a loja é confiável antes de pagar, porque câmera de segurança é item sensível e a marca Tá Hora é nova para mim, mas estou bloqueado por **falta de prova social estruturada** — a home tem H2 "O que nossos clientes dizem" mas isso não vira `Review`/`aggregateRating` no schema nem aparece nas PDPs.
   *(Sinal: marketplaces dominantes no SERP — Mercado Livre, Amazon, Magazine Luiza — competem com contagem de avaliações e "comprado por X pessoas"; loja pequena sem isso perde no primeiro filtro de confiança.)*

4. Como **buscador de modelo específico** (ativado pelos resultados de "A31"/"ICSee A31" — fabricante + revendedores pequenos, baixa autoridade dominante, oportunidade real), quero achar as specs exatas do modelo que vi em outro lugar (grupo de WhatsApp, anúncio, vídeo), mas estou bloqueado porque a Tá Hora renomeou o produto (A31H em vez de A31) e não menciona o nome OEM em lugar nenhum da página.
   *(Sinal: PDPs de revendedores pequenos como Realtek e ED Cabos rankeiam usando o nome exato do fabricante "A31" no título/H1.)*

5. Como **presenteador leigo** (ex.: comprar para os pais, ativado pela combinação "sem mensalidade" + "instala sozinho" nos listicles), quero garantir que quem vai usar não vai precisar de suporte técnico contínuo, mas estou bloqueado por **falta de reforço na PDP** — a garantia de "sem mensalidade"/"funciona sem cartão de memória" só aparece no FAQ da home, não na PDP onde a decisão de compra do presente é tomada.
   *(Sinal: consulta "câmera wifi barata sem mensalidade" tem volume dedicado e listicles tratam isso como critério de decisão central.)*

## Persona Scoring — Home / Catálogo / PDP (A31H)

| Persona | Página | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|---|
| **A. Comprador Ansioso por Segurança** | Home | 22/25 | 20/25 | 14/25 | 20/25 | 76/100 | Bom |
| | Catálogo | 18/25 | 20/25 | 10/25 | 18/25 | 66/100 | Bom |
| | PDP A31H | 20/25 | 20/25 | 8/25 | 20/25 | 68/100 | Bom |
| **B. Comparador de Preço** | Home | 12/25 | 12/25 | 12/25 | 15/25 | 51/100 | Precisa melhorar |
| | Catálogo | 20/25 | 15/25 | 10/25 | 18/25 | 63/100 | Bom (mas raso) |
| | PDP A31H | 15/25 | 15/25 | 8/25 | 18/25 | 56/100 | Precisa melhorar |
| **C. Cético em Loja Desconhecida** | Home | 14/25 | 15/25 | 10/25 | 15/25 | 54/100 | Precisa melhorar |
| | Catálogo | 12/25 | 15/25 | 8/25 | 15/25 | 50/100 | Precisa melhorar |
| | PDP A31H | 12/25 | 14/25 | 6/25 | 15/25 | 47/100 | **Mismatch crítico** |

**Persona mais fraca: C. Cético em Loja Desconhecida na PDP (47/100).**
Top issue: `Product` schema sem `aggregateRating`/`review` + nenhuma menção a CNPJ/nota fiscal/garantia visível na própria PDP (essas informações existem no `OnlineStore` schema da home e no meta description do catálogo, mas não estão replicadas na página onde a compra acontece).
Fix recomendado: adicionar bloco de confiança na PDP logo abaixo do preço ("CNPJ 46.340.461/0001-04 · nota fiscal · 3 meses de garantia · envio em 24h") + implementar `aggregateRating`/`Review` assim que houver avaliações reais (mínimo viável: 5-10 reviews via app pós-compra).

**Problema sistêmico: dimensão Trust é a mais baixa em todas as 9 combinações (6 a 14 de 25).** Nenhuma página do site tem prova social estruturada (schema) nem visível de forma consistente. Isso é o gargalo transversal, não um problema de página isolada.

## Diagnóstico central: por que uma loja de 7 SKUs não rankeia para os head terms

1. **Autoridade de domínio ~zero** (confirmado por `site:tahora.com.br` sem retorno) — nenhum tipo de página, por mais bem otimizado que seja, vence Techtudo/Intelbras/TP-Link/Mercado Livre em "câmera de segurança wifi", "câmera wifi para casa" ou "melhor câmera... 2026". Esses termos são estruturalmente dominados por Listicle/Comparison e big-box category pages — tipos de página que a Tá Hora não tem (não existe Comparison Page nem Blog Post no site) e que provavelmente não valeria o investimento para 7 SKUs.
2. **A câmera é um produto white-label (OEM iCSee)** revendido também por dezenas de outros lojistas (Shopee, ED Cabos, Realtek, AliExpress) sob nomes de modelo próximos mas não idênticos. Isso é o núcleo do problema de comoditização: mesmo nas consultas de cauda longa por modelo, a Tá Hora renomeou os SKUs (A31 → A31H) perdendo o pouco tráfego de marca/modelo que existiria.
3. **Páginas realisticamente ganháveis:** consultas de cauda longa por modelo/característica específica (ex. "câmera lâmpada wifi sem fio", "câmera dupla lente A31 original nota fiscal") onde o SERP já mostra revendedores pequenos e páginas de fabricante rankeando — tipo Product Page, exatamente o que a Tá Hora tem. Também é ganhável o cluster transacional "sem mensalidade" + "instala sozinho" combinado com trust signals fortes (CNPJ, nota fiscal, garantia), que hoje só aparece na home/FAQ e precisa ser replicado em catálogo e PDPs.
4. **Não é recomendável** perseguir "câmera de segurança wifi" (head term) como keyword primário da home — o tipo de página vencedor ali (listicle comparativo com múltiplas marcas) é estruturalmente incompatível com uma loja de marca própria de 7 SKUs. Recomenda-se realinhar a expectativa de tráfego orgânico da home para termos de marca + long-tail de modelo/uso, e considerar conteúdo de Comparison Page (ex. "qual câmera Tá Hora escolher") como ativo interno de conversão, não como aposta de ranking para head term.

## Cross-skill

- Falta de `aggregateRating`/`Review` no schema → recomendar `/seo schema` para gerar/validar Review schema assim que houver avaliações reais.
- Divergência de nome de modelo (A31 vs A31H) e ausência de conteúdo Comparison Page → recomendar `/seo content` para avaliar estratégia de nomenclatura de SKU e viabilidade de uma página comparativa interna.
- Autoridade de domínio ~zero → fora de escopo de SXO; achado de link building/authority a registrar separadamente (não coberto por esta análise).

## Limitações

- SERP analisado via WebSearch (não Search Console/rank tracker) — posições exatas e presença de featured snippet/AI Overview/PAA completa não foram confirmadas com screenshot real do SERP brasileiro; classificação de tipo de página é inferida pelos títulos/domínios retornados.
- Nenhum dado de Search Console foi usado — não há confirmação de quais keywords já geram impressões reais para tahora.com.br.
- Volume de busca não foi validado com ferramenta de keyword (estimativa qualitativa baseada em densidade de SERP).
- Seção "O que nossos clientes dizem" da home não foi inspecionada quanto a conteúdo real de depoimentos (texto/autoria) — apenas confirmado que não gera schema `Review`/`aggregateRating`.

Gerar um relatório em PDF? Use `/seo google report`.
