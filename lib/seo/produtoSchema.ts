import { SITE_URL } from "@/lib/site"
import { tituloProduto } from "@/lib/seo/tituloProduto"
import { ORG_ID } from "@/lib/seo/organizacaoSchema"
import { entregaSchema, devolucaoSchema } from "@/lib/seo/entregaSchema"
import { urlComLargura, LARGURA_OG } from "@/lib/shopify/imagens"
import type { Product, ProductImage } from "@/lib/shopify/types"

// JSON-LD `Product` das PDPs — o objeto que faz o Google exibir PREÇO e
// DISPONIBILIDADE no resultado de busca, em vez de um link de texto puro.
//
// Módulo PURO, mesmo padrão de `lib/parcelamento.ts`, `lib/apresentacao.ts` e
// `lib/shopify/destaques.ts`: sem React, sem `server-only`, sem fetch. Recebe um
// `Product` e devolve o objeto. Dá para exercitar com `node -e`, e é isso que
// permite o `npm run verificar:schema` conferir os 7 produtos reais.
//
// Quem serializa e emite a <script> é `components/seo/JsonLd.tsx` — a separação
// existe para este arquivo continuar testável sem DOM.
//
// ═══════════════════════════════════════════════════════════════════════════
// 🔴🔴 NUNCA ADICIONE `aggregateRating` NEM `review` A ESTE OBJETO. 🔴🔴
// ═══════════════════════════════════════════════════════════════════════════
//
// Nem "só as estrelas", nem "só a contagem", nem em variante, nem atrás de flag.
//
// A tentação é concreta e vai reaparecer: a home exibe 5 depoimentos com nota 4,7
// e "+10 mil vendas". Eles são TRANSCRIÇÕES DE MERCADO LIVRE E SHOPEE — avaliação
// coletada por terceiro, sobre a loja daquele marketplace.
//
// A política de rich results do Google exige que a avaliação seja coletada pelo
// PRÓPRIO site ou por parceiro autorizado. Marcar review de marketplace como se
// fosse nossa é motivo de AÇÃO MANUAL — e ação manual não derruba só a estrela:
// derruba os rich results do DOMÍNIO INTEIRO, incluindo este `Product` e o
// `FAQPage` que vem depois.
//
// O risco é assimétrico: o ganho seria uma estrela numa PDP; a perda seria todo o
// domínio, com prazo de reconsideração medido em semanas.
//
// O caminho legítimo existe e está na fila (item 18 do SEO-AUDIT.md): coletar
// avaliação de PRIMEIRA PARTE por e-mail pós-compra. Quando essas existirem, o
// campo entra — com os dados certos.
//
// `npm run verificar:schema` FALHA (exit 1) se qualquer um dos dois aparecer no
// objeto. A regra está travada em código, não na memória de quem mexer depois.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valores canônicos de `schema.org/ItemAvailability`.
 *
 * Em URL completa (e não `"InStock"` solto): o Google aceita as duas formas, mas
 * a URL é a documentada e a que o validador do schema.org resolve sem ambiguidade.
 */
const EM_ESTOQUE  = "https://schema.org/InStock"
const SEM_ESTOQUE = "https://schema.org/OutOfStock"

/** Produto novo e lacrado — a loja não vende usado nem recondicionado. */
const CONDICAO_NOVO = "https://schema.org/NewCondition"

/**
 * Reconhece o INFOGRÁFICO de especificações dentro da galeria.
 *
 * A galeria de cada câmera tem 5 imagens, e a última é uma ficha técnica
 * ilustrada — a câmera com textos apontando para cada parte. Ela é ótima na
 * página e ERRADA em `Product.image`: a orientação do Google é que a imagem
 * mostre o produto com clareza, e ali entraria uma ficha, não uma foto.
 *
 * ─── POR QUE NÃO É POR POSIÇÃO ─────────────────────────────────────────────
 *
 * 🔴 Hoje o infográfico é o índice 4 em 7/7, e mesmo assim NÃO usamos a posição.
 * A ordem da galeria da Shopify muda ARRASTANDO no admin: um arrasto e o filtro
 * passa a excluir uma foto boa e a publicar a ficha, sem erro em lugar nenhum.
 *
 * ─── OS DOIS SINAIS, MEDIDOS NOS 7 PRODUTOS EM 12/08/2026 ──────────────────
 *
 *   1. nome do arquivo contém "infografico" — 7/7
 *      (`A31H_`, `P9_`, `Q6_`, `Lampada_`, `Cinza_`, `Preta_`, `S8_`; note que
 *      dois usam a COR e não o modelo, então o padrão é o sufixo)
 *   2. o alt contém "textos apontando" — 7/7
 *
 * É `OU`, não `E`, e a assimetria é deliberada: excluir uma foto boa por engano
 * custa uma imagem a menos no rich result; deixar passar um infográfico publica
 * ficha técnica como foto de produto. Na dúvida, exclui.
 *
 * ⚠️ O NOME DE ARQUIVO DERIVA — dois heros já estão com nome UUID
 * (`2bd1ea0f-…png`), prova de que reenvio troca o nome. Por isso existe o
 * segundo sinal, e por isso `npm run verificar:schema` FALHA se algum produto
 * deixar de ter exatamente 1 imagem reconhecida aqui: a deriva vira erro
 * barulhento em vez de uma ficha técnica publicada em silêncio.
 */
