> **⚠️ Correção posterior — 10/08/2026:** o parcelamento real é **até 3x sem juros**
> (Mercado Pago, único meio ativo no checkout), não 12x, e **não há desconto no
> PIX**. O site foi corrigido nesta data. Toda recomendação abaixo construída
> sobre "12x" precisa ser relida antes de implementada — inclusive as âncoras de
> preço derivadas dele.

# Auditoria de Marketing: Ta Hora

**URL:** https://ta-hora-loja.vercel.app/
**Data:** 31 de julho de 2026
**Tipo de negócio:** E-commerce (varejo de câmeras de segurança Wi-Fi, checkout Shopify)
**Score geral de marketing: 56/100 (Nota: C)**
**Auditoria anterior:** 30/07/2026 — 38/100 (F). **Variação: +18 pontos em 24 horas.**

---

## Sumário executivo

O Ta Hora sai de **38 para 56 em um dia**, de F para C. O salto é real e foi medido item por item, não inferido de mensagem de commit: `robots.txt` e `sitemap.xml` respondem 200 depois de estarem em 404; as 14 páginas ganharam `<title>` único, meta description, canonical e Open Graph; o hero que era um PNG de 1,03 MB com extensão `.webp` mentirosa hoje é WebP genuíno de 81.642 bytes (confirmado por magic bytes `RIFF...WEBP`, não pelo commit); três páginas legais estão no ar; e o rodapé assina CNPJ, razão social e endereço em 100% das páginas. Nenhuma dessas correções é cosmética — juntas, elas tiram o site da faixa em que o comprador brasileiro o classificava como golpe.

A maior força nova, e a surpresa da auditoria, é o conteúdo de produto. Os 7 SKUs ganharam apresentação narrativa via metafield, e a copy é boa de verdade: dor concreta → consequência → solução → benefícios → **ressalva honesta**. A Camera Lampada avisa, antes da compra, que *"conecta só em Wi-Fi 2.4 GHz"*, que *"o interruptor daquela luz precisa ficar sempre ligado"* e que *"o cartão não vem incluso"*. Dizer o que o produto não faz, antes de vender, é raro nessa faixa de preço e é o tipo de ativo que reduz devolução e constrói recompra. Conteúdo foi de 41 para 63, a maior subida individual.

A maior lacuna mudou de natureza — e é isso que torna esta auditoria diferente da de ontem. Ontem o problema era **ausência**: faltavam políticas, faltava CNPJ, faltava SEO. Hoje o problema é **contradição**. O site publica CNPJ, endereço e três políticas com CDC art. 49 citado nominalmente — e na mesma home publica um depoimento que diz *"Comprei um fone bluetooth"* numa loja que vende exclusivamente 7 câmeras. Quatro dos cinco subagentes, trabalhando de forma independente, elegeram esse depoimento como o achado mais grave do site. Ele anula, sozinho, o investimento inteiro em assinatura jurídica: o comprador cético que lê os dois em sequência não conclui "loja idônea com um deslize", conclui "o site inventa coisas".

A contradição se repete em três outros lugares e o padrão é sempre o mesmo — **o ativo existe e está apontado para o lugar errado**. Os sinais de confiança da PDP ("12x", "garantia", "nota fiscal") aparecem 6 vezes cada no HTML do produto, todas dentro de `<meta>` e Open Graph: o Google lê, o comprador não. O `PriceTag` aceita `installments` e `cashNote` e a PDP passa só três props, então "R$ 185,00" aparece sozinho na tela onde a decisão acontece. O `AcessoriosSugeridos` está codificado, testado e com o gatilho certo, mas nenhum produto tem a tag que o liga. E o programa de afiliados — a peça de engenharia mais cara do projeto, com cookie de 30 dias, last-touch e carimbo no pedido Shopify provado ponta a ponta — tem, na home, um `<button>` sem `href` e sem handler. Piorou de forma desde ontem: era `href="#"`, hoje é um botão inerte.

As três ações de maior retorno, nesta ordem: **(1)** tirar os dois depoimentos falsos do ar e substituí-los pelas 68 avaliações reais do Mercado Livre, com atribuição — 20 minutos de trabalho que destravam o valor de tudo o que foi assinado ontem; **(2)** cadastrar `tag:acessorio` nos produtos de acessório que **já existem na Shopify** (cartão de memória 64GB e cabo de 5 metros, hoje sem PDP e sem tag), o que liga sozinho o cross-sell do carrinho sem uma linha de código nova; **(3)** instalar medição, que segue inexistente e sem a qual nada aqui é verificável.

**Sobre impacto em receita:** confirmado hoje por grep de 9 padrões no HTML servido e em todo o código — o site **não tem** GA4, Meta Pixel, GTM, `@vercel/analytics` nem qualquer instrumentação. Portanto não existe dado de tráfego, conversão ou faturamento, nem meu nem de terceiros. A seção financeira adiante é um **cenário modelado sobre premissas declaradas**, mantido com as mesmas premissas de ontem para permitir comparação. Trate os números como ordem de grandeza para priorizar esforço, jamais como previsão.

---

## Score por categoria

