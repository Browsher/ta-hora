# Auditoria de SEO e Conteúdo
## https://www.tahora.com.br
### Data: 11/08/2026

Escopo: as 14 URLs do sitemap (home, catálogo, 7 PDPs, 5 páginas institucionais), robots.txt, sitemap.xml, headers HTTP e o código-fonte do repositório `site-ta-hora`.

> **Sobre os números de volume de busca:** esta auditoria não teve acesso a Keyword Planner, Ahrefs ou Semrush. Toda estimativa de volume abaixo está marcada como **estimativa qualitativa** e serve para priorizar, não para projetar tráfego. Validar no Google Keyword Planner antes de investir em produção de conteúdo.

> **⚠️ Correção aplicada em 11/08/2026 — peso de imagem.** A primeira versão deste documento afirmava que a PDP entregava **26,3 MB** de imagem e classificava isso como o problema nº 1 do site. **O número estava errado.** A medição foi feita com um cliente HTTP que não envia o header `Accept: image/webp`; o CDN da Shopify faz negociação de conteúdo e, sem esse header, devolve os PNGs originais. Todo navegador real envia o header e recebe WebP. **O peso real da PDP é 1,47 MB.** As seções 1.5, 10 e 12 foram recalculadas com medições feitas com headers de navegador. A recomendação de redimensionamento continua válida, mas deixou de ser crítica e saiu da primeira posição.

---

## SEO Health Score: 66/100

| Bloco | Nota | Comentário |
|---|---|---|
| Metadata e indexação | 92/100 | Excelente. Títulos e descriptions únicos em 14/14 URLs, canonical em todas, OG completo, robots e sitemap corretos. |
| Estrutura de headings | 85/100 | Um H1 por página, hierarquia limpa. |
| Imagens — alt text | 100/100 | 100% das imagens com alt descritivo e específico. Raro. |
| Imagens — performance | 55/100 | Imagens servidas em tamanho original (WebP por negociação). Há ~50-85% de gordura, mas não é emergência. |
| Dados estruturados (Schema) | **0/100** | **Zero JSON-LD no site inteiro.** E-commerce sem Product schema. **É o problema nº 1.** |
| Estratégia de palavra-chave | 30/100 | Títulos de PDP usam código de SKU que ninguém busca. |
| Camada de conteúdo | 10/100 | 14 URLs. Nenhum conteúdo informacional. |
| Linkagem interna | 45/100 | Sem breadcrumbs, home linka 3 das 7 PDPs. |
| E-E-A-T | 60/100 | Confiança bem trabalhada; autoridade e experiência quase ausentes. |

O site foi construído por alguém que entende de metadata — e isso aparece. O que falta não é ajuste fino: são duas camadas inteiras que não existem (dados estruturados e conteúdo informacional), mais uma faixa de gordura em imagem que vale colher mas não está sangrando.

---

## 1. Checklist de SEO On-Page

### 1.1 Title Tags

| URL | Título atual | Chars | Status |
|---|---|---|---|
| `/` | Ta Hora — Câmeras de segurança Wi-Fi | 36 | Precisa melhorar |
| `/catalogo` | Catálogo de Câmeras de Segurança Wi-Fi \| Ta Hora | 48 | **Pass** |
| `/produtos/camera-seguranca-a31h` | Câmera Segurança A31H \| Ta Hora | 31 | **Falha** |
| `/produtos/camera-seguranca-es-p9` | Câmera Segurança P9 \| Ta Hora | 29 | **Falha** |
| `/produtos/camera-seguranca-q6` | Câmera Segurança Q6 \| Ta Hora | 29 | **Falha** |
| `/produtos/camera-lampada` | Câmera Lâmpada \| Ta Hora | 24 | Precisa melhorar |
| `/produtos/camera-seguranca-a38` | Câmera Segurança A38 \| Ta Hora | 30 | **Falha** |
| `/produtos/camera-seguranca-q8` | Câmera Segurança Q8 \| Ta Hora | 29 | **Falha** |
| `/produtos/camera-seguranca-s8` | Câmera Segurança S8 \| Ta Hora | 29 | **Falha** |
| `/sobre-nos` | Sobre Nós \| Ta Hora | 19 | Precisa melhorar |
| `/suporte` | Suporte \| Ta Hora | 17 | Precisa melhorar |

**Todos únicos, todos com a marca, template `%s | Ta Hora` implementado corretamente em `app/layout.tsx:31`. O problema não é técnico — é de escolha de palavra-chave.**

**O diagnóstico central:** "A31H", "Q6", "S8" e "A38" são códigos internos de fábrica. **Ninguém no Brasil digita "A31H" no Google.** As 6 PDPs de câmera estão gastando o ativo de SEO mais valioso da página — as 60 primeiras posições do title — em uma string com zero demanda de busca, e ainda por cima usando só 29-31 dos ~60 caracteres disponíveis. Metade do espaço vago, e a metade preenchida não tem demanda.

Ninguém busca o SKU. As pessoas buscam o **problema** e o **formato**:

| Antes (atual) | Depois (recomendado) | Chars |
|---|---|---|
| `Câmera Segurança A31H \| Ta Hora` | `Câmera de Segurança Wi-Fi Externa 360° A31H \| Ta Hora` | 53 |
| `Câmera Segurança Q6 \| Ta Hora` | `Câmera de Segurança Wi-Fi Interna com Áudio Q6 \| Ta Hora` | 56 |
| `Câmera Lâmpada \| Ta Hora` | `Câmera Lâmpada Wi-Fi que Rosqueia no Bocal \| Ta Hora` | 52 |
| `Câmera Segurança S8 \| Ta Hora` | `Câmera de Segurança Wi-Fi Solar sem Fio S8 \| Ta Hora` | 52 |
| `Ta Hora — Câmeras de segurança Wi-Fi` | `Câmeras de Segurança Wi-Fi Originais com NF \| Ta Hora` | 53 |
| `Suporte \| Ta Hora` | `Suporte e Dúvidas Frequentes sobre Câmeras \| Ta Hora` | 52 |
| `Sobre Nós \| Ta Hora` | `Sobre a Ta Hora — Loja de Câmeras com CNPJ e NF \| Ta Hora` → usar `Sobre a Ta Hora — Loja com CNPJ e Nota Fiscal` | 45 |

> ⚠️ Os descritores acima ("externa 360°", "interna com áudio", "solar") são **suposições a partir dos nomes**. Cada PDP precisa do descritor real do produto. A ficha técnica (`FichaTecnica`) e as tags da Shopify já têm essa informação — o descritor deveria vir de lá, não ser digitado à mão.

