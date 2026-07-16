"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { X } from "lucide-react"
import { CtaButton } from "@/components/ui/CtaButton"
import { paletaWrapperStyle, type Paleta } from "@/lib/paleta"
import { tokens } from "@/lib/tokens"
import { useCarrinho } from "./CarrinhoProvider"
import { CarrinhoLinha } from "./CarrinhoLinha"
import { CupomForm } from "./CupomForm"
import { SeloPagamento } from "./SeloPagamento"

// Painel lateral do carrinho. Montado UMA vez, no `app/layout.tsx`.
//
// Duas armadilhas verificadas moram aqui — as duas geram bug VISÍVEL que o build
// NÃO pega:
//
//  1. `MotionConfig reducedMotion="user"` PRÓPRIO. O do `PreviewContent`
//     (PreviewContent.tsx:112) é o ÚNICO do projeto e NÃO alcança o root layout.
//     Sem este, a animação ignora `prefers-reduced-motion`.
//
//  2. `paletaWrapperStyle` PRÓPRIO. Só existem dois wrappers de paleta
//     (PreviewContent e StoreShell); montado no root layout, o drawer fica fora
//     dos dois e herdaria o `:root` de FÁBRICA — sairia dourado (#D4A017) num
//     site laranja (#ff8903).
//
// A `paleta` vem por PROP, resolvida no `app/layout.tsx` (Server Component).
// Importar `layouts/_home.json` aqui jogaria 9 KB de conteúdo da Home no bundle
// de TODA rota, inclusive /catalogo. A paleta são 9 strings.

const LARGURA = 420

