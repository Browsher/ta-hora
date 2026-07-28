"use client"

import { motion } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { ProductCardLink } from "@/components/loja/ProductCardLink"
// import type: só o TIPO (apagado na compilação) — a fronteira cliente/servidor
// fica intacta. Esta seção NUNCA busca nada: recebe a lista pronta do servidor.
import type { ProductCard } from "@/lib/shopify/types"

// Seção "Nossos Produtos" da Home, com produtos REAIS da coleção `destaques`
// (feature home-produtos-carrossel). Substitui o `ProductGrid` na entrada de
// índice 3 do `layouts/_home.json`.
//
// 🔴 NÃO é o `ProductGrid` e não o modifica: aquele é do template do Builder,
// compartilhado com o preview, e seu contrato de conteúdo são 8 produtos
// achatados em campos numerados de JSON (`product1Name`…) — um contrato que não
// aceita `ProductCard[]` da Shopify. Esta seção é nova e vive ao lado dele; o
// `ProductGrid` continua registrado no `componentMap` para os outros JSONs.
//
// Esta seção NÃO contém regra de negócio: a ordem é a ordem manual do lojista,
// já devolvida pela API, e os esgotados já morreram no servidor
// (`getVitrineHome`, em lib/shopify/products.ts).
export function VitrineHome({
  produtos,
  idSecao,
  sectionLabel,
  headline,
  accentColor = "var(--cor-destaque)",
}: {
  produtos:      ProductCard[]
  /** `section.id` do JSON. Reservado para o id da faixa do carrossel (Bloco 3):
   *  dois `VitrineHome` no mesmo layout não podem gerar ids duplicados. */
  idSecao:       string
  sectionLabel?: string
  headline?:     string
  accentColor?:  string
}) {
  const se   = useSectionEffects()
  // 🔴 O `mode` NÃO é opcional: o `ProductGrid` monta o `containerProps` com ele,
  // e omiti-lo constrói a animação de ENTRADA errada — a seção destoaria das
  // irmãs sem erro nenhum, só "achando" diferente.
  const mode = useEffectsMode()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  // Sem produtos → a seção INTEIRA some: sem título órfão, sem container vazio,
  // sem espaço reservado. Cobre os três caminhos de degradação de uma vez
  // (coleção nula, coleção vazia, tudo esgotado) — mesma disciplina do
  // `RecomendadosRelacionados`. Quem faz barulho nesses casos é o terminal
  // (`npm run verificar:vitrine`), não a Home.
  if (produtos.length === 0) return null

  return (
    // 🔴 Contêiner externo copiado do `ProductGridGrid` (padrão, não import — é
    // função interna dele): os MESMOS paddings, para o espaçamento da Home não
    // mudar ao trocar o componente. O `PreviewContent` já aplica
    // paddingTop/paddingBottom no wrapper de fora; este padding é ADICIONAL e
    // existe hoje. ⚠️ O padding horizontal é premissa da conta do carrossel
    // (Bloco 3) — mudá-lo invalida a largura de card calculada lá.
    <section id={`vitrine-${idSecao}`} style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Cabeçalho no padrão do `GridHeader`: rótulo + headline centralizados.
              O `Heading` preserva o realce `%%…%%` da headline do JSON. Cada um
              renderiza só se houver texto — nada de rótulo vazio ocupando espaço. */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            {sectionLabel && (
              <SectionLabel {...itemProps} text={sectionLabel} accentColor={accentColor} />
            )}
            {headline && (
              <Heading
                {...itemProps}
                as="h2"
                size="medio"
                text={headline}
                accentColor={accentColor}
                color="var(--cor-texto)"
              />
            )}
          </div>

          {/* O `itemProps` fica NESTE wrapper, não na grade: no Bloco 3 a grade
              vira `<CarrosselMobile>` (sem hooks, para poder ser servidor do
              outro lado), e um componente sem Framer Motion não aceitaria essas
              props de animação. */}
          <motion.div {...itemProps}>
            <div className="vitrine-home__grade">
              {produtos.map((produto) => (
                // `verDetalhes`: a chamada do card, opt-in — os recomendados não
                // a passam e seguem idênticos.
                <ProductCardLink key={produto.id} product={produto} verDetalhes />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
