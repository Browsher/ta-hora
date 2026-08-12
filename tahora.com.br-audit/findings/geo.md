# GEO / AI Search Readiness — tahora.com.br

Auditado em 2026-08-12. Escopo: `/`, `/catalogo`, `/sobre-nos`, `/suporte`, 7 PDPs em `/produtos/*`.
Método: fetch direto de `robots.txt`, `llms.txt`, `sitemap.xml`; render/parse das páginas via
`render_page.py` (`--mode never`, HTML bruto — o site é Next.js SSR/prerendered, confirmado por
`is_spa=false` e header `X-Nextjs-Prerender: 1`) + `parse_html.py` para H1-H3, schema.org, Open Graph
e contagem de palavras.

## AI Search Readiness Score: 61/100

| Dimensão | Peso | Nota | Contribuição |
|---|---|---|---|
| Citabilidade | 25% | 60/100 | 15.0 |
| Estrutura/Legibilidade | 20% | 65/100 | 13.0 |
| Conteúdo multimodal | 15% | 45/100 | 6.75 |
| Autoridade & sinais de marca | 20% | 40/100 | 8.0 |
| Acessibilidade técnica para crawlers | 20% | 90/100 | 18.0 |
| **Total** | | | **60.75 ≈ 61** |

## O que funciona

- **robots.txt permissivo para todo bot de IA**: `User-agent: *` com `Allow: /` e só dois disallow
  (`/api/`, `/carrinho`). GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot e
  Bingbot não estão bloqueados — nenhuma ação necessária aqui.
- **SSR real, não SPA**: HTML bruto (fetch sem JS) já contém H1/H2/H3, specs, FAQ e schema completos
  (`is_spa: false`, `X-Nextjs-Prerender: 1`). Crawlers de IA que não executam JavaScript (a maioria)
  veem o conteúdo real, não uma casca vazia.
- **Product schema com preço e disponibilidade** nas 7 PDPs (`Offer.price`, `priceCurrency: BRL`,
  `availability: InStock`, `sku`), além de `BreadcrumbList`. Base sólida para citação de preço por
  assistentes de compra.
- **Especificações em texto** (não só em imagem/infográfico): cards `label: valor` (Resolução, Visão
  noturna, Resistência à água, Áudio bidirecional, Sensor de movimento, Conectividade, Alarme,
  Aplicativo) presentes no HTML de cada PDP — extraíveis por um LLM sem OCR.
- **FAQ com respostas diretas e autocontidas** na home (4 perguntas, ~15-30 palavras cada, formato
  pergunta-resposta), ex.: "Preciso de internet para a câmera funcionar? — Sim. A câmera se conecta
  ao Wi-Fi... Ela usa apenas redes de 2.4 GHz." Isso é exatamente o formato que motores de IA
  extraem para citação.