export function ehInfografico(img: ProductImage): boolean {
  return (
    img.url.toLowerCase().includes("infografico") ||
    (img.altText ?? "").toLowerCase().includes("textos apontando")
  )
}

/** A galeria sem o infográfico — as fotos que descrevem o produto de fato. */
function fotosDoProduto(produto: Product): ProductImage[] {
  return produto.images.filter((img) => !ehInfografico(img))
}

/**
 * Monta o JSON-LD `Product` de uma PDP.
 *
 * Campos ausentes são OMITIDOS, nunca preenchidos com placeholder: `sku: null`,
 * `sku: ""` ou uma descrição inventada são piores que a ausência — o Google trata
 * campo presente como afirmação nossa sobre o produto.
 */
export function produtoSchema(produto: Product): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type":    "Product",

    // 🔴 `tituloProduto`, NÃO `produto.title` — e o critério é O QUE A PÁGINA
    // MOSTRA, não o que a aba do navegador mostra.
    //
    // O schema é uma reafirmação em JSON do conteúdo visível; divergência entre
    // os dois é sinal de baixa confiança para o Google (mesmo argumento já
    // registrado em organizacaoSchema.ts sobre o rodapé). Desde 12/08/2026 o H1
    // da PDP exibe este mesmo descritor derivado, então é ele que o `name` deve
    // afirmar.
    //
    // ⚠️ A REGRA É ACOMPANHAR O H1, não o `<title>`. Se algum dia o H1 voltar ao
    // nome curto, este campo volta junto — e não porque o title mudou. São
    // perguntas diferentes: o title é o que o Google EXIBE na SERP, o `name` é o
    // que ele entende que a página descreve.
    //
    // Não afeta rich result: o que o Google exibe da PDP vem de `offers` (preço e
    // disponibilidade). Este campo é identidade, não decoração.
    //
    // 🔴 NÃO "uniformize" com a meta description, que continua com o nome curto
    // por outro motivo, também registrado (ela estouraria 160 chars). Três
    // consumidores, três decisões — ver app/produtos/[handle]/page.tsx.
    name: tituloProduto(produto),

    // A GALERIA INTEIRA a 1200 px, MENOS o infográfico — ver `ehInfografico`.
    //
    // 🔴 SEMPRE 1200, NUNCA os 800 da galeria. O Google recomenda a maior
    // resolução disponível (mínimo documentado de 696 px de largura), e 1200 é a
    // MESMA largura do `og:image`: o CDN serve do cache que já existe, então
    // várias imagens aqui não custam requisição nova nenhuma.
    //
    // Por que mais de uma: é `image` que decide a miniatura do rich result, e o
    // Google escolhe melhor com opções. Antes daqui ia só o `ogImage` (1 URL).
    //
    // Fallback em cascata, e a ordem importa:
    //   galeria sem infográfico → o array
    //   galeria vazia (ou só infográfico) → o `ogImage` sozinho
    //   sem foto nenhuma → CAMPO OMITIDO. Array vazio seria afirmar ao Google
    //   "este produto não tem imagem", que é diferente de não afirmar nada.
    ...(fotosDoProduto(produto).length > 0
      ? { image: fotosDoProduto(produto).map((i) => urlComLargura(i.url, LARGURA_OG)) }
      : produto.ogImage
        ? { image: [produto.ogImage.url] }
        : {}),

    // `custom.resumo` — a linha consultiva do lojista ("Dupla lente com detecção
    // inteligente, pra quem quer mais controle sem complicar").
    //
    // ⚠️ NÃO use `descriptionHtml` nem `apresentacao` aqui, e não é preferência:
    //   - `product.description` vem VAZIO nos 7 produtos (medido em 11/08/2026) —
    //     o `descriptionHtml` da loja só tem imagens, nenhum texto.
    //   - o 1º bloco de `apresentacao` é gancho narrativo ("Você abaixa a porta da
    //     loja, tranca e vai embora…"): descreve o PROBLEMA do cliente, não o
    //     produto. Como `description` de schema, seria descrição errada.
    ...(produto.resumo ? { description: produto.resumo } : {}),

    // Vive na VARIANTE, não no produto.
    //
    // 7/7 preenchidos desde 11/08/2026, quando o lojista cadastrou `IC-A31H` e
    // `IC-A38` no admin — os dois que faltavam. (Antes disso eram 5: `ES-P9`,
    // `ES-Q6`, `IC-8177`, `ES-Q8`, `ES-S8`.) Confirmado em produção nas 7 PDPs em
    // 12/08/2026.
    //
    // O `?` continua aqui de propósito: o campo é da variante e pode voltar a
    // ficar vazio numa edição do admin. Omitido quando ausente — `sku: null` seria
    // afirmar ao Google que o produto não tem código.
    ...(produto.sku ? { sku: produto.sku } : {}),

    // 🔴 `brand` OMITIDO POR DECISÃO REGISTRADA (11/08/2026), não por esquecimento.
    //
    // Os dois candidatos foram avaliados e os dois estariam errados:
    //   - `vendor` da Shopify é "Ta Hora" nos 7 produtos — é o VENDEDOR, não o
    //     fabricante. Esse fato está declarado abaixo, em `offers.seller`.
    //   - as tags `icsee`/`eseecloud` (que `ROTULO_MARCA` exibe como "iCSee" e
    //     "EseeCloud") são os APLICATIVOS que controlam a câmera. As câmeras são
    //     genéricas; o app não é a marca do produto.
    //
    // `brand` é RECOMENDADO, não obrigatório — omitir custa um campo, declarar
    // errado seria afirmar ao Google um fabricante que não existe.

    offers: {
      "@type": "Offer",

      // 🔴 `precoNumerico`, JAMAIS `price.price`.
      //
      // `price.price` é texto pt-BR formatado — "1.799,90". O schema.org exige
      // decimal com ponto, então o Google leria isso como **1.79**: erro de mil
      // vezes no preço, publicado no resultado de busca, sem quebrar build, `tsc`
      // nem teste. É o mesmo motivo pelo qual `precoNumerico` existe para o
      // parcelamento (ver lib/shopify/types.ts).
      price:         produto.precoNumerico.toFixed(2),

      // Código ISO ("BRL"), não o símbolo. `price.currency` é "R$" — símbolo de
      // exibição, que o schema.org não aceita.
      priceCurrency: produto.moeda,

      // ⚠️ DEGRADAÇÃO HERDADA, declarada de propósito: `normalizeProduct` aplica
      // `?? true` em `availableForSale` (fail-open — ver o comentário lá). Se
      // alguém remover o campo da query, este schema passa a declarar "InStock"
      // para a loja inteira. É o MESMO comportamento que o botão de compra já
      // tem hoje; a diferença é que agora essa degradação também fala com o
      // Google. Quem decide a venda de fato continua sendo `resolverVariante`,
      // no servidor, no momento da adição.
      availability:  produto.disponivel ? EM_ESTOQUE : SEM_ESTOQUE,

      itemCondition: CONDICAO_NOVO,

      // URL CANÔNICA — construída de `SITE_URL` + handle, nunca da URL da
      // requisição. Os links de afiliado chegam com `?ref=<código>`, e uma
      // `offers.url` carregando a query diria ao Google que cada afiliado tem sua
      // própria oferta. Mesma razão do canonical (ver app/layout.tsx).
      url:           `${SITE_URL}/produtos/${produto.handle}`,

      // Aqui, sim, "Ta Hora": o `vendor` da Shopify descreve quem VENDE.
      //
      // O `@id` liga esta oferta à entidade declarada em `organizacaoSchema.ts`
      // (CNPJ, endereço, telefone, logo, `sameAs`). Sem ele, cada uma das 7 PDPs
      // afirmava um vendedor anônimo chamado "Ta Hora", sem relação declarada com
      // a empresa da home. O `name` fica junto de propósito: um bloco que traz só
      // `@id` depende de o consumidor resolver a referência, e repetir o nome
      // custa uma linha.
      seller: { "@type": "Organization", "@id": ORG_ID, name: "Ta Hora" },

      // ─── FRETE E DEVOLUÇÃO ────────────────────────────────────────────────
      //
      // Os dois campos que o Merchant Center exige e que o Google usa para exibir
      // frete e política de devolução junto do preço.
      //
      // 🔴 OS NÚMEROS NÃO ESTÃO AQUI NEM EM `entregaSchema.ts`: vêm de
      // `lib/frete/tabela.ts` (a mesma fonte da calculadora da PDP) e de
      // `layouts/trocas-e-devolucoes.json`. O motivo está no topo daquele módulo —
      // frete divergente do cobrado suspende conta no Merchant Center, e a loja
      // tem 6 zonas com valores de R$ 14,90 a R$ 59,90. Um valor único aqui seria
      // errado para cinco delas.
      shippingDetails:         entregaSchema(),
      hasMerchantReturnPolicy: devolucaoSchema(),

      // 🔴 `priceValidUntil` OMITIDO POR DECISÃO REGISTRADA (11/08/2026).
      //
      // O Rich Results Test emite WARNING pela ausência — e o warning fica. Não
      // bloqueia o rich result, e a alternativa seria carimbar uma data de
      // validade de preço que a loja não se comprometeu a cumprir. Dado falso
      // para calar um validador é exatamente o tipo de erro que este site passou
      // a semana corrigindo (ver o topo do SEO-AUDIT.md).
    },

    // 🔴 NADA ABAIXO DESTA LINHA. Ver o bloco no topo do arquivo: nem
    // `aggregateRating`, nem `review`.
  }
}
