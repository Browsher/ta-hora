"use client"

import { ShoppingCart } from "lucide-react"
import { useCarrinho } from "./CarrinhoProvider"

// Entrada do carrinho na navbar. Vive dentro da `Navbar`, que é seção dirigida
// por JSON e compartilhada entre a Home, o Sobre Nós e as rotas da loja.

export function IconeCarrinho({ accentColor = "var(--cor-destaque)" }: { accentColor?: string }) {
  const ctx = useCarrinho()

  // Fora do provider → nada. A `Navbar` precisa continuar montável isolada
  // (é o que o `StoreShell` e o `PreviewContent` já assumem). Sem esta guarda,
  // um `useContext` nulo derrubaria a Home inteira.
  if (!ctx) return null

  const total = ctx.carrinho?.totalItens ?? 0

  return (
    <button
      type="button"
      /* ⚠️ NÃO volte para `onClick={ctx.abrir}`. O React passaria o `MouseEvent`
         como primeiro argumento e a origem chegaria como um evento em vez de
         `"icone"` — o `view_cart` pararia de sair, calado. O tipo de `abrir` não
         tem default justamente para o `tsc` pegar isso. */
      onClick={() => ctx.abrir("icone")}
      aria-label={total > 0 ? `Abrir carrinho (${total} ${total === 1 ? "item" : "itens"})` : "Abrir carrinho"}
      style={{
        position:     "relative",
        display:      "inline-flex",
        alignItems:   "center",
        justifyContent: "center",
        width:        40,
        height:       40,
        background:   "none",
        border:       "none",
        color:        "var(--cor-texto)",
        cursor:       "pointer",
        flexShrink:   0,
      }}
    >
      <ShoppingCart size={20} aria-hidden="true" />

      {/*
        SEM badge quando vazio (Req 4.3 — nada de "0") e SEM badge quando o
        carrinho é `null`, que é TAMBÉM o estado de falha: Shopify fora, env
        ausente, ou a leitura falhou (Req 4.7). Mesmo visual, sem erro — é o que
        impede uma falha da Shopify de virar erro na Home estática.
      */}
      {total > 0 && (
        <span
          aria-hidden="true"
          style={{
            position:     "absolute",
            top:          2,
            right:        2,
            minWidth:     17,
            height:       17,
            padding:      "0 4px",
            borderRadius: 999,
            background:   accentColor,
            color:        "var(--cor-destaque-texto)",
            fontSize:     10,
            fontWeight:   700,
            lineHeight:   "17px",
            textAlign:    "center",
          }}
        >
          {total}
        </span>
      )}
    </button>
  )
}
