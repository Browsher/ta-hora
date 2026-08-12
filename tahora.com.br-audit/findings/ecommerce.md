# E-commerce SEO — tahora.com.br

Escopo: 7 PDPs (`/produtos/camera-seguranca-{a31h,es-p9,q6,q8,a38,s8}`, `/produtos/camera-lampada`) + `/catalogo`. Stack: Next.js/Vercel (SSR — `x-nextjs-prerender: 1`, schema já vem no HTML puro, sem depender de hidratação), catálogo Shopify (CDN de imagens) com checkout Mercado Pago fora do domínio.

Fonte dos dados: `render_page.py --mode always` + `parse_html.py` + `schema_ecommerce_validate.py` nas 7 PDPs e no catálogo. Sem credenciais DataForSEO/Google nesta sessão — **nada de dados de marketplace ao vivo (posição, volume, concorrência de preço) foi coletado**; a seção de gap competitivo é avaliação qualitativa de mercado, não medição.

## O que funciona

- **Product JSON-LD válido nas 7 PDPs**, server-rendered (não depende de JS no client): `name`, `image`, `description`, `sku`, `offers.price/priceCurrency/availability/itemCondition/seller/url` todos presentes e bem formados. `schema_ecommerce_validate.py` retornou **PASS (0 Critical/High)** em todas as 7.
- **BreadcrumbList** correto em catálogo e PDPs (Início > Catálogo > Produto), consistente com o trabalho recente de breadcrumbs (commit `d87adbe`).
- **Catálogo é uma única URL sem parâmetros** — o "filtro" (Todas / Melhor preço / Mais recursos / EseeCloud / iCSee) é client-side via `aria-pressed`, não gera rotas novas. Risco de index bloat por faceta é baixo/inexistente hoje.
- **Alt text de imagem excepcionalmente bom** — descrições longas e específicas (cor, número de lentes, LEDs, ângulo, contexto de instalação) em todas as imagens de produto e infográficos, nas 7 PDPs e no catálogo. Isso é o oposto do padrão de mercado.
- Meta title/description/canonical/robots corretos e únicos por PDP e no catálogo (dado já confirmado em auditoria anterior de metadata, aqui só revalidado no contexto de e-commerce).
- Textos das PDPs mencionam nota fiscal, garantia, prazo de troca ("7 dias") e devolução diretamente no corpo da página (não apenas na página dedicada) — bom sinal de confiança para quem não clica em política.

## Findings

### Critical
Nenhum.

### High
Nenhum.

### Medium

**1. Product schema sem `hasMerchantReturnPolicy` — nas 7 PDPs**
- Evidência: `schema_ecommerce_validate.py` sobre o JSON-LD extraído de cada PDP: `[Medium] missing-return-policy` em todas as 7 (a31h, es-p9, q6, q8, a38, s8, lampada).
- Impacto: sem esse campo, o Google não pode exibir badge de devolução no rich result / Merchant Center, mesmo a política existindo em texto na página (`/trocas-e-devolucoes`, "7 dias").
- Recomendação: adicionar bloco `hasMerchantReturnPolicy` (com `applicableCountry: "BR"` e `returnPolicyCategory`) ao Offer de cada Product, referenciando a política já publicada em `/trocas-e-devolucoes`. Esforço baixo (schema é gerado centralizado, provável 1 alteração propagando às 7 PDPs).

**2. Product schema sem `shippingDetails` — nas 7 PDPs**
- Evidência: mesmo validator, `[Medium] missing-shipping-details` em todas as 7.
- Impacto: perde elegibilidade para o badge de frete/prazo no rich result e no Merchant Center; o frete existe (widget "Calcular frete" por CEP na PDP), mas não está estruturado.
- Nota de contexto: como o frete é calculado dinamicamente por CEP/UF (ver frete Shopify por `provinceCode` — não há tarifa única nacional), `shippingDetails` provavelmente precisa ser uma faixa/estimativa (ex.: "3 a 10 dias úteis, todo o Brasil") em vez de um valor fixo — não dá pra estruturar o resultado exato do calculador sem uma integração mais profunda.
- Recomendação: adicionar `OfferShippingDetails` com `shippingDestination` (BR) e `deliveryTime` estimado por faixa, mesmo que aproximado.