| Categoria | 30/07 | **31/07** | Δ | Peso | Ponderado | Achado principal |
|---|---|---|---|---|---|---|
| Conteúdo & Mensagem | 41 | **63** | +22 | 25% | 15,75 | 7/7 PDPs com apresentação narrativa e ressalva honesta; depoimentos falsos intactos |
| Otimização de Conversão | 52 | **58** | +6 | 20% | 11,60 | PDP ganhou conteúdo, não ganhou conversão: preço sem parcela, sem CTA fixo no mobile |
| SEO & Descoberta | 27 | **61** | +34 | 20% | 12,20 | robots/sitemap/metadata resolvidos; **zero JSON-LD** segue sendo o teto |
| Posicionamento Competitivo | 42 | **51** | +9 | 15% | 7,65 | Site é ~30% mais caro que a loja do próprio dono no Mercado Livre |
| Marca & Confiança | 31 | **52** | +21 | 10% | 5,20 | CNPJ e políticas publicados; prova social falsa anula o ganho |
| Crescimento & Estratégia | 29 | **34** | +5 | 10% | 3,40 | Nenhum motor ligado; afiliados pioraram de `href="#"` para botão inerte |
| **TOTAL** | **38** | | | **100%** | **55,80 → 56/100** | **Nota C** |

A leitura correta da tabela: **descoberta e credibilidade formal foram resolvidas; conversão e crescimento não foram tocados.** SEO subiu 34 pontos, Crescimento subiu 5. O site ficou muito melhor em ser encontrado e em parecer legítimo, e continua igual em transformar visita em venda e em gerar tráfego próprio.

---

## Quick Wins (esta semana)

**1. Tirar os dois depoimentos falsos do ar. — 20 minutos, maior ROI da auditoria.**
`layouts/_home.json`, blocos de testimonial. Rodrigo M. diz *"Comprei um fone bluetooth"*; Felipe S. diz *"Melhor custo-benefício em acessórios que já achei"*. O catálogo tem 7 câmeras. Dois depoimentos autoevidentemente falsos invalidam os outros três, que são plausíveis. Substituir pelas avaliações reais do Mercado Livre com atribuição explícita ("avaliação verificada no Mercado Livre"). **Se não houver tempo de transcrever, deletar a seção é melhor que mantê-la** — ausência é melhor que fraude óbvia. Quatro dos cinco subagentes elegeram este como o achado mais grave do site.

**2. Dar destino ao "Quero ser afiliado" — ou removê-lo.**
`layouts/_home.json:143` define `ctaLabel` sem `ctaHref`; `HowItWorks.tsx:246` faz `href={c.ctaHref || undefined}` e degrada para `<button type="button">` sem handler. O rodapé de **todas as 6 páginas** tem `column2Link1Label: "Seja um Afiliado"` sem `href`, caindo no default `"#sobre"` — âncora que não existe em página nenhuma, e `Footer.tsx:78-80` registra que *"o href segue morto DE PROPÓSITO"*. Um `ctaHref` para um Tally ou Google Form resolve a v1. Isto destrava o único ativo de aquisição já construído e pago.

**3. Instalar GA4 + Meta Pixel + eventos de e-commerce.**
`app/layout.tsx` para o script; `components/loja/BotaoAdicionar.tsx:23` para `add_to_cart`; `CarrinhoDrawer.tsx:266` para `begin_checkout`. Sem isso não há remarketing para carrinho abandonado, o algoritmo de anúncio não recebe sinal de conversão, e **nenhum item desta lista pode ser medido**. É pré-requisito de todo o resto.

**4. Preencher o `PriceTag` da PDP.**
`app/produtos/[handle]/page.tsx:204` passa apenas `price`, `currency` e `size`. O componente já aceita `installments`, `cashNote`, `oldPrice` e `discountLabel` e já renderiza todos. Adicionar `installments="12x de R$ 15,42 sem juros"` e a nota do PIX. No varejo brasileiro o cliente ancora na parcela: R$ 185 à vista assusta, 12x de R$ 15,42 não. É a mudança de maior retorno por linha de código no site.

**5. Subir os sinais de confiança do `<meta>` para o corpo da PDP.**
Medição de hoje: "garantia" aparece 6×, "12x" 6× e "devoluç" 2× no HTML da A31H — **todas dentro de `<meta>`, `og:` e `twitter:`**. O corpo visível do bloco de compra é, na íntegra: *"Camera Segurança A31H · R$ 185,00 · Adicionar ao carrinho"*. Inserir logo abaixo do botão (`page.tsx:209`, onde o comentário da linha 200 já reserva o espaço): *3 meses de garantia direto com a loja · Até 12x no cartão · Nota fiscal · 7 dias para devolver (CDC) · **frete de devolução por nossa conta***. Todo esse texto já foi escrito e aprovado nas páginas legais — está só na tag errada.

**6. Barra de compra fixa no mobile da PDP.**
`app/globals.css:430` aplica `position: sticky` só a partir de 768px. Abaixo disso o bloco colapsa para 1 coluna e não há nenhum `position: fixed` de compra em `components/loja/`. A PDP acabou de ficar ~3× mais longa com a apresentação nova: o cliente rola ~2.000px de texto e 21 specs sem nenhum botão à vista, e o único caminho de volta é rolar tudo de novo. É a maior perda mobile do site, e ela **piorou** justamente por causa da melhoria de conteúdo.

**7. Corrigir "Camera" → "Câmera" nos 7 títulos.**
Admin da Shopify. Também "Lampada" → "Lâmpada", "memoria" → "memória" e "Externor" → "Externo" (não é palavra). Propaga sozinho para `<h1>`, `<title>`, `og:title` (`page.tsx:87,94`), cards do catálogo e sitemap. Erro de português no maior texto da página, repetido 7 vezes, numa loja que se vende como estabelecida.

**8. Resolver a contradição "mais vendida".**
No `/catalogo`, o A31H tem o selo **"Mais vendida"** e o P9 tem o resumo *"**A mais vendida**, pra quem quer começar com o essencial"* — os dois aparecem na mesma tela. Trocar o resumo do P9 (metafield `custom.resumo`). Duas afirmações incompatíveis lado a lado ensinam o visitante a descontar tudo o que o site afirma.

