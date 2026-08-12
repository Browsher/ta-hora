import type { Metadata } from "next"

// Metadata completo de uma página estática — título, description, canonical e o
// bloco `openGraph` INTEIRO, derivados de um caminho só.
//
// Módulo PURO, mesmo padrão de `produtoSchema.ts` e `tituloProduto.ts`: sem
// React, sem fetch, sem `server-only`.
//
// ═══ O DEFEITO QUE ESTE ARQUIVO EXISTE PARA IMPEDIR ════════════════════════
//
// Até 12/08/2026, SEIS das 14 páginas (/catalogo, /sobre-nos, /suporte e as 3
// legais) declaravam `title`, `description` e `alternates` — e NENHUM
// `openGraph`. Resultado medido no HTML servido:
//
//     /catalogo   → og:url = https://www.tahora.com.br   (a HOME)
//     /sobre-nos  → og:url = https://www.tahora.com.br
//     /suporte    → og:url = https://www.tahora.com.br
//     3 legais    → og:url = https://www.tahora.com.br
//
// E o `og:title` das seis dizia "Ta Hora — Câmeras de Segurança Wi-Fi
// Originais", ignorando o `title` que cada uma declarava certo. Na prática: um
// link do /catalogo colado no WhatsApp mostrava a prévia da HOME. Num negócio que
// vende por indicação e afiliado, o link compartilhado é o primeiro contato — era
// o primeiro contato mostrando a página errada.
//
// Não afetava busca: o `canonical` de cada página sempre esteve correto. Afetava
// compartilhamento, que é onde este negócio vive.
//
// ═══ 🔴 POR QUE O BLOCO É INTEIRO, E NÃO SÓ A `url` ═══════════════════════
//
// `openGraph` NÃO é mesclado com o do layout raiz: é SUBSTITUÍDO por inteiro.
// A documentação do Next diz que objetos aninhados como `openGraph` e `robots`
// são sobrescritos pelo último segmento que os definir, e o `mergeMetadata` do
// próprio Next confirma — para cada chave presente no filho, o resolver roda e o
// resultado substitui o valor do pai.
//
// Consequência: `openGraph: { url: "/catalogo" }` NÃO acrescenta a url ao bloco
// herdado. Ele DESCARTA o bloco herdado e emite só a url — a página perderia
// imagem, siteName, locale, type e description de uma vez, ficando PIOR que
// antes. Preview sem miniatura é pior que preview com a imagem errada.
//
// É por isso que o `openGraph` da PDP (app/produtos/[handle]/page.tsx) repete
// tudo o que o raiz já define. Não é redundância: é o contrato da API. Este
// módulo existe para que essa repetição aconteça UMA vez, aqui, e não seis.
//
// ═══ POR QUE `url` E `canonical` SAEM DO MESMO ARGUMENTO ══════════════════
//
// Os dois derivam de `path`. Não é economia de digitação: divergirem É o defeito
// descrito acima. Com uma fonte só, a divergência deixa de ser possível — não
// depende de ninguém lembrar de editar os dois.

/**
 * Arte de Open Graph padrão do site — 1200×630, o formato 1,91:1 do card.
 *
 * Exportada porque o `app/layout.tsx` usa a MESMA arte na Home: eram duas
 * cópias do mesmo objeto, com as mesmas dimensões literais e o mesmo alt.
 *
 * 🔴 AS DIMENSÕES SÃO AS REAIS DO ARQUIVO. Declarar dimensão que não bate faz o
 * WhatsApp recortar errado ou descartar a prévia — o mesmo modo de falha que o
 * `og:image` da PDP documenta.
 *
 * O formato WebP foi verificado na prévia real do WhatsApp em 12/08/2026 e
 * funciona. Não "conserte" para JPEG sem repetir esse teste.
 */
export const OG_IMAGE_PADRAO = {
  url:    "/uploads/og-image.webp",
  width:  1200,
  height: 630,
  alt:    "Mão segurando celular com a imagem ao vivo de uma câmera Ta Hora apontada para o portão de uma casa, ao lado da chamada “Veja de onde estiver”",
} as const

interface Opcoes {
  /**
   * Título da página, **SEM** o sufixo `" | Ta Hora"` — quem acrescenta é o
   * `template` do `app/layout.tsx`. Repetir aqui gera "Suporte | Ta Hora |
   * Ta Hora", que não quebra o build e sai errado na aba e no Google.
   */
  title: string
  /** Meta description. A MESMA string alimenta `description` e `og:description`. */
  description: string
  /**
   * Caminho da rota, começando com `/` e SEM barra final (`/sobre-nos`).
   * Vira `alternates.canonical` e `openGraph.url` — relativo, resolvido contra o
   * `metadataBase`, que é o que neutraliza o `?ref=` dos afiliados.
   */
  path: string
  /**
   * `og:title`, quando o `title` sozinho for ruim como manchete de link
   * compartilhado. Default: o próprio `title`.
   *
   * Existe porque as duas perguntas são diferentes. "Sobre Nós" é um bom rótulo
   * de aba ao lado do sufixo da marca, e uma manchete vazia no WhatsApp, onde a
   * pessoa vê o título antes de decidir se clica. Já "Catálogo de Câmeras de
   * Segurança Wi-Fi" se descreve sozinho e não precisa de override.
   *
   * 🔴 Também SEM `" | Ta Hora"`: o `template` do layout NÃO se aplica ao Open
   * Graph, e o `og:site_name` abaixo já diz a marca.
   */
  ogTitle?: string
  /** Arte própria da página. Default: `OG_IMAGE_PADRAO`. */
  image?: typeof OG_IMAGE_PADRAO
}

/**
 * Monta o `Metadata` completo de uma página estática.
 *
 * 🔴 NÃO É PARA A PDP. Ela usa `generateMetadata` com dados dinâmicos, `og:image`
 * por produto e dimensões calculadas por foto — cabe aqui com um parâmetro, mas a
 * migração é decisão própria, não efeito colateral desta. Ela já está correta.
 *
 * 🔴 NÃO É PARA O LAYOUT RAIZ. Lá vivem `metadataBase`, `title.template`,
 * `twitter` e `robots`, que são do site e não de uma página. O que os dois
 * compartilham é a arte: `OG_IMAGE_PADRAO`.
 */
export function metadataPagina({
  title,
  description,
  path,
  ogTitle,
  image = OG_IMAGE_PADRAO,
}: Opcoes): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      // Os quatro campos abaixo existiam SÓ por herança do raiz. Some qualquer um
      // e a prévia perde uma informação — ver o bloco no topo do arquivo.
      type:     "website",
      locale:   "pt_BR",
      siteName: "Ta Hora",
      url:      path,
      title:    ogTitle ?? title,
      description,
      images:   [image],
    },
  }
}
