import { Fragment } from "react"
import type { Spec } from "@/lib/shopify/types"

// Especificações técnicas como pares rótulo/valor (tema --cor-*).
// Lista vazia → não renderiza nada (Req 3.2: specs ausentes são omitidas).
export function ProductSpecs({ specs }: { specs: Spec[] }) {
  if (specs.length === 0) return null

  return (
    <dl
      style={{
        display:             "grid",
        gridTemplateColumns: "auto 1fr",
        gap:                 "10px 20px",
        margin:              0,
      }}
    >
      {specs.map((s) => (
        <Fragment key={s.label}>
          <dt style={{ color: "var(--cor-texto-secundario)", fontWeight: 600 }}>{s.label}</dt>
          <dd style={{ color: "var(--cor-texto)", margin: 0 }}>{s.value}</dd>
        </Fragment>
      ))}
    </dl>
  )
}