**9. Trocar `icamera6688@gmail.com` por um endereço da marca.**
`layouts/suporte.json:56`. Não é só "Gmail genérico": quem escreve para o suporte da "Ta Hora — CH CFTV" recebe resposta de "icamera6688". São **três identidades na mesma jornada**. Enquanto não houver domínio próprio, um Gmail com o nome da marca já resolve.

**10. Consertar ou remover a promessa de preço em `/sobre-nos`.**
O benefício nº1 da página é *"Preços melhores — Sem o intermediário do marketplace, repassamos o desconto direto pra você"*. Ver a seção competitiva: é refutável pelo link que o próprio site publica. Trocar por um benefício verdadeiro e defensável — garantia de 3 meses direto com a loja, sem laudo e sem assistência técnica, algo que Intelbras e Amazon não oferecem.

**11. Adicionar `&width=` em toda URL de imagem do CDN Shopify.**
Medido: a mesma imagem sai a 157.154 B sem o parâmetro e a **28.606 B com `&width=800`** — 5,5× de LCP jogados fora. Já existe precedente no código (as imagens `IC-A31H_*` usam `&width=800`, as outras não). Padronizar num helper e aplicar no `ImageSlot` e nos `<link rel="preload">`. Reduzir também os 7 preloads da PDP para 1 e adicionar `<link rel="preconnect" href="https://cdn.shopify.com">`.

**12. Emitir `width`/`height`/`loading`/`srcset` nos `<img>`.**
**0 de 16 imagens** têm dimensão declarada; zero `srcset` e zero `loading="lazy"` em todo o site. As dimensões já chegam no payload RSC e já são lidas em `page.tsx:105-106` para o Open Graph — falta só repassá-las ao elemento. É CLS estrutural e mobile baixando imagem de desktop.

**13. Corrigir `og:url` e `og:title` das páginas internas.**
`/catalogo` serve `og:url = https://ta-hora-loja.vercel.app` (a home) e título genérico. Só as PDPs declaram `openGraph` próprio. Para um negócio que vende por indicação no WhatsApp, todo link de catálogo compartilhado mostra a prévia errada.

**14. Ativar o negrito dos 35 bullets de produto.**
`ApresentacaoProduto.tsx:67-73` renderiza em `<strong>` tudo que vem antes de um " — ". O verificador aponta **7/7 produtos sem travessão nenhum**: são 35 bullets de 12-15 palavras em peso uniforme, que ninguém escaneia. `- Enxergue à noite em cores, e não só em sombras, com visão noturna colorida` vira `- Enxergue à noite em cores — visão noturna colorida e infravermelho`. Zero código.

**15. Alinhar as duas FAQs.**
A home promete *"Cartão em até 12x, PIX com desconto e boleto"* e *"3 a 10 dias úteis"*; `/suporte` responde *"aparecem na hora de finalizar a compra"* e *"varia conforme a sua região"*. O `_nota` em `suporte.json:64` admite que são placeholders deliberados — mas a home já assumiu os compromissos. A página que existe para reduzir ansiedade é a mais vaga das duas.

**16. Publicar a placa-brinde em texto.**
Hoje ela existe apenas como `imageSrc` do hero, com a explicação dentro do `imageAlt` (`_home.json:41-42`). É o único diferenciador não-preço do negócio e é invisível para leitor de tela, para o Google e para quem entra direto na PDP.

---

## Recomendações estratégicas (este mês)

**1. Cadastrar `tag:acessorio` nos acessórios que já existem na Shopify. — Maior retorno por esforço da auditoria.**
Correção importante em relação ao diagnóstico de ontem: os acessórios **não precisam ser criados**. O dump ao vivo da Storefront API mostra que "Cartão de memoria 64GB" e "Cabo Externor 5 Metros" já existem como produtos — apenas não estão na coleção com PDP (guarda `handleTemPagina`, `page.tsx:159`) e não têm a tag. O `AcessoriosSugeridos` está codificado, testado e com o gatilho correto (`CarrinhoProvider.tsx:232-241` filtra o que já está no carrinho; `lib/shopify/acessorios.ts:49` descarta indisponíveis). **Ligar a tag no admin faz o cross-sell funcionar sem uma linha de código.** Depois, ampliar o sortimento com os kits de 2 a 5 câmeras que a mesma operação já vende no Mercado Livre até ~R$992. Ataca ticket médio, margem e o limiar de frete grátis de uma vez, sem fornecedor novo e sem risco de estoque.

**2. JSON-LD de `Product` nas 7 PDPs.**
`grep -c 'application/ld+json'` = **0** em todas as páginas testadas. É o item de maior peso de SEO para e-commerce e o teto da categoria. Sem `Product`+`Offer`, as PDPs nunca aparecem na SERP com preço ou "Em estoque" — competem com um resultado azul cru contra concorrentes que exibem "R$ 185,00 ★★★★☆ Em estoque". Os dados já estão no `getProductByHandle`; é Server Component, custo zero de bundle. Complementar com `Organization`, `BreadcrumbList`, `FAQPage` (a home já tem a seção) e `ItemList` no catálogo. **Não declarar `aggregateRating` enquanto não houver avaliação real exibida na página** — estrela inventada é penalidade manual.

**3. Barra de progresso de frete grátis no drawer.**
Nenhuma menção ao limiar existe em `layouts/`, `app/` ou `components/` — o drawer diz apenas *"Frete calculado no checkout."* Com a A31H a R$185 e o limiar em R$199, faltam R$14: a distância exata que um cartão de memória fecha. Colocar entre `<CupomForm />` e os totais, conversando diretamente com a lista de acessórios que já renderiza logo acima — duas features isoladas viram um upsell. *Premissa: o limiar de R$199 veio do briefing e não foi encontrado no repositório nem no HTML; presume-se regra configurada na Shopify.*

