# Auditoria de Conteúdo e E-E-A-T — tahora.com.br

Metodologia: fetch via `curl` (raw HTML) das 14 URLs do sitemap + parsing próprio (Python stdlib `html.parser`) para extrair title, meta description, hierarquia de headings, texto visível e JSON-LD. Comparação de duplicação entre as 7 PDPs feita com `difflib.SequenceMatcher` sobre a seção de conteúdo específico do produto (excluindo header/footer comuns).

## Scores

**Content Quality: 68/100**
**On-Page SEO: 78/100**

---

## O que funciona

- CNPJ (46.340.461/0001-04), endereço físico completo (Rua André de Leão, 78, Brás, São Paulo/SP) e telefone (11) 98418-8541 aparecem no rodapé de **todas as 14 páginas** — sinal de Trust forte e consistente.
- Cada uma das 7 PDPs tem uma narrativa introdutória ("SOBRE ESTE PRODUTO") **de fato diferente** por produto — não é um template raso com find-replace do nome. Similaridade textual par-a-par (via `difflib`) entre as 7 seções narrativas ficou entre 12% e 59%, com a maioria abaixo de 40%. Isso é bom: mostra esforço editorial real, não apenas spinning de conteúdo.
- Sinais de garantia/confiança repetidos em todas as PDPs de forma clara: "3 meses de garantia direto com a loja", "Nota fiscal em todo pedido", "7 dias para devolver sem custo".
- Title tags únicos por página, incluindo o modelo no título das PDPs (ex.: "Câmera Segurança Wi-Fi Full HD Dupla Lente A31H | Ta Hora"), 17–60 caracteres.
- Meta descriptions únicas e dentro do intervalo recomendado (110–155 caracteres) em todas as 14 páginas, cada uma citando preço parcelado específico do produto.
- Hierarquia H1 único por página + H2/H3 consistentes e lógicos (ex.: PDP segue H1 > H2 "SOBRE ESTE PRODUTO" > H3 "O que este produto resolve por você" > H2 "Especificações técnicas" > H2 "Você também pode gostar").
- Breadcrumbs textuais e JSON-LD `BreadcrumbList` presentes em todas as 7 PDPs e no catálogo ("Início › Catálogo › [Produto]").
- Linkagem interna entre produtos via seção "Você também pode gostar" (2 produtos relacionados por PDP) e o catálogo linkando para as 7 PDPs por H2 dedicado.
- `Product` schema presente nas 7 PDPs (tipo confirmado via JSON-LD; campos de oferta/preço não auditados em detalhe — ver "não medido").
- Tom de voz em pt-BR coloquial, frases curtas, 2ª pessoa ("você"), cenários concretos e reconhecíveis (motoboy, portão, loja, filho na escola) — bom para público leigo e para legibilidade.

---

## Findings

### 1. [MÉDIO] Frase-bullet idêntica em 100% das PDPs (7 de 7)
**Evidência:** A frase "Enxergue à noite em cores, e não só em sombras, com visão noturna colorida" aparece **verbatim, palavra por palavra**, nas 7 páginas de produto (a31h, a38, es-p9, q6, q8, s8, câmera-lâmpada), dentro da lista "O que este produto resolve por você".
**Risco:** Baixo a médio para SEO clássico (é apenas uma bullet entre 4-5), mas é o tipo de padrão que sistemas de detecção de conteúdo templado/AI penalizam quando se acumula com os outros pontos abaixo. Também reduz o valor incremental de cada PDP para um crawler de IA que já "viu" essa frase em outra página do mesmo domínio.
**Recomendação:** Reescrever essa bullet com uma variação por produto (ex.: citar o alcance real do infravermelho, se disponível, ou o diferencial de cor por modelo), mesmo mantendo o benefício central.

