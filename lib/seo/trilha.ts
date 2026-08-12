import { SITE_URL } from "@/lib/site"

// Trilha de navegação (breadcrumb) — a MESMA fonte para o que aparece na tela e
// para o `BreadcrumbList` do JSON-LD.
//
// Módulo PURO, mesmo padrão de `produtoSchema.ts`, `tituloProduto.ts` e
// `metadataPagina.ts`: sem React, sem fetch, sem `server-only`.
//
// ═══ POR QUE UMA FONTE SÓ, E NÃO DUAS LISTAS ═══════════════════════════════
//
// O `BreadcrumbList` tem que afirmar exatamente o que a trilha visível mostra, na
// mesma ordem. Divergirem tem dois desfechos, e o segundo é caro:
//
//   - O provável: o Google ignora a marcação e volta a exibir a URL crua no
//     resultado. Perde-se o ganho, sem punição.
//   - O caro: se a marcação inventar hierarquia que não existe na página — um
//     nível "Câmeras Externas" que não é página nem aparece na tela —, isso é
//     marcar conteúdo ausente, a MESMA família do `aggregateRating`. Ação manual
//     por structured data derruba os rich results do DOMÍNIO INTEIRO, incluindo o
//     `Product` das 7 PDPs.
//
// Por isso `Trilha.tsx` e `trilhaSchema()` recebem o MESMO array. Não é economia
// de digitação: é tirar a divergência do campo do que alguém precisa lembrar —
// mesmo argumento do `path` em metadataPagina.ts e do `parcelamento()`.
//
// ═══ 🔴 AS URLs SAEM DE `SITE_URL`, NUNCA DA REQUISIÇÃO ════════════════════
//
// Os links de afiliado chegam com `?ref=<código>`. Uma trilha construída da URL
// da requisição carregaria a query, e o schema passaria a declarar uma hierarquia
// diferente por afiliado. É o mesmo motivo pelo qual `offers.url` do
// produtoSchema.ts e o `canonical` do layout são absolutos e sem query.

/** Um degrau da trilha. `href` é sempre uma rota do site, começando com "/". */
export interface ItemTrilha {
  nome: string
  href: string
}

/**
 * A raiz. "Início" e não "Home": é o rótulo que o site usa em português, e o
 * breadcrumb é texto de interface antes de ser sinal de busca.
 */
const INICIO: ItemTrilha = { nome: "Início", href: "/" }

/** O nível intermediário — a única categoria real que este site tem hoje. */
const CATALOGO: ItemTrilha = { nome: "Catálogo", href: "/catalogo" }

/** `Início > Catálogo`. */
export function trilhaDoCatalogo(): ItemTrilha[] {
  return [INICIO, CATALOGO]
}

/**
 * `Início > Catálogo > <produto>`.
 *
 * 🔴 `nome` É O NOME CURTO ("Câmera Segurança A31H"), não o descritor completo do
 * title. Decisão registrada em 12/08/2026, por dois motivos:
 *
 *   1. Breadcrumb é NAVEGAÇÃO. O rótulo é um degrau de trilha, não um título — a
 *      mesma razão pela qual os cards, o carrinho e o `item_name` do GA4 seguem
 *      com o nome curto.
 *   2. O último degrau é o MENOS consequente dos três no resultado de busca. O
 *      Google monta o caminho a partir dos ANCESTRAIS — o que substitui a URL é
 *      "tahora.com.br › Catálogo". A página atual já é o título azul logo acima e
 *      não se repete na trilha. Ou seja, o descritor completo aqui pagaria custo
 *      de layout (47 caracteres quebrando linha no mobile) por um ganho que nem
 *      chega a ser exibido.
 *
 * Onde o descritor completo importa — `<title>`, `og:title` e `Product.name` —
 * ele já está. Ver lib/seo/tituloProduto.ts.
 */
export function trilhaDoProduto(nomeCurto: string, handle: string): ItemTrilha[] {
  return [INICIO, CATALOGO, { nome: nomeCurto, href: `/produtos/${handle}` }]
}

/**
 * `BreadcrumbList` a partir do MESMO array que a tela renderiza.
 *
 * 🔴 O ÚLTIMO ELEMENTO SAI SEM `item`, de propósito. Ele é a página atual, e a
 * documentação do Google permite omitir a URL nesse caso. A trilha visível também
 * não o renderiza como link — o schema espelha a tela, que é a regra deste
 * arquivo. Declarar um link para si mesmo dentro de uma trilha de navegação não
 * acrescenta destino nenhum.
 *
 * `position` é 1-based e sequencial. Não use o índice do array cru.
 */
export function trilhaSchema(itens: ItemTrilha[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: itens.map((item, i) => ({
      "@type":  "ListItem",
      position: i + 1,
      name:     item.nome,
      // Absoluta e sem query — ver o bloco no topo do arquivo.
      ...(i < itens.length - 1
        ? { item: item.href === "/" ? SITE_URL : `${SITE_URL}${item.href}` }
        : {}),
    })),
  }
}