**4. Trazer as avaliações reais dos marketplaces para a PDP e a home.**
A PDP não tem nenhuma estrela, nenhuma contagem, nenhum review — na única página onde a prova social decide a venda. A loja tem 4,7 com 68 avaliações no Mercado Livre, já linkadas em `sobre-nos.json:111,113`, e o componente `StarRating.tsx` já existe. Prova verificável e clicável vale mais que cinco depoimentos anônimos escritos internamente.

**5. Devolver o miolo da home ao comprador.**
A ordem servida hoje é hero → benefícios → produtos → *"Ganhe indicando em 5 passos"* → depoimentos → FAQ. O visitante acabou de ver as câmeras; a pergunta na cabeça dele é "qual eu compro?" e a resposta que o site dá é "cadastre sua chave PIX". Trocar os 5 passos de afiliado por 4 passos de instalação — *"Escolha o modelo · Receba em casa · Rosqueie ou fixe, sem obra · Baixe o app e conecte no Wi-Fi"* — e mover o afiliado para `/afiliados`. *"Será que eu consigo instalar?"* é a objeção nº1 de quem nunca teve câmera, e o conteúdo da resposta já está escrito dentro das apresentações de produto.

**6. Unificar a história de pagamento numa fonte única.**
Quatro versões conflitantes: home diz "processado pela Shopify" (`_home.json:88`), home diz "12x ou PIX com desconto" (`:91`), FAQ da home inclui boleto (`:200`), drawer diz "Pagamento seguro via Mercado Pago" (`SeloPagamento.tsx:31`, cujo comentário declara Mercado Pago como *único* meio ativo — contradizendo o boleto), PDP não diz nada. E o "PIX com desconto" não tem percentual em lugar nenhum. Decidir a verdade, replicar o selo na PDP.

**7. Trocar o cross-sell de "outra câmera" por "o que falta para esta funcionar".**
`lib/shopify/recomendados.ts:38-60` pega até 4 câmeras da mesma marca em ordem crua da API — o próprio comentário admite *"sem curadoria própria"*. Verificado: a PDP da Camera Lampada (R$78) sugere A31H (R$185) e A38 (R$263). Isso é substituição, não expansão. E a mesma página diz ao cliente que *"o cartão não vem incluso"* — o site informa que ele precisa de um cartão e não oferece o cartão.

**8. Ligar de fato a captura de e-mail.**
Duplo problema: os 6 layouts usam `"type": "compacto"` e o `FooterCompacto` **não renderiza o bloco de newsletter**; e mesmo no `FooterCompleto` o form é `onSubmit={(e) => e.preventDefault()}` (`Footer.tsx:301`) — descarta o e-mail. Verificado no ar: `grep "Seu melhor email"` → 0 ocorrências. Câmera é compra de ciclo longo (uma a cada 2-4 anos): sem lista, cada aquisição queima numa única transação.

**9. Publicar a tabela comparativa dos 7 SKUs.**
O `/catalogo` já tem os dados e os filtros, e cada produto já tem um papel declarado ("Mais vendida", "Menor preço", "Maior praticidade", "Melhor para área externa"…). Falta a tabela lado a lado e um "qual é a sua?" de três perguntas: onde vai instalar / tem tomada ou bocal / precisa ver de longe. Hoje o cliente compara preço porque preço é a única coluna visível.

**10. Reivindicar "sem mensalidade" explicitamente.**
Verificado hoje: a Intelbras vende o Mibo Cloud em plano à parte ("adquirido separadamente"). Todo SKU do Ta Hora grava em microSD sem custo recorrente. É a única vantagem competitiva do catálogo contra a líder de mercado e **nenhuma página a menciona**. A copy certa já existe na meta description do root (*"Você mesmo instala em minutos, sem obra e sem técnico"*) — está na tag, não na página.

**11. Fechar as duas pendências jurídicas antes de investir em mídia.**
`politica-de-privacidade.json:55` carrega `"NAO PUBLICAR ASSIM. Pendencia juridica em aberto (base legal do cookie tahora_ref: legitimo interesse x consentimento)"` e `trocas-e-devolucoes.json:55` diz `"Rascunho de trabalho, nao revisado por advogado"` — ambas publicadas assim mesmo. Pior: `docs/legal-pendencias.md` registra que Trocas e Devoluções **não foi transposta para a Shopify**, então site e checkout podem divergir sobre devolução. Meta e Google reprovam conta de e-commerce com política inconsistente.

**12. Fechar a ponte de reputação nos dois sentidos.**
O rodapé já assume "Ta Hora — CH CFTV & Eletrônicos". Falta o inverso: a loja do ML e da Shopee continuam sem qualquer menção a "Ta Hora". Enquanto isso, o "+10 mil vendas" do hero é uma afirmação que o visitante não consegue confirmar. Uma frase em `/sobre-nos` — *"Somos a CH CFTV & Eletrônicos, loja no Mercado Livre e na Shopee desde 2022 — agora também com site próprio"* — custa uma linha e evita que o cético descubra sozinho.

**13. Reescrever títulos e descriptions das PDPs com intenção de busca.**
"Camera Segurança A31H | Ta Hora" vem cru do título Shopify, sem os termos que as pessoas digitam. As 7 descriptions são o mesmo template com o nome trocado — descrição duplicada de facto. Usar metafields `custom.seo_titulo`/`custom.seo_descricao`, seguindo o padrão já implantado para `custom.apresentacao`, com fallback para o template atual.

---

## Iniciativas de longo prazo (este trimestre)

**1. Domínio próprio `tahora.com.br` com 301 do `vercel.app`.**
`lib/site.ts:17` já centraliza a constante — a migração é de uma linha no código e de configuração no DNS. Resolve autoridade de SEO hoje construída em subdomínio alheio, confiança de um site que pede cartão num endereço "vercel.app", e viabilidade de e-mail transacional com SPF/DKIM. **Fazer antes de submeter o sitemap ao Search Console**, para não indexar duas versões.