### 2. [MÉDIO] Parágrafo "Vale saber antes de comprar" quase idêntico em 6 de 7 PDPs
**Evidência:** Comparando A31H, A38, ES-P9, Q6, Q8 e S8 (todas exceto a Câmera Lâmpada, que tem instalação diferente por bocal E27):
- A31H: "Ela é fixada na parede com os parafusos e buchas que vêm na caixa e funciona ligada na fonte de alimentação, também inclusa, então precisa de uma tomada por perto. Aguenta de -10 °C a 45 °C."
- Q6: "Ela é presa na parede com os parafusos e buchas que vêm na caixa e funciona ligada na fonte de alimentação, também inclusa, então precisa de tomada por perto. Tem proteção IP66 contra chuva e aguenta de -10 °C a 45 °C."
- Q8 e S8 repetem a mesma estrutura quase palavra por palavra, trocando só "presa/fixada" e um ou dois detalhes técnicos.
**Risco:** Isso é o padrão clássico de "thin/templated content" citado nas QRG de Set/2025 — o texto tecnicamente correto por produto, mas a variação é cosmética (troca de 3-4 palavras num parágrafo de ~35 palavras). Em um catálogo de só 7 SKUs isso é o principal risco de "conteúdo duplicado" identificado nesta auditoria.
**Recomendação:** Tratar esse parágrafo como dado estruturado (specs de instalação) em vez de prosa livre repetida — ou reescrever cada instância com detalhes específicos do modelo (peso da câmera, tipo de parafuso, comprimento do cabo de alimentação) para que cada frase agregue informação nova.

### 3. [BAIXO] Erro de dado no schema/specs da Q8 — campo "Linha" incorreto
**Evidência:** Na tabela de especificações da PDP da Q8, o campo "Linha" mostra `EseeCloud` (que é o nome do aplicativo, repetido do campo "Aplicativo" logo acima), enquanto todas as outras 6 PDPs têm `Linha: Câmera Segurança Wi-Fi`.
**Risco:** Pequeno, mas é um sinal de Trust/Expertise negativo — indica erro de cadastro/QA que um comprador atento ou um mecanismo de verificação de dados estruturados pode notar. Em specs table isso também pode ser lido por um LLM como inconsistência de linha de produto.
**Recomendação:** Corrigir o campo "Linha" da Q8 para "Câmera Segurança Wi-Fi", igual às demais.

### 4. [MÉDIO] Página de catálogo com conteúdo muito raso (thin content)
**Evidência:** `/catalogo` tem apenas 202 palavras de texto visível (H1 + 7 H2 com nome de cada câmera + preço, sem nenhuma frase de apoio, diferenciação entre modelos ou orientação de escolha).
**Risco:** Para uma página que deveria ajudar o comprador leigo a decidir entre 7 câmeras semelhantes (que é justamente a dúvida principal desse tipo de loja), a ausência de texto comparativo é uma oportunidade perdida de E-E-A-T (Expertise) e de cobertura tópica. QRG trata isso como cobertura insuficiente do "propósito da página", não como violação de contagem mínima de palavras.
**Recomendação:** Adicionar 1-2 frases por produto no catálogo (ou uma seção "qual modelo escolher") com critério prático — ex. "ambiente interno vs. externo", "precisa de sirene", "quer instalar sem furar parede" — reaproveitando os diferenciais já usados nas PDPs.

### 5. [MÉDIO] Sem autoria/credenciais técnicas em nenhuma página (Expertise fraco)
**Evidência:** Nenhuma das 14 páginas cita quem escreveu o conteúdo técnico, quem testou os produtos, ou credencial de quem responde no suporte. `/sobre-nos` fala da empresa ("4 anos vendendo eletrônicos em marketplaces") mas não de pessoas, testes ou processo de curadoria dos produtos.
**Risco:** Para o fator Expertise das QRG — especialmente relevante em produtos de segurança residencial, onde o comprador quer saber se alguém testou o alcance do Wi-Fi, a qualidade da visão noturna, etc. — a ausência de qualquer evidência de teste/uso real (fotos próprias, vídeo demonstrativo, review em vídeo) enfraquece esse pilar.
**Recomendação:** Adicionar evidência de "mão na massa": fotos reais da instalação, prints do app com o produto conectado, ou um parágrafo/vídeo curto de "como testamos".

### 6. [BAIXO] Sem schema de avaliação (Review/AggregateRating) apesar de haver depoimentos
**Evidência:** A home tem a seção "O que nossos clientes dizem" (H2), mas o único JSON-LD encontrado na home é `OnlineStore`; nenhuma PDP tem `Review` ou `AggregateRating` no schema (`Product` + `BreadcrumbList` apenas).
**Risco:** Perde a chance de rich snippet de estrelas no Google e de citação de prova social por IA. Depoimentos sem atribuição verificável (nome completo, foto, data, verificação de compra) também têm menor peso de Trust segundo as QRG.
**Recomendação:** Se os depoimentos forem reais e verificáveis, adicionar `Review`/`AggregateRating` ao schema do produto correspondente e/ou da Organization. Confirmar que os depoimentos citam nome e, se possível, cidade/data de compra.

