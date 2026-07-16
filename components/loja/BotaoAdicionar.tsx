"use client"

import { tokens } from "@/lib/tokens"
import { useCarrinho } from "./CarrinhoProvider"

// Substitui o `AddToCartPlaceholder` inerte. Recebe o `handle` da rota — NUNCA
// um `merchandiseId`: o servidor resolve a variante (decisão de segurança), o
// cliente não pode injetar a variante de outro produto.

export function BotaoAdicionar({ handle }: { handle: string }) {
  const ctx = useCarrinho()

  // Fora do provider (Navbar/rota montada isolada) → botão inerte, nunca crash.
  if (!ctx) return null

  const { adicionar, abrir, carregando } = ctx

  async function aoClicar() {
    // ⚠️ A ORDEM IMPORTA: `abrir()` ANTES do `await`.
    // A NFR exige drawer em <100ms, sem esperar a rede — o drawer mostra
    // carregando e reconcilia quando a resposta chega. Inverter (await antes de
    // abrir) faria o cliente clicar e encarar uma página parada até a Shopify
    // responder.
    //
    // E é `abrir()` do PROVIDER, não estado local: o drawer é montado no root
    // layout, então só o contexto o alcança.
    abrir()
    await adicionar(handle)
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={carregando}
      aria-busy={carregando}
      style={{
        width:        "100%",
        background:   "var(--cor-destaque)",
        color:        "var(--cor-destaque-texto)",
        border:       "none",
        borderRadius: tokens.radius.btn,
        padding:      "14px 32px",
        fontSize:     14,
        fontWeight:   600,
        cursor:       carregando ? "wait" : "pointer",
        opacity:      carregando ? 0.7 : 1,
        transition:   "opacity .15s",
      }}
    >
      {carregando ? "Adicionando…" : "Adicionar ao carrinho"}
    </button>
  )
}