**2. Conteúdo de topo e fundo de funil.**
A infra de ISR e sitemap já existe. As objeções que travam a compra estão respondidas de forma dispersa dentro das apresentações de produto e nenhuma é indexável: *"Câmera Wi-Fi funciona sem internet?"*, *"Quanto de internet uma câmera consome?"*, *"Preciso de cartão de memória?"* (link direto para o acessório), *"Como instalar sem furar a parede"* (link direto para a Camera Lampada). O negócio tem 4 anos de perguntas de clientes para virar conteúdo, e o artigo do iCSee ainda reduz volume de suporte no WhatsApp.

**3. Cortar os 608 KB de JS brotli da home.**
São 14 chunks, 2,26 MB crus, para uma página de **404 nós de DOM e 11 KB de HTML** — ~55× mais JavaScript que markup, pressionando INP e TBT. O suspeito principal segue sendo o framer-motion envolvendo cada imagem em `motion.div`: para revelação por scroll, `IntersectionObserver` nativa entrega o mesmo efeito com zero KB. *Ressalva: o número de ontem (~446 KB) foi medido com outro método de compressão e **não é diretamente comparável** — não afirmo que houve regressão.*

**4. Migrar o `ImageSlot` para `next/image`.**
`next.config.ts` traz `images: { unoptimized: true }`, justificado por o primitivo usar `<img>` puro. Migrar com `remotePatterns` para `cdn.shopify.com` resolve de uma vez `srcset`, dimensões, lazy e AVIF — mas exige refatorar um primitivo compartilhado, por isso não é quick win.

**5. Construir reputação sob o nome "Ta Hora".**
Reclame Aqui, Google Business e avaliações de produto no site. Hoje a busca por "Ta Hora" não retorna nada da loja, e existe uma empresa homônima ("daHORA") no Reclame Aqui com reputação "Não Recomendada" — **é outra empresa, sem relação verificada**, mas representa risco de confusão em busca e é mais uma razão para registrar a reputação própria primeiro.

**6. Insert físico com QR + cupom nos pedidos de ML e Shopee.**
Custa centavos por pedido, converte cliente já satisfeito e usa o **único ativo de tráfego real que o negócio tem hoje**. É a resposta correta ao conflito de canal: marketplace vira funil de aquisição, site vira margem e expansão, em vez de competirem por preço.

**7. Coleta sistemática de avaliação pós-compra.**
Fluxo de e-mail/WhatsApp 10-15 dias após a entrega, pedindo avaliação com foto, exibida na PDP correspondente. Resolve o problema dos depoimentos de forma permanente e alimenta o `aggregateRating` do JSON-LD com dado legítimo. Com 10 mil vendas acumuladas, a matéria-prima existe — falta o mecanismo de captura.

**8. Rosto e história em `/sobre-nos`.**
Nenhuma pessoa, nenhum nome, nenhuma data de fundação. Foto do estoque no Brás, nome do responsável, ano de início. Contra a suspeita de golpe, pessoa vence certificado.

---

## Análise detalhada por categoria

### Conteúdo & Mensagem — 63/100 (era 41)

**Forças.** As 7 apresentações de produto são o maior ativo do site hoje, verificadas em 7/7 via `custom.apresentacao`. A estrutura é consistente e profissional: dor concreta → consequência emocional → solução → 5 bullets de benefício → ressalva honesta. Do Q6: *"Você vira a câmera pra ver a garagem e perde o portão de vista. Vira de volta pro portão e deixa de ver a garagem. No fim você fica escolhendo qual pedaço da casa quer acompanhar, e o que interessa sempre acontece no outro lado."* Os bullets viraram benefício com o mecanismo anexado — o oposto do *"Áudio bidirecional: Sim"* de ontem. E 7/7 trazem ressalva sob o rótulo "Vale saber antes de comprar", incluindo o que o produto **não** faz. O headline novo passa no teste dos 5 segundos: diz a categoria, o resultado, o momento e mata a objeção principal em duas linhas.

**Lacunas.** Os depoimentos falsos são o achado mais grave do site. O catálogo tem duas afirmações de "mais vendida" na mesma tela. "Camera" sem acento aparece no `<h1>`, no `<title>` e no `og:title` de todas as 7 PDPs, mais "Lampada", "memoria" e "Externor". A seção "Como funciona" segue recrutando afiliado entre a vitrine e a prova social. As duas FAQs se contradizem em pagamento e prazo. E os 35 bullets estão sem o travessão que ativaria o negrito de um componente já construído para isso.

*Ressalva do subagente:* não foi verificado se o desconto no PIX realmente existe no checkout, nem se "ENVIO EM 24H" corresponde à operação real. Se não existirem, são promessas falsas em duas seções da home.

### Otimização de Conversão — 58/100 (era 52)

**Forças.** O drawer de carrinho segue acima da média do mercado brasileiro: cupom, linha de desconto, aviso *"Um item do seu carrinho ficou indisponível"* antes do checkout, e checkout que só renderiza com `checkoutUrl` real da Shopify — nunca URL adivinhada. `BotaoAdicionar.tsx:24-27` chama `abrir()` **antes** do `await`, entregando feedback em menos de 100ms. O 404 deixou de ser beco sem saída, com dois CTAs de retorno, e handle fora da coleção agora retorna 404 real em vez de renderizar página.

