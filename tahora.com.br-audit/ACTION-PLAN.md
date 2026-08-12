# Plano de ação — tahora.com.br

Ordenado por dependência, não só por severidade. Cada item traz o princípio em que se apoia, como saber que falhou, e o indicador para acompanhar sem refazer a auditoria.

---

## Fase 0 — Antes de tudo (esta semana, ~1h)

### 0.1 Confirmar o que o Google indexou — ✅ RESOLVIDO (12/08/2026)
O especialista de SXO não obteve resultado para `site:tahora.com.br` e levantou risco de indexação. **Verificado no Search Console pelo dono do site: as páginas estão indexadas.** O `site:` não retornar nada era limitação do método de consulta, não bloqueio real — consistente com o que o especialista técnico já havia apurado (canonicais, robots, sitemap e meta robots todos corretos).

Nenhuma ação necessária. A Fase 1 pode começar sem ressalva.
**Indicador para acompanhar:** contagem de páginas indexadas no GSC (meta: 14/14).

### 0.2 Configurar as credenciais que faltam
Sem elas, metade das métricas desta auditoria continuará estimada.
- **Google API key** (gratuita) → destrava CrUX e PageSpeed = CWV de campo, incluindo INP real
- **Search Console** → indexação, consultas, CTR
- **Moz API** (gratuita, 2.500 linhas/mês) → DA/PA e spam score

Depois disso, `/seo google` e `/seo backlinks` passam a dar números reais no lugar de estimativas.

---

## Fase 1 — Correções de alto impacto (semana 1)

| # | Item | Esforço | Ganho estimado |
|---|---|---|---|
| 1.1a | `lazyOnload` no gtag | **15 min** | 600–900ms de main thread por página. TBT mobile de ~2.100ms para ~1.300–1.500ms |
| 1.1b | `fetchPriority`+preload no LCP de catálogo/PDP | **~1h** | LCP da PDP de 4,9s para ~3,5–4,0s. Sozinho não tira do Poor |
| 1.1c | Code-splitting do chunk `329j824l1odqw.js` | **4–8h** | O maior lever isolado. É o que separa mobile 54 de desktop 95 |
| 1.1d | Auditar `unused-javascript` | **4–8h** | Retorno decrescente. Só depois de 1.1c |
| 1.2 | Prova social real nas 7 PDPs | **~3h de código** + coleta contínua | Estrelas no SERP (CTR) + destrava a persona mais fraca (47/100) |
| 1.3 | Completar `Product` schema | **2–3h** | Elegibilidade no Merchant Center; preço, frete e devolução no resultado |
| 1.4 | Security headers | **~2h** + 1 semana em report-only | **Ganho de ranking ≈ zero.** É segurança, não SEO |

**Total de dev: ~14–25h.** Estimativas de esforço são minhas; os números de ganho vêm das medições de laboratório do Lighthouse, exceto os de 1.2 e 1.3, que dependem de como o Google exibe o resultado e não são previsíveis com precisão.

### Status de execução (12/08/2026)

| # | Item | Status |
|---|---|---|
| 1.1a | `lazyOnload` no gtag | ❌ **NÃO EXECUTADO — recomendação inválida.** Ver abaixo |
| 1.1b | Prioridade das imagens LCP | ✅ Feito. Efeito estrutural confirmado; ganho em ms **não medido** |
| 1.1c | Code-splitting | ⏳ Aguardando decisão |
| 1.1d | `unused-javascript` | ⏳ Depois de 1.1c |
| 1.2 | Prova social | ⏸️ Pendente de decisão sobre coleta própria |
| 1.3 | `Product` schema | ✅ Feito, com dados reais |
| 1.4 | Security headers | ⏸️ Adiado por decisão do lojista |

**1.1a estava errado, e o código já tinha a resposta.** O `<Script>` do gtag **já usa `afterInteractive`** — a estratégia recomendada para analytics. O especialista de performance sugeriu `lazyOnload` sem ler o que estava implementado. Trocar teria custo real: `lazyOnload` só injeta o script depois do evento `load` mais tempo ocioso, e numa página cujo LCP mobile é 4,7s isso são vários segundos. O stub inline enfileira os eventos no `dataLayer`, mas fila sem biblioteca não vira requisição: quem saísse antes do carregamento perderia o `page_view` — exatamente o caso do visitante que salta rápido. E o ganho seria em boa parte contábil, porque `lazyOnload` empurra a execução do GA4 para FORA da janela em que o TBT é medido, sem remover o trabalho da CPU do usuário. Melhorar a métrica perdendo dado é o oposto do objetivo. **Item cancelado, não adiado.**

Duas observações que mudam a ordem de ataque:

