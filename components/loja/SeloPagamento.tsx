import { Lock } from "lucide-react"

// Selo de confiança do rodapé do drawer.
//
// Copy FIXA no código — exceção consciente ao princípio "mudar conteúdo = editar
// JSON" do product.md (Req 6.5): o drawer não é uma seção de layout, não existe
// em `layouts/*.json` e não passa pelo `PreviewContent`.
//
// "via Mercado Pago" é afirmação verificada: o operador confirmou que o Mercado
// Pago é o ÚNICO meio de pagamento ativo no checkout. Se outro gateway entrar na
// loja, esta copy passa a mentir por omissão e precisa ser revista (Req 6.2).
//
// A copy é INFORMATIVA e não sugere que o pagamento ocorre no site — ele ocorre
// no checkout hospedado da Shopify (Req 6.4).
//
// Cores só via `--cor-*`, herdadas do wrapper de paleta do drawer (Req 6.3).

export function SeloPagamento() {
  return (
    <div
      style={{
        display:    "flex",
        alignItems: "center",
        gap:        8,
        color:      "var(--cor-texto-secundario)",
        fontSize:   12,
      }}
    >
      <Lock size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span>Pagamento seguro via Mercado Pago</span>
    </div>
  )
}