**Atritos.** O ganho de 6 pontos é quase todo de conteúdo, não de conversão: a PDP deixou de ser nua em informação de produto e continua nua em razão para comprar agora. Sem parcelamento visível, sem prazo, sem estoque, sem avaliação, sem selo de pagamento, sem garantia no corpo. O botão de compra desaparece na rolagem do mobile — e isso piorou porque a página triplicou de comprimento. A home mostra 3 dos 7 SKUs e omite justamente a Camera Lampada de R$78, a porta de entrada de menor atrito. `grep compareAtPrice` no repositório retorna vazio: não existe preço "de/por" nem badge de desconto em lugar nenhum, embora o `PriceTag` já renderize ambos.

### SEO & Descoberta — 61/100 (era 27)

**Medido em produção em 31/07, ~20h40 UTC.** `robots.txt` → **200**, 113 B, com sitemap declarado. `sitemap.xml` → **200**, 14 URLs absolutas, `lastmod` do mesmo dia, prioridades coerentes. `<title>` **únicos em 14/14 páginas**. Meta description presente em 8/8 testadas. Canonical absoluto em todas, sem query. Open Graph com 12 tags na home e imagem dedicada 1200×630 de 47 KB. `og:image` sai absoluto porque `metadataBase` foi configurado.

O hero foi verificado por magic bytes, não por mensagem de commit: `/uploads/Promocao_placa.webp` responde 200, 81.642 B, `image/webp`, bytes `52 49 46 46 ... 57 45 42 50` — **WebP real, redução medida de 92%**. As 8 imagens com `alt=""` da PDP estão corrigidas: 12/12 com alt descritivo.

O risco de duplicação por afiliado foi resolvido numa camada melhor que o canonical: `?ref=` responde **307 para `/`** gravando cookie `HttpOnly` — nenhuma URL indexável duplicada chega a ser servida.

**Correção a um achado de ontem.** O relatório anterior afirmou que crawlers sem JS veriam página em branco por causa dos blocos com `opacity:0`. Verificado hoje: **os headings e parágrafos vêm no markup servido**. O risco residual é de conteúdo tratado como oculto e de crawlers de IA sem execução de JS, não de página vazia.

**Lacunas.** Zero JSON-LD em 100% das páginas é o teto da categoria. As imagens são servidas na resolução de origem: o CDN da Shopify negocia WebP sozinho (10,6 MB de PNG cru viram 157 KB), mas ainda são 845 KB de imagens preloaded numa PDP e 488 KB na home, para renderizar em ~400px — e `&width=800` derruba a mesma imagem para 28,6 KB. Zero `width`/`height`/`srcset`/`loading` em 16 de 16 imagens. Zero skip nav, zero `<label>`, o logo do rodapé marcado como `<h2>`, e o `<h1>` da PDP em `clamp(18px, 2.4vw, 30px)` contra `clamp(28px, 4.5vw, 48px)` dos H2 — hierarquia visualmente invertida. O `/404` emite dois `<meta name="robots">` conflitantes, `noindex` seguido de `index, follow` herdado do root.

*Lighthouse não foi executado — CLI indisponível no ambiente. Nenhum valor de LCP, CLS ou INP é reportado como medido; os riscos são inferidos de peso de recurso e ausência de dimensões, ambos medidos.*

### Posicionamento Competitivo — 51/100 (era 42)

**O eixo mudou no hero e não mudou no site.** A primeira dobra promete "sem obra"; a seção logo abaixo volta ao genérico ("Entrega rápida / Compra segura / 12x / Produtos originais" — serviria para uma loja de tênis); e `/sobre-nos` mantém o eixo antigo intacto, com "Preços melhores" como benefício nº1. A copy certa existe, mas mora na meta description do root, não na página.

**O achado que decide a categoria.** Verificado em 31/07:

| Produto | Ta Hora | Mesma loja no ML | Mercado aberto |
|---|---|---|---|
| Câmera Lâmpada E27 | **R$ 78,00** (720p) | **R$ 59,99** com frete grátis | R$ 49,99–55 (Full HD) |
| Topo de linha A38 | **R$ 263,00** | R$ 195,99 | Intelbras iM4 C R$ 254 / iM3 C R$ 186,21 |

O site é **~30% mais caro que a loja do próprio dono no Mercado Livre**, com frete grátis só acima de R$199 enquanto o ML dá frete grátis num item de R$59,99. A promessa *"repassamos o desconto direto pra você"* é refutável em dois cliques, **pelo link que o próprio site oferece como prova de idoneidade**. E o topo da linha custa mais que a Intelbras iM4 C, marca com rede de assistência nacional, contra 3 meses de garantia própria.

*Ressalva importante:* a câmera-lâmpada do Ta Hora é 720p e as concorrentes de R$49-55 são Full HD — a comparação de preço não é rigorosamente like-for-like, e isso pode justificar parte do delta. Mas não justifica o delta contra a **própria loja do dono**, que é o mesmo produto.

**Concorrentes verificados hoje:** Loja Oficial Intelbras (iM3 C a R$186,21 no PIX), Tudo Forte (~R$175,92 no PIX), CH CFTV no Mercado Livre (a própria operação), Mercado Livre aberto (E27 a partir de R$49,99), TP-Link Tapo (TC70 a R$168).

| Fator | **Ta Hora** | Intelbras | Tudo Forte | ML/CH CFTV | Amazon BR | TP-Link |
|---|---|---|---|---|---|---|
| Clareza do headline | **7** | 8 | 7 | 4 | 3 | 8 |
| Força da proposta de valor | **4** | 8 | 7 | 6 | 5 | 8 |
| Sinais de confiança | **3** | 10 | 8 | 8 | 9 | 9 |
| Eficácia do CTA | **6** | 8 | 7 | 8 | 9 | 7 |
| Clareza de preço | **7** | 9 | 9 | 9 | 9 | 7 |
| Profundidade de conteúdo | **5** | 8 | 7 | 4 | 6 | 8 |
| **Média** | **5,3** | **8,5** | **7,5** | **6,5** | **6,8** | **7,8** |

