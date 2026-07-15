"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, MotionConfig } from "framer-motion"
import { GlobalEffectsContext } from "@/lib/GlobalEffectsContext"
import { SectionEffectsContext } from "@/lib/SectionEffectsContext"
import { EffectsModeContext } from "@/lib/EffectsModeContext"
import { GlobalEffectsProvider } from "@/components/efeitos/GlobalEffectsProvider"
import { AnimatedBackground } from "@/components/efeitos/AnimatedBackground"
import { initGlobalEffects } from "@/lib/globalEffects"
import { contrastColor } from "@/lib/utils"
import { PALETA_ATIVA, paletaWrapperStyle } from "@/lib/paleta"
import { getPaleta } from "@/lib/estilos"
import type { Layout, SectionEffects } from "@/lib/types"

// Static imports only — Turbopack requires statically analyzable import paths.
// When a new component is approved, add its static import here manually.

import { BenefitsCard } from "@/components/sections/BenefitsCard"
import { CTAFinal } from "@/components/sections/CTAFinal"
import { Hero } from "@/components/sections/Hero"
import { FAQ } from "@/components/sections/FAQ"
import { Features } from "@/components/sections/Features"
import { Footer } from "@/components/sections/Footer"
import { Navbar } from "@/components/sections/Navbar"
import { HowItWorks } from "@/components/sections/HowItWorks"
import { ProductGrid } from "@/components/sections/ProductGrid"
import { Testimonials } from "@/components/sections/Testimonials"
import { Marketplaces } from "@/components/sections/Marketplaces"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentMap: Record<string, React.ComponentType<any>> = {
  Hero,
  BenefitsCard,
  CTAFinal,
  FAQ,
  Features,
  Footer,
  HowItWorks,
  Navbar,
  ProductGrid,
  Testimonials,
  Marketplaces,
}

// ─── Parallax wrapper ─────────────────────────────────────────────────────────

const PARALLAX_AMOUNTS: Record<string, number> = { sutil: 30, medio: 60, forte: 100, nenhum: 0 }

// Gate separado dos hooks: useScroll exige o ref anexado a um elemento montado.
// Com parallax="nenhum" o ramo antigo retornava children sem anexar o ref →
// exceção do FM "Target ref is defined but not hydrated" em toda seção do preview.
function ParallaxWrapper({ children, parallax }: { children: React.ReactNode; parallax: string }) {
  const amount = PARALLAX_AMOUNTS[parallax] ?? 0
  if (amount === 0) return <>{children}</>
  return <ParallaxSection amount={amount}>{children}</ParallaxSection>
}

function ParallaxSection({ children, amount }: { children: React.ReactNode; amount: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount])

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PreviewContentProps {
  layout: Layout
}

// Navbar e Footer têm entrada própria (navEntry/footerEntry) e não sofrem o
// problema — são ignorados ao achar a primeira seção "de conteúdo".
const OWN_ENTRY = new Set(["Navbar", "Footer"])

// Desativa as animações de ENTRADA (sectionEntry, cards.entry, image.entry),
// mantendo hovers e demais efeitos. Usado na primeira dobra: as animações de
// entrada do Framer Motion não disparam de forma confiável no primeiro paint
// após a hidratação SSR (nem `animate`, nem `whileInView` — armadilha #6), o
// que deixava o Hero invisível. Sem scroll para "acordar" o observer, a única
// forma robusta de garantir que a dobra apareça é renderizá-la estática.
// As seções seguintes mantêm a entrada — o scroll até elas dispara a animação.
function disableEntry(effects: SectionEffects | null): SectionEffects | null {
  if (!effects) return effects
  return {
    ...effects,
    sectionEntry: "nenhum",
    ...(effects.cards ? { cards: { ...effects.cards, entry: "nenhum" } } : {}),
    ...(effects.image ? { image: { ...effects.image, entry: "nenhum" } } : {}),
  }
}

