# Auditoria de SEO e Conteúdo
## https://www.tahora.com.br
### Data: 11/08/2026

Escopo: as 14 URLs do sitemap (home, catálogo, 7 PDPs, 5 páginas institucionais), robots.txt, sitemap.xml, headers HTTP e o código-fonte do repositório `site-ta-hora`.

> **Sobre os números de volume de busca:** esta auditoria não teve acesso a Keyword Planner, Ahrefs ou Semrush. Toda estimativa de volume abaixo está marcada como **estimativa qualitativa** e serve para priorizar, não para projetar tráfego. Validar no Google Keyword Planner antes de investir em produção de conteúdo.

> **⚠️ Correção aplicada em 11/08/2026 — peso de imagem.** A primeira versão deste documento afirmava que a PDP entregava **26,3 MB** de imagem e classificava isso como o problema nº 1 do site. **O número estava errado.** A medição foi feita com um cliente HTTP que não envia o header `Accept: image/webp`; o CDN da Shopify faz negociação de conteúdo e, sem esse header, devolve os PNGs originais. Todo navegador real envia o header e recebe WebP. **O peso real da PDP é 1,47 MB.** As seções 1.5, 10 e 12 foram recalculadas com medições feitas com headers de navegador. A recomendação de redimensionamento continua válida, mas deixou de ser crítica e saiu da primeira posição.

---

## SEO Health Score: 66 → **78/100**

| Bloco | Antes | Depois | Comentário |
|---|---|---|---|
| Metadata e indexação | 92 | **98** | Descriptions corrigidas (ambas em 155 chars) e `openGraph` próprio nas 6 páginas que herdavam o da home, com `canonical == og:url` em 7/7 e guarda em código. É o bloco mais bem resolvido do site. |
| Estrutura de headings | 85 | **95** | Respostas do FAQ no DOM, perguntas em `<h3>` real e o `H2 TA Hora` do rodapé removido das 14 páginas. |
| Imagens — alt text | 100 | 100 | Sem alteração. Continua sendo o melhor item do site. |
| Imagens — performance | 55 | **85** | Redimensionamento pelo CDN em produção (−61% a −88%), `lazy` abaixo da dobra, preload 4→1 e 7→1. Falta `srcset` e a imagem de descrição `lazy` acima da dobra no desktop. |
| Dados estruturados (Schema) | **0** | **90** | `Product`+`Offer` nas 7 PDPs, `OnlineStore` na home e `BreadcrumbList` nas PDPs e no catálogo, confirmados no HTML servido. Falta só o `ItemList` do `/catalogo`, que é prioridade baixa. |
| Estratégia de palavra-chave | 30 | **80** | Os 7 titles saíram do código de fábrica para descritor com demanda, e o H1 acompanhou em 12/08. O que falta aqui é camada informacional, não on-page. |
| Camada de conteúdo | 10 | 10 | Intocado. 14 URLs, nenhuma informacional. É o item que sobrou como maior gap. |
| Linkagem interna | 45 | **65** | Breadcrumbs visuais + schema nas PDPs e no catálogo. Seguem abertos: a home linka 3 das 7 PDPs, e não há links contextuais dentro do texto. |
| E-E-A-T | 60 | 65 | NAP completo no rodapé (o telefone entrou). Experience e Authority seguem sem trabalho. |

**O que mudou de natureza:** a auditoria original apontava **duas camadas inteiras ausentes** — dados estruturados e conteúdo informacional. Uma delas foi construída hoje. A que sobra é a cara: conteúdo é programa de meses, não tarde de código. O eixo do documento se deslocou de "faltam camadas" para "falta conteúdo, e faltam três acabamentos baratos" (breadcrumbs, headings do FAQ, as duas descriptions).

---

## Antes/depois de 11/08/2026 — verificado no HTML de produção

Tudo abaixo foi conferido **no domínio de produção** com headers de navegador, não no build local. Os 7 commits do dia estão no ar.

### ✅ Fechado

| # | Item | Antes | Depois (produção) |
|---|---|---|---|
| 1 | `Product` + `Offer` nas PDPs | 0 blocos JSON-LD no site | 2 blocos na PDP: `Product`, `Offer`, `Organization`. Sem `aggregateRating` — a guarda segurou. |
| 8 | `Organization` na home | ausente | 1 bloco `OnlineStore` + `PostalAddress`, só na home. Catálogo segue sem JSON-LD (esperado — falta `ItemList`). |
| 2 | Titles das 7 PDPs | 24-31 chars, SKU puro | **51-60 chars, descritor real** — ver tabela abaixo |
| 5 | Redimensionamento pelo CDN | `foto.url` cru, 3543 px | `width=800` galeria, `400` cards, `128` thumbs, `1200` no `og:image` |
| 7 | Preloads | home 4, catálogo 7 | **home 1, catálogo 1**; PDP mantida em 8 por decisão |
| 4→ | Respostas do FAQ no DOM | pergunta 2×, resposta **1×** (só no payload RSC) | pergunta 2×, **resposta 2×** — está no HTML pré-renderizado |
| 6 | CLS das imagens de descrição | sem reserva de espaço | `aspect-ratio: 1/1` + `object-fit: contain`, com `npm run verificar:descricao` de guarda |
| — | NAP no rodapé | nome + endereço | nome + endereço + **telefone** |

**Os 7 titles, como estão agora em produção:**

