# Schema — /produtos/camera-seguranca-a31h

**Data:** 12/08/2026 · **Fonte:** produção (`X-Vercel-Cache: PRERENDER`, `Age: 0`)
**Escopo:** a PDP pedida, com verificação cruzada nas outras 6 PDPs e na home

A produção já serve o schema publicado ontem (frete, devolução e `@id` do vendedor). Esta análise é do estado real no ar, não do código local.

## Detecção

| Formato | Encontrado |
|---|---|
| JSON-LD | 2 blocos — `Product` (7.267 bytes), `BreadcrumbList` (324 bytes) |
| Microdata | nenhum |
| RDFa | nenhum |

Ambos server-rendered no HTML inicial. Isso importa: a orientação do Google de dez/2025 sobre JS diz que structured data injetado via JavaScript pode ter processamento atrasado, e recomenda explicitamente HTML pré-renderizado para `Product`/`Offer`. Está correto aqui.

## Validação

| Schema | Tipo | Status | Observação |
|---|---|---|---|
| Product | ACTIVE | ✅ | Todos os obrigatórios; sem placeholder, sem URL relativa |
| Offer | ACTIVE | ✅ | `price` decimal com ponto, `priceCurrency` ISO, `url` canônica sem query |
| OfferShippingDetails ×11 | ACTIVE | ✅ | Cobre as 27 UFs, valores reais |
| MerchantReturnPolicy | ACTIVE | ✅ | Completo para janela finita |
| BreadcrumbList | ACTIVE | ✅ | 3 níveis; último item sem `item`, que é o correto |

Nenhum tipo depreciado. Sem `HowTo`, sem `SpecialAnnouncement`, sem `FAQPage`. Sem `aggregateRating`/`review` — travado por `npm run verificar:schema`.

### Consistência entre as 7 PDPs

| Handle | sku | imagens | frete | devolução | preço |
|---|---|---|---|---|---|
| camera-seguranca-a31h | IC-A31H | 1 | 11 | ok | 185,00 |
| camera-seguranca-es-p9 | ES-P9 | 1 | 11 | ok | 115,00 |
| camera-seguranca-q6 | ES-Q6 | 1 | 11 | ok | 158,00 |
| camera-lampada | IC-8177 | 1 | 11 | ok | 78,00 |
| camera-seguranca-a38 | IC-A38 | 1 | 11 | ok | 263,00 |
| camera-seguranca-q8 | ES-Q8 | 1 | 11 | ok | 227,00 |
| camera-seguranca-s8 | ES-S8 | 1 | 11 | ok | 253,00 |

Sem exceção: as 7 têm a mesma forma. Não há PDP degradada.

### `@id` do vendedor: resolve

`offers.seller.@id` = `https://www.tahora.com.br/#organization`, e a home declara `OnlineStore` com exatamente esse `@id`. **Verificado por comparação de string, não presumido.** É o padrão canônico — entidade definida uma vez na home, referenciada por `@id` nas demais páginas.

---

## Findings

### 1. `image` com uma única URL — **Medium**

**Observação de primeiro princípio:** o `image` do `Product` é o que o Google usa para escolher a miniatura do rich result, e ele decide melhor com mais opções. Hoje o campo traz **uma** URL (o `ogImage`, 1200×1200, proporção 1:1). A documentação recomenda várias imagens e, quando possível, 16:9, 4:3 e 1:1.

O dado já existe e é verdadeiro: a galeria da PDP tem 5 imagens reais do produto, normalizadas a 800px, e `urlComLargura` gera a versão de 1200 da mesma URL sem custo de CDN novo. Passar o array em vez de uma URL é uma mudança pequena e honesta.

**Dependência:** nenhuma. Independente dos outros itens.
**Como saber que falhou:** a miniatura do resultado continua sendo a mesma foto de sempre, ou o Rich Results Test segue listando 1 imagem.
**Indicador:** número de imagens no item Produto do Search Console.

### 2. `handlingTime` ausente em `shippingDetails` — **Info (decisão registrada)**