**Por que importa em dinheiro:** o title é o que o Google exibe como link azul. Uma PDP intitulada "Câmera Segurança A31H" só pode rankear para quem já conhece o modelo — ou seja, quem já viu no Mercado Livre. A loja própria está competindo por zero demanda nova. Trocar o title é uma alteração de uma linha em `generateMetadata` e afeta **todas as impressões futuras** dessas 7 páginas.

**Implementação:** hoje o title da PDP é `produto.title` puro (`app/produtos/[handle]/page.tsx:108`). O caminho de menor atrito é adicionar um campo `custom.seo_title` ou uma tag na Shopify e usá-lo com fallback para `produto.title`, mantendo a tolerância a falha que a rota já tem.

---

### 1.2 Meta Descriptions

| Página | Chars | Status |
|---|---|---|
| `/` | 123 | Curta (ideal 150-160) |
| `/catalogo` | 175 | **Longa — trunca em ~160** |
| PDPs (7) | 136-143 | Aceitável, quase no ponto |
| `/sobre-nos` | 151 | **Pass** |
| `/suporte` | 135 | Aceitável |
| Legais (3) | 110-139 | Pass (irrelevantes para tráfego) |

Todas únicas, todas com CTA implícito. Boa qualidade de copy.

**Destaque positivo:** a description das PDPs é **gerada com o valor real da parcela** (`app/produtos/[handle]/page.tsx:92-97`), pela mesma função que alimenta o `<PriceTag>`. Isso significa que mudar o preço na Shopify muda a meta no próximo ISR. É a solução certa para o problema clássico de meta description que apodrece — vale registrar como padrão.

**`/catalogo` — 175 chars, corrigir:**
- Antes: *"Todas as câmeras de segurança Wi-Fi do Ta Hora: interna, externa, com holofote, 4K e a que rosqueia no bocal da lâmpada. Originais, com nota fiscal, 3x sem juros e em até 12x."*
- Depois (158): *"Câmeras de segurança Wi-Fi: interna, externa, com holofote, 4K e a que rosqueia no bocal da lâmpada. Originais, com nota fiscal e 3x sem juros. Veja os modelos."*

**Home — 123 chars, aproveitar o espaço (157):**
- Depois: *"Câmeras de segurança Wi-Fi originais: você mesmo instala em minutos, sem obra e sem técnico. Loja com CNPJ, nota fiscal e 3 meses de garantia. Envio em 24h."*

---

### 1.3 Hierarquia de Headings

**Pass em todas as páginas.** 1 H1 por página em 14/14 URLs, sem pulo de nível, subtítulos descritivos.

Home:
```
H1  Saiba quem está na sua porta, mesmo quando você não está
H2  Tudo que você precisa, com confiança
    H3 Entrega rápida / Compra segura / Parcele em até 12x / Produtos originais
H2  Escolha o modelo ideal para você
H2  Ganhe indicando em 5 passos simples
H2  O que nossos clientes dizem
H2  Tudo que você precisa saber        ← FAQ
H2  Aproveite agora e receba em casa
```

**Duas observações:**

1. **O H1 da home é ótimo copy e SEO fraco.** *"Saiba quem está na sua porta, mesmo quando você não está"* vende bem e não contém nenhuma palavra-chave — nem "câmera", nem "segurança", nem "Wi-Fi". Não recomendo trocá-lo: o H1 é o primeiro elemento da dobra e trocar copy que converte por copy que rankeia é mau negócio quando existe uma terceira opção. **A terceira opção:** o subheadline logo abaixo já diz "Câmera Wi-Fi com alerta no celular" — subir esse termo para dentro do H1 sem matar a frase, ou aceitar o H1 como está e resolver a relevância pelo title + primeiro parágrafo (o Google não exige keyword no H1). **Deixar como está é defensável.** O que não é defensável é o title.

2. **Os H2 do FAQ estão desperdiçados.** "Tudo que você precisa saber" é um rótulo, não uma pergunta. As 4 perguntas do FAQ (que são excelentes — ver 1.4) estão dentro de componentes de accordion sem marcação de heading. Ver seção 7 (Featured Snippets).

3. **`H2 TAHora`** aparece em todas as páginas — é o logotipo do rodapé (`Footer.tsx`) marcado como heading. É ruído semântico: um H2 de rodapé sem conteúdo abaixo. Trocar por `<span>` ou `<div>` com estilo. Impacto pequeno, correção de 1 minuto.

---

### 1.4 Conteúdo do FAQ — o ativo mais subaproveitado do site

As 4 perguntas do `_home.json` são, do ponto de vista de SEO, **melhores que a média do mercado brasileiro**:

| Pergunta | Por que é valiosa |
|---|---|
| "Preciso de internet para a câmera funcionar?" | Dúvida real, alto volume, resposta direta. Formato perfeito de snippet. |
| "A câmera grava sem cartão de memória?" | Objeção de compra + informacional. Captura busca comparativa. |
| "Consigo instalar sozinho ou preciso de técnico?" | **É a proposta de valor inteira do negócio em forma de pergunta.** |
| "A câmera funciona à noite?" | Pergunta de especificação, altíssima frequência. |

Estado dessas quatro perguntas, atualizado em 11/08/2026:

- ✅ **As respostas estão no HTML** — não estavam. Até 11/08/2026 o accordion não renderizava resposta fechada, e as quatro eram invisíveis para qualquer crawler (ver seção 8). Corrigido.
- ❌ Não estão em heading — as perguntas são `<span>` dentro do botão, não `<h3>`.
- ❌ Não existem como página própria (o gap de conteúdo da seção 5).
- ~~Não têm FAQPage schema~~ — **e não vão ter**: o rich result foi extinto (seção 8).

Ver seções 7 e 8.

---

### 1.5 Imagens — alt text: excelente / peso: crítico

**Alt text — Pass, com destaque.** 0 imagens sem alt em todas as páginas auditadas. E não são alts genéricos:

> *"Câmera branca e preta com uma antena e duas lentes (uma retangular fixa na parte superior com quatro LEDs, outra redonda giratória na parte inferior com seis LEDs), fotografada em ângulo de três quartos sobre fundo branco"*

Isso é alt text de nível de acessibilidade profissional. Serve leitor de tela e Google Imagens. **Manter o padrão.**