| URL | Antes | Depois | Chars |
|---|---|---|---|
| `…/camera-seguranca-a31h` | Câmera Segurança A31H | Câmera Segurança Wi-Fi Full HD Dupla Lente A31H | 57 |
| `…/camera-seguranca-es-p9` | Câmera Segurança P9 | Câmera Segurança Wi-Fi HD Interna e Externa P9 | 56 |
| `…/camera-seguranca-q6` | Câmera Segurança Q6 | Câmera Segurança Wi-Fi Full HD Dupla Lente Q6 | 55 |
| `…/camera-lampada` | Câmera Lâmpada | Câmera Lâmpada Wi-Fi que Rosqueia no Bocal HD | 55 |
| `…/camera-seguranca-a38` | Câmera Segurança A38 | Câmera Segurança Wi-Fi 4K Dupla Lente A38 | 51 |
| `…/camera-seguranca-q8` | Câmera Segurança Q8 | Câmera Segurança Wi-Fi Full HD Dupla Lente Q8 | 55 |
| `…/camera-seguranca-s8` | Câmera Segurança S8 | Câmera Segurança Wi-Fi 3K Vertical Tripla Lente S8 | 60 |

Todos na faixa de 51-60 chars, todos com descritor **derivado de spec real** — a seção 1.1 alertava que os descritores sugeridos ("externa 360°", "solar") eram suposição a partir do nome; nenhum deles sobreviveu ao contato com a ficha técnica. O que a auditoria chamou de "câmera solar sem fio S8" é, de fato, **3K vertical tripla lente**. A recomendação estava certa no método e errada no conteúdo, e foi o método que valeu.

### 🆕 Dois achados novos desta verificação

1. **A pendência de SKU se resolveu.** O documento registrava que A31H e A38 estavam sem SKU na Shopify e que o schema omitia o campo. Em produção os dois emitem `"sku":"IC-A31H"` e `"sku":"IC-A38"`. Os 7 produtos têm SKU no `Product`. Nada a fazer.

2. ✅ **~~O H1 das PDPs ficou para trás do title~~ — CORRIGIDO em 12/08/2026.** O title dizia "Câmera Segurança Wi-Fi Full HD Dupla Lente A31H" e o H1 dizia "Câmera Segurança A31H": keyword certa na tag que o Google exibe, keyword vazia no elemento que ele usa para entender o tema. Ver abaixo.

### ✅ 12/08/2026 — H1, escala tipográfica e `Product.name`

Três alterações numa só, porque são a mesma decisão.

**1. O H1 recebeu o descritor.** `text={tituloProduto(produto)}` — a MESMA função de `generateMetadata`, não uma segunda string a manter em sincronia. Sai de graça para os 7 produtos e acompanha mudança de spec no admin pelo mesmo ISR que já move o title.

**2. A fonte do H1 caiu — e essa era a causa raiz, não o texto.** A coluna `.produto-info` é `minmax(240px, 1fr)`, e o `1fr` calculado dá 232px a 1920: **ela trava em 240px em todo o desktop**. A fonte, porém, era `clamp(18px, 2.4vw, 30px)` e chegava a 30px — ~13 caracteres por linha, com o nome curto de 21 chars já ocupando 2 linhas. Desproporção que existia antes do descritor. Novo valor: `clamp(18px, 1.6vw, 22px)`, **inline e escopado à PDP** (o `size="pequeno"` do `Heading` é compartilhado com os H3 do site, e a escala é aplicada inline pelo componente — uma classe de CSS perderia a especificidade).

| Estado | Fonte | Linhas do H1 | Coluna fechada | Coluna com frete aberto |
|---|---|---|---|---|
| Antes (nome curto, 30px) | 30px | 2 | 551px | 716px |
| Descritor **sem** reduzir a fonte | 30px | 4 | 629px | ~793px ❌ |
| **Depois (descritor + 22px)** | 22px | **3** | **559px** | **724px** ✅ |

Medido no build local, A31H, 1920×911, CEP do Acre (2 opções de frete — o caso mais alto). O limiar de sticky de 760px disponibiliza 736px (`top: 24px`): **724px cabem, com 12px de folga.** Pouca folga — o próximo item que crescer nesta coluna empurra o limiar junto, e isso ficou registrado no `globals.css`.

**Uma premissa do `globals.css` estava invertida, e foi corrigida.** O comentário do sticky supunha que as larguras entre 768 e 1200px seriam as piores, "porque a coluna de info é mais estreita lá". Ela não é — é fixa em 240px; quem varia é a fonte, que cresce com a viewport. **O pior caso é a tela mais larga.** Medido com elemento espelho: 3 linhas de 1375px para cima, 2 linhas abaixo disso, inclusive no mobile.

**3. `Product.name` acompanhou o H1.** `lib/seo/produtoSchema.ts` passou de `produto.title` para `tituloProduto(produto)`. O critério registrado no arquivo é **o que a página mostra, não o que a aba mostra**: o schema é uma reafirmação em JSON do conteúdo visível, e divergência entre os dois é sinal de baixa confiança — o mesmo argumento que o `organizacaoSchema.ts` já faz sobre o rodapé. Não muda rich result (o que o Google exibe vem de `offers`); é identidade. `npm run verificar:schema` passa nas 3 camadas, 7 produtos reais conferidos.

**O que deliberadamente NÃO mudou, e por quê:** cards do catálogo e da vitrine (grade estreita), carrinho (vem da API da Shopify, não da rota), meta description (com 47 chars iria a ~170 e truncaria) e **`item_name` do GA4** — este último é o mais importante: o `item_id` é o handle, então o funil não quebraria, mas trocar o nome parte os relatórios em dois rótulos para o mesmo produto, com a metade antiga congelada para sempre.