**3. Sem `brand`, `gtin`/`mpn` no Product schema**
- Evidência: os 2 blocos JSON-LD por PDP (Product + BreadcrumbList) não contêm `brand` nem identificadores globais; só `sku` interno (ex.: `IC-A31H`). O validador de política não flagra isso (não é requisito de rich result básico), mas é requisito de facto para **Google Shopping / Merchant Center** em muitas categorias de eletrônicos.
- Impacto: sem `gtin`/`mpn`, listagens no Shopping podem ser rejeitadas ou despriorizadas por "identificador de produto ausente", mesmo com o Product schema "válido".
- Recomendação: adicionar `"brand": {"@type": "Brand", "name": "Ta Hora"}` (ou marca do fabricante OEM, se aplicável) e, se as câmeras têm GTIN/EAN de fábrica, incluir `gtin13`/`gtin`. Se não houver GTIN oficial (produto white-label), declarar `mpn` com o SKU já existente para não cair no "missing identifier".

**4. Sem prova social nas PDPs — 7/7**
- Evidência: busca por `avalia|review|estrela|rating|depoimento` no HTML renderizado da PDP a31h não retornou nenhuma ocorrência. Amostragem em 1 de 7 PDPs (mesma template, alta probabilidade de valer para as demais, mas **não confirmado individualmente nas outras 6**).
- Impacto: nenhum `AggregateRating`/`Review` no schema (não elegível a estrelas no resultado de busca) e nenhuma prova social visível na página (sem depoimentos, sem contagem de vendas, sem selo de reputação) — em uma categoria (câmera de segurança) onde confiança é o principal bloqueio de conversão.
- Recomendação: pelo menos um mecanismo leve de avaliação (mesmo que via app externo tipo Judge.me/Yotpo no Shopify, ou depoimentos curados manualmente com schema `Review`) antes de qualquer aposta em Google Shopping — sem isso a loja de nicho compete em desvantagem direta com os "selo confiável" do Mercado Livre.

**5. Cross-linking entre os 7 SKUs é parcial**
- Evidência: na PDP a31h, a seção "Você também pode gostar" linka apenas 2 dos outros 6 produtos (`camera-lampada`, `camera-seguranca-a38`). Amostragem em 1 PDP.
- Impacto: com só 7 SKUs, o ideal é que cada PDP dê ao usuário (e ao crawler) caminho fácil para comparar com os outros modelos próximos (ex.: A31H vs A38, ambas dupla-lente). Two-link "relacionados" deixa a decisão de compra sem suporte on-page e deixa PageRank interno mal distribuído entre as 7 páginas.
- Recomendação: expandir "Você também pode gostar" para cobrir todos os modelos relevantes (ou adicionar uma mini-tabela comparativa specs-a-specs linkando as 7 PDPs a partir de qualquer uma delas).

### Low

**6. Imagens de produto sem `width`/`height` no `<img>`**
- Evidência: `parse_html.py` reporta `width: null, height: null` em todas as imagens da PDP a31h (galeria principal, infográfico, embalagem, lifestyle).
- Impacto: não é um problema de SEO direto, mas contribui a CLS se o layout não reserva espaço via CSS — vale confirmar com a auditoria de performance/CWV; aqui é só um sinal correlato encontrado durante a análise de schema de imagem.
- Recomendação: garantir que `width`/`height` (ou `aspect-ratio` no CSS) estejam explícitos nas tags de imagem da galeria.

### Oportunidades de conteúdo comercial (não é "erro", é gap de aquisição)

