import "server-only"
import { SPEC_METAFIELDS } from "./specs"

// Documentos GraphQL da Storefront API. `server-only` (defesa em profundidade):
// as queries só são usadas pelo servidor via client.ts/products.ts.

// PRODUCTS_QUERY — usada SÓ por getProducts (vitrine /catalogo).
//
// Busca os produtos de uma COLEÇÃO (não `products` global) para respeitar a ORDEM
// MANUAL do admin: `sortKey: MANUAL` devolve os produtos na ordem que o lojista
// arrastou na coleção (as populares no topo). O connection de loja `products` NÃO
// tem `MANUAL` (só a coleção tem — `ProductCollectionSortKeys`), por isso a busca
// é por coleção. `collection` vem `null` se o handle estiver errado ou a coleção
// não estiver publicada no canal Storefront → getProducts trata com `?? []`.
//
// `tags` e o metafield aliasado `resumo` são ADITIVOS (feature catalogo-consultivo):
// alimentam o selo de marca + filtro e o resumo consultivo do bloco. UMA requisição
// (sem N+1). A chave `custom.resumo` é confirmada nos DADOS reais por
// `npm run verificar:resumo`.
//
// Os 4 metafields seguintes são ADITIVOS (feature catalogo-destaques): alimentam a
// tarja de posicionamento (`selo`) e a linha de destaques do bloco (`resolucao`,
// `lentes`, `alarme`). Entram na MESMA requisição — o catálogo continua sendo uma
// única chamada por revalidação de ISR.
//
// 🔴 AS `key` SÃO AS LITERAIS DA LOJA, não o rótulo do admin — mesma lição de
// `custom.marca` (rótulo "Aplicativo") e `custom.notorizada` (rótulo "Motorizada")
// em `specs.ts`: renomear no admin PRESERVA a key original. Uma key errada não dá
// erro — devolve `null` e o destaque some em SILÊNCIO. As 4 foram confirmadas nos
// DADOS reais (7/7 câmeras) e ficam travadas por `npm run verificar:destaques`.
//
// ⚠️ `sortKey: MANUAL` acima é a ORDEM MANUAL do lojista — não remova ao editar.
export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first, sortKey: MANUAL) {
        nodes {
          id
          handle
          title
          tags
          featuredImage { url altText width height }
          priceRange { minVariantPrice { amount currencyCode } }
          resumo:    metafield(namespace: "custom", key: "resumo")             { value }
          selo:      metafield(namespace: "custom", key: "selo")               { value }
          resolucao: metafield(namespace: "custom", key: "tipo_de_resolucao")  { value }
          lentes:    metafield(namespace: "custom", key: "numero_de_lentes")   { value }
          alarme:    metafield(namespace: "custom", key: "com_alarme")         { value }
        }
      }
    }
  }