### ✅ 12/08/2026 — meta descriptions, H2 do rodapé e headings do FAQ

**`/catalogo`: 175 → 155 chars.** Saíram "Todas as" e "do Ta Hora" (a marca já está no title). **Nenhum fato saiu** — os dois tetos de parcelamento continuam inteiros. A versão que este documento propunha cortava "e em até 12x" para caber um "Veja os modelos."; foi descartada, porque trocaria um fato pelo CTA mais genérico que existe e reintroduziria justamente a ambiguidade entre os dois tetos que o `lib/parcelamento.ts` existe para impedir.

**Home: 123 → 155 chars.** A anterior não continha a palavra "câmera" — começava direto na promessa de instalação, e a keyword central da loja ficava fora do campo que o Google exibe. A nova:

> Câmeras de segurança Wi-Fi originais: instale você mesmo em minutos, sem obra e sem técnico. Envio em até 24h, com CNPJ, nota fiscal e 3 meses de garantia.

Vive numa constante `DESCRICAO_HOME` em `app/layout.tsx`, porque alimenta dois campos que precisam concordar (`description` e `openGraph.description`) — eram duas cópias literais idênticas até aqui.

**`H2 TA Hora` do rodapé → `div`.** Feito pelo `Heading`, que passou a aceitar `as="div"`, em vez de um `<div>` solto no `Footer`: preserva a escala, o parser de `%%destaque%%`, o `motion` e o `data-effect-target`. Medido: `font-size 30px`, `weight 700`, `margin 0`, altura 39px — idênticos ao `h2` anterior.

**Perguntas do FAQ → `<h3>`.** No acordeão o `<h3>` **envolve** o botão (padrão de accordion do WAI-ARIA); heading dentro do botão sumiria da lista de títulos do leitor de tela, e trocar o botão por `<h3 role="button">` perderia o teclado nativo. `aria-expanded`, `aria-controls` e o `inert` do painel intactos. O tipo `grid` (usado pelo `/suporte`) recebeu `<h3>` direto, sem botão a envolver.

| Página | Antes | Depois |
|---|---|---|
| Home | h1 ×1, h2 ×7, h3 ×9 | h1 ×1, **h2 ×6**, **h3 ×13** |
| `/suporte` | h1 ×1, h2 ×2 | h1 ×1, **h2 ×1**, **h3 ×4** |

O nível é relativo ao próprio componente, que já emite um `h2` no `FAQHeader` — nenhum nível pulado em nenhuma das duas páginas.

### 🆕 O envio em até 24h existe e nunca foi publicado

**Confirmado pelo operador em 12/08/2026: o pedido é despachado em até 24h após a confirmação do pagamento.** O fato não aparecia em lugar nenhum do site — nem no rodapé, nem no `/suporte`, nem no bloco de confiança da PDP. A única ocorrência de "24" no repositório era `"Equipe dedicada disponível 24 horas"`, que é atendimento, não expedição.

Entrou agora na meta description da home. **É o único lugar onde está.**

**Por que vale mais do que parece:** é a parte do prazo que a loja controla. O trânsito é da transportadora e varia de 6 a 20 dias úteis conforme o destino (a calculadora de frete já mostra isso). Prazo de expedição é opaco na maioria dos marketplaces — o cliente que compra no Mercado Livre não sabe se o vendedor despacha hoje ou em três dias. Declarar o teto é um diferencial de confiança barato, e é verificável pelo próprio cliente no rastreio.

> 🔎 **Oportunidade, não implementada:** levar "envio em até 24h após a confirmação do pagamento" ao **`SelosConfianca` da PDP**, ao lado da garantia, da nota fiscal e da devolução. Aquele bloco é exatamente o inventário de fatos de confiança da página, é server component (sai no HTML do ISR) e hoje traz "Entrega para todo o Brasil" sem nenhuma noção de tempo. O `/suporte` é o segundo candidato. **Onde houver espaço, use a frase completa, com a ressalva do pagamento** — na meta description ela ficou de fora só por caber em 155 chars.
>
> ⚠️ **Nunca escreva "entrega em 24h".** 24h é despacho; entrega é trânsito de transportadora. É a mesma família de erro do "12x sem juros" que o `lib/parcelamento.ts` existe para impedir, e o comentário da constante em `app/layout.tsx` registra isso.

### ✅ 12/08/2026 — Breadcrumbs (visual + `BreadcrumbList`)

O último item de código da auditoria. `Início > Catálogo > Câmera Segurança A31H` nas 7 PDPs, `Início > Catálogo` no `/catalogo`.

**Uma fonte para tela e schema.** `lib/seo/trilha.ts` devolve o array; `components/loja/Trilha.tsx` renderiza `<nav>/<ol>` e `trilhaSchema()` emite o `BreadcrumbList` — os dois recebem o **mesmo array**, calculado uma vez na rota. Divergir deixou de ser possível, mesmo desenho do `path` no `metadataPagina.ts`. Importa porque marcação que inventa hierarquia inexistente é a família do `aggregateRating`: ação manual derruba os rich results do domínio inteiro, `Product` das 7 PDPs incluído.

**Nome curto no último degrau**, não o descritor completo. Além de breadcrumb ser navegação (mesma razão dos cards, do carrinho e do `item_name`), o último degrau é o **menos consequente na SERP**: o Google monta o caminho a partir dos ancestrais — o que substitui a URL é `tahora.com.br › Catálogo`, e a página atual já é o título azul logo acima. O descritor ali pagaria custo de layout por um ganho que não é exibido.