export function CarrinhoDrawer({ paleta }: { paleta: Paleta | null }) {
  const ctx = useCarrinho()
  const painel = useRef<HTMLDivElement>(null)

  const aberto = ctx?.aberto ?? false
  const fechar = ctx?.fechar

  // Esc fecha (Req 3.9) + trava o scroll do fundo enquanto aberto.
  useEffect(() => {
    if (!aberto || !fechar) return

    const aoTeclar = (e: KeyboardEvent) => { if (e.key === "Escape") fechar() }
    window.addEventListener("keydown", aoTeclar)

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = "hidden"

    // Foco entra no painel: sem isso o teclado continua no fundo e o `Esc` do
    // leitor de tela não tem contexto.
    painel.current?.focus()

    return () => {
      window.removeEventListener("keydown", aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [aberto, fechar])

  if (!ctx) return null

  const { carrinho, aviso, erro, carregando } = ctx
  const linhas  = carrinho?.linhas ?? []
  const vazio   = linhas.length === 0
  const temIndisponivel = linhas.some((l) => !l.disponivel)

  return (
    // reducedMotion="user": o Framer Motion DESTE subtree respeita
    // prefers-reduced-motion (WCAG 2.3.3). Ver armadilha 1 no topo.
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {aberto && (
          <>
            {/* Overlay — clique fora fecha (Req 3.9) */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={fechar}
              aria-hidden="true"
              style={{
                position: "fixed", inset: 0, zIndex: 2000,
                background: "rgba(0,0,0,.6)", backdropFilter: "blur(2px)",
              }}
            />

            <motion.div
              key="painel"
              ref={painel}
              role="dialog"
              aria-modal="true"
              aria-label="Carrinho de compras"
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 2001,
                width: "min(100vw, " + LARGURA + "px)",
                display: "flex", flexDirection: "column",
                borderLeft: "1px solid color-mix(in srgb, var(--cor-texto) 12%, transparent)",
                outline: "none",
                // Wrapper de paleta — ver armadilha 2 no topo.
                ...paletaWrapperStyle(paleta),
              }}
            >
              {/* ─── Cabeçalho ─── */}
              <header
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 20px",
                  borderBottom: "1px solid color-mix(in srgb, var(--cor-texto) 12%, transparent)",
                  flexShrink: 0,
                }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--cor-texto)", margin: 0 }}>
                  Seu carrinho
                </h2>
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar carrinho"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, background: "none", border: "none",
                    color: "var(--cor-texto)", cursor: "pointer",
                  }}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </header>

              {/* ─── Corpo ─── */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
                {/*
                  `aviso` e `erro` são a voz do servidor. O aviso é o que salva o
                  estoque silencioso: a Shopify limita a quantidade com
                  `userErrors` VAZIO e sinaliza só em `warnings`. Sem exibir isto,
                  o cliente clica + e o número trava sem explicação.
                */}
                {aviso && (
                  <p role="status" style={{
                    margin: "14px 0 0", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.45,
                    borderRadius: tokens.radius.sm, color: "var(--cor-texto)",
                    background: "color-mix(in srgb, var(--cor-destaque) 14%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--cor-destaque) 32%, transparent)",
                  }}>
                    {aviso}
                  </p>
                )}

                {erro && (
                  <p role="alert" style={{
                    margin: "14px 0 0", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.45,
                    borderRadius: tokens.radius.sm, color: "var(--cor-texto)",
                    background: "color-mix(in srgb, #ff4d4d 14%, transparent)",
                    border: "1px solid color-mix(in srgb, #ff4d4d 34%, transparent)",
                  }}>
                    {erro}
                  </p>
                )}

                {vazio ? (
                  <p style={{
                    padding: "56px 0", textAlign: "center", fontSize: 14,
                    color: "var(--cor-texto-secundario)",
                  }}>
                    {carregando ? "Carregando…" : "Seu carrinho está vazio"}
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {linhas.map((linha) => (
                      <CarrinhoLinha key={linha.id} linha={linha} />
                    ))}
                  </ul>
                )}
              </div>

              {/* ─── Rodapé — só existe com itens (Req 3.8) ─── */}
              {!vazio && carrinho && (
                <footer
                  style={{
                    flexShrink: 0, padding: "16px 20px 20px",
                    borderTop: "1px solid color-mix(in srgb, var(--cor-texto) 12%, transparent)",
                    display: "flex", flexDirection: "column", gap: 14,
                    background: "var(--cor-fundo)",
                  }}
                >
                  <CupomForm />

                  {/* Totais — vêm PRONTOS da Shopify. Nada é somado aqui. */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--cor-texto-secundario)" }}>
                      <span>Subtotal</span>
                      <span>{carrinho.subtotal.currency} {carrinho.subtotal.price}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--cor-texto)" }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "var(--cor-texto)" }}>
                        {carrinho.total.currency} {carrinho.total.price}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--cor-texto-secundario)" }}>
                      Frete calculado no checkout.
                    </span>
                  </div>

                  {/* Alerta antes do checkout (Req 7.6): sem isto o cliente só
                      descobre o item esgotado LÁ, depois de preencher tudo. */}
                  {temIndisponivel && (
                    <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--cor-destaque)" }}>
                      Um item do seu carrinho ficou indisponível. Remova-o para concluir a compra.
                    </p>
                  )}

                  <SeloPagamento />

                  {/*
                    Link DIRETO para o `checkoutUrl` que a Shopify devolveu — a
                    URL nunca é montada nem adivinhada (Req 7.2/7.3). Sem
                    `checkoutUrl` não renderiza link algum: melhor não ter botão
                    do que levar a uma URL inventada (Req 7.5).
                  */}
                  {carrinho.checkoutUrl ? (
                    <CtaButton
                      href={carrinho.checkoutUrl}
                      label="Finalizar compra"
                      shape="quadrado"
                      fill="solido"
                      accentColor="var(--cor-destaque)"
                      className="text-center"
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p role="alert" style={{ margin: 0, fontSize: 12.5, color: "var(--cor-texto)" }}>
                      Não foi possível iniciar o checkout. Tente novamente em instantes.
                    </p>
                  )}
                </footer>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}