O Google recomenda `handlingTime` e `transitTime` juntos, e o Rich Results Test pode avisar da ausência. Aqui foi omitido de propósito: os prazos de `lib/frete/tabela.ts` são o que a calculadora promete ao cliente, ou seja, já são porta a porta. Declarar um `handlingTime` além disso somaria dias que a loja não prometeu.

**A omissão é a leitura correta do dado.** Só faria sentido preencher se a loja passar a separar preparo de transporte na tabela — e aí `transitTime` teria que diminuir na mesma medida.

### 3. `brand` ausente — **Info (decisão registrada)**

`brand` é Recomendado, não obrigatório, e não bloqueia rich result. A decisão de 11/08 está correta: `vendor` da Shopify é "Ta Hora" (o vendedor, já declarado em `seller`) e as tags `icsee`/`eseecloud` são os aplicativos, não o fabricante.

**Onde isso volta a importar:** no Merchant Center, `brand` costuma ser exigido, salvo produto genuinamente sem marca. Se a loja for para o Shopping, é lá que a decisão precisa ser revisitada — não aqui.

### 4. `priceValidUntil` ausente — **Info (decisão registrada)**

Gera warning no Rich Results Test, não bloqueia nada. A alternativa seria carimbar uma validade de preço que a loja não se comprometeu a cumprir. Warning honesto vale mais que campo falso.

### 5. `mpn` ausente, com o dado já disponível — **Low**

`custom.modelo` guarda `IC-A31H`, `ES-Q6`, `IC-8177` etc., e o `sku` agora carrega o mesmo valor. Essas são designações de fábrica OEM usadas por fabricante e revendedores — é o que `mpn` descreve.

**Tensão honesta:** um `mpn` sem `brand` identifica pela metade, e a razão de não ter `brand` (câmera genérica, fabricante desconhecido) é a mesma que enfraquece o `mpn`. Só vale se e quando a loja for para o Merchant Center. **Não recomendo mexer agora.**

### 6. Comentário desatualizado em `produtoSchema.ts` — **Info**

O comentário do campo `sku` afirma: *"Medido: 5 dos 7 têm (ES-P9, ES-Q6, IC-8177, ES-Q8, ES-S8); A31H e A38 estão com `sku: null` na Shopify."*

**Não é mais verdade.** As 7 PDPs em produção trazem `sku`, incluindo `IC-A31H` e `IC-A38`. Confirmei que não há fallback no código — `normalize.ts:246` lê `raw.variants?.nodes[0]?.sku` direto da variante — então alguém preencheu os dois no admin depois que o comentário foi escrito.

Num codebase que usa comentário como registro de decisão, comentário desatualizado é dívida real: o próximo leitor acredita nele. Vale corrigir para "7/7 preenchidos (12/08/2026)".

### 7. `Organization` sem `contactPoint` — **Low**

A home traz `telephone` e `email` como propriedades diretas, o que é válido. Um `ContactPoint` acrescentaria `contactType`, `areaServed` e `availableLanguage`, que ajudam desambiguação de entidade. Ganho pequeno, sem rich result associado.

---

## O que NÃO recomendo

- **`FAQPage`** — o Google aposentou os rich results de FAQ para todos os sites em 07/05/2026. Não há feature de SERP a capturar. Se `/suporte` tiver Q&A genuíno de usuário, `QAPage` é o tipo correto.
- **`aggregateRating` / `review`** — só com avaliação de primeira parte, coletada pelo próprio site. Marcar depoimento de marketplace é motivo de ação manual no domínio inteiro.
- **`HowTo`** — depreciado desde set/2023.
- **`ItemList` no `/catalogo`** — sem SERP feature associada. Custo de manutenção sem retorno.

## Peso

O bloco `Product` passou de ~600 bytes para 7.267 com as 11 entradas de frete. É HTML servido com Brotli, então o custo real de rede é de centenas de bytes — irrelevante perto dos 733–908 KB de JavaScript que a auditoria de performance apontou. Não é motivo para enxugar o frete.