`

/**
 * Produtos da VITRINE DA HOME — usada só por `getVitrineHome()`, que alimenta a
 * seção "Nossos Produtos" (feature home-produtos-carrossel).
 *
 * Busca por COLEÇÃO (`destaques`) com `sortKey: MANUAL` pelo mesmo motivo da
 * `PRODUCTS_QUERY` acima: quem manda na ordem é o ARRASTO DO LOJISTA no admin,
 * não o código. O connection global `products` não tem `MANUAL`. `collection` vem
 * `null` se o handle mudar ou a coleção sair do canal Storefront → `getVitrineHome`
 * degrada com `?? []` e a seção some (a Home nunca cai por causa da loja).
 *
 * ⚠️ `sortKey: MANUAL` é a ORDEM MANUAL do lojista — não remova ao editar.
 *
 * **A seleção é DE PROPÓSITO mais magra que a do catálogo:** sem `tags` e sem os
 * 5 metafields. A Home é vitrine simples — foto, nome, preço e "Ver detalhes";
 * selo, resumo e destaques de spec são do `/catalogo` e da página de produto.
 * Pedir o que não se exibe seria peso de rede sem consumidor.
 *
 * **Com `availableForSale`** — o filtro de esgotados precisa dele. Segue o
 * precedente da `RECOMENDADOS_QUERY`: o campo entra na SELEÇÃO, nunca na string
 * de busca (aqui nem existe string de busca — a coleção é a curadoria). Assim a
 * seleção é `RawProductCard` + um campo, e `normalizeProductCard` funciona sem
 * adaptador, ignorando o extra.
 */
export const VITRINE_HOME_QUERY = /* GraphQL */ `
  query ProdutosDestaque($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first, sortKey: MANUAL) {
        nodes {
          id
          handle
          title
          availableForSale
          featuredImage { url altText width height }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query ProductByHandle($handle: String!, $identifiers: [HasMetafieldsIdentifier!]!) {
    product(handle: $handle) {
      id
      handle
      title
      descriptionHtml
      # tags: dirige a seção "Você também pode gostar" (produtos-recomendados) —
      # a marca (eseecloud/icsee) sai daqui, sem uma segunda busca. Escalar
      # aditivo; esta query é usada SÓ por getProductByHandle (não pelo carrinho).
      tags
      # availableForSale do PRODUTO: true se ALGUMA variante está disponível — a
      # mesma pergunta que resolverVariante responde no servidor na hora de
      # adicionar (lib/shopify/carrinho.ts). Aqui é só para a UI poder desabilitar
      # o botão ANTES do clique; a decisão de vender continua sendo do servidor.
      #
      # ⚠️ SEM CRASE NESTE COMENTÁRIO — ver o aviso do metafield logo abaixo: a
      # query é um template literal, e uma crase aqui fecha a string.
      #
      # Sem isto a PDP não sabia o estoque: o filtro de esgotados só existe no
      # /catalogo e nos destaques, então a página de um produto esgotado abria com
      # o botão vivo e o cliente só descobria dentro do drawer.
      availableForSale
      images(first: 20) { nodes { url altText width height } }
      priceRange { minVariantPrice { amount currencyCode } }
      # Texto de apresentação (feature apresentacao-produto). ALIASADO, e não
      # dentro de SPEC_METAFIELDS de propósito: aquela lista alimenta a ficha
      # técnica, e este texto viraria um card de especificação com rótulo e
      # valor. Mesmo molde do resumo na PRODUCTS_QUERY.
      #
      # Tipo multi_line_text_field: o value é a string CRUA, com as quebras de
      # linha como o lojista digitou. Não é HTML e não passa pelo sanitizador —
      # quem interpreta a convenção de blocos é lib/apresentacao.ts, que devolve
      # nós React (nunca dangerouslySetInnerHTML).
      #
      # ⚠️ SEM CRASE NESTE COMENTÁRIO. A query inteira é um template literal do
      # JS: uma crase aqui dentro FECHA a string e o arquivo deixa de compilar.
      apresentacao: metafield(namespace: "custom", key: "apresentacao") { value }
      # Resumo consultivo (uma linha) — ADITIVO para o JSON-LD Product
      # (feature product-schema). Mesmo metafield que a PRODUCTS_QUERY já pede
      # para o bloco do /catalogo; aqui ele vira a description do schema.
      #
      # Por que ele, e não descriptionHtml: product.description vem VAZIO nos 7
      # produtos (medido em 11/08/2026 — o HTML da loja só tem imagens), e o 1º
      # bloco de apresentacao é gancho narrativo sobre o problema do cliente,
      # não descrição do produto. Ver lib/seo/produtoSchema.ts.
      #
      # ⚠️ SEM CRASE NESTE COMENTÁRIO — ver o aviso logo acima.
      resumo: metafield(namespace: "custom", key: "resumo") { value }
      # SKU — ADITIVO para o JSON-LD (feature product-schema). Vive na VARIANTE,
      # não no produto, e por isso exige esta seleção.
      #
      # first: 1 (e não 2, como na PRODUTO_PARA_CARRINHO_QUERY): aqui a pergunta
      # não é "quantas variantes existem" — essa salvaguarda é de lá, e continua
      # sendo dela. Aqui só se lê o identificador da variante que a loja vende.
      #
      # Medido: 5 dos 7 produtos têm SKU; A31H e A38 vêm null e o schema omite o
      # campo em vez de inventar.
      #
      # ⚠️ SEM CRASE NESTE COMENTÁRIO — ver o aviso logo acima.
      variants(first: 1) { nodes { sku } }
      # Número de lentes — ADITIVO para o TITLE derivado (feature title-por-spec).
      # Mesmo metafield que a PRODUCTS_QUERY já pede para os destaques do catálogo.
      #
      # 🔴 ALIAS SEPARADO, E NÃO ENTRADA EM SPEC_METAFIELDS — decisão registrada
      # (11/08/2026). Pôr a chave naquele array a faria aparecer na Ficha Técnica
      # da PDP, que é mudança VISÍVEL e não foi pedida. O alias entrega o dado ao
      # title sem tocar na tela.
      #
      # Valor CRU aqui: "Lente única" | "Lente dupla" | "Lente tripla" (medido nos
      # 7 produtos). Quem decide o que vira descritor é lib/seo/tituloProduto.ts —
      # e "Lente única" não vira nada, porque lente única não é diferencial.
      #
      # ⚠️ SEM CRASE NESTE COMENTÁRIO — ver o aviso logo acima.
      lentes: metafield(namespace: "custom", key: "numero_de_lentes") { value }
      metafields(identifiers: $identifiers) {
        namespace
        key
        value
      }
    }
  }
`

// Identificadores dos metafields de specs, derivados de SPEC_METAFIELDS.
// Passado como variável `$identifiers` para PRODUCT_BY_HANDLE_QUERY.
export const SPEC_METAFIELD_IDENTIFIERS = SPEC_METAFIELDS.map(
  ({ namespace, key }) => ({ namespace, key }),
)

/**
 * Produtos por tag — usada pela sugestão de acessórios.
 *
 * `$query` vem por VARIÁVEL, montada no servidor a partir de `TAG_ACESSORIO`
 * (`lib/shopify/tags.ts`). O cliente nunca escolhe a busca: a action
 * `buscarAcessorios()` não tem argumentos.
 *
 * **`first: 250` é o TETO da Storefront API** — verificado: `first: 251` responde
 * *"first cannot exceed 250"*. Não paginamos de propósito: uma tag `acessorio`
 * com mais de 250 produtos não é catálogo crescendo, é a tag virando categoria —
 * e aí a feature precisa ser repensada, porque ninguém lê 250 sugestões num
 * drawer. Paginar fingiria suportar um cenário que a UI não suporta.
 *
 * A seleção é exatamente `RawProductCard` + `availableForSale`, para
 * `normalizeProductCard` funcionar sem adaptador.
 *
 * **`availableForSale` NÃO entra na string de busca**, embora
 * `tag:x AND available_for_sale:true` seja aceito pela API. Motivo: quando testei,
 * a loja tinha 2 acessórios e 0 esgotados — "filtra certo" e "não filtra nada"
 * davam o mesmo resultado. Um filtro que não consigo verificar é pior que um
 * `.filter()` em JS, que qualquer um lê. O filtro está em `acessorios.ts`.
 */
export const ACESSORIOS_QUERY = /* GraphQL */ `
  query Acessorios($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      nodes {
        id
        handle
        title
        availableForSale
        featuredImage { url altText width height }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`

/**
 * Produtos por tag de MARCA — usada pela seção "Você também pode gostar"
 * (produtos-recomendados). Recomenda outras câmeras da MESMA marca.
 *
 * Documento **novo** (não reusa nem generaliza a `ACESSORIOS_QUERY`): a forma é
 * idêntica, mas manter separado evita tocar a feature de acessórios que já
 * funciona. Se um dia surgir um 3º consumidor de "produtos por tag", aí sim vale
 * extrair um documento compartilhado — com as duas features revalidadas.
 *
 * `$query` vem por VARIÁVEL, montada no servidor a partir de `MARCAS`
 * (`lib/shopify/tags.ts`): `tag:eseecloud` / `tag:icsee`. O cliente nunca escolhe.
 *
 * `first: 250` é o TETO da Storefront API; não paginamos (a seção mostra no
 * máximo 4 — cortar em JS é mais simples e verificável que paginar).
 *
 * Seleção = `RawProductCard` + `availableForSale`, para `normalizeProductCard`
 * funcionar sem adaptador. **`availableForSale` NÃO entra na string de busca** —
 * filtro em JS (`recomendados.ts`), mesmo motivo da `ACESSORIOS_QUERY`.
 */
export const RECOMENDADOS_QUERY = /* GraphQL */ `
  query Recomendados($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      nodes {
        id
        handle
        title
        availableForSale
        featuredImage { url altText width height }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`

/**
 * Variantes de um produto — usada só pelo carrinho, para o SERVIDOR resolver o
 * `merchandiseId` a partir do handle (o cliente nunca escolhe a variante).
 *
 * `first: 2` é DELIBERADO — não troque por `first: 1`:
 *   - 1 basta para comprar (a premissa do catálogo é 1 variante por produto);
 *   - mas são precisas 2 para DETECTAR "mais de uma variante" e disparar a
 *     salvaguarda do Req 1.8. Com `first: 1` a premissa poderia cair em silêncio
 *     e o site venderia a cor errada.
 *
 * A salvaguarda conta VARIANTES, nunca a presença de `options`: hoje os produtos
 * têm 1 variante mas MANTÊM a opção `Cor` (com um único valor) — checar `options`
 * daria falso positivo imediato.
 *
 * `quantityAvailable` pode vir `null` (depende do scope
 * `unauthenticated_read_product_inventory`) — tratar como opcional (Req 10.7).
 *
 * `product(handle:)` e NÃO `productByHandle`, que está depreciado na 2026-01.
 */
export const PRODUTO_PARA_CARRINHO_QUERY = /* GraphQL */ `
  query ProdutoParaCarrinho($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      variants(first: 2) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
        }
      }
    }
  }
`
