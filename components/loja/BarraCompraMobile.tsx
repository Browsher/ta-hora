"use client"

import { useEffect, useState } from "react"
import { BotaoAdicionar } from "./BotaoAdicionar"

// Barra de compra fixa no rodapé do MOBILE da PDP.
//
// O problema que resolve: o sticky da coluna de compra é
// `@media (min-width: 768px) and (min-height: 760px)` (globals.css) — abaixo de
// 768px o grid colapsa e NÃO SOBRA NADA. Como a página passou a levar
// ApresentacaoProduto + FichaTecnica + RecomendadosRelacionados depois do
// <article>, o cliente rola ~2.000px sem nenhum caminho de compra à vista.
//
// 🔴 DIVISÃO DE RESPONSABILIDADE — não inverter:
//   CSS  decide se a barra EXISTE     → `@media (max-width: 767.98px)`
//   JS   decide se ela está VISÍVEL   → IntersectionObserver
// O motivo está no bloco do carrossel em globals.css: `useIsMobile` devolve
// `false` no primeiro render, então decidir mobile/desktop em JS faria o HTML do
// servidor sair sempre no ramo de desktop e só corrigir depois da hidratação.
// Por isso a barra vai no HTML SEMPRE e é o CSS que a revela.
//
// Por que não reusa o <PriceTag>: o menor tamanho dele é `medio`, com o inteiro
// em clamp(28px, 4vw, 48px) — três vezes o que cabe numa barra de 64px. Reusar
// exigiria uma variante "mini" nova, que mudaria um componente usado na home, no
// catálogo e na própria PDP para servir a um caso só. O preço aqui é marcação
// própria e deliberadamente burra: dois <span>, zero lógica. A lógica que
// importa — parcelamento e formatação — continua no servidor, e chega pronta.

interface BarraCompraMobileProps {
  handle: string
  /** Já formatado ("179,90") — mesma origem do PriceTag da página. */
  preco:    string
  moeda:    string
  /** Texto do parcelamento, ou undefined quando não há (produto abaixo do piso). */
  parcela?: string
  disponivel: boolean
  /**
   * `id` do bloco observado — na prática a `.produto-info`, que contém o botão
   * original. A barra aparece quando ele sai da tela por cima e some quando
   * volta: assim ela nunca compete com o CTA principal na dobra.
   */
  alvoId: string
}

export function BarraCompraMobile({
  handle, preco, moeda, parcela, disponivel, alvoId,
}: BarraCompraMobileProps) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const alvo = document.getElementById(alvoId)
    // Alvo ausente ou navegador sem IntersectionObserver → a barra nunca aparece
    // e a página se comporta exatamente como antes desta feature. Degradar para
    // "sempre visível" seria pior: barra fixa colada no CTA original.
    if (!alvo || typeof IntersectionObserver === "undefined") return

    const obs = new IntersectionObserver(
      ([entrada]) => {
        // `boundingClientRect.top < 0` distingue "saiu por CIMA" de "ainda não
        // chegou". Sem essa checagem a barra apareceria no carregamento de uma
        // página aberta com âncora abaixo do bloco de compra.
        setVisivel(!entrada.isIntersecting && entrada.boundingClientRect.top < 0)
      },
      // Sem rootMargin: a troca acontece quando o último pixel do bloco de compra
      // cruza o topo. Um threshold maior faria a barra piscar durante o scroll
      // fino em cima do limiar.
      { threshold: 0 },
    )
    obs.observe(alvo)
    return () => obs.disconnect()
  }, [alvoId])

  return (
    <div
      className="barra-compra-mobile"
      data-visivel={visivel}
      // Escondida ela sai da árvore de acessibilidade E do tab order (o CSS usa
      // `visibility: hidden`, que já tira do foco) — senão o leitor de tela
      // anunciaria dois botões "adicionar" para o mesmo produto.
      aria-hidden={!visivel}
    >
      <div className="barra-compra-mobile__preco">
        <span className="barra-compra-mobile__valor">
          {moeda} {preco}
        </span>
        {parcela && (
          <span className="barra-compra-mobile__parcela">ou {parcela}</span>
        )}
      </div>

      {/* Mesmo componente do botão da página: o estado `carregando`, o
          `aria-busy` e a ordem `abrir()`-antes-do-`await` vivem num lugar só. */}
      <BotaoAdicionar
        handle={handle}
        disponivel={disponivel}
        label="Adicionar"
        compacto
      />
    </div>
  )
}
