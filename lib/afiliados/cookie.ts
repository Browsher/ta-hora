import "server-only"

import { cookies } from "next/headers"

import { COOKIE_REF, normalizarRef } from "./ref"

// Leitura do ref de afiliado nas Server Actions. `server-only`: o build FALHA se
// um componente de cliente importar isto.
//
// ─── SÓ LEITURA — e isso NÃO é esquecimento ───────────────────────────────────
//
// O irmão `lib/carrinho/cookie.ts` tem ler/gravar/descartar. Aqui só existe
// `lerRefDeAfiliado`, porque QUEM GRAVA É O `proxy.ts` (raiz do projeto):
//
//   • O proxy roda ANTES do roteamento e grava o cookie na RESPOSTA
//     (`NextResponse.cookies.set`) — não usa `next/headers`.
//   • Gravar aqui também seria pior: uma Server Action só roda DEPOIS que a
//     página existe, e a captura precisa estar pronta ANTES do primeiro clique.
//
// Não adicione um `gravarRef` "por simetria" — ele não teria chamador, e teria
// uma corrida.
//
// ─── POR QUE REVALIDAR NA LEITURA ────────────────────────────────────────────
//
// O `proxy.ts` já validou antes de gravar. Validamos DE NOVO aqui porque cookie
// é ENTRADA DO CLIENTE: qualquer um edita o `tahora_ref` no DevTools ou manda um
// header `Cookie` forjado. Sem esta segunda barreira, esse valor viraria um cart
// attribute enviado à Shopify — é a diferença entre um campo validado e um campo
// de injeção. A validação do proxy é conveniência; ESTA é a que protege.

/**
 * O código de afiliado da sessão, já normalizado e validado.
 *
 * `null` = sem atribuição (visitante orgânico, cookie expirado, ou valor
 * adulterado). Nesse caso o carrinho se comporta EXATAMENTE como antes desta
 * feature: nenhum attribute, nenhuma mutation extra.
 */
export async function lerRefDeAfiliado(): Promise<string | null> {
  const jar = await cookies()

  return normalizarRef(jar.get(COOKIE_REF)?.value)
}