**Último elemento sem `item`** no schema, e sem link na tela — é a página atual. As URLs saem de `SITE_URL`, nunca da requisição, senão o `?ref=` do afiliado entraria na trilha.

**Onde ficou, e o que custou.** A trilha é **irmã** do `.produto-grid`, fora de `.produto-coluna-esquerda` — confirmado no DOM (`col.contains(trilha) === false`). Remedido no build local (A31H, 1920×911, CEP do Acre, 2 opções de frete):

| | Antes | Depois |
|---|---|---|
| Coluna do sticky, frete aberto | 724px | **724px** |
| Folga contra os 736px do limiar | 12px | **12px** |
| Topo da galeria | 130px | 152px |

**O orçamento do sticky não se moveu em um pixel** — era o ponto de pôr a trilha fora do grid. O `padding-top` do `<article>` foi de 40px para 12px para compensar; **o custo líquido não foi zero, foi +22px** de deslocamento da galeria. É uma linha de 13px numa página de 911px, e preferi registrar o número a arredondá-lo para "praticamente nada".

No mobile cabe em **uma linha**: o texto mais longo dos 7 produtos mede 247px, contra 350px disponíveis a 390px de viewport (320px a 360px). O `flex-wrap` fica como rede de segurança, não como comportamento esperado.

`<nav aria-label>` (a página tem três navegações), `<ol>` porque a ordem é a informação, separador `aria-hidden`, último item com `aria-current="page"`.

**Sem guarda novo, por decisão.** O `og:url` mereceu porque a divergência era possível e silenciosa; aqui o array compartilhado já remove o modo de falha. Um script só pegaria quem voltasse a escrever a trilha à mão nos dois lugares.

### ✅ 12/08/2026 — Open Graph próprio nas 6 páginas, com guarda

**O que era:** 6 das 14 páginas emitiam `og:url = https://www.tahora.com.br` e o `og:title` da home. **O que é:** cada uma anuncia a si mesma, verificado no HTML servido.

| Página | `og:url` | `og:title` |
|---|---|---|
| `/catalogo` | `…/catalogo` | Catálogo de Câmeras de Segurança Wi-Fi |
| `/sobre-nos` | `…/sobre-nos` | Sobre a Ta Hora — loja com CNPJ e nota fiscal |
| `/suporte` | `…/suporte` | Suporte Ta Hora — dúvidas sobre câmeras Wi-Fi |
| `/politica-de-privacidade` | `…/politica-de-privacidade` | Política de Privacidade |
| `/termos-de-uso` | `…/termos-de-uso` | Termos de Uso |
| `/trocas-e-devolucoes` | `…/trocas-e-devolucoes` | Trocas e Devoluções |

`canonical == og:url` nas 7 páginas estáticas, conferido uma a uma.

**Por que um helper e não 6 blocos: `openGraph` não é mesclado, é substituído por inteiro.** A documentação do Next diz que objetos aninhados como `openGraph` são sobrescritos pelo último segmento que os definir, e o `mergeMetadata` confirma. Ou seja, `openGraph: { url: "/catalogo" }` **não acrescenta** a url ao bloco herdado — descarta o bloco e emite só a url, deixando a página sem imagem, `siteName`, `locale` e `type`. Preview sem miniatura é pior que preview com a imagem errada. Era isso, e não redundância, que fazia o `openGraph` da PDP repetir tudo o que o raiz define.

`lib/seo/metadataPagina.ts` emite o bloco inteiro uma vez e deriva `canonical` e `og:url` **do mesmo argumento `path`** — divergir deixou de ser possível. A arte de OG virou `OG_IMAGE_PADRAO`, compartilhada com o `app/layout.tsx`, que tinha o mesmo objeto literal duplicado.

**Dois `og:title` receberam texto próprio.** "Sobre Nós" e "Suporte" funcionam como rótulo de aba, ao lado do sufixo da marca — e são manchetes vazias no WhatsApp, onde a pessoa lê o título antes de decidir se clica. As legais ficaram com o título puro: já se descrevem.

**A PDP ficou fora por decisão.** Usa `generateMetadata`, `og:image` por produto e dimensões por foto; o `openGraph` dela já estava próprio e correto. Cabe no helper com um parâmetro, mas a migração é commit próprio.

✅ **`npm run verificar:og`** — lê o HTML pré-renderizado em `.next/server/app`, sem rede e sem servidor, e falha se `og:url` ≠ o esperado, se `og:url` ≠ `canonical`, se faltar `og:title`/`og:description`/`og:image`/`og:site_name`, ou se o `og:title` carregar o sufixo `| Ta Hora` (que o `template` não aplica ao OG e o `og:site_name` já cobre).

**Contraprova executada:** reintroduzindo o `og:url` da home no `/catalogo`, o guarda acusou as duas regras e saiu com **exit 1**; com o defeito removido, exit 0. Roda **depois** do build, porque lê a saída dele — sem `.next/server/app`, avisa e sai com sucesso.

> **Por que este item mereceu guarda e os outros não:** metadata errada é HTML válido. Não quebrou build, não quebrou `tsc`, não quebrou teste, e ficou meses no ar — só apareceu porque alguém foi ler o `<head>` servido procurando outra coisa. É a mesma categoria do `aggregateRating` e da proporção das imagens de descrição, que já têm os seus.

### ~~🆕 Open Graph: 12 das 14 páginas anunciam a home~~ — diagnóstico original (12/08/2026)