O headline saiu de 6 para 7 e é o melhor ativo novo. Confiança em 3 é o buraco: zero reputação de terceiros sob o nome "Ta Hora". A categoria *"segurança sem obra, sem técnico, sem mensalidade"* **segue desocupada no Brasil** — a Intelbras fala com o instalador, a Tudo Forte com o integrador de CFTV, a Amazon com ninguém. É o único espaço onde o Ta Hora pode ser primeiro em vez de nono.

*Ressalvas:* Amazon BR retornou 503 e o preço de entrada não foi reconfirmado. Mercado Livre bloqueou parcialmente a leitura; os preços vêm da vitrine `pagina/cftv_ch`, que renderizou, e de snippets. Shopee não renderizou — a nota 4,7 nesse canal **não foi verificada**.

### Marca & Confiança — 52/100 (era 31)

A assinatura jurídica foi publicada e é de qualidade acima do exigido. CNPJ, razão social e endereço em 100% das páginas. Três políticas no ar com 200. O CDC art. 49 é citado **nominalmente, com a lei** (*"Lei nº 8.078/1990, art. 49"*), e a política separa corretamente os três prazos distintos: 7 dias de arrependimento, 3 dias de avaria, 3 meses de garantia. O cookie de afiliado é declarado com detalhe técnico honesto — nome, validade, natureza `httpOnly`, regra de last-touch e instrução de recusa. O frete de devolução por conta da loja, nos dois casos, é um diferencial competitivo real hoje enterrado numa política que ninguém abre. A garantia de 3 meses está consistente em **8 de 8 pontos** verificados: a correção de ontem sobreviveu. E as notas internas de trabalho não vazam para o HTML — o filtro `lib/semNotasInternas.ts` funciona em produção.

**E tudo isso está sendo anulado pela prova social falsa.** Confiança em e-commerce não se mede pelo que é verdade, e sim pelo que é verificável em dez segundos — e o comprador que verifica encontra "fone bluetooth" numa loja de câmeras. Somado ao e-mail `icamera6688@gmail.com` (terceira identidade na mesma jornada), ao domínio `vercel.app`, ao link "Seja um Afiliado" morto em todas as páginas e ao "+10 mil vendas" que a prova linkada não confirma, o ganho formal não se converte em confiança percebida.

**Risco em aberto:** duas das três políticas carregam bloqueio interno de publicação — *"NAO PUBLICAR ASSIM. Pendencia juridica em aberto"* e *"Rascunho de trabalho, nao revisado por advogado"* — e foram publicadas assim mesmo. `docs/legal-pendencias.md` registra que Trocas e Devoluções não foi transposta para a Shopify, então site e checkout podem divergir. Não há banner nem central de cookies, o que o próprio documento aponta como risco caso o parecer exija consentimento em vez de legítimo interesse.

### Crescimento & Estratégia — 34/100 (era 29)

**O único motor que avançou foi o de descoberta.** Metadata, robots, sitemap e canonical à prova de `?ref=` são base necessária e foram bem feitos — mas ainda sem JSON-LD e sem conteúdo, e descoberta orgânica sem página que ranqueie não gera visita.

**Todos os demais seguem desligados, e um regrediu.** O programa de afiliados é a peça de engenharia mais cara já construída no projeto — `proxy.ts` grava cookie de 30 dias com 307 e URL limpa, `lib/carrinho/acoes.ts:126-139` carimba `afiliado_ref` no carrinho Shopify, e o commit `ac063d0` registra E2E real provado com o pedido #1001. Na home, o botão que deveria recrutar é um `<button type="button">` sem `href` e sem handler. Ontem era `href="#"`; hoje nem link é. Nenhum e-mail é capturado (o form dá `preventDefault` e o layout compacto nem o renderiza). Nenhum acessório está tagueado, embora dois já existam como produtos na Shopify. O cross-sell empurra câmera mais cara em vez do que falta para a câmera funcionar — e a própria PDP diz ao cliente que *"o cartão não vem incluso"*. A regra de comissão exige 3 indicações antes do primeiro pagamento e não publica percentual: é dura demais para recrutar iniciante.

O negócio continua tendo os dois ingredientes mais difíceis — demanda comprovada e operação validada de 4 anos — e continua sem nenhum motor de aquisição próprio ligado. Segue sendo um carro com motor bom, tanque cheio e câmbio em ponto morto. A diferença em relação a ontem é que agora ele tem placa, documento e retrovisor.

---

## Impacto em receita — cenário modelado

**Leia esta ressalva antes da tabela.** Confirmado hoje por grep de 9 padrões no HTML servido e em todo o código-fonte: não há analytics instalado. Não existe número real de sessões, conversão, ticket médio ou faturamento. A tabela é um **exercício de priorização** sobre premissas explícitas e arbitrárias, escolhidas apenas para tornar os itens comparáveis entre si. **Os valores absolutos não têm validade preditiva.** O que tem validade é a ordem relativa. As premissas são idênticas às de 30/07, para permitir comparação entre as duas auditorias.

**Premissas:** 1.000 sessões/mês · conversão base 1% · ticket médio R$180 · faixas de melhoria vindas de benchmarks gerais de e-commerce, não deste site.

