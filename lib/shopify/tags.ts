// Tags da Shopify que dirigem a sugestão de acessórios.
//
// SEM `server-only` DE PROPÓSITO: os dois lados precisam destas strings — o
// servidor monta a busca (`tag:acessorio`) e o cliente avalia o gatilho
// (`linha.tags.includes(TAG_CAMERA)`). Mesmo precedente de `types.ts`, que também
// atravessa a fronteira por não conter token nem fetch.
//
// ⚠️ ESTE ARQUIVO EXISTE PARA A GRAFIA SER ÚNICA.
// Duplicar as strings nos dois lados criaria o pior tipo de bug desta feature:
// um typo (`acessório`, `Camera`, `acessorios`) não gera erro, não quebra o
// build, não aparece em log — a seção simplesmente **nunca aparece**, e isso é
// indistinguível de "não há acessórios cadastrados".
//
// Os valores batem com o cadastro real da loja (verificado na Storefront API):
// minúsculas, sem acento. Se mudarem no admin, mudam AQUI — e o
// `npm run verificar:tags` é quem avisa que divergiram.

/** Produtos com esta tag são o GATILHO: se houver um no carrinho, sugerimos. */
export const TAG_CAMERA = "camera"

/** Produtos com esta tag são os SUGERIDOS. */
export const TAG_ACESSORIO = "acessorio"

// ─── Marcas (feature produtos-recomendados) ───────────────────────────────────
//
// A seção "Você também pode gostar" recomenda outras câmeras da MESMA marca.
// A marca de cada câmera é uma tag da Shopify. Mesma regra do resto do arquivo:
// a grafia mora AQUI, num lugar só, porque um typo faz a seção sumir em silêncio.

// 🔴 "eseecloud" com DOIS "e" (es-ee-cloud) é a grafia CERTA da marca — NÃO é um
// typo. MEDIDO na loja real (Storefront 2026-01): `tag:eseecloud` → 4 câmeras;
// `tag:essecloud` (um "s" a mais... digo, um "e" a menos) → 0. NÃO "conserte"
// para "essecloud": isso zera a seção para toda câmera EsseCloud, sem erro algum.
export const TAG_ESEECLOUD = "eseecloud"

/** A outra marca da loja. */
export const TAG_ICSEE = "icsee"

/**
 * As marcas conhecidas, EM ORDEM DE DESEMPATE: se um produto (caso não esperado)
 * tiver as duas tags, `marcaDoProduto` devolve a primeira desta lista.
 */
export const MARCAS = [TAG_ESEECLOUD, TAG_ICSEE] as const

/**
 * A marca do produto a partir das suas tags, ou `null` se não tiver nenhuma tag
 * de marca conhecida (nesse caso a seção de recomendados não aparece).
 *
 * Usa APENAS a tag — nunca título/handle/coleção como proxy. O valor devolvido é
 * provadamente um elemento de `MARCAS`, o que o servidor usa para montar
 * `tag:<marca>` (o cliente nunca escolhe a busca).
 */
export function marcaDoProduto(tags: string[]): (typeof MARCAS)[number] | null {
  return MARCAS.find((m) => tags.includes(m)) ?? null
}