Achado durante a verificação das descriptions, **não corrigido**. Só a Home e as 7 PDPs declaram `openGraph` próprio. As demais herdam o do layout raiz inteiro — e isso inclui o `og:url`:

| Página | `og:url` emitido | Correto seria |
|---|---|---|
| `/catalogo` | `https://www.tahora.com.br` | `…/catalogo` |
| `/sobre-nos` | `https://www.tahora.com.br` | `…/sobre-nos` |
| `/suporte` | `https://www.tahora.com.br` | `…/suporte` |
| 3 páginas legais | `https://www.tahora.com.br` | a própria URL |

O `og:title` dessas páginas também vem o da home ("Ta Hora — Câmeras de Segurança Wi-Fi Originais"), ignorando o `title` que cada uma declara corretamente. Efeito prático: **um link do `/catalogo` colado no WhatsApp mostra a prévia da home**. Numa loja que vende por indicação e afiliado, é o mesmo tipo de perda que o `openGraph` da PDP foi criado para evitar — o comentário daquele arquivo explica por que ele repete tudo o que o raiz já define. As outras 6 páginas nunca receberam o mesmo tratamento.

Não afeta busca (o canonical de cada página está correto e é auto-referencial). Afeta compartilhamento. Entra como item aberto abaixo.

### ❌ Continua aberto (nenhum destes foi tocado hoje)

| Prioridade | Item | Estado verificado |
|---|---|---|
| **Alta** | Vídeo de instalação real (Experience) | não existe |
| Baixa | Arte de OG dedicada do `/catalogo` | as 7 páginas compartilham `og-image.webp`; é trabalho de design, não de código |
| Média | Envio em até 24h no `SelosConfianca` da PDP | 🆕 fato confirmado, hoje só na meta description da home |
| Média | Camada de conteúdo / blog | 14 URLs, zero informacional |
| Média | Tabela comparativa no `/catalogo` | não existe |
| Média | Expandir PDPs para 800+ palavras | não iniciado |
| Média | Vitrine da home 3 → 6 produtos | segue em 3 |
| Média | PageSpeed Insights com chave de API | CWV continuam inferidos, não medidos |
| Média | Coleta de avaliação de 1ª parte | não iniciada |
| Baixa | `ItemList` no `/catalogo` | catálogo tem 0 blocos JSON-LD |
| Baixa | `srcset` / `images.unoptimized` | `grep srcset` = 0 em produção |
| Baixa | `Disallow: /*?ref=` no robots.txt | robots inalterado |
| ⚠️ | Imagem de descrição `lazy` acima da dobra (desktop) | **pendente de decisão do dono** — ver seção 10 |

**Leitura da lista, atualizada em 12/08 — a camada técnica está encerrada.** Fecharam os acabamentos de on-page (as duas descriptions, o `H2` do rodapé, os `<h3>` do FAQ), o Open Graph das 6 páginas e os breadcrumbs. **Não sobrou nenhum item de código de prioridade alta.** O que resta da fila inteira é **conteúdo e prova**: o vídeo de instalação, os artigos, a tabela comparativa do catálogo, a coleta de avaliação de primeira parte — mais três itens técnicos de prioridade baixa (`ItemList`, `srcset`, `Disallow: /*?ref=`) e a decisão pendente do `lazy` na imagem de descrição.

A partir daqui, mais código não move o ponteiro. O que move é publicar.

---

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

> ✅ **Esta tabela é histórica — os 7 titles de PDP foram trocados em 11/08/2026.** Os valores atuais em produção estão na seção "Antes/depois" no topo do documento. O diagnóstico abaixo fica registrado porque explica *por que* a troca valia, e porque o mesmo raciocínio ainda se aplica ao **H1** das PDPs, que não foi tocado.

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
2. ✅ ~~**`preload` em todas as imagens acima da dobra** (4 na home, 7 no catálogo e na PDP)~~ — **CORRIGIDO na home e no catálogo em 11/08/2026; a contagem original estava errada.** Ver a seção 10.

   Três acertos de fato sobre este item:
   - **A PDP tem 8 preloads, não 7.**
   - **`/sobre-nos` tem 2**, e este documento nem a mencionava. (`/suporte` tem 0.)
   - **"Saturam a banda" era verdade em 15,3 MB; hoje não.** Depois do redimensionamento, o total em prioridade máxima é 32-128 KB por página. O custo da disputa caiu para a ordem de **~50-75 ms em 4G** — real, mas modesto.
3. ~~**Nenhuma `<img>` tem `width`/`height`** → cada imagem é fonte de CLS.~~ **✅ CORRIGIDO NO DIAGNÓSTICO em 11/08/2026 — a premissa era falsa.** A primeira metade é verdadeira (não há atributos), a segunda não decorre dela: atributo é *um* jeito de reservar espaço, `aspect-ratio` no CSS é outro — e melhor, porque é responsivo. Ver o levantamento na seção 10.
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
| 4 | ✅ ~~`width`/`height` explícitos em toda `<img>`~~ — **feito de outro jeito, porque o diagnóstico estava errado**: `aspect-ratio: 1/1` + `object-fit: contain` nas imagens de descrição, que eram as ÚNICAS sem reserva de espaço | ~1h | Zera o CLS de imagem |
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
2. ✅ **~~NAP completo e visível~~ — FEITO em 11/08/2026.** O rodapé já trazia razão social, CNPJ e endereço nas 14 páginas; faltava o **telefone**, que só existia dentro do `/suporte`. NAP é Name-Address-**Phone**, e a consistência dos três entre site, marketplaces e diretórios é o sinal que casa a entidade. Sem questão de privacidade: é endereço comercial de registro, já público no rodapé desde antes — e é justamente por não haver atendimento presencial que o schema usa `OnlineStore` e não `LocalBusiness` (seção 8).
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

