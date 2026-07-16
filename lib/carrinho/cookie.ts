import "server-only"

import { cookies } from "next/headers"

// Persistência do ID do carrinho. `server-only`: o build FALHA se um componente
// de cliente importar isto.
//
// O QUE O `httpOnly` GARANTE — e o que NÃO garante (leia antes de mexer):
//
//   ✅ Garante: JS do cliente não LÊ, não FORJA e não APAGA a sessão de
//      carrinho. Quem decide qual carrinho é o desta sessão é o servidor. O
//      valor nunca é logado.
//
//   ❌ NÃO garante: sigilo do VALOR do id. Ele chega ao navegador de qualquer
//      forma, dentro do `checkoutUrl` (verificado ao vivo:
//      `checkoutUrl = .../cart/c/<token>?key=<key>` e
//      `cart.id = gid://shopify/Cart/<MESMO token>?key=<MESMA key>`).
//      Isso é sabido, aceito e decidido — a capability é do carrinho do PRÓPRIO
//      visitante, e a credencial que importa (o token da Storefront API)
//      continua server-only. Ver design → "Decisão: link direto".
//
// Ou seja: o cookie protege a PERSISTÊNCIA, não o segredo. Não escreva em outro
// lugar que "o id nunca chega ao cliente" — é falso, e essa frase já produziu
// defeito nesta spec.

const NOME_DO_COOKIE = "carrinho_id"

/** 7 dias (Req 2.1: janela declarada de persistência). */
const VALIDADE_EM_SEGUNDOS = 60 * 60 * 24 * 7

/** Lê o ID do carrinho da sessão. `null` = visitante sem carrinho. */
export async function lerIdDoCarrinho(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(NOME_DO_COOKIE)?.value ?? null
}

/**
 * Grava o ID do carrinho.
 *
 * `sameSite: "lax"` é o default prudente. Nesta arquitetura `strict` também
 * funcionaria (o cookie só é lido em Server Actions iniciadas pela própria
 * página, contexto same-site), mas `lax` é à prova de futuro caso um dia haja
 * leitura no SSR.
 */
export async function gravarIdDoCarrinho(id: string): Promise<void> {
  const jar = await cookies()
  jar.set(NOME_DO_COOKIE, id, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   VALIDADE_EM_SEGUNDOS,
    path:     "/",
  })
}

/**
 * Descarta o ID — usado quando a Shopify devolve `cart: null` (inexistente,
 * expirado ou já finalizado em checkout). Não é erro: é autocorreção para
 * carrinho vazio, sem mensagem ao cliente (Req 2.3/2.6).
 */
export async function descartarIdDoCarrinho(): Promise<void> {
  const jar = await cookies()
  jar.delete(NOME_DO_COOKIE)
}
