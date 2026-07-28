"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { HighlightBadge } from "@/components/ui/HighlightBadge"
import { tokens } from "@/lib/tokens"
import { useCarrinho } from "./CarrinhoProvider"

// Campo de cupom. A Shopify VALIDA — o site não tem lista nem regra de cupom
// (Req 5.6). Aqui só há repasse.

export function CupomForm({ accentColor = "var(--cor-destaque)" }: { accentColor?: string }) {
  const ctx = useCarrinho()
  const [codigo, setCodigo] = useState("")

  if (!ctx) return null
  const { carrinho, carregando, aplicarCodigo, removerCodigo } = ctx

  // Só cupons `applicable: true` chegam aqui — a normalização já filtrou. Um
  // código rejeitado NUNCA aparece como aplicado (Req 5.4); ele vira `aviso`.
  const cupons = carrinho?.cupons ?? []

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const limpo = codigo.trim()
    if (!limpo || carregando) return
    await aplicarCodigo(limpo)
    setCodigo("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <form onSubmit={enviar} style={{ display: "flex", gap: 8 }}>
        <Input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Cupom de desconto"
          ariaLabel="Código do cupom de desconto"
          accentColor={accentColor}
          size="medio"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={carregando || !codigo.trim()}
          style={{
            background:   "none",
            // background:none → esta borda é o ÚNICO contorno do botão:
            // identificação de controle (WCAG 1.4.11), não decoração.
            border:       `1px solid var(--cor-destaque-texto-forte, ${accentColor})`,
            borderRadius: tokens.radius.btn,
            color:        `var(--cor-destaque-texto-forte, ${accentColor})`,
            padding:      "0 14px",
            fontSize:     13,
            fontWeight:   600,
            cursor:       carregando || !codigo.trim() ? "not-allowed" : "pointer",
            opacity:      carregando || !codigo.trim() ? 0.5 : 1,
            flexShrink:   0,
          }}
        >
          Aplicar
        </button>
      </form>

      {cupons.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {cupons.map((c) => (
            /*
              O botão de remover é elemento IRMÃO do badge, nunca filho:
              `HighlightBadge` aceita `{ text, accentColor, variant, showDot,
              dotColor, className }` e NÃO aceita `children` — ele renderiza só
              `text`. Passar filhos seria silenciosamente ignorado.
            */
            <span key={c.codigo} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <HighlightBadge text={c.codigo} accentColor={accentColor} variant="suave" />
              <button
                type="button"
                onClick={() => removerCodigo(c.codigo)}
                disabled={carregando}
                aria-label={`Remover o cupom ${c.codigo}`}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 20, height: 20, background: "none", border: "none",
                  color: "var(--cor-texto-secundario)", cursor: "pointer",
                  opacity: carregando ? 0.5 : 1,
                }}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