✅ **Submetido no Google Search Console em 10/08/2026** — painel retornou "Sucesso", com **14 páginas descobertas**, exatamente as 14 `<loc>` do arquivo. Nenhuma URL sobrando nem faltando.

A partir daqui o Search Console passa a ser a fonte de verdade sobre o que este documento previu: impressões, CTR e posição média por página, o relatório de itens de comércio (`Product`) e a cobertura de indexação. **A janela útil de leitura começa em ~2 semanas** — antes disso os dados são ruído, e as mudanças de title de 11/08/2026 (seção 1.1) só aparecem depois de o Google reprocessar as PDPs.

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
| **OnlineStore** (Organization) | Home | ✅ **Implementado (11/08/2026)** | ~~1~~ feito |
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

### ✅ OnlineStore / Organization — implementado em 11/08/2026

`lib/seo/organizacaoSchema.ts`, emitido **só na home** (`app/page.tsx`). A orientação do Google é declarar a entidade na home — *"You don't need to include it on every page of your site"*; no layout raiz ela sairia 14 vezes sem acrescentar sinal.

**Tipo: `OnlineStore`, não `LocalBusiness` — decisão registrada.** O endereço do Brás é onde a empresa está registrada, **não há atendimento presencial**. `LocalBusiness` habilita Maps e pacote local, ou seja, faria cliente aparecer na porta esperando ser atendido. `OnlineStore` é subtipo de `Organization` para varejo online: descreve o que a empresa é sem prometer o que ela não faz.

Campos: `name` (fantasia) + `legalName` (razão social) como campos distintos; **CNPJ em `taxID`** — o campo do schema.org para identificação fiscal, não `identifier` genérico, que perderia o significado do número; `address` completo (o bairro vive dentro do `streetAddress`, porque `PostalAddress` não tem campo de bairro); `telephone`; `email`; `logo` (`logo-tahora.png`, **512×512**, bem acima do mínimo de 112×112); e `sameAs` com Mercado Livre, Shopee e Instagram.

> ⚠️ **Não é rich result, e a diferença com o FAQPage importa.** A documentação do Google diz que o Organization *"ajuda a entender os detalhes administrativos da organização e a desambiguá-la nos resultados"* — alimenta knowledge panel, perfil de comerciante e desambiguação de entidade, **não decora o resultado de busca**. Mas isto **não** é o caso do FAQPage: aquele é um recurso extinto, com suporte removido das ferramentas; este é ativo, documentado e mantido. É investimento de identidade de marca, não de CTR.

**Duas fontes para os mesmos fatos, de propósito e com aviso:** o rodapé exibe razão social, CNPJ, endereço e telefone nas 14 páginas; o schema os afirma em JSON-LD. Mudou um deles, muda nos dois — divergência entre o que o schema declara e o que a página mostra é sinal de baixa confiança. O aviso está nos dois arquivos.

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
| **CLS** | ✅ **Corrigido em 11/08/2026** | O diagnóstico anterior ("Poor, galeria e cards sem dimensões") estava errado — ver abaixo |
| **INP** | Não avaliado | Carrossel, accordion e drawer são candidatos a verificar |

**A tradução em dinheiro, com os benchmarks da literatura:**

- Cada 100 ms de melhora no LCP correlaciona com ~1,1% de aumento em conversão.
- Reduzir CLS em 0,1 correlaciona com ~15% de queda no bounce.
- Sites que passam nos três CWV têm ~24% menos abandono de página.

**O cálculo, agora com o número certo:** 1,47 MB de imagem numa PDP, em 4G brasileiro (~8 Mbps reais), é da ordem de **1,5 s** só de imagem — não os 26 s que a versão anterior deste documento projetava. O redimensionamento leva isso para ~0,7 MB, algo como **700 ms de ganho de LCP**. Pelo benchmark de 1,1% por 100 ms, é um ganho de conversão na casa de um dígito percentual: real, mas de outra ordem que o erro original sugeria.

### ⚠️ Correção de 11/08/2026 — o diagnóstico de CLS estava errado

A versão anterior afirmava *"CLS provável Poor; galeria e cards renderizam sem `width`/`height`"* e recomendava adicionar os atributos em toda `<img>`. **A medição derrubou a premissa em dois pontos:**

**1. `aspect-ratio` no CSS já cobre quase tudo.** Reservar espaço não exige atributo. Levantamento componente a componente:

| Onde | Como reserva espaço | CLS |
|---|---|---|
| Hero (LCP da home) | `.hero-palco { aspect-ratio: 16/9 }` | ✅ |
| Galeria da PDP | `aspectRatio: "1 / 1"` | ✅ |
| Thumbnails | botão fixo 64×64 | ✅ |
| Cards do catálogo (`CameraBloco`) | `aspectRatio: "1 / 1"` | ✅ |
| Cards da vitrine (`ProductCardLink`) | `aspectRatio: "1 / 1"` | ✅ |
| `ProductGrid` | `aspectRatio: "3/2"` ou `"4/3"` | ✅ |
| Carrinho / Acessórios | `width`/`height` explícitos | ✅ |
| **Imagens da descrição** | **nenhuma** (`height: auto`, sem proporção) | ❌ |

