"use client"

import { useState, useEffect } from "react"
import { useMobileOverride } from "@/lib/MobileOverrideContext"

/**
 * `true` quando a viewport é menor que `breakpoint`.
 *
 * ─── 🔴 O PADRÃO DE SSR É `true` (MOBILE) — DECISÃO DE 11/08/2026 ──────────────
 *
 * Este hook NÃO mede nada no servidor: `window` não existe lá, e a medição só
 * acontece no `useEffect` abaixo, que por definição roda DEPOIS da hidratação
 * completa. Então existe uma janela — o HTML do servidor mais o primeiro render
 * do cliente — em que o valor é um CHUTE. `padraoSSR` é esse chute.
 *
 * O chute era `false` (desktop). No celular isso produzia um flash de ~1s da
 * versão desktop antes de o layout trocar: o tempo de baixar, parsear e hidratar
 * o bundle client (a Home tem 9 seções "use client", todas com framer-motion).
 * Sete das nove seções da Home saíam no ramo errado — verificado no HTML gerado,
 * não por leitura: `flex-direction:row`, `gap:48px` e o grid do rodapé estavam
 * todos no ramo desktop.
 *
 * Invertemos para `true` porque isto é uma LOJA e o tráfego é majoritariamente
 * mobile. Não elimina o flash — MOVE ele para o desktop, onde é menor (o
 * navegador costuma estar quente) e onde a página não é a principal porta de
 * entrada. É troca consciente, não conserto.
 *
 * ⚠️ ISTO É PALIATIVO. O conserto de verdade é `@media` puro, e está registrado
 * como pendência em `docs/responsividade-pendencias.md` (passo 2). Enquanto ele
 * não vier, qualquer seção NOVA deve nascer em CSS e não chamar este hook.
 *
 * ─── A EXCEÇÃO DA NAVBAR — NÃO "UNIFORMIZAR" ──────────────────────────────────
 *
 * `Navbar.tsx` chama `useIsMobile(768, false)`, mantendo o padrão ANTIGO. Isso é
 * deliberado, e não um esquecimento da inversão acima.
 *
 * Nas outras oito seções os dois ramos têm o MESMO CONTEÚDO e só o layout muda
 * (`flexDirection`, `gap`, `gridTemplateColumns`). Trocar o padrão ali muda como
 * a página se parece por 1s, e nada mais.
 *
 * Na Navbar, não: os ramos renderizam ELEMENTOS DIFERENTES — links de navegação
 * de um lado, botão hambúrguer e dropdown do outro (`Navbar.tsx:173/200/209/235`).
 * Com `padraoSSR: true` os links de navegação SUMIRIAM do HTML do servidor e só o
 * hambúrguer sairia. Isso deixa de ser aparência e passa a mexer no que o Google
 * indexa — que é exatamente a preocupação registrada no cabeçalho de
 * `components/ui/CarrosselMobile.tsx` ("todos os itens saem no HTML do servidor,
 * e o CSS só muda como o MOBILE os exibe").
 *
 * Ou seja: a Navbar não é diferente por gosto. Ela é a única seção onde o padrão
 * de SSR tem consequência de SEO, então ela é a única que paga o flash para não
 * pagar o índice. Ela só deve entrar na inversão DEPOIS de os dois ramos dela
 * passarem a coexistir no HTML com visibilidade por `@media` — que é o passo 2
 * para ela.
 *
 * @param breakpoint largura, em px, abaixo da qual consideramos mobile.
 * @param padraoSSR  valor usado no servidor e no primeiro render do cliente,
 *                   antes de a medição real acontecer. Ver o bloco acima antes
 *                   de passar `false`.
 */
export function useIsMobile(breakpoint = 768, padraoSSR = true): boolean {
  const override = useMobileOverride()
  // 🔴 O estado inicial tem de ser o MESMO no servidor e no primeiro render do
  // cliente, senão o flash vira erro de hidratação. É por isso que `padraoSSR`
  // é uma constante e NÃO `window.innerWidth < breakpoint`: ler a janela aqui
  // faria o cliente hidratar com um valor que o HTML do servidor não tem. O
  // código de hoje é livre de mismatch por construção — manter assim.
  const [fromViewport, setFromViewport] = useState(padraoSSR)

  useEffect(() => {
    if (override !== null) return  // skip listener when overridden
    function check() {
      setFromViewport(window.innerWidth < breakpoint)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint, override])

  return override !== null ? override : fromViewport
}
