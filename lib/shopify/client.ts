import "server-only"

// Cliente da Shopify Storefront API (GraphQL). RODA APENAS NO SERVIDOR:
// `import "server-only"` acima faz o build FALHAR se algum módulo de cliente
// importar este arquivo — o token nunca entra no bundle do browser.
//
// O token vem SEMPRE de `process.env` (nunca embutido no código). Nenhuma
// mensagem de erro interpola o token.

const DEFAULT_API_VERSION = "2026-01"

// ─── Cache: LEIA ANTES DE "CONSERTAR" ────────────────────────────────────────
//
// ⚠️ O `next: { revalidate }` abaixo é INERTE hoje, e isso é esperado.
//    A partir do Next 15 (aqui: 16.x) o `fetch` NÃO é mais cacheado por default
//    — cachear é opt-in via `cache: "force-cache"`. Como este client faz POST e
//    nunca passa `force-cache`, nada aqui entra no Data Cache.
//
// ⚠️ Então de onde vem o ISR do catálogo? Do ROUTE SEGMENT, não daqui:
//      app/catalogo/page.tsx          → export const revalidate = 300
//      app/produtos/[handle]/page.tsx → export const revalidate = 300
//    Não remova esses exports achando que este arquivo cobre. Não cobre.
//
// 🚫 NUNCA "conserte" o `revalidate` daqui com `cache: "force-cache"`, e NUNCA
//    adicione `export const fetchCache = "default-cache"` no projeto.
//    Motivo (a doc do Next é explícita): `force-cache` cacheia QUALQUER request,
//    INCLUSIVE POST e requests que mandam `cookie`/`authorization`. As operações
//    de carrinho são exatamente isso. O resultado seria o pior bug possível
//    nesta base: o CARRINHO DE UM CLIENTE SERVIDO A OUTRO. Ver Req 8.4a.
//
// Por que a união existe se o `revalidate` é inerte: ela crava NO TIPO a
// intenção "o carrinho nunca cacheia", em vez de depender de um default do
// framework que já mudou uma vez e pode mudar de novo. É defesa declarada — o
// `semCache: true` continua correto mesmo se o Next voltar a cachear por default.

export type StorefrontFetchOptions =
  /** ISR (catálogo): janela de revalidação em segundos. Default 300 (5 min). */
  | { semCache?: false; revalidate?: number }
  /** Carrinho: nunca cacheia. `revalidate` é proibido aqui (conflito no Next). */
  | { semCache: true; revalidate?: never }

interface GraphQLResponse<T> {
  data?:   T
  errors?: { message: string }[]
}

/**
 * Executa uma consulta GraphQL contra a Storefront API.
 * Lança `Error` explícito se env ausente, se a resposta não for 2xx, ou se o
 * GraphQL retornar `errors` — sempre SEM vazar o token.
 */
export async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  opts?: StorefrontFetchOptions,
): Promise<T> {
  const domain  = process.env.SHOPIFY_STORE_DOMAIN
  const token   = process.env.SHOPIFY_STOREFRONT_TOKEN
  const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

  if (!domain || !token) {
    throw new Error(
      "Shopify env ausente: defina SHOPIFY_STORE_DOMAIN e SHOPIFY_STOREFRONT_TOKEN " +
        "em .env.local (ver .env.example).",
    )
  }

  const endpoint = `https://${domain}/api/${version}/graphql.json`

  // Mutuamente exclusivo: `cache: "no-store"` junto de `next: { revalidate }` é
  // conflito no Next. A união de `StorefrontFetchOptions` torna a combinação
  // inválida um erro de COMPILAÇÃO — ver o comentário de cache no topo.
  const opcoesDeCache = opts?.semCache
    ? { cache: "no-store" as const }
    : { next: { revalidate: opts?.revalidate ?? 300 } }

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      ...opcoesDeCache,
    })
  } catch (e) {
    // Erro de rede/DNS — mensagem sem token.
    throw new Error(`Falha ao conectar à Shopify (${endpoint}): ${(e as Error).message}`)
  }

  if (!res.ok) {
    throw new Error(`Shopify respondeu ${res.status} ${res.statusText} em ${endpoint}`)
  }

  const json = (await res.json()) as GraphQLResponse<T>

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Erro GraphQL da Shopify: ${json.errors.map((e) => e.message).join("; ")}`)
  }

  if (!json.data) {
    throw new Error("Resposta da Shopify sem campo `data`.")
  }

  return json.data
}