- **1.1a e 1.1b entregam a maior parte do ganho por hora investida** — 1h15 no total para uma melhora mensurável nas três páginas mobile. Faça-os primeiro e remeça antes de decidir se 1.1c vale o custo.
- **1.4 foi classificado como High pelo especialista técnico, mas isso é severidade de segurança, não de SEO.** Security header não é fator de ranqueamento. Está na Fase 1 porque é barato e porque uma loja que pede dados de pagamento deveria ter, não porque move posição.

### 1.1 Performance mobile — LCP e TBT `[P1, P2, P3, P4, P5]`
**Princípio:** a home em desktop tira 95 no Lighthouse com LCP de 0,9s. A mesma página em mobile tira 54 com LCP de 4,7s. A arquitetura está certa; o que quebra é o custo de JavaScript em CPU mobile. E mobile é o índice que ranqueia.

**Ordem de execução (do mais barato para o mais caro):**
1. `strategy="lazyOnload"` no `<Script>` do gtag — devolve 600–900ms de main thread por página, mudança de uma linha
2. `fetchPriority="high"` + preload na imagem de produto do catálogo e da PDP, replicando o que a home já faz certo
3. Code-splitting do chunk `329j824l1odqw.js` — é o maior consumidor de main thread nas 3 páginas, maior que o próprio GA4
4. Auditar `unused-javascript` (733–908 KB de script por página, 80–90% do peso)

**Como saber que falhou:** LCP mobile segue acima de 2,5s e TBT acima de 300ms após os quatro passos.
**Indicador:** Lighthouse mobile da home e da PDP, semanal. Quando o CrUX estiver disponível, trocar por INP e LCP de campo — o que temos hoje é lab.

### 1.2 Prova social nas PDPs `[S2, e-commerce, SXO]`
**Princípio:** Trust é a dimensão mais baixa em todas as 9 combinações persona×página (6–14 de 25). A persona "cético em loja desconhecida" na PDP tira 47/100. A PDP é onde a compra acontece, e não tem uma única avaliação. Isso é simultaneamente o maior buraco de SEO (sem `AggregateRating`) e de conversão.

**Status:** ⏸️ pendente de decisão do lojista sobre coleta própria de avaliação.

**🔴 DESCARTADO — avaliação de marketplace como fonte para `AggregateRating`.**

Minha recomendação original dizia que os marketplaces onde a loja opera há 4 anos "são uma fonte legítima, com atribuição". **Isso estava errado e não deve ser seguido.** A política de rich results do Google exige avaliação coletada pelo PRÓPRIO site ou por parceiro autorizado; os depoimentos da home são transcrições de Mercado Livre e Shopee, ou seja, avaliação de terceiro sobre a loja daquele marketplace. Marcá-los como nossos é motivo de **ação manual** — e ação manual não derruba a estrela de uma PDP, derruba os rich results do domínio inteiro, incluindo o `Product` que acabou de ganhar frete e devolução.

O risco é assimétrico: o ganho seria uma estrela; a perda seria todo o domínio, com reconsideração medida em semanas.

Isto já estava decidido e travado em código antes desta auditoria — `lib/seo/produtoSchema.ts` traz o bloco em caixa alta, e `npm run verificar:schema` falha (exit 1) se `aggregateRating` ou `review` aparecerem no objeto, com contraprova que injeta o campo para confirmar que o detector funciona. O plano agora diz o mesmo que o código.

**Único caminho válido:** coletar avaliação de primeira parte (e-mail pós-compra), exibir na PDP e só então marcar.
**Como saber que falhou:** rich result de estrelas não aparece no teste de resultados aprimorados 4 semanas após publicar avaliação própria.
**Indicador:** número de PDPs com avaliação real de primeira parte (meta: 7/7).

### 1.3 Completar o `Product` schema `[S1, S3, S4]`
**Princípio:** o schema está válido, mas mínimo. As propriedades ausentes são exatamente as que sustentam preço, frete e devolução no resultado e as que o Merchant Center exige.

Adicionar em 7/7 PDPs: `brand`, `priceValidUntil`, `shippingDetails`, `hasMerchantReturnPolicy`, `mpn` (ou `gtin` se houver EAN), e `@id: .../#organization` ligando `Offer.seller` aos dados ricos da home.

Snippets prontos em `findings/schema.md`. **Os prazos de frete e devolução ali são placeholders estruturais** — confira contra a política real antes de publicar. Atenção ao frete: as tarifas da loja variam por UF, então `shippingDetails` precisa refletir faixa, não tarifa única.

**Depende de:** nada. Pode ir em paralelo com 1.1 e 1.2.
**Como saber que falhou:** o Rich Results Test segue apontando campos recomendados ausentes.
**Indicador:** itens válidos no relatório de Produtos do GSC.

