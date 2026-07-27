import { Fragment } from "react"
import { Heading } from "@/components/ui/Heading"
import { SPEC_METAFIELDS } from "@/lib/shopify/specs"
import { ICONES_SPEC, ICONE_FALLBACK } from "./fichaTecnicaIcones"
import type { Spec } from "@/lib/shopify/types"

// Seção "Especificações técnicas" da página de produto (feature ficha-tecnica).
//
// Server Component (SEM "use client"), no padrão de `RecomendadosRelacionados`:
// monta tudo no servidor, HTML sai completo no ISR (indexável). Os ícones lucide
// são SVG server-rendered. Nenhum estado/efeito/hook.
//
// Dois níveis (Req 1/2/3): cards com ícone (specs principais) + lista "Mais
// detalhes" (secundárias). ORDEM e TIER vêm do mapa `SPEC_METAFIELDS` (fonte
// única); os VALORES vêm de `specs` (produto.specs); o ícone vem de `ICONES_SPEC`.
export function FichaTecnica({ specs }: { specs: Spec[] }) {
  // Nenhuma spec preenchida → a seção não aparece (Req 4.2), igual a
  // `RecomendadosRelacionados`. `normalizeProduct` já omite ausentes, então `specs`
  // só traz as presentes.
  if (specs.length === 0) return null

  const valor = new Map(specs.map((s) => [s.key, s.value]))
  // Percorre o MAPA (ordem/tier canônicos) e mantém só as specs com valor presente.
  const presentes = SPEC_METAFIELDS.filter((def) => valor.has(def.key))
  const principais = presentes.filter((def) => def.tier === "principal")
  const secundarias = presentes.filter((def) => def.tier === "secundaria")

  // Defensivo: `presentes` só contém keys do mapa, então isto praticamente não
  // ocorre após `specs.length > 0` — protege contra `key` órfã/stale.
  if (principais.length === 0 && secundarias.length === 0) return null

  return (
    <section className="ficha-tecnica" aria-label="Especificações técnicas">
      <Heading
        as="h2"
        size="grande"
        text="Especificações técnicas"
        color="var(--cor-texto)"
        accentColor="var(--cor-destaque)"
      />

      {/* Grade de cards — só quando há principais (Req 2.6: sem grade órfã). */}
      {principais.length > 0 && (
        <div className="ficha-cards">
          {principais.map((def) => {
            const Icone = ICONES_SPEC[def.key] ?? ICONE_FALLBACK
            return (
              <div key={def.key} className="ficha-card">
                {/* Ícone decorativo: o rótulo textual carrega o significado. */}
                <Icone className="ficha-card__icone" size={28} aria-hidden />
                <span className="ficha-card__label">{def.label}</span>
                <span className="ficha-card__valor">{valor.get(def.key)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista "Mais detalhes" — só quando há secundárias (Req 3.5: sem título órfão). */}
      {secundarias.length > 0 && (
        <div className="ficha-detalhes">
          <span className="ficha-detalhes__titulo">Mais detalhes</span>
          <dl className="ficha-detalhes__lista">
            {secundarias.map((def) => (
              <Fragment key={def.key}>
                <dt>{def.label}</dt>
                <dd>{valor.get(def.key)}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