### 7. [BAIXO] FAQ do suporte sem `FAQPage` schema
**Evidência:** `/suporte` tem 4 perguntas em H3 ("Quanto tempo demora a entrega?", "Quais as formas de pagamento?", "Como funciona a garantia?", "Posso devolver se não gostar?") mas nenhum JSON-LD foi encontrado nessa página.
**Risco:** Baixo diretamente para ranking, mas é uma oportunidade perdida de citação por IA/rich result — essas 4 perguntas são exatamente o tipo de conteúdo que motores de resposta direta (AI Overviews, assistentes) preferem extrair de página com schema explícito.
**Recomendação:** Adicionar `FAQPage` schema espelhando as 4 perguntas/respostas já existentes no HTML.

### 8. [INFORMATIVO] Contagem de palavras por tipo de página vs. piso de cobertura tópica
| Página | Palavras | Piso de referência | Situação |
|---|---|---|---|
| Home | 514 | 500 | Adequado (levemente acima do piso) |
| Catálogo | 202 | — (page hub) | Raso — ver finding #4 |
| Sobre Nós | 239 | — | Curto para uma página de confiança institucional |
| Suporte | 212 | — | Curto, mas objetivo (FAQ) |
| Política de Privacidade | 2.889 | — | Completa |
| Termos de Uso | 3.975 | — | Completa |
| Trocas e Devoluções | 805 | 500-600 (análogo location) | Acima do piso, boa cobertura (prazos, CDC, quem paga frete) |
| 7 PDPs | 402–436 cada | 300-400+ (produto complexo) | No piso ou levemente acima — aceitável, mas justo |

Nota: contagem de palavras não é fator de ranking direto (Google confirma); o ponto de atenção real é cobertura tópica, não o número em si. `/sobre-nos` e `/suporte` estão no limite inferior do que se espera de páginas institucionais de confiança para um e-commerce que processa pagamento (via Mercado Pago) — vale reforçar com mais prova social e detalhes operacionais.

### 9. [NÃO MEDIDO — registrar para próxima rodada]
- Percentual exato de duplicação **verbatim** carácter-a-carácter entre as 7 PDPs usando uma ferramenta dedicada de plágio/duplicação (só foi medida similaridade estrutural via `difflib` na seção de conteúdo específico; achados #1 e #2 foram identificados por inspeção direta das strings, não por um score agregado de duplicação de página inteira).
- Completude dos campos do `Product` JSON-LD (price, priceCurrency, availability, brand, sku) — confirmou-se apenas a presença do tipo `Product`, não a validação de campos obrigatórios para rich results de Merchant/Shopping.
- Cálculo formal de legibilidade (Flesch/Flesch-Kincaid adaptado a pt-BR) — avaliação foi qualitativa (frases curtas, vocabulário coloquial, 2ª pessoa), sem score numérico.
- Autenticidade/verificabilidade dos depoimentos da home ("O que nossos clientes dizem") — não foi possível confirmar se são de compradores reais verificados.
- Data de publicação/atualização de cada página (`publication_date`) não foi extraída nesta rodada.

---

## Resumo dos scores

**Content Quality: 68/100** — puxado para baixo principalmente pelo padrão de boilerplate repetido entre PDPs (achados #1 e #2), pela página de catálogo rasa (#4) e pela ausência de sinais de Expertise/experiência de primeira mão (#5). Trust é o ponto forte (CNPJ, endereço, telefone, garantia e política de troca claros e presentes em 100% das páginas).

**On-Page SEO: 78/100** — titles, meta descriptions, H1 único e hierarquia de headings estão bem executados e consistentes nas 14 páginas; breadcrumbs (visual + `BreadcrumbList`) e linkagem interna entre produtos já existem. Pontos a melhorar: schema `FAQPage` ausente no suporte, `Review`/`AggregateRating` ausente apesar dos depoimentos na home, e o erro de dado no specs da Q8.