**Peso — há gordura relevante, mas não é emergência. Medido em 11/08/2026.**

> **Nota metodológica — leia antes de usar estes números.** A primeira medição desta auditoria usou um cliente HTTP sem o header `Accept: image/webp` e concluiu que a PDP pesava 26,3 MB. Isso não descreve nenhum usuário real. O CDN da Shopify **faz negociação de conteúdo**: com o header (que todo navegador envia), a mesma imagem sai em WebP. A coluna "sem `Accept`" abaixo fica registrada só para explicar de onde veio o erro.

| Página | Imagens | Sem `Accept` (medição errada) | **Real (navegador)** | Preloads |
|---|---|---|---|---|
| `/` (home) | 4 | 13,5 MB | **0,39 MB** | 4 |
| `/catalogo` | 7 | 15,3 MB | **0,54 MB** | 7 |
| `/produtos/camera-seguranca-a31h` | 11 | 26,3 MB | **1,47 MB** | 7 |

O `A31H3_4.png` de 10,4 MB chega ao usuário como **153 KB de WebP**. O CDN da Shopify já está fazendo o trabalho pesado sozinho.

**O que continua sendo problema de verdade:**

1. **As imagens são servidas em tamanho ORIGINAL.** `A31H3_4` é 3543×3543 px, exibida numa galeria de ~600 px e em thumbnails de 64 px. A Shopify aceita `&width=` na própria URL e devolve a versão redimensionada de graça — verificado: `&width=800` → 27,9 KB; `&width=400` → 12,6 KB, contra 153 KB da original. **O código passa `foto.url` cru** (`lib/shopify/normalize.ts:106`).
2. **`preload` em todas as imagens acima da dobra** (4 na home, 7 no catálogo e na PDP), incluindo as que não são o LCP. Sete preloads disputando banda não aceleram o LCP — atrasam.
3. **Nenhuma `<img>` tem `width`/`height`** nos componentes de galeria e card → cada imagem é fonte de Cumulative Layout Shift. (As miniaturas de carrinho e acessórios têm.)
4. **`images: { unoptimized: true }`** (`next.config.ts:8`) desliga o otimizador do Next — sem `srcset`, sem AVIF. Menos grave do que parecia, já que o CDN cobre a conversão de formato, mas ainda custa o `srcset` responsivo.

**Ganho do redimensionamento — ✅ implementado em 11/08/2026.** Números medidos comparando produção com o build local, baixando cada imagem com `Accept: image/webp`:

| Página | Produção (antes) | Build local (depois) | Redução |
|---|---|---|---|
| `/` (imagens Shopify) | 0,387 MB | **0,047 MB** | **−88%** |
| `/catalogo` (cards, w=400) | 0,542 MB | **0,101 MB** | **−81%** |
| PDP A31H (galeria 800, thumbs 128) | 1,196 MB | **0,466 MB** | **−61%** |

Implementado em `lib/shopify/imagens.ts` (módulo novo) + `normalize.ts`, `normalizeCarrinho.ts`, `ProductGallery.tsx` e o `og:image` da PDP. O `otimizarLargura` que já existia em `sanitizarDescricao.ts` — e que fazia isto só para as imagens de descrição — passou a usar o mesmo módulo em vez de manter uma segunda cópia da lógica.

**Correção, em ordem de esforço/impacto:**

| # | Ação | Esforço | Ganho |
|---|---|---|---|
| 1 | Anexar `&width=800` (galeria), `&width=400` (cards) e `&width=128` (thumbnails) às URLs do CDN Shopify, com as dimensões `width`/`height` recalculadas junto | ~1h | −53% a −88% de peso de imagem |
| 2 | Manter `preload` **só na primeira imagem** da galeria/hero; remover das demais | ~15 min | LCP direto |
| 3 | `loading="lazy"` nas imagens abaixo da dobra (`ImageSlot`, `ProductGallery`, cards) | ~30 min | Reduz payload inicial |
| 4 | `width`/`height` explícitos em toda `<img>` | ~1h | Zera o CLS de imagem |
| 5 | Reavaliar `images.unoptimized` — decisão registrada no `next.config.ts`, e o CDN já cobre o formato; o que falta é `srcset` | ~4h | Consolidação |

⚠️ **O item 1 tem um pré-requisito de correção:** os campos `width`/`height` de `ProductImage` são as dimensões **intrínsecas do original**. Redimensionar a URL sem recalculá-los faz o objeto mentir — e `generateMetadata` os emite como `og:image:width`/`og:image:height` (`app/produtos/[handle]/page.tsx:126-127`, hoje declarando 3543×3543). Dimensão de OG que não bate com o arquivo faz o WhatsApp recortar errado ou descartar a prévia, que é exatamente o modo de falha que o comentário daquele arquivo já documenta. Numa loja que vende por indicação e afiliado, é o pior lugar para introduzir um bug.

---

### 1.6 Linkagem Interna

| Critério | Status | Observação |
|---|---|---|
| Links internos presentes | Pass | 11-25 por página |
| Anchor text descritivo | Pass | Sem "clique aqui" |
| Deep linking | Precisa melhorar | Ver abaixo |
| Sem links quebrados | **Pass** | 14/14 URLs = 200 |
| Breadcrumbs | **Falha** | Não existem |

**Problema: a home linka 3 das 7 PDPs.** A vitrine da home (`VitrineHome`) mostra A31H, A38 e Q6. As outras quatro — P9, Câmera Lâmpada, Q8, S8 — só recebem link do `/catalogo`. Do ponto de vista de distribuição de autoridade, essas quatro estão a 2 cliques da home enquanto as outras estão a 1. Não são páginas órfãs (o `/catalogo` as cobre e estão no sitemap), mas recebem menos PageRank interno.

**Problema: não há breadcrumbs.** Nem visuais nem em schema. Numa loja com estrutura `Home > Catálogo > Produto`, breadcrumbs (a) melhoram a navegação, (b) rendem `BreadcrumbList` schema, que o Google exibe **substituindo a URL crua no resultado de busca** — ganho de CTR direto e barato.

**Problema: zero links contextuais.** A descrição do produto, a apresentação e o FAQ não linkam para nada. Um "veja também a versão com bateria solar" dentro do texto da A31H vale mais que um card de "Você também pode gostar" (que já existe e é bom, mas é navegação, não contexto).

