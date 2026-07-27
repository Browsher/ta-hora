// Núcleo puro do filtro do /catalogo (feature catalogo-consultivo).
//
// O filtro REORDENA, nunca ESCONDE. Toda a garantia de SEO ("o robô continua
// vendo as 7 câmeras") se apoia num invariante desta função: ela nunca filtra um
// item para fora — o array de saída tem SEMPRE o mesmo comprimento da entrada, só
// muda a ordem. Não há `.filter()` que remova; não há `display:none` aqui nem em
// quem a consome.
//
// Módulo PURO de propósito: sem "use client" e sem imports de VALOR da camada
// Shopify (só `import type`). Assim ele pode ser exercitado isoladamente e não
// arrasta nada server-only para o bundle do cliente.

import type { ProductCard } from "@/lib/shopify/types"

/** As 5 opções do filtro. `todas` é o padrão (ordem do servidor). */
export type FiltroCatalogo =
  | "todas"
  | "melhor-preco"
  | "mais-recursos"
  | "eseecloud"
  | "icsee"

// Predicado "este produto casa com o filtro de partição?" para os filtros que
// sobem um GRUPO ao topo. `melhor-preco` e `todas` não passam por aqui (têm
// ordenação própria / identidade).
const CASA: Record<"mais-recursos" | "eseecloud" | "icsee", (p: ProductCard) => boolean> = {
  "mais-recursos": (p) => p.maisRecursos,
  eseecloud:       (p) => p.marca === "eseecloud",
  icsee:           (p) => p.marca === "icsee",
}

/**
 * Reordena (nunca esconde) a lista já carregada conforme o filtro.
 *
 * ESTÁVEL e sem mutação: opera sobre uma CÓPIA (`[...produtos]`), e `Array.sort`
 * é estável desde o ES2019 — empates preservam a ordem original do servidor.
 *
 * - `todas`        → identidade: devolve `produtos` como está (sem cópia/sort).
 * - `melhor-preco` → `precoNumerico` crescente; preços iguais mantêm a ordem do servidor.
 * - `mais-recursos`/`eseecloud`/`icsee` → partição estável: os que casam (rank 0)
 *   sobem, o resto (rank 1) desce, cada grupo na ordem original.
 *
 * O comprimento do array é INVARIANTE em todos os casos — o que garante o "nunca
 * esconde" (Req 3.2 / 4.3).
 */
export function ordenarCatalogo(
  produtos: ProductCard[],
  filtro: FiltroCatalogo,
): ProductCard[] {
  if (filtro === "todas") return produtos // identidade real (ordem do servidor)

  if (filtro === "melhor-preco") {
    return [...produtos].sort((a, b) => a.precoNumerico - b.precoNumerico)
  }

  // Partição estável: quem casa vem antes (rank 0), quem não casa depois (rank 1).
  // Dentro de cada grupo, a estabilidade do sort preserva a ordem do servidor.
  const casa = CASA[filtro]
  const rank = (p: ProductCard) => (casa(p) ? 0 : 1)
  return [...produtos].sort((a, b) => rank(a) - rank(b))
}