export function PreviewContent({ layout }: PreviewContentProps) {
  const globalEffects = initGlobalEffects(layout)

  // Paleta CARIMBADA no layout (as 9 cores). Fallback: nome (compat) → fábrica.
  const paleta = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo) ?? PALETA_ATIVA

  // Primeira seção de conteúdo = a dobra visível no carregamento.
  const firstContentIdx = layout.sections.findIndex(
    (s) => !OWN_ENTRY.has(s.component),
  )

  return (
    // reducedMotion="user": todo o Framer Motion do site exportado respeita
    // prefers-reduced-motion de uma vez (WCAG 2.3.3 / 2.2.2)
    <MotionConfig reducedMotion="user">
    <EffectsModeContext.Provider value="preview">
    <GlobalEffectsContext.Provider value={globalEffects}>
      <GlobalEffectsProvider>
        {/* Wrapper de tema: uma paleta ativa sobrescreve as --cor-* SÓ aqui
            dentro (a página), nunca no :root (o builder). Ver lib/paleta.ts.
            minHeight 100vh: o wrapper é o "chão" da página e cobre a viewport
            inteira, então no estilo claro não sobra faixa escura abaixo do conteúdo. */}
        <div style={{ minHeight: "100vh", ...paletaWrapperStyle(paleta) }}>
        {layout.sections.map((section, index) => {
          const Component = componentMap[section.component]
          if (!Component) {
            console.warn("[preview] componente desconhecido:", section.component)
            return null
          }
          // Primeira dobra: entrada desativada (renderiza visível, sem race de
          // hidratação). Resto: entrada normal (anima ao rolar até a seção).
          const effects = index === firstContentIdx
            ? disableEntry(section.effects ?? null)
            : (section.effects ?? null)
          // Accent: sem personalização herda o tema (var); com hex do usuário, injeta
          // o par (--cor-destaque + --cor-destaque-texto via contrastColor) escopado à seção.
          const accentColor = section.content?.accentColor as string | undefined
          const resolvedAccent = accentColor ?? "var(--cor-destaque)"
          const accentVars = accentColor?.startsWith("#")
            ? ({ "--cor-destaque": accentColor, "--cor-destaque-texto": contrastColor(accentColor) } as React.CSSProperties)
            : undefined
          // Chrome da Arquitetura (Navbar/Footer) NUNCA entra no parallax: o
          // ParallaxWrapper aplica `transform` no ancestral, e um `transform`
          // no ancestral transforma o `position: fixed` da Navbar em `absolute`
          // (a viewport deixa de ser o containing block) — a barra fixa some.
          // Além disso, parallax numa barra fixa é conceitualmente errado (ela
          // não deve deslizar com o scroll). Uso independente do MESMO Set usado
          // p/ firstContentIdx acima — não colidem. As seções de conteúdo mantêm
          // o parallax exatamente como antes.
          const noParallax = OWN_ENTRY.has(section.component)
          return (
            <ParallaxWrapper
              key={section.id}
              parallax={noParallax ? "nenhum" : globalEffects.parallax}
            >
              <SectionEffectsContext.Provider value={effects}>
                <div
                  id={`section-${section.id}`}
                  className="relative"
                  style={{
                    paddingTop: section.paddingTop ?? 80,
                    paddingBottom: section.paddingBottom ?? 80,
                    ...(section.content?.sectionBg
                      ? { background: section.content.sectionBg as string }
                      : undefined),
                    ...accentVars,
                  }}
                >
                  <AnimatedBackground accentColor={resolvedAccent} />
                  <Component
                    type={section.type}
                    variation={section.variation}
                    effect={section.effect}
                    {...section.content}
                    content={section.content}
                    accentColor={resolvedAccent}
                  />
                </div>
              </SectionEffectsContext.Provider>
            </ParallaxWrapper>
          )
        })}
        </div>
      </GlobalEffectsProvider>
    </GlobalEffectsContext.Provider>
    </EffectsModeContext.Provider>
    </MotionConfig>
  )
}