**Recomendações:**
1. Adicionar breadcrumb visual + `BreadcrumbList` schema nas PDPs e no catálogo.
2. Expandir a vitrine da home para 6 produtos, ou rotacioná-la.
3. Quando existir blog (seção 11), cada artigo deve linkar para 1-2 PDPs relevantes com anchor descritivo.

---

### 1.7 Estrutura de URL

**Pass, quase perfeito.** Legíveis, minúsculas, hífens, curtas, sem parâmetro, sem barra final, consistentes.

Uma inconsistência: **`/produtos/camera-seguranca-es-p9`** — o "es-" é resquício do handle da Shopify e não está nos outros 6 handles. O title da página é "Câmera Segurança P9". Não vale corrigir agora (redirect + risco por um ganho marginal), mas **padronizar os handles novos** daqui pra frente.

Ponto forte a registrar: o **canonical relativo resolvido contra `metadataBase`** (`app/layout.tsx:41`, `page.tsx:110`) neutraliza o `?ref=` do programa de afiliados. Sem isso, cada afiliado criaria uma URL duplicada da mesma PDP. O código já documenta isso e a decisão está certa — é o tipo de coisa que costuma quebrar SEO de loja com afiliados e aqui foi previsto.

---

## 2. Qualidade de Conteúdo (E-E-A-T)

| Dimensão | Nota | Evidência |
|---|---|---|
| **Experience** (experiência) | **Fraca** | Nenhum conteúdo em primeira pessoa. Nenhuma foto real de instalação, nenhum "montamos e testamos". Todas as fotos são de fundo branco (catálogo de fábrica). A `/sobre-nos` diz "4 anos vendendo eletrônicos" — isso é experiência declarada, não demonstrada. |
| **Expertise** (especialização) | **Fraca** | Nenhum autor identificado. Nenhum conteúdo técnico além da ficha. O FAQ demonstra domínio real (2.4 GHz, infravermelho, microSD vs. nuvem) — mas em 4 perguntas. |
| **Authoritativeness** (autoridade) | **Fraca** | Sem menções na imprensa, sem backlinks visíveis, sem perfil de autor. O único sinal de autoridade é social proof de marketplace (4,7 no ML e Shopee, +10 mil vendas). |
| **Trustworthiness** (confiança) | **Presente/Forte** | HTTPS + HSTS (`max-age=63072000`), política de privacidade, termos de uso, página de trocas e devoluções, CNPJ mencionado, 5 depoimentos com nome e origem, `SelosConfianca` na PDP com garantia/NF/devolução, suporte por WhatsApp. |

**Leitura:** o site resolveu **Trust** (a dimensão que mais importa para converter) e não tocou em **Experience/Expertise/Authority** (as dimensões que mais importam para rankear). Isso é coerente com um site que foi construído para converter tráfego pago/indicação, não para captar orgânico — que é exatamente o estágio em que este negócio está.

**As três correções de maior alavancagem:**

1. **Fotos e vídeo reais de instalação.** O argumento de venda é "você mesmo instala em minutos". Hoje isso é uma afirmação. Um vídeo de 60s instalando a A31H de verdade (celular na mão, parafuso, app configurando) converte *e* é o sinal de Experience mais forte que existe. Baixo custo, altíssimo retorno.
2. **NAP completo e visível.** CNPJ por extenso, endereço e telefone no rodapé. Vira `Organization` schema (seção 8) e é sinal de confiança clássico. **Verificar antes se há restrição de privacidade quanto ao endereço** — se for endereço residencial, usar só CNPJ + cidade/UF.
3. **Assinar o conteúdo.** Quando o blog existir, cada artigo com autor real ("Alexandre, 4 anos vendendo câmeras") + bio. É o que separa artigo de loja de artigo de conteúdo genérico.

---

## 3. Análise de Palavras-Chave

### 3.1 Palavra-chave primária

| Elemento | Avaliação |
|---|---|
| **Primária identificada (home)** | `câmera de segurança wi-fi` |
| **Intenção de busca** | Comercial/transacional |
| **Alinhamento de intenção** | **Pass.** A home é comercial e o buscador quer comparar/comprar. Sem descasamento. |
| Keyword no title | Presente |
| Keyword no H1 | **Ausente** (ver 1.3) |
| Keyword nos 100 primeiros caracteres | Parcial (aparece no subheadline) |
| Keyword em subtítulo | Ausente nos H2 |
| Keyword na meta description | **Ausente** — a description atual não contém "câmera" |
| Keyword na URL | N/A (home) |
| **Densidade** | "câmera" 13× em 434 palavras = **3,0%** — no limite superior. Não é stuffing porque é uma loja de câmeras, mas não há margem para adicionar mais. |

**Achado relevante:** a home tem **434 palavras**, o catálogo **249** e a PDP **417**. Para keywords comerciais competitivas no Brasil, as páginas que rankeiam ficam na faixa de 800-1.500 palavras. As PDPs, em particular, têm espaço óbvio para crescer — `ApresentacaoProduto` e `FichaTecnica` já são os componentes certos, só estão pouco preenchidos.

**Achado curioso — "mercado" (5×), "livre" (4×) e "shopee" (3×) estão entre os 10 termos mais frequentes da home.** A página `/sobre-nos` tem uma seção inteira "Também estamos nos marketplaces". Isso é uma decisão de confiança compreensível (o cliente reconhece a loja do ML), mas é **densidade de marca de concorrente** na página que deveria vender a loja própria. Vale monitorar: se o Google associar a home a "mercado livre", a página compete numa busca navegacional que nunca vai ganhar.

### 3.2 Keywords secundárias a incorporar

Termos que a linguagem do site já usa naturalmente e que estão subaproveitados. **Volumes são estimativa qualitativa — validar no Keyword Planner.**

| Keyword | Intenção | Vol. est. | Concorrência est. | Onde usar |
|---|---|---|---|---|
| `câmera de segurança wifi externa` | Comercial | Alto | Alta | Title + H2 da PDP externa |
| `câmera de segurança sem fio` | Comercial | Alto | Alta | `/catalogo` H2 |
| `câmera wifi para casa` | Comercial | Médio | Média | Home, meta description |
| `câmera de segurança que rosqueia na lâmpada` | Comercial | Médio | **Baixa** | PDP câmera lâmpada — **oportunidade rara** |
| `câmera de segurança para ver pelo celular` | Comercial | Médio | Média | Home H2 |
| `como instalar câmera wifi sozinho` | Informacional | Médio | **Baixa** | **Blog** |
| `câmera de segurança precisa de internet` | Informacional | Médio | **Baixa** | **Blog / FAQ** |
| `câmera wifi não conecta 2.4 GHz` | Informacional | Médio | **Baixa** | **Blog / Suporte** |
| `câmera de segurança grava sem cartão` | Informacional | Baixo | **Baixa** | **Blog / FAQ** |
| `câmera de segurança com visão noturna` | Comercial | Médio | Média | Ficha técnica, H3 |
| `melhor câmera de segurança custo benefício` | Comercial | Alto | Alta | **Blog comparativo** |
| `câmera de segurança 4K wifi` | Comercial | Médio | Média | PDP correspondente |