**2. Os atributos seriam inócuos no `ImageSlot`.** O `<img>` de lá tem `style={{ width: "100%", height: "100%" }}` — dimensão CSS explícita nos dois eixos **sobrescreve** a proporção derivada dos atributos. Eles entrariam no HTML sem mudar um pixel de layout. A recomendação original teria gerado ~1h de trabalho com efeito zero.

**O CLS real eram as 4 imagens de descrição por PDP**, em largura total, `loading="lazy"`, sem dimensão conhecida: reservam zero altura e saltam ao carregar durante o scroll, empurrando o texto abaixo. Não são `product.images` — são arquivos soltos da biblioteca de Files da Shopify, e a Storefront API não devolve dimensão para elas.

✅ **Corrigido**: as 28 imagens (7 PDPs × 4) foram medidas e são todas **800×800**, então `.descricao-produto img` ganhou `aspect-ratio: 1 / 1` + `object-fit: contain`. O `contain` é a rede de segurança — o mesmo bloco de CSS registra que um `aspect-ratio: 4/3` anterior **esmagava retratos reais** (800×1067), então retrato já existiu nesta loja. `npm run verificar:descricao` agora lê o header de cada imagem e falha se alguma fugir de 1:1: a premissa do CSS é verificada, não confiada.

> **O efeito está provado por MECANISMO, não por NÚMERO.** Confirmei lendo o DOM, o CSS compilado e as dimensões reais dos arquivos; **não medi o valor de CLS antes e depois**. O PageSpeed Insights recusa sem chave de API (429), e não há chave. Enquanto isso, "CLS corrigido" significa "a causa foi removida e verificada", não "o score foi medido em 0". Medir exige criar uma chave do PSI.

### ✅ Preloads de imagem — corrigido na home e no catálogo (11/08/2026)

**Origem:** nenhum `preload` deste site é escrito à mão. O **React 19 emite um `<link rel="preload" as="image">` para cada `<img>` renderizada no SSR que não tenha `loading="lazy"`**. Verificado na PDP: 12 imagens, 4 com `lazy` (as da descrição), exatamente 8 preloads. Consequência prática: `loading="lazy"` é o único jeito de tirar uma imagem do preload — não existe desligar um sem o outro.

**Contagem medida** (o documento dizia "4 na home, 7 no catálogo e na PDP"):

| Página | Preloads | KB em prioridade máxima | Depois |
|---|---|---|---|
| home | 4 | 127,6 KB | **1** |
| catálogo | 7 | 103,0 KB | **1** |
| PDP | **8** (não 7) | 77,9 KB | 8 — intocada, por decisão |
| **`/sobre-nos`** | **2** — ausente do documento | 32,0 KB | 2 |
| `/suporte` | 0 | — | 0 |

**LCP medido no Chrome, build local, viewport 1920×855:**

| Página | Elemento LCP | Tempo |
|---|---|---|
| home | `<img>` `Promocao_placa.webp` (hero) | 556 ms |
| catálogo | `<img>` `A31H3_4.png` (1º card) — **não o H1** | 216 ms |

A dúvida "e se o LCP do catálogo for o texto?" foi respondida por medição: é a imagem. E das 7 do catálogo só duas ficam acima da dobra (`top` 321 e 797; a terceira em 1.274).

**O que foi feito:** `loading="lazy"` nos 3 cards da vitrine da home e nos cards 2-7 do catálogo (prop `foraDaDobra`, decidida por quem itera a lista, não pelo card); `fetchPriority="high"` no hero. Thumbnails da PDP deixados eager de propósito — 2,8-5,1 KB cada, acima da dobra, e `lazy` neles atrasaria mais do que economizaria.

> ⚠️ **O ganho é MODELADO, não medido.** As medições foram feitas em `localhost`, que não tem latência nem limite de banda — exatamente a variável que este item ataca. Lá o LCP é custo de parse e render (216-556 ms), e a disputa por banda é invisível. Os **~48 ms (home)** e **~75 ms (catálogo)** vêm de um modelo de HTTP/2 sobre os bytes reais medidos a ~1 MB/s (4G brasileiro), não de um antes/depois observado. Medir de verdade exigiria throttling do DevTools ou uma chave do PSI — nenhum dos dois disponível aqui. O que ESTÁ medido: o LCP de cada página, a posição de cada imagem e a queda de 4→1 e 7→1 preloads.

### ⚠️ Item aberto — imagem de descrição com `lazy` acima da dobra (PDP)

Achado durante a medição acima, **não corrigido**, e deliberadamente separado deste item.

Na PDP em **desktop**, o layout é grid de 2 colunas: galeria à esquerda, descrição à direita. Isso põe a primeira imagem de descrição **no topo da página, ao lado da galeria** — e ela é **a maior imagem acima da dobra**:

```
i=0  galeria principal   área 207.936  top 130  eager
i=6  IC-A31H_01.png      área 230.400  top 130  LAZY   ← maior
```

Ou seja: a provável imagem de LCP da PDP em desktop está marcada `loading="lazy"`, que além de tirá-la do preload faz o navegador esperar o layout para buscá-la. É o anti-padrão clássico de LCP.

**Não foi introduzido agora** — `sanitizarDescricao` marca todas as imagens de descrição como `lazy` desde antes deste trabalho, e para o mobile isso está **certo**: lá o layout empilha, a descrição vai para baixo da galeria e fica de fato fora da dobra.