- **Nenhuma página de comparação entre modelos** foi encontrada. As PDPs têm apenas `H2: SOBRE ESTE PRODUTO / Especificações técnicas / Você também pode gostar` — nenhuma seção comparativa (ex.: "A31H vs A38: qual escolher") nem tabela cruzando as 7 câmeras lado a lado.
- **Nenhum conteúdo de guia de compra ou caso de uso** existe fora das PDPs e página institucional — o site tem só `catalogo`, `produtos/*`, `sobre-nos`, `suporte`, `politica-de-privacidade`, `termos-de-uso`, `trocas-e-devolucoes`. Sem `/blog`, `/guias`, `/aprenda` ou qualquer página informacional.
- Impacto: para uma loja de 7 SKUs, o volume de busca transacional de cauda longa ("câmera wifi para portão", "melhor câmera de segurança para loja pequena") é pequeno demais para competir sozinho contra o catálogo de milhares de SKUs do Mercado Livre/Magalu, mas é exatamente o espaço onde conteúdo editorial (guias, comparativos, casos de uso) pode capturar busca informacional que players de marketplace generalista não atendem bem (eles rankeiam a página de categoria, não um guia específico).
- Recomendação (Medium prioridade de negócio, não é erro técnico): criar 3–5 páginas de conteúdo comercial ancoradas nas 7 PDPs — ex. "Câmera de segurança para portão: qual modelo escolher" linkando A31H/A38, "Câmera que gira 360° vs fixa" linkando Q6/Q8/S8, "Câmera lâmpada: instalação sem furar parede" para a camera-lampada. Cada uma linkando de volta para 2–3 PDPs relevantes, fortalecendo a malha interna que hoje é fraca (finding 5).

## Gap competitivo — Brasil (avaliação qualitativa, sem dados de SERP ao vivo)

**Não medido nesta sessão**: posição real, share of voice ou volume de busca de "câmera de segurança wifi" e variações — não há credenciais DataForSEO/GSC configuradas. O que segue é leitura de mercado, não dado coletado.

- No Brasil, para termos genéricos de câmera de segurança wifi, as SERPs são historicamente dominadas por **Mercado Livre e Amazon** (resultados de listagem agregada, com dezenas de SKUs concorrentes e reviews em volume), **Magalu** (marketplace + varejo próprio) e **Intelbras** (fabricante nacional com marca forte e SEO institucional robusto, além de presença nos mesmos marketplaces). Para buscas de marca própria de fabricante OEM (os chips ICSee/EseeCloud usados nas câmeras Ta Hora são chineses genéricos, revendidos por dezenas de lojistas com nomes de modelo idênticos — A31H, Q6, Q8, S8 são nomenclaturas de fábrica, não exclusivas da Ta Hora), a concorrência de conteúdo idêntico (specs, fotos de fabricante) é alta: **múltiplas lojas venderão fisicamente o mesmo produto sob o mesmo nome de modelo**, o que agrava o risco de conteúdo duplicado / não-diferenciado mencionado nas prioridades de análise.
- Uma loja de nicho de 7 SKUs não vai disputar volume nos termos genéricos de cabeça (impossível competir com o inventário e a autoridade de domínio do Mercado Livre/Amazon nesses termos). O caminho realista é:
  1. Ranquear pelo **nome de modelo + "review"/"vale a pena"/"como configurar"** — cauda longa onde a página de produto único bem escrita pode superar uma listagem de marketplace genérica.
  2. Capturar buscas de **marca própria** ("Ta Hora câmera") — depende de branding e retenção, não SEO técnico.
  3. Conteúdo de guia/comparação (ver seção acima) para capturar buscas informacionais que grandes marketplaces não atendem com profundidade.
- Recomendação: se o orçamento permitir, uma rodada futura com DataForSEO Merchant/SERP para os 7 nomes de modelo + "câmera de segurança wifi [cidade/uso]" traria dado real de quem ocupa o pack de compras e a posição orgânica hoje — hoje isso é lacuna de dados, não conclusão.

## Não medido nesta sessão

- Conteúdo completo da página `/trocas-e-devolucoes` (HTML foi baixado mas não analisado em detalhe — condições exatas do texto de devolução não foram extraídas).
- Prova social/avaliações nas outras 6 PDPs além da A31H (amostragem de 1/7; mesma template, alta probabilidade de generalizar, mas não confirmado individualmente).
- Cross-linking "Você também pode gostar" nas outras 6 PDPs (amostragem de 1/7).
- Qualquer dado de marketplace ao vivo (posição, CPC, volume, seller landscape) — sem credenciais DataForSEO nesta sessão.
- Existência de facetas de catálogo além dos 5 botões de ordenação observados (ex.: rotas escondidas tipo `/catalogo?categoria=`) — não testado por tentativa de URL direta.