| Recomendação | Mecanismo | Impacto modelado/mês | Confiança | Prazo |
|---|---|---|---|---|
| Acessórios tagueados + kits | +R$40 no ticket de 30% dos pedidos | ~R$1.200 | Média | 3 dias |
| Parcelamento + confiança na PDP | +0,3 p.p. de conversão | ~R$540 | Média | 2 dias |
| Depoimentos reais no lugar dos falsos | +0,3 p.p. (remoção de suspeita) | ~R$540 | Baixa | 1 dia |
| Barra de frete grátis no drawer | +R$25 em 25% dos pedidos | ~R$450 | Média | 1 sem |
| Barra de compra fixa no mobile | +0,25 p.p. | ~R$450 | Média | 1 dia |
| Avaliações reais na PDP | +0,2 p.p. | ~R$360 | Média | 2 sem |
| Domínio próprio | +0,2 p.p. | ~R$360 | Baixa | 2 sem |
| Imagens com `&width=` e dimensões | +0,15 p.p. via LCP/CLS | ~R$270 | Baixa | 2 dias |
| JSON-LD de Product | tráfego orgânico novo | não modelável | — | 1 sem |
| Programa de afiliados aberto | novo canal de aquisição | não modelável | — | 3 sem |
| Captura de e-mail + pós-venda | recompra e recuperação | não modelável | — | 1 mês |
| Conteúdo de funil | tráfego orgânico novo | não modelável | — | 1 trim |
| **Soma dos itens modeláveis** | | **~R$4.170/mês** | | |

Os quatro itens "não modeláveis" são justamente os de **maior potencial de longo prazo** — criam tráfego e recompra em vez de otimizar o que já existe. Não recebem número porque qualquer valor seria invenção.

**Nada disso será verificável enquanto não houver analytics.** Instalar medição continua sendo a recomendação que destrava a avaliação de todas as outras — e é o item que aparece em ambas as auditorias sem ter sido executado.

---

## Próximos passos

1. **Tirar os depoimentos falsos do ar e dar destino ao CTA de afiliados.** Menos de uma hora somados. O primeiro destrava o valor de todo o investimento em CNPJ e políticas feito ontem; o segundo destrava o ativo de engenharia mais caro do projeto, que hoje rende zero.
2. **Taguear os acessórios e preencher o `PriceTag` da PDP.** O sortimento já existe na Shopify, o componente de upsell já funciona no drawer, e o componente de preço já renderiza parcela — as três peças estão construídas e desconectadas. É o maior retorno por esforço da auditoria.
3. **Instalar medição e publicar JSON-LD de Product.** Sem o primeiro, nada acima é avaliável; sem o segundo, as PDPs continuam invisíveis na SERP de comparação, que é onde a decisão de compra de câmera acontece.

---

## Notas de método e limitações

- Auditoria conduzida por 5 análises paralelas (conteúdo, conversão, competitivo, técnico, estratégia) sobre a URL de produção em 31/07/2026, complementadas por leitura do repositório local. Cada subagente recebeu os achados de 30/07 com instrução explícita de **reverificar em produção** em vez de confiar no relatório anterior.
- **Conflitos entre subagentes foram arbitrados, não somados.** Dois casos relevantes:
  - Um subagente concluiu que o cross-sell de acessórios estava "resolvido" e outro que estava ausente. Ambos estavam parcialmente certos: o código funciona e o gatilho está correto, mas nenhum produto tem `tag:acessorio`, então nunca renderiza. Um terceiro subagente trouxe a informação decisiva — os acessórios **já existem como produtos na Shopify** ("Cartão de memoria 64GB", "Cabo Externor 5 Metros"), apenas fora da coleção com PDP. A correção é menor do que qualquer um dos dois supunha isoladamente.
  - A comparação de peso de JavaScript com a auditoria de ontem foi **descartada como não-comparável**: os dois números vieram de métodos de compressão diferentes. Nenhuma regressão é afirmada.
- **Correção a um achado de 30/07:** o relatório anterior afirmou que crawlers sem JS veriam página em branco por causa dos blocos com `opacity:0`. Verificado hoje no HTML servido: headings e parágrafos **estão** no markup. O risco residual é menor e diferente do descrito.
- **Verificado diretamente por medição, não por mensagem de commit:** os magic bytes do hero em produção (`RIFF...WEBP`, 81.642 B); os status HTTP de `robots.txt`, `sitemap.xml`, das três páginas legais e do 404; a unicidade dos 14 `<title>`; a ausência total de `application/ld+json`; a ausência total de instrumentação (9 padrões, HTML servido e código); o 307 do `?ref=`; os pesos de imagem com e sem `&width=`; os preços dos concorrentes em 31/07.
- Sem acesso a analytics, Search Console, admin da Shopify ou dados financeiros. Nenhum número de tráfego, conversão, CAC, margem ou faturamento foi medido — nem estimado como se fosse medido.
- Nenhum Lighthouse/PageSpeed foi executado (CLI indisponível). Riscos de LCP, CLS e INP descritos qualitativamente, a partir de peso de recurso e ausência de dimensões, ambos medidos.
- **Premissas declaradas, não medidas:** o limiar de R$199 para frete grátis não foi encontrado no repositório nem no HTML servido — presume-se regra configurada na Shopify. Toda recomendação de barra de progresso depende dela.
- **Não verificado:** se o desconto no PIX existe no checkout; se "ENVIO EM 24H" corresponde à operação; a nota da Shopee (a página não renderizou); o preço de entrada da Amazon BR (HTTP 503); a configuração real de meios de pagamento no checkout; o perfil de Instagram (a plataforma bloqueia leitura automatizada — tratar o "0 seguidores" como indício, não como fato).
- **Cobertura de PDP:** 7 de 7 lidas pelo subagente de conteúdo; 2 de 7 em profundidade pelos subagentes de conversão e estratégia. Metadata verificada em 8 de 14 URLs; as 5 PDPs restantes usam o mesmo `generateMetadata`, comportamento presumido idêntico.
- Nenhuma alteração de código foi feita por esta auditoria.

*Gerado pela AI Marketing Suite — `/market audit`*