### 1.4 Security headers `[T1]`
CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` via `headers()` no `next.config`. CSP em **report-only primeiro** — há GA4 e o CDN do Shopify servindo imagens, e uma CSP restritiva publicada de primeira quebra a loja.
**Como saber que falhou:** imagens de produto ou GA4 param de carregar após sair do report-only.

---

## Fase 2 — Conteúdo que fecha as lacunas (semanas 2–3)

### 2.1 Página comparativa dos 7 modelos `[G1, C3, SXO]`
**Princípio:** este é o item de maior alavancagem do plano porque resolve três problemas de uma vez — dá ao catálogo (202 palavras hoje) a estrutura que o SERP premia, dá ao assistente de IA o material que ele precisa para recomendar um produto, e ajuda o comprador leigo a escolher entre 7 modelos parecidos.

Tabela HTML real (não imagem) comparando os 7 SKUs por resolução, alimentação, interno/externo, alcance IV e FOV, mais um resumo "melhor para X" por modelo.

**Pré-requisito — 2.2.**

### 2.2 Tornar as specs comparáveis `[G2]`
Hoje "Resolução" varia entre `HD`, `Full HD`, `4K Ultra HD` e `3K Vertical` — vocabulário de marketing, não medida. E os outros 6 campos de spec são "Sim" idêntico nos 7 modelos, o que os torna inúteis para comparar. Converter para unidades objetivas: MP, metros de alcance IV, graus de FOV.

Uma tabela comparativa construída sobre specs não comparáveis não compara nada — por isso este item vem antes de 2.1.

### 2.3 Recuperar a cauda longa de modelo `[SXO]`
O SKU foi renomeado de "A31" para "A31H", e "A31" é o nome OEM que fabricante e revendedores usam. Isso descartou a cauda longa de modelo — que é justamente o espaço que uma loja de 7 SKUs consegue ganhar.

**Decisão necessária sua:** manter "A31H" e citar "A31" no corpo e nas specs (baixo risco, ganho parcial), ou reverter a nomenclatura (ganho maior, exige checar impacto no schema, no feed e nos links já existentes). Recomendo a primeira: mencionar o nome OEM no texto captura boa parte da busca sem mexer em URL nem em `sku`.

### 2.4 Desduplicar os blocos templatizados `[C1, C2]`
- Bullet de visão noturna colorida: verbatim em 7/7 → variar com o dado real de cada modelo
- "Vale saber antes de comprar": quase idêntico em 6/7 → converter em ficha estruturada ou reescrever

Contexto que muda a prioridade: a similaridade par-a-par entre PDPs foi medida em 12–59%, o que é **saudável** para 7 SKUs da mesma categoria. Não é um site de conteúdo raso — são dois blocos específicos. Por isso é Fase 2 e não Fase 1.

### 2.5 Corrigir o erro de dado na PDP Q8 `[C5]`
Campo "Linha" mostra `EseeCloud` em vez de "Câmera Segurança Wi-Fi". Correção de 1 minuto, visível para o cliente, e sinal de QA para quem avalia a loja.

### 2.6 Tirar o texto de dentro das imagens `[Images]`
Os infográficos "01 Duas lentes, mais segurança" e "02 Mais cobertura, mais controle" trazem specs reais (Full HD, PTZ, zoom 4x) apenas como pixel. Migrar para HTML ou duplicar abaixo da imagem — hoje esse conteúdo não existe nem para busca nem para leitor de tela.

### 2.7 CTA da PDP mobile `[Visual]`
"Adicionar ao carrinho" aparece como faixa de ~10px na dobra mobile. CTA sticky no rodapé ou bloco imagem/preço mais compacto. É conversão antes de ser SEO.

---

## Fase 3 — Autoridade (mês 2 em diante)

**Princípio que enquadra a fase inteira:** o site não está fora do SERP por falta de otimização. Está fora por falta de autoridade e por disputar termos cujo tipo de página vencedor ele não oferece. Fases 1 e 2 arrumam a casa; esta é a única que move o teto.

### 3.1 Conteúdo de cauda longa ganhável
Marketplaces não atendem com profundidade, e é aí que cabe uma loja de nicho:
- "câmera de segurança sem mensalidade" (cluster identificado pelo SXO)
- "como configurar iCSee" e afins — procedural, apareceu em PAA
- "câmera lâmpada wifi vale a pena" — modelo + intenção
- guias por caso de uso (portaria, pet, obra, loja)

Cada peça linkando as PDPs relevantes, para que a malha interna trabalhe.

### 3.2 YouTube
Foi apontado como o gargalo provável de autoridade de marca — é a plataforma com correlação mais forte com citação por IA, e a loja não tem presença. Vídeos de unboxing e instalação real dos 7 modelos resolvem simultaneamente o buraco de Expertise (C4: nenhuma evidência de teste real dos produtos) e o de autoridade externa. Adicionar ao `sameAs`.

### 3.3 Aquisição de links (sem esquemas)
Google Merchant Center, comparadores (Buscapé, Zoom), diretórios setoriais legítimos, microinfluenciadores de casa inteligente com `rel="sponsored"`, perfis sociais apontando para o domínio. **Nada de compra de link, PBN ou troca massiva** — o risco é desproporcional para um domínio novo.

### 3.4 Menções não linkadas
Não foi possível medir nesta auditoria (o especialista tentou via Bing, tomou bloqueio anti-bot e descartou o resultado em vez de reportar zero). Rode manualmente: `"tahora.com.br"` e `"Tá Hora" câmera segurança -site:tahora.com.br`. Para uma marca nova, converter menção existente em link é o caminho mais concreto que existe.

---

## Fase 4 — Higiene e monitoramento (contínuo)

| Item | Ref. | Status / Nota |
|---|---|---|
| Remover `Disallow: /carrinho` do robots.txt | T4 | ✅ **Feito 12/08.** Confirmado morto: `/carrinho` responde 404 e a spec `carrinho-loja` é toda drawer + Server Actions, sem página planejada |
| `lastmod` real em vez de timestamp de build | Sitemap | ✅ **Feito 12/08, híbrido.** 7 PDPs com `updatedAt` real da Shopify (datas distintas de verdade: 05/08 e 11/08); 7 editoriais **sem o campo**, porque não existe fonte honesta — três layouts legais trazem `updatedAt: 1970-01-01` e os outros são cópia manual |
| Remover `changefreq` e `priority` | Sitemap | ✅ **Feito 12/08.** Zero ocorrências no XML gerado |
| Check de produto destoante na ficha técnica | C5 | ✅ **Feito 12/08.** Nova camada no `verificar:especificacoes`: falha quando uma chave tem 2 valores, maioria de 4+ e minoria de exatamente 1. Pega o `custom.linha` da Q8 e nada mais nos dados atuais |
| Corrigir `custom.linha` da Q8 no admin | C5 | ⏳ **Com o lojista.** É metafield da Shopify, não código |
| Chamadas dos infográficos como texto | Images | ⏳ **Com o lojista.** Textos prontos em `textos-infograficos-shopify.md`; só colar na Shopify, sem deploy |
| `alt` vazio na imagem 01 da Câmera Lâmpada | Images | ⏳ **Com o lojista.** Única das 28 imagens de descrição sem alt |
| IndexNow: publicar chave e disparar na revalidação | T2 | Pendente. Alimenta o índice do Bing, que abastece o Copilot |
| Redirect apex HTTP direto para `https://www.` | T3 | Pendente. Domain settings da Vercel, elimina 1 hop |
| `width`/`height` explícitos nas `<img>` | T5 | Pendente. Prevenção: o CLS medido está ótimo (0,000–0,002) |
| Filtros do catálogo mobile em carrossel horizontal | Visual | Pendente. Preço e CTA do 1º produto saem da dobra |
| Confirmar reveal-on-scroll com rolagem real | Visual | Pendente. Provável artefato de captura |
| CTA mobile da PDP | Visual | ❌ **Sem ação — achado rebaixado.** O `BarraCompraMobile` já implementava a recomendação antes da auditoria; o especialista não rolou a página. Ver o relatório |
| `/seo drift baseline` após a Fase 1 | — | Pendente. Passa a detectar regressão de SEO a cada deploy |

**Não fazer:** `FAQPage` schema. Dois especialistas recomendaram; está descartado. O Google aposentou os rich results de FAQ para todos os sites em 07/05/2026 — não há feature de SERP a capturar. Se `/suporte` tiver Q&A genuíno de usuários, `QAPage` é o tipo correto. `llms.txt` também é opcional e o Google ignora — não priorizar.

---

## Expectativa realista

Fases 1 e 2 resolvem o que está sob controle direto e devem levar o Health Score de 69 para a faixa de 82–86. O que elas **não** fazem é ganhar "câmera de segurança wifi" — esse SERP pertence a listicles e marketplaces, e continuará pertencendo.

O caminho de tráfego para esta loja é cauda longa, marca e conversão. É por isso que a Fase 3 é a que importa no médio prazo, e por isso itens de confiança (1.2, 3.2) aparecem mais alto do que sua severidade puramente técnica sugeriria: num nicho onde o comprador tem medo de ser enganado, prova social é rankeamento e é conversão ao mesmo tempo.