**Padrão a notar:** todas as keywords de **baixa concorrência** da lista são **informacionais** — e o site não tem uma única página informacional. É onde está o espaço disponível.

---

## 4. SEO Técnico

### 4.1 robots.txt — **Pass**
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /carrinho
Sitemap: https://www.tahora.com.br/sitemap.xml
```
Correto. Não bloqueia CSS/JS. Bloqueia o carrinho (certo — página sem valor de busca) e a API. Aponta para o sitemap.

**Sugestão menor:** adicionar `Disallow: /*?ref=` como cinto de segurança extra sobre o canonical dos afiliados. O canonical já resolve; isso é defesa em profundidade.

### 4.2 sitemap.xml — **Pass**
14 URLs, todas 200, `lastmod` com data real, `changefreq` e `priority` coerentes com a hierarquia (home 1.0 → PDPs 0.8 → legais 0.3). Gerado programaticamente em `app/sitemap.ts`, o que significa que **produto novo na coleção `cameras` entra no sitemap sozinho.**

**Verificar:** o sitemap está submetido no Google Search Console? Não é possível confirmar de fora. Se ainda não estiver, é a primeira coisa a fazer — 5 minutos, e sem isso nada nesta auditoria vira dado observável.

### 4.3 Canonical — **Pass, com destaque**
Presente e auto-referencial em 14/14 URLs. A implementação relativa contra `metadataBase` (ver 1.7) é a decisão técnica mais bem resolvida do site.

### 4.4 Redirects e domínio — **Pass**
`tahora.com.br` → 308 → `www.tahora.com.br`. Permanente, consistente, uma única versão canônica. HSTS ativo (`max-age=63072000`, 2 anos).

### 4.5 Headers e cache
```
Cache-Control: public, max-age=0, must-revalidate
X-Vercel-Cache: HIT / STALE
Server: Vercel
Content-Encoding: gzip
```
TTFB medido (3 amostras, cache HIT): **208 ms, 216 ms, 496 ms** (primeira amostra fria). Na faixa "Good" (< 200ms) a "Needs Work". HTML de 73,5 KB comprimido — razoável.

**Observação:** as respostas estão em `gzip`, não `brotli`. A Vercel serve brotli quando o cliente anuncia `br` — não é um problema de configuração, é do meu cliente de teste. Sem ação.

### 4.6 Mobile-friendliness
| Item | Status |
|---|---|
| Viewport meta | **Pass** — `width=device-width, initial-scale=1` |
| Sem scroll horizontal | Provável Pass (há trabalho de responsividade em andamento — ver `docs/responsividade-pendencias.md`) |
| Imagens responsivas | **Falha** — nenhum `srcset` no site |
| Alvos de toque | Não verificado nesta auditoria |
| Formulários usáveis no mobile | Pass — a calculadora de frete é o único input relevante |

### 4.7 Renderização
As páginas entregam **HTML completo no servidor** (SSG na home/institucionais, ISR de 300s nas PDPs). O conteúdo, os headings, os links e o alt text estão todos no HTML inicial — o Google não depende de JavaScript para ler nada. **Isso está certo e é a base sobre a qual tudo o mais funciona.**

---

## 5. Análise de Gap de Conteúdo

**O site tem 14 URLs. Nenhuma é informacional.** Todo o funil de topo está descoberto.

| Tópico ausente | Vol. est. | Concorrência est. | Formato | Prioridade |
|---|---|---|---|---|
| Como instalar câmera Wi-Fi sozinho (passo a passo) | Médio | Baixa | Guia + vídeo | **1** |
| Câmera Wi-Fi não conecta: 2.4 GHz vs 5 GHz | Médio | Baixa | Artigo de solução | **1** |
| Câmera de segurança precisa de internet? | Médio | Baixa | Artigo curto (snippet) | **1** |
| Cartão microSD vs. gravação em nuvem: qual escolher | Médio | Baixa | Comparativo | **2** |
| Qual câmera de segurança escolher: interna, externa ou lâmpada | Médio | Média | Guia de compra | **2** |
| Câmera de segurança é legal? O que a LGPD permite filmar | Baixo | **Muito baixa** | Artigo | **2** |
| Quanto consome de internet uma câmera Wi-Fi | Baixo | Baixa | Artigo curto | **3** |
| Câmera solar / sem tomada: como funciona | Baixo | Baixa | Artigo | **3** |
| Como ver a câmera pelo celular fora de casa | Médio | Média | Tutorial | **3** |
| Melhor câmera de segurança custo-benefício 2026 | Alto | **Alta** | Comparativo | **4** (difícil, mas alto valor) |

**Por que esta lista, e não outra:** cada tópico acima já é uma pergunta que a Ta Hora responde no WhatsApp todos os dias. **O conteúdo já existe na cabeça de quem atende** — é transcrição, não pesquisa. E cada artigo tem caminho natural para uma PDP.

**O tópico da LGPD merece destaque:** concorrência praticamente nula, ninguém no varejo brasileiro de câmera escreveu sobre isso bem, e é uma dúvida real ("posso filmar a calçada?", "preciso avisar o vizinho?"). É o tipo de artigo que ganha backlink de blog jurídico e de condomínio — resolve a dimensão **Authority** de tabela.

---

## 6. Cross-referência com auditorias anteriores

O repositório já contém `MARKETING-AUDIT.md`, `MARKETING-AUDIT-2026-07-31.md` e `COPY-SUGGESTIONS.md`. Não foram lidos em profundidade nesta auditoria — **vale um passe de consolidação** para checar se alguma recomendação de copy conflita com as mudanças de title/description propostas aqui (especialmente a seção 1.1, que altera copy visível em SERP).

---

## 7. Oportunidades de Featured Snippet

O site tem **conteúdo de qualidade de snippet e formatação de zero snippets**. As 4 perguntas do FAQ da home são exatamente o formato que o Google promove — e estão invisíveis.

**Oportunidade 1 — snippet de parágrafo (a mais fácil do site):**

A resposta atual de "Preciso de internet para a câmera funcionar?" tem 29 palavras. O ideal de snippet é 40-60. Expandir:

> **Preciso de internet para a câmera funcionar?**
>
> Sim. A câmera de segurança Wi-Fi precisa estar conectada à internet para enviar as imagens ao seu celular e mandar alertas de movimento. Ela funciona apenas em redes de 2.4 GHz — a maioria dos roteadores brasileiros oferece essa frequência junto com a de 5 GHz. Sem internet, a câmera continua gravando no cartão microSD, mas você não consegue assistir à distância.

60 palavras, responde direto na primeira frase, adiciona o detalhe que ninguém mais responde (o que acontece *sem* internet). **Esta é a estrutura a replicar nas outras três.**

**Oportunidade 2 — snippet de lista:** "Como instalar câmera Wi-Fi em 5 passos" — lista ordenada com H2 contendo a query. O conteúdo de instalação já é a promessa central do negócio.

**Oportunidade 3 — snippet de tabela:** comparativo dos 7 modelos no `/catalogo` (resolução, interna/externa, alimentação, visão noturna, preço) em `<table>` HTML real. Serve o usuário *e* é o formato que o Google extrai.

**Checklist de execução:**
- [x] ✅ **Respostas do FAQ presentes no HTML** — feito em 11/08/2026 (ver seção 8). Era pré-requisito de tudo abaixo: não há snippet de conteúdo que o crawler não vê.
- [ ] Cada pergunta do FAQ vira um `<h3>` real (hoje são `<span>` dentro do botão do accordion)
- [ ] Resposta imediatamente após o heading, 40-60 palavras
- [ ] ~~`FAQPage` schema~~ — **retirado**, o rich result não existe mais (seção 8)
- [ ] Tabela comparativa em `/catalogo` como `<table>` semântica

> ⚠️ **Calibragem honesta sobre esta seção:** com o FAQ rich result extinto, o "featured snippet de FAQ" saiu de cena. O que continua valendo é o **snippet de parágrafo comum** — o Google ainda extrai uma resposta direta do corpo da página para consultas em pergunta. Isso não depende de schema; depende de a resposta estar no HTML (feito), em heading claro, e ter 40-60 palavras. Os itens acima seguem válidos por esse caminho, não pelo do FAQPage.

---

## 8. Schema Markup — **zero implementado**

**Verificado no HTML servido de 5 páginas: nenhum bloco `application/ld+json`. O site não tem uma linha de dados estruturados.**

Para um e-commerce, isso é a maior perda de CTR disponível. `Product` schema é o que faz o Google exibir **preço, disponibilidade e estrelas dentro do resultado de busca**. Sem ele, a loja aparece como link de texto ao lado de concorrentes com preço em destaque.

| Tipo | Aplicável a | Status | Prioridade |
|---|---|---|---|
| **Product + Offer** | 7 PDPs | ✅ **Implementado (11/08/2026)** | ~~1~~ feito |
| **Organization** | Home | **Ausente** | **1** |
| ~~**FAQPage**~~ | ~~Home + `/suporte`~~ | **Removido da lista** | ❌ ver abaixo |
| **BreadcrumbList** | Catálogo + PDPs | **Ausente** | 2 |
| **ItemList** | `/catalogo` | **Ausente** | 2 |
| **WebSite / SearchAction** | Home | Ausente | 4 (só faz sentido com busca interna) |
| **AggregateRating** | PDPs | Ausente | **Ver aviso abaixo** |
| LocalBusiness | — | N/A | — |
| Article | Blog (não existe) | N/A | Quando o blog existir |

**Product schema — o que implementar em `app/produtos/[handle]/page.tsx`:** todos os dados já estão carregados na página. `produto.title`, `produto.images[0].url`, `produto.descriptionHtml`, `produto.price`, `produto.disponivel` e `marcaDoProduto(produto.tags)` cobrem `name`, `image`, `description`, `offers.price`, `offers.priceCurrency`, `offers.availability`, `brand` e `sku`. **É montar o objeto e emitir um `<script type="application/ld+json">` — não precisa de dado novo.** Como a rota é ISR, o schema acompanha automaticamente mudança de preço na Shopify, pelo mesmo mecanismo que já mantém a meta description viva.

### ❌ FAQPage — RETIRADO DA LISTA (correção de 11/08/2026)

**A primeira versão deste documento classificava `FAQPage` como prioridade 1, prometendo captura de featured snippet. A premissa é falsa, e o erro é meu.**

**O FAQ rich result não existe mais.** O Google restringiu o recurso a sites de governo e saúde em agosto de 2023 e depois o encerrou por completo: hoje ele não aparece na Busca para site nenhum, o suporte saiu do Rich Results Test e do relatório do Search Console, e a API do Search Console encerrou o tipo. A documentação do Google diz que a marcação pode permanecer porque outros sistemas podem consumi-la, mas **não há benefício de busca esperado**.

Ou seja: implementar `FAQPage` neste site produziria zero rich result, e nem seria validável pela mesma ferramenta que validou o `Product`.

**O que foi feito no lugar — e que era o ganho real o tempo todo.** Ao investigar, apareceu um problema estrutural que independe de schema: **as respostas do FAQ da home não estavam no HTML.** Medido no build:

```
"Preciso de internet para a câmera funcionar?"  → 2× (DOM + payload RSC)
"...redes de 2.4 GHz."                          → 1× (SÓ no payload RSC)
```

O `AccordionItem` renderizava a resposta dentro de `{isOpen && …}` com `defaultOpen: false` — resposta fechada não existia no DOM. As 4 respostas da home, que são o conteúdo de cauda longa mais valioso do site ("câmera precisa de internet", "grava sem cartão", "instalo sozinho"), eram invisíveis para Google, Bing e crawlers de LLM. E marcá-las em `FAQPage` seria markup de conteúdo ausente da página — a mesma família de violação do `aggregateRating`.

✅ **Corrigido em 11/08/2026** (`components/sections/FAQ/FAQ.tsx`): a resposta é sempre renderizada e escondida por CSS, com `inert` quando fechada para não regredir acessibilidade. As 4 respostas agora estão no HTML pré-renderizado. Como efeito colateral, o `/suporte` — que usava `type: "grid"` só para contornar isso — voltou a poder escolher o layout pela aparência.

**Ganho:** conteúdo indexável que sobrevive à morte do FAQPage e serve Bing e LLMs sem schema nenhum. **Custo:** ~15 linhas, zero mudança visual.

**Organization:** nome, logo, URL, `sameAs` (Instagram, WhatsApp, lojas de marketplace) e — se houver decisão de expor — CNPJ em `identifier` e telefone em `contactPoint`.

> ⚠️ **Aviso sobre AggregateRating.** Os 5 depoimentos da home vêm do **Mercado Livre e da Shopee**, com nota 4,7. É tentador marcar isso como `AggregateRating` no Product. **Não faça.** A política de rich results do Google exige que a avaliação seja coletada pelo próprio site ou por parceiro autorizado; marcar avaliação de marketplace de terceiro como se fosse do site é motivo de ação manual, e ação manual derruba **todos** os rich results do domínio, não só o de review. O caminho correto é coletar avaliação de primeira parte (e-mail pós-compra com link de review na PDP) e marcar essas. Enquanto isso, os depoimentos continuam valiosos como social proof visual — só não vão para o schema.

---

## 9. Oportunidades de Linkagem Interna

**Arquitetura atual:**
```
Home
 ├── /catalogo ──── 7 PDPs
 ├── /sobre-nos
 ├── /suporte
 ├── 3 PDPs (vitrine)          ← só 3 de 7
 ├── 3 páginas legais
 └── afiliados.tahora.com.br   (externo)
```

**Arquitetura recomendada:**
```
Home
 ├── /catalogo (pillar comercial) ──── 7 PDPs ──┐
 ├── /blog (pillar informacional)               │
 │    ├── Como instalar câmera Wi-Fi ───────────┤ links contextuais
 │    ├── Wi-Fi 2.4 vs 5 GHz ───────────────────┤ de volta para PDP
 │    ├── Cartão vs nuvem ──────────────────────┤
 │    └── Guia: qual câmera escolher ───────────┘
 ├── /sobre-nos  (E-E-A-T)
 └── /suporte    (FAQ ampliado, pillar de suporte)
```

**Ações concretas:**
1. Breadcrumb `Home > Catálogo > Produto` nas PDPs (visual + schema)
2. Vitrine da home de 3 → 6 produtos
3. Cada artigo do blog linka 1-2 PDPs com anchor descritivo ("a câmera que rosqueia no bocal", não "clique aqui")
4. `/suporte` linka para os artigos de solução de problema conforme forem publicados
5. `/catalogo` linka para o guia "qual câmera escolher" — é a página onde a dúvida acontece

---

## 10. Core Web Vitals — impacto em receita

Não foi possível rodar o PageSpeed Insights (a API pública respondeu 429 sem chave). A avaliação abaixo é **inferida a partir de medições diretas**, não de laboratório — vale rodar o PSI com chave de API para confirmar.

| Métrica | Estado inferido | Base da inferência |
|---|---|---|
| **TTFB** | **Good** | 208-216 ms medidos, cache HIT na Vercel |
| **FCP** | Provável Good | HTML SSR de 73,5 KB, sem JS bloqueante crítico |
| **LCP** | **Needs Work** | 0,39-1,47 MB de imagem, com 4-7 `preload` competindo por banda |
| **CLS** | **Provável Poor (> 0,25)** | Galeria e cards sem `width`/`height` nas `<img>` |
| **INP** | Não avaliado | Carrossel, accordion e drawer são candidatos a verificar |

**A tradução em dinheiro, com os benchmarks da literatura:**

- Cada 100 ms de melhora no LCP correlaciona com ~1,1% de aumento em conversão.
- Reduzir CLS em 0,1 correlaciona com ~15% de queda no bounce.
- Sites que passam nos três CWV têm ~24% menos abandono de página.

**O cálculo, agora com o número certo:** 1,47 MB de imagem numa PDP, em 4G brasileiro (~8 Mbps reais), é da ordem de **1,5 s** só de imagem — não os 26 s que a versão anterior deste documento projetava. O redimensionamento leva isso para ~0,7 MB, algo como **700 ms de ganho de LCP**. Pelo benchmark de 1,1% por 100 ms, é um ganho de conversão na casa de um dígito percentual: real, mas de outra ordem que o erro original sugeria.

**O item de CWV com maior efeito agora é o CLS, não o LCP.** Galeria e cards renderizam sem `width`/`height`, e CLS alto é a métrica que mais penaliza página de produto — o cliente clica no lugar errado quando o layout salta. Os itens 2-4 da seção 1.5 (preload, lazy, dimensões) valem tanto quanto o redimensionamento.

**Nada disso é o item nº 1 da auditoria.** Com o peso real medido, os dois primeiros lugares são de SEO puro: `Product` schema e os titles de PDP.

---

## 11. Estratégia de Conteúdo

**Cadência:** 2 artigos por mês nos primeiros 3 meses (6 artigos), reavaliando com dados do Search Console. Não recomendo mais que isso — o gargalo aqui é produção com qualidade de Experience real (foto, vídeo, caso concreto), não volume.

**Extensão:** 1.200-1.800 palavras nos guias, 600-900 nos artigos de solução de problema. As respostas de snippet ficam no topo; o corpo aprofunda.

**Formatos, em ordem de retorno para este negócio:**
1. **Vídeo de instalação real** — resolve Experience, converte, e vira conteúdo para Instagram e para as PDPs. Fazer primeiro, mesmo antes do primeiro artigo.
2. **Guias de solução de problema** — baixa concorrência, alta intenção, e você já responde isso por WhatsApp.
3. **Guia de compra comparativo** — captura a busca "qual escolher" e desemboca no catálogo.
4. **Tabela comparativa no `/catalogo`** — não é blog, é melhoria de página existente, e rende snippet de tabela.

**Atualização:** revisar as PDPs a cada trimestre (preço e specs mudam) e os guias a cada semestre.

**Matriz de priorização:**

| Ideia | Volume est. | Concorrência est. | Valor de negócio | Score |
|---|---|---|---|---|
| Vídeo + guia "instale você mesmo em 10 min" | Médio | Baixa | **Alto** (é a proposta de valor) | **10** |
| "Câmera Wi-Fi não conecta: 2.4 vs 5 GHz" | Médio | Baixa | Médio | **8** |
| "Qual câmera escolher: interna, externa ou lâmpada" | Médio | Média | **Alto** (vai pro catálogo) | **8** |
| "Câmera de segurança precisa de internet?" | Médio | Baixa | Médio | **7** |
| Tabela comparativa no `/catalogo` | — | — | **Alto** | **7** |
| "Cartão microSD vs nuvem" | Médio | Baixa | Médio (vende acessório) | **6** |
| "LGPD e câmera: o que posso filmar" | Baixo | Muito baixa | Médio (backlink) | **6** |
| "Melhor câmera custo-benefício 2026" | Alto | Alta | Alto | **5** |

---

## 12. Recomendações Priorizadas

> **Ordem revisada em 11/08/2026.** O redimensionamento de imagem era o item nº 1 e caiu para o nº 5, pela correção de medição descrita no topo do documento. Os dois primeiros lugares agora são de SEO puro — e não dependiam de nenhuma medição de peso.

### 🔴 Crítico — fazer esta semana

1. ✅ **~~Implementar `Product` + `Offer` schema nas 7 PDPs~~ — FEITO em 11/08/2026.** `lib/seo/produtoSchema.ts` (módulo puro) + `components/seo/JsonLd.tsx`, com `npm run verificar:schema` travando a regra do `aggregateRating` em código. **Sem `aggregateRating` e sem `review`** — ver a seção 8. Pendência de cadastro no admin: A31H e A38 estão sem SKU na Shopify (o schema omite o campo corretamente).

2. **Reescrever os 7 titles de PDP**, trocando o código de SKU por descritor com demanda real de busca (seção 1.1). Hoje as páginas que vendem competem por termos que ninguém digita, usando metade dos caracteres disponíveis. Esforço: ~1h + decisão de onde guardar o descritor.

3. **Confirmar que o sitemap está submetido no Google Search Console.** 5 min. Sem isso não há como medir nada do que está neste documento.

4. ✅ **~~`FAQPage` schema na home e no `/suporte`~~ — RETIRADO, e substituído por outra correção.** O FAQ rich result não existe mais desde 2023/2026 (ver seção 8): o schema renderia zero. A investigação revelou o problema real — **as respostas do FAQ da home não estavam no HTML** — e foi isso que se corrigiu em 11/08/2026. Ganho de conteúdo indexável, sem markup.

### 🟠 Alta prioridade — este mês

5. ✅ **~~Redimensionar as imagens do CDN da Shopify~~ — FEITO em 11/08/2026.** `width=800` (galeria), `400` (cards), `128` (thumbnails), `1200` (`og:image`), com `width`/`height` recalculados junto. Medido: home −88%, catálogo −81%, PDP −61%.
6. **`width`/`height` em toda `<img>` e `loading="lazy"` abaixo da dobra.** Zera o CLS de imagem — que, com o peso real medido, é a métrica de CWV com maior efeito nesta loja.
7. **Limitar o `preload` de imagem a uma por página.** Hoje são 4 na home e 7 no catálogo e na PDP; sete preloads disputando banda atrasam o LCP que deveriam acelerar. Esforço: ~15 min.
8. `Organization` schema na home + NAP completo no rodapé.
9. Breadcrumbs visuais + `BreadcrumbList` schema no catálogo e nas PDPs.
10. Corrigir a meta description do `/catalogo` (175 → ~158 chars) e expandir a da home (123 → ~157).
11. **Gravar o vídeo de instalação real.** É simultaneamente conteúdo, prova de Experience e material de conversão.
12. Trocar o `H2 TAHora` do rodapé por elemento não-heading.

### 🟡 Média prioridade — este trimestre

13. Publicar os 4 primeiros artigos do blog (matriz da seção 11), cada um linkando para PDP relevante.
14. Tabela comparativa dos 7 modelos no `/catalogo`, em `<table>` semântica.
15. Expandir o conteúdo das PDPs de ~417 para 800+ palavras via `ApresentacaoProduto` e `FichaTecnica` (componentes já existem).
16. Expandir a vitrine da home de 3 para 6 produtos.
17. **Rodar PageSpeed Insights com chave de API** e confirmar os números de CWV da seção 10 — que continuam sendo inferidos, não medidos em laboratório.
18. Implantar coleta de avaliação de primeira parte (e-mail pós-compra) — pré-requisito para `AggregateRating` legítimo.

### 🟢 Baixa prioridade — quando houver folga

19. `ItemList` schema no `/catalogo`.
20. `Disallow: /*?ref=` no robots.txt como defesa em profundidade sobre o canonical.
21. Padronizar handles novos da Shopify (o `es-` do `camera-seguranca-es-p9` é resquício — **não** corrigir o existente).
22. Reavaliar `images.unoptimized` no `next.config.ts` depois que o item 5 estiver em produção — o CDN já cobre a conversão de formato, então o que resta é `srcset`.
23. `WebSite`/`SearchAction` schema — só quando existir busca interna.
24. Consolidar com `MARKETING-AUDIT.md` e `COPY-SUGGESTIONS.md` para evitar conflito nas recomendações de copy.

---

## Resumo em um parágrafo

A infraestrutura de SEO deste site é notavelmente boa para um projeto deste porte: metadata única e correta em 14/14 URLs, canonical resolvendo o problema de duplicação por `?ref=` do programa de afiliados, sitemap gerado programaticamente, HTML renderizado no servidor, e 100% de alt text descritivo — melhor que o da maioria das lojas grandes. O que falta são **duas camadas inteiras que não existem**: dados estruturados (zero JSON-LD num e-commerce, o que custa preço e disponibilidade no resultado de busca) e conteúdo informacional (nenhuma página de topo de funil). Some-se a isso um problema de posicionamento: as 7 páginas que vendem estão intituladas com código de fábrica — "A31H", "Q6" — que ninguém digita no Google. A primeira camada se resolve em poucas horas no código que já está lá; a segunda é um programa de meses, mas o conteúdo já existe, disperso nas respostas de WhatsApp e nas quatro perguntas de FAQ, que são das melhores que vi num varejo desse segmento. Sobre imagem: há ~50-85% de gordura a colher redimensionando pelo CDN, e vale colher — mas o CDN da Shopify já converte para WebP sozinho, então isto é otimização, não incêndio.

---

*Auditoria gerada por `/market-seo` em 11/08/2026, com correção de medição aplicada na mesma data. Medições de peso de imagem e TTFB feitas em requisições reais ao domínio de produção; o peso de imagem foi remedido com headers de navegador (`Accept: image/webp`) após o erro descrito no topo. Números de LCP/CLS/INP permanecem inferidos — o PageSpeed Insights não foi executado (API pública respondeu 429 sem chave).*