- **Depoimentos reais e nominais na home** (nome, nota 5.0, canal de origem — ex. "Gabriel Santos —
  Mercado Livre · Câmera Segurança Q8"), prova social textual, não só estrelas visuais.
- **Alt text descritivo e extenso** em praticamente todas as imagens de produto (chega a descrever
  ângulo, LEDs, antenas, cenário de uso) — incomum e um ativo real para busca multimodal por imagem.
- **Organization/OnlineStore schema na home** com CNPJ, razão social, endereço físico e telefone —
  sinal de entidade verificável (E-E-A-T) que ajuda ferramentas de IA a confirmar que a loja é real.

## Findings

### 1. `llms.txt` ausente (severidade: baixa)
- **Evidência**: `GET /llms.txt` → 404 (retorna a página 404 padrão do site, `meta robots: noindex`
  na versão SPA-fallback).
- **Recomendação**: opcional — Google ignora `llms.txt` e não há evidência de que ChatGPT/Perplexity
  o usem para ranquear. Não é prioridade, mas se implementado, é barato: listar as 11 URLs do
  catálogo com 1 linha de resumo cada. Não infle a importância disso no roadmap.

### 2. Nenhum schema de review/avaliação (severidade: média-alta)
- **Evidência**: os 7 PDPs auditados têm apenas `Product` + `BreadcrumbList` no `<script
  type="application/ld+json">`; nenhum tem `AggregateRating` ou `Review`. Os depoimentos com estrelas
  existem só na home, em HTML puro sem marcação, e não aparecem em nenhuma PDP verificada.
- **Por quê importa**: assistentes de compra (Google AIO, ChatGPT) usam prova social estruturada
  como sinal de confiança para recomendar um produto sobre outro; sem `AggregateRating` por SKU, a
  Tá Hora perde esse sinal justamente onde a decisão de compra acontece.
- **Recomendação**: adicionar `AggregateRating`/`Review` ao schema `Product` de cada PDP (mesmo que
  agregando avaliações do Mercado Livre/Shopee, com atribuição de origem) e replicar 2-3 depoimentos
  por modelo na própria página do produto, não só na home.

### 3. Sem conteúdo comparativo entre os 7 modelos (severidade: alta)
- **Evidência**: `/catalogo` tem apenas 219 palavras, um H1 e cards de produto (H2 = nome de cada
  câmera), sem tabela ou texto comparativo. Nenhuma página do site compara resolução, tipo de
  gravação, alcance de visão noturna ou caso de uso entre os modelos lado a lado.
- **Por quê importa**: a pergunta típica de compra por IA é "qual câmera da Tá Hora é melhor para
  [cenário]?" — sem um bloco comparativo textual e autocontido, o assistente não tem de onde extrair
  a resposta e é forçado a inferir (ou simplesmente não citar a marca).
- **Recomendação**: criar uma seção/página "Compare os modelos" com tabela HTML (não imagem) cruzando
  os 7 SKUs por resolução real (não só "Full HD"/"HD"), alimentação (bateria vs. fonte), indoor/outdoor,
  alcance de visão noturna em metros, e um resumo de 1 frase "melhor para X" por modelo.

### 4. Especificação "Resolução" pouco diferenciada e sem unidade objetiva (severidade: média)
- **Evidência**: nos 7 cards de ficha técnica, "Resolução" varia entre `HD`, `Full HD`, `4K Ultra HD`
  e `3K Vertical` — rótulos de marketing, não megapixels/linhas reais (ex. "2MP", "1920x1080"). Os
  outros 6 campos (visão noturna, resistência à água, áudio bidirecional, sensor de movimento) são
  idênticos ("Sim") em todos os 7 modelos, sem diferenciação real.
- **Recomendação**: trocar por valores comparáveis (megapixels, alcance de IV em metros, ângulo de
  visão em graus) para permitir que um LLM monte uma tabela comparativa correta a partir de uma única
  página — hoje ele teria que adivinhar.

### 5. `/sobre-nos` e `/suporte` sem nenhum schema estruturado (severidade: média)
- **Evidência**: `parse_html.py` retornou `schema: []` para ambas as páginas (nem `Organization`
  nem `FAQPage`, apesar de `/suporte` ter H2 "As perguntas que a gente mais recebe" com conteúdo de
  FAQ em texto).
- **Recomendação**: adicionar `FAQPage` schema em `/suporte` (e replicar nas 4 perguntas já
  existentes na home) — não é mais usado para rich snippet no Google, mas ajuda parsers de IA a
  isolar pares pergunta/resposta com confiança maior que heurística de HTML.

### 6. Sem presença de marca fora do site (severidade: média — não totalmente mensurável nesta auditoria)
- **Evidência coletada**: `sameAs` no schema da home lista Mercado Livre, Shopee e Instagram. Não
  há link para YouTube, Wikipedia, Reddit ou LinkedIn em nenhuma página auditada.
- **Limitação**: não medi presença real em YouTube/Reddit/Wikipedia via busca externa (fora do
  escopo de ferramentas desta auditoria — precisaria de busca web ou DataForSEO, que não estava
  disponível nesta sessão). O que dá para afirmar com confiança é que o site não referencia essas
  plataformas.
- **Por quê importa**: menção em YouTube tem a correlação mais forte (~0,737) com citação por IA;
  Wikipedia e Reddit também pesam mais que backlinks (DR ~0,266). Para uma marca pequena de
  e-commerce, isso é provavelmente o maior gargalo de "Autoridade" no score, mais que qualquer ajuste
  on-page.
- **Recomendação**: produzir 2-3 vídeos curtos (unboxing, instalação em 5 min, comparação entre
  modelos) no YouTube da marca e linkar de volta nas PDPs; considerar posts orgânicos em
  subreddits de segurança residencial/Brasil (r/brasil, r/seguranca) respondendo dúvidas reais, sem
  spam.

### 7. Conteúdo por página é curto (184-528 palavras) (severidade: baixa)
- **Evidência**: `/suporte` 184, `/sobre-nos` 221, `/catalogo` 219, home 528, PDP A31H 431 palavras.
- **Leitura**: não é necessariamente ruim — passagens de 134-167 palavras são o ideal para citação,
  e o FAQ da home já está nessa faixa por resposta. Mas a profundidade total é baixa: não há
  conteúdo suficiente para responder perguntas de cauda longa ("câmera aguenta chuva forte?",
  "funciona sem internet fixa, só 4G/roteador de celular?") que um assistente de IA tentaria
  responder citando a página.
- **Recomendação**: expandir PDPs com 2-3 perguntas específicas do produto (formato pergunta direta
  como já é feito na home), não apenas ficha técnica genérica.

## Status técnico resumido

- **Crawlers de IA**: nenhum bloqueado (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot,
  Google-Extended, CCBot, Bingbot, anthropic-ai) — `robots.txt` usa `User-agent: *` sem exceções por bot.
- **llms.txt**: ausente (404).
- **RSL 1.0**: não verificado nesta sessão — nenhuma tag/licença RSL encontrada no HTML nem em
  `robots.txt`; ausência não é um problema em si (padrão ainda incipiente), mas fica sem avaliação
  aprofundada por falta de sinal no site para checar.
- **Renderização**: 100% SSR (Next.js), sem gap de conteúdo entre HTML bruto e pós-JS nas páginas
  amostradas.
- **Sitemap.xml**: presente, atualizado (`lastmod` em 2026-08-12), inclui home, catálogo, PDPs e
  páginas institucionais.

## Scores por plataforma (estimativa qualitativa, sem dados live de rastreamento)

| Plataforma | Estimativa | Racional |
|---|---|---|
| Google AI Overviews | ~55/100 | Schema Product/Breadcrumb + SSR ajudam; falta `AggregateRating`, `FAQPage` e conteúdo comparativo |
| ChatGPT search | ~50/100 | GPTBot/OAI-SearchBot livres, mas conteúdo comparativo entre os 7 modelos é o que mais falta para recomendação |
| Perplexity | ~55/100 | PerplexityBot livre; passagens curtas do FAQ da home são citáveis, mas cobertura rasa fora da home |
| Bing Copilot | ~50/100 | Bingbot livre; mesma limitação de conteúdo comparativo e reviews estruturadas |

Nota: sem acesso a ferramentas de rastreamento de menção por LLM (DataForSEO ou similar) nesta
sessão — estes números são estimativas baseadas em estrutura on-page e sinais de acessibilidade, não
em citações reais observadas.
