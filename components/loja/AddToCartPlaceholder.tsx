"use client"

import { tokens } from "@/lib/tokens"

// Placeholder INERTE do futuro "adicionar ao carrinho" (Req 3.5): visualmente
// presente (estilo do CtaButton sólido) mas sem handler, não navega, não envia
// dados. `disabled` + `aria-disabled`.
// TODO: carrinho — implementar na spec seguinte (carrinho/checkout).
export function AddToCartPlaceholder() {
  return (
    <button
      type="button"
      disabled
      aria-disabled
      style={{
        width:        "100%",
        background:   "var(--cor-destaque)",
        color:        "var(--cor-destaque-texto)",
        border:       "none",
        borderRadius: tokens.radius.btn,
        padding:      "14px 32px",
        fontSize:     14,
        fontWeight:   600,
        cursor:       "not-allowed",
        opacity:      0.85,
      }}
    >
      Adicionar ao carrinho (em breve)
    </button>
  )
}
