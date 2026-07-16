import "server-only"

// Cliente da Shopify Storefront API (GraphQL). RODA APENAS NO SERVIDOR:
// `import "server-only"` acima faz o build FALHAR se algum módulo de cliente
// importar este arquivo — o token nunca entra no bundle do browser.
//
// O token vem SEMPRE de `process.env` (nunca embutido no código). Nenhuma
// mensagem de erro interpola o token.

const DEFAULT_API_VERSION = "2026-01"

export interface StorefrontFetchOptions {
  /** Janela de revalidação do cache (ISR), em segundos. Default 300 (5 min). */
  revalidate?: number
}

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

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: opts?.revalidate ?? 300 },
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
