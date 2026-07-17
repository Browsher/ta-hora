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