**Por que não tem correção óbvia:** a resposta certa depende do viewport, e `loading` é atributo de HTML — **CSS não o controla**. Tirar o `lazy` conserta o desktop e piora o mobile, onde passaria a precarregar 4 imagens de 800 px que ninguém vê na abertura. As saídas plausíveis (marcar só a primeira como eager, decidir no cliente por `matchMedia`, ou usar `<picture>`) têm custos diferentes e nenhuma é gratuita.

**Pendente de decisão do dono** antes de qualquer código.

**Os outros itens de CWV seguem abertos:** o `srcset` responsivo (item 22) e o item de descrição acima.

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

2. ✅ **~~Reescrever os 7 titles de PDP~~ — FEITO em 11/08/2026 e confirmado em produção.** Os descritores não foram digitados à mão nem tirados do nome do produto: são **derivados da ficha técnica real**, o que derrubou três das suposições desta auditoria (a "S8 solar" é 3K vertical tripla lente). Os 7 titles ficaram entre 51 e 60 chars. **Sobrou o H1:** a mesma PDP que agora se intitula "Câmera Segurança Wi-Fi Full HD Dupla Lente A31H" ainda exibe `<h1>Câmera Segurança A31H</h1>`. O descritor já está calculado na rota — é reaproveitá-lo. **Este é o item nº 1 restante de SEO on-page.**

3. ✅ **~~Confirmar que o sitemap está submetido no Google Search Console~~ — FEITO em 10/08/2026.** Painel retornou "Sucesso", **14 páginas descobertas** — bate exatamente com as 14 `<loc>` do `sitemap.xml`. É o que torna observável tudo o mais deste documento.

4. ✅ **~~`FAQPage` schema na home e no `/suporte`~~ — RETIRADO, e substituído por outra correção.** O FAQ rich result não existe mais desde 2023/2026 (ver seção 8): o schema renderia zero. A investigação revelou o problema real — **as respostas do FAQ da home não estavam no HTML** — e foi isso que se corrigiu em 11/08/2026. Ganho de conteúdo indexável, sem markup.

### 🟠 Alta prioridade — este mês

5. ✅ **~~Redimensionar as imagens do CDN da Shopify~~ — FEITO em 11/08/2026.** `width=800` (galeria), `400` (cards), `128` (thumbnails), `1200` (`og:image`), com `width`/`height` recalculados junto. Medido: home −88%, catálogo −81%, PDP −61%.
6. ✅ **~~`width`/`height` em toda `<img>`~~ — FEITO em 11/08/2026, por outro caminho.** O diagnóstico estava errado: `aspect-ratio` no CSS já cobria hero, galeria, cards e thumbs, e os atributos seriam neutralizados pelo `style` inline do `ImageSlot`. A única fonte real de CLS eram as imagens de descrição, corrigidas com `aspect-ratio: 1/1` + `object-fit: contain` e guarda no `verificar:descricao`. Ver seção 10. (O `loading="lazy"` das imagens de descrição já existia.)
7. ✅ **~~Limitar o `preload` de imagem a uma por página~~ — FEITO na home e no catálogo em 11/08/2026.** 4→1 e 7→1, com `fetchPriority="high"` no hero. LCP de ambas medido no Chrome (é a imagem nas duas, não o texto). PDP mantida em 8 por decisão: os 5 thumbnails são de 2,8-5,1 KB e estão acima da dobra. Ganho **modelado** em ~48 ms (home) e ~75 ms (catálogo) — não medido, porque localhost não tem latência. Ver seção 10.
8. ✅ **~~`Organization` schema na home + NAP completo no rodapé~~ — FEITO em 11/08/2026.** `OnlineStore` na home (ver seção 8) e o **telefone acrescentado ao rodapé** — até então o NAP tinha nome e endereço, sem o "P", que só existia dentro do `/suporte`. Ver seção 2.
8b. ✅ **~~Levar o descritor do title para o H1 da PDP~~ — FEITO em 12/08/2026.** O H1 passou a usar `tituloProduto(produto)`, a mesma função de `generateMetadata` — não uma segunda string. Junto veio a redução de fonte do H1 (`clamp(18px, 2.4vw, 30px)` → `clamp(18px, 1.6vw, 22px)`, inline e escopada à PDP), e o `Product.name` do schema acompanhou. Ver "Antes/depois" no topo.
9. ✅ **~~Breadcrumbs visuais + `BreadcrumbList` schema no catálogo e nas PDPs~~ — FEITO em 12/08/2026.** Uma fonte só (`lib/seo/trilha.ts`) para a tela e para o schema; nome curto no último degrau; trilha fora da coluna do sticky, que continua em 724px com 12px de folga. Ver "Antes/depois" no topo.
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

*Auditoria gerada por `/market-seo` em 11/08/2026, com correção de medição e passe de verificação de produção aplicados na mesma data. O passe de verificação conferiu no HTML servido pelo domínio de produção (headers de navegador): blocos JSON-LD e seus `@type`, os 7 titles e suas descriptions, contagem de `rel=preload as=image`, parâmetros `width=` nas URLs do CDN, presença das respostas do FAQ no DOM, hierarquia completa de headings, `srcset`, dimensões de `og:image` e o `robots.txt`.*

*Nota original:* Medições de peso de imagem e TTFB feitas em requisições reais ao domínio de produção; o peso de imagem foi remedido com headers de navegador (`Accept: image/webp`) após o erro descrito no topo. Números de LCP/CLS/INP permanecem inferidos — o PageSpeed Insights não foi executado (API pública respondeu 429 sem chave).*
