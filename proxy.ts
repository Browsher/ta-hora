import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  COOKIE_REF,
  VALIDADE_REF_EM_SEGUNDOS,
  normalizarRef,
} from "@/lib/afiliados/ref"

// A CAPTURA do link de afiliado (`?ref=CODIGO`). No Next 16 este arquivo se
// chama `proxy.ts` — é o rename oficial do antigo `middleware.ts` (codemod
// `middleware-to-proxy`), e a função exportada é `proxy`, não `middleware`.
//
// ─── POR QUE AQUI, E NÃO NUM COMPONENTE DE CLIENTE ───────────────────────────
//
// A alternativa era capturar num `useEffect` pós-montagem. Este lugar ganha em
// quatro pontos, e cada um já foi um bug em loja de afiliado:
//
//   1. O COOKIE É `httpOnly`. Via `document.cookie` ele seria legível e
//      FORJÁVEL por qualquer script da página. Aqui é o mesmo padrão do
//      `carrinho_id` (`lib/carrinho/cookie.ts`).
//   2. NÃO DEPENDE DE JS. Cliente com JS quebrado/bloqueado ainda credita.
//   3. SEM CORRIDA. O cookie está gravado ANTES de a página existir — não há
//      janela em que o cliente clique em "comprar" antes de o efeito rodar.
//   4. NÃO TOCA O REGIME DAS ROTAS. Isto roda ANTES do roteamento, fora do
//      render: nenhuma `page.tsx` passa a ler `cookies()`/`headers()`, então
//      `/` e `/catalogo` seguem ISR e `/sobre-nos` segue estática. (Ver
//      tech.md → "Home estática": mudança de regime aqui seria vazamento.)
//
// ─── O QUE ESTE ARQUIVO PODE IMPORTAR ────────────────────────────────────────
//
// Só `lib/afiliados/ref.ts` — módulo PURO (regex + constantes). **NUNCA**
// importe `lib/afiliados/cookie.ts` nem nada com `server-only`/`next/headers`:
// o proxy roda fora do contexto de Server Component e isso quebraria o build.
// A gravação aqui é na RESPOSTA (`resposta.cookies.set`), não via `cookies()`.

/**
 * As rotas em que o proxy sequer é cogitado.
 *
 * Exclui API, estáticos do Next, o otimizador de imagem e QUALQUER caminho com
 * extensão (`.png`, `.ico`, os uploads de `public/`). Sem isso o proxy seria
 * convidado a opinar sobre cada asset da página — custo puro, já que nenhum
 * asset carrega `?ref=`.
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
}

export function proxy(request: NextRequest) {
  // ─── O GUARD, E ELE É O PRIMEIRO STATEMENT DE PROPÓSITO ─────────────────────
  //
  // 99,9% das requisições NÃO têm `?ref=`. Para todas elas o proxy precisa ser
  // um passthrough barato — uma leitura de `searchParams` e sai. Qualquer
  // trabalho acima desta linha seria pago por toda visita ao site para servir
  // uma minoria de visitas de afiliado.
  if (!request.nextUrl.searchParams.has("ref")) return NextResponse.next()

  try {
    // `get` devolve a PRIMEIRA ocorrência — é a regra decidida para
    // `?ref=A&ref=B` (Req 1.7). `normalizarRef` faz upper + valida
    // `^[A-Z0-9]{8}$`.
    const ref = normalizarRef(request.nextUrl.searchParams.get("ref"))

    // Ref inválido: seguimos a viagem SEM gravar e SEM redirecionar (Req 1.2).
    //
    // Não "limpamos" a URL de quem trouxe lixo, e sobretudo NÃO apagamos o
    // cookie existente (Req 1.4): um link torto de hoje não pode derrubar uma
    // atribuição legítima de ontem.
    if (!ref) return NextResponse.next()

    const urlLimpa = request.nextUrl.clone()
    // `delete` remove TODAS as ocorrências de `ref` — inclusive as que o `get`
    // acima ignorou. É também o que impede loop de redirect: a URL de destino
    // não tem `ref`, então o guard lá em cima devolve `next()` na volta.
    urlLimpa.searchParams.delete("ref")

    // ⚠️ 307, NUNCA 308 — E ISTO NÃO É ESTILO.
    //
    // O 308 é PERMANENTE e, por isso, CACHEÁVEL pelo navegador. Com ele, a 2ª
    // visita ao mesmo link `?ref=` seria resolvida do cache local, sem tocar o
    // servidor — e o `Set-Cookie` abaixo simplesmente NÃO ACONTECERIA. O
    // last-touch quebraria EM SILÊNCIO: nenhum erro, nenhum log, só afiliados
    // deixando de ser creditados. 307 é o default do `NextResponse.redirect`;
    // este comentário existe para ninguém "otimizar" isso depois.
    const resposta = NextResponse.redirect(urlLimpa)

    resposta.cookies.set(COOKIE_REF, ref, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   VALIDADE_REF_EM_SEGUNDOS,
      path:     "/",
    })

    // LAST-TOUCH: gravar sem checar o valor anterior é o comportamento correto
    // — o último afiliado a indicar leva a atribuição (Req 1.3).
    //
    // Se o navegador recusar o cookie, nada aqui falha: a navegação segue e a
    // visita apenas não é atribuída (Req 1.6). O risco desta feature é sempre
    // "não creditar", nunca "não vender".
    return resposta
  } catch {
    // A captura é ACESSÓRIA; a página não é. Qualquer exceção aqui (URL
    // malformada, o que for) degrada para a navegação normal. Sem
    // `console.error`: isto rodaria em toda visita de afiliado e não há nada
    // acionável a registrar.
    return NextResponse.next()
  }
}
