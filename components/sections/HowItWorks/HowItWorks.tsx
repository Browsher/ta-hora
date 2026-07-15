"use client"

import React from "react"
import { motion, type MotionProps } from "framer-motion"
import { itemVariants } from "@/lib/animations"
import { buildSectionContainerProps, buildSectionItemProps, buildCardItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { TiltCard } from "@/components/ui/TiltCard"
import { CtaButton } from "@/components/ui/CtaButton"
import type { SectionEffects } from "@/lib/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const NUMBER_SIZE = 44  // diameter of step number circle

// ─── Content ─────────────────────────────────────────────────────────────────

interface HowItWorksContent {
  sectionLabel?:     string
  headline?:         string
  sectionDesc?:      string
  step1Title?:       string
  step1Description?: string
  step2Title?:       string
  step2Description?: string
  step3Title?:       string
  step3Description?: string
  step4Title?:       string
  step4Description?: string
  step5Title?:       string
  step5Description?: string
  step6Title?:       string
  step6Description?: string
  ctaLabel?:         string
  ctaHref?:          string
}

const DEFAULT_CONTENT: Required<HowItWorksContent> = {
  sectionLabel:     "Como funciona",
  headline:         "%%Três passos%% simples para o resultado",
  sectionDesc:      "Um processo claro e eficiente para você começar agora mesmo.",
  step1Title:       "Cadastre-se",
  step1Description: "Crie sua conta gratuitamente em menos de dois minutos.",
  step2Title:       "Configure",
  step2Description: "Personalize de acordo com as suas necessidades específicas.",
  step3Title:       "Comece a usar",
  step3Description: "Aproveite todos os recursos desde o primeiro acesso.",
  step4Title:       "Escale",
  step4Description: "Cresça com confiança usando ferramentas avançadas.",
  step5Title:       "Otimize",
  step5Description: "Analise resultados e melhore continuamente.",
  step6Title:       "Celebre",
  step6Description: "Alcance seus objetivos e comemore cada conquista.",
  ctaLabel:         "Começar agora",
  ctaHref:          "",
}

// ─── Number badge ─────────────────────────────────────────────────────────────
//
// filled  → circle with accentColor fill
// outline → circle border only
// ghost   → large zero-padded number, no circle (decorative)

function NumberBadge({ num, accentColor, numberStyle }: {
  num:         number
  accentColor: string
  numberStyle: string
}) {
  const textColor = "var(--cor-destaque-texto)"
  const base: React.CSSProperties = {
    width:          NUMBER_SIZE,
    height:         NUMBER_SIZE,
    borderRadius:   "50%",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontSize:       16,
    fontWeight:     800,
    flexShrink:     0,
    lineHeight:     1,
  }

  if (numberStyle === "outline") {
    return (
      <div style={{ ...base, border: `2px solid ${accentColor}`, color: accentColor }}>
        {num}
      </div>
    )
  }
  if (numberStyle === "ghost") {
    return (
      <div style={{ ...base, color: accentColor, fontSize: 22, fontWeight: 900 }}>
        {String(num).padStart(2, "0")}
      </div>
    )
  }
  // filled (default)
  return (
    <div style={{ ...base, background: accentColor, color: textColor }}>
      {num}
    </div>
  )
}

// ─── Sub-function props ───────────────────────────────────────────────────────

interface SubProps {
  c:              Required<HowItWorksContent>
  se:             SectionEffects | null
  containerProps: MotionProps
  itemProps:      MotionProps
  accentColor:    string
  steps:          { title: string; description: string }[]
  showLine:       boolean
  cardBackground: boolean
  numberStyle:    string
  alternating:    boolean
  ctaVisible:     boolean
  isMobile:       boolean
  // GRADE: passo herda o stagger coordenado do container da seção (itemVariants).
  stepItemProps: MotionProps
  // LISTA: passo com whileInView PRÓPRIO (scroll-reveal) — anima ao entrar na
  // viewport, independente do container. Fora de "subir": {} → estático.
  stepScrollRevealProps: MotionProps
}

// ─── Grade ────────────────────────────────────────────────────────────────────
// Horizontal layout: cards side by side, optional connector at badge center height.
// On mobile: stacks vertically, connector hidden.

function HowItWorksGrade({
  c, se, containerProps, itemProps,
  accentColor, steps, showLine, cardBackground, numberStyle, ctaVisible, isMobile,
  stepItemProps,
}: SubProps) {
  return (
    <section id="howitworks" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 48 }}>

        {/* Header — centered */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <SectionLabel {...itemProps} text={c.sectionLabel} accentColor={accentColor} />
          <Heading {...itemProps} as="h2" size="medio" text={c.headline} accentColor={accentColor} color="var(--cor-texto)" />
          <Text
            {...itemProps}
            text={c.sectionDesc}
            size="grande"
            color="var(--cor-texto-secundario)"
            align="centro"
            style={{ maxWidth: 560 }}
          />
        </div>

        {/* Steps row — <div> comum (SEM container aninhado): cada card é um
            item de stagger que HERDA direto do container externo ativo da seção
            (como o cabeçalho / o Features). Um wrapper motion aninhado só herda
            "visible" e não dispara staggerChildren próprio → animava tudo junto. */}
        <div
          style={{
            display:       "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems:    "flex-start",
            gap:           isMobile ? 32 : (showLine ? 0 : 24),
          }}
        >
          {steps.map((step, i) => (
            <React.Fragment key={i}>

              {/* Step card — item da cascata de passos */}
              <motion.div {...stepItemProps} style={{
                flex:          1,
                display:       "flex",
                flexDirection: "column",
                alignItems:    "center",
                gap:           16,
                textAlign:     "center",
                minWidth:      0,
              }}>
                <NumberBadge num={i + 1} accentColor={accentColor} numberStyle={numberStyle} />

                {cardBackground ? (
                  <TiltCard
                    entry={se?.cards?.entry}
                    hover={se?.cards?.hover}
                    accentColor={accentColor}
                    style={{
                      width:         "100%",
                      background:    "var(--cor-card)",
                      border:        `1px solid color-mix(in srgb, ${accentColor} 12.55%, transparent)`,
                      borderRadius:  16,
                      padding:       "20px 24px",
                      display:       "flex",
                      flexDirection: "column",
                      gap:           8,
                    }}
                  >
                    <Heading as="h3" size="pequeno" text={step.title} accentColor={accentColor} color="var(--cor-texto)" />
                    <Text text={step.description} size="medio" color="var(--cor-texto-secundario)" />
                  </TiltCard>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Heading as="h3" size="pequeno" text={step.title} accentColor={accentColor} color="var(--cor-texto)" />
                    <Text text={step.description} size="medio" color="var(--cor-texto-secundario)" />
                  </div>
                )}
              </motion.div>

              {/* Horizontal connector between cards — aligned to badge center */}
              {showLine && !isMobile && i < steps.length - 1 && (
                <div style={{
                  width:      40,
                  paddingTop: NUMBER_SIZE / 2,
                  flexShrink: 0,
                  display:    "flex",
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width:        "100%",
                    height:       2,
                    marginTop:    -1,
                    background:   `color-mix(in srgb, ${accentColor} 20.78%, transparent)`,
                    borderRadius: 1,
                  }} />
                </div>
              )}

            </React.Fragment>
          ))}
        </div>

        {/* CTA — centralizado (coerente com o header centralizado da grade) */}
        {ctaVisible && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CtaButton
              {...itemProps}
              label={c.ctaLabel}
              href={c.ctaHref || undefined}
              hover={se?.button?.hover}
              accentColor={accentColor}
            />
          </div>
        )}

      </motion.div>
      </div>
    </section>
  )
}

// ─── Lista ────────────────────────────────────────────────────────────────────
// Vertical timeline layout. The number column is a flex column: badge on top,
// line connector below (extends through paddingBottom gap to the next badge).
// Connector disabled when alternating=true because numbers swap sides per row.

function HowItWorksList({
  c, se, containerProps, itemProps,
  accentColor, steps, showLine, cardBackground, numberStyle, alternating, ctaVisible, isMobile,
  stepScrollRevealProps,
}: SubProps) {
  // Vertical connector only makes sense when numbers stay on one side
  const showVerticalLine = showLine && !alternating

  return (
    <section id="howitworks" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 48 }}>

        {/* Header — left aligned */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SectionLabel {...itemProps} text={c.sectionLabel} accentColor={accentColor} />
          <Heading {...itemProps} as="h2" size="medio" text={c.headline} accentColor={accentColor} color="var(--cor-texto)" />
          <Text
            {...itemProps}
            text={c.sectionDesc}
            size="grande"
            color="var(--cor-texto-secundario)"
            style={{ maxWidth: 560 }}
          />
        </div>

        {/* Steps list — <div> comum (SEM container aninhado): cada passo é um
            item de stagger que HERDA direto do container externo ativo da seção
            (como o cabeçalho / o Features). Um wrapper motion aninhado só herda
            "visible" e não dispara staggerChildren próprio → animava tudo junto. */}
        <div
          style={{ display: "flex", flexDirection: "column" }}
        >
          {steps.map((step, i) => {
            const isLast     = i === steps.length - 1
            const isReversed = alternating && !isMobile && i % 2 === 1

            return (
              <motion.div
                key={i}
                {...stepScrollRevealProps}
                // Micro-stagger: soma um delay pequeno por índice ao whileInView
                // próprio do passo. fadeUp.visible.transition define duration/ease
                // (sem delay); o `delay` daqui compõe, não sobrescreve. Respiro
                // quando vários passos entram juntos; inerte quando estático ({}).
                transition={{ delay: i * 0.06 }}
                style={{
                  display:       "flex",
                  flexDirection: isReversed ? "row-reverse" : "row",
                  alignItems:    "flex-start",
                  gap:           24,
                  paddingBottom: isLast ? 0 : 24,
                }}
              >
                {/* Number column — flex column so the line can extend below the badge */}
                <div style={{
                  display:       "flex",
                  flexDirection: "column",
                  alignItems:    "center",
                  flexShrink:    0,
                  width:         NUMBER_SIZE,
                  alignSelf:     "stretch",
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <NumberBadge num={i + 1} accentColor={accentColor} numberStyle={numberStyle} />
                  </div>
                  {showVerticalLine && !isLast && (
                    <div style={{
                      flex:         1,
                      width:        2,
                      background:   `color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
                      marginTop:    8,
                      borderRadius: 1,
                      minHeight:    16,
                    }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  {cardBackground ? (
                    <TiltCard
                      entry={se?.cards?.entry}
                      hover={se?.cards?.hover}
                      accentColor={accentColor}
                      style={{
                        background:    "var(--cor-card)",
                        border:        `1px solid color-mix(in srgb, ${accentColor} 12.55%, transparent)`,
                        borderRadius:  16,
                        padding:       "20px 24px",
                        display:       "flex",
                        flexDirection: "column",
                        gap:           8,
                      }}
                    >
                      <Heading as="h3" size="pequeno" text={step.title} accentColor={accentColor} color="var(--cor-texto)" />
                      <Text text={step.description} size="medio" color="var(--cor-texto-secundario)" />
                    </TiltCard>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10 }}>
                      <Heading as="h3" size="pequeno" text={step.title} accentColor={accentColor} color="var(--cor-texto)" />
                      <Text text={step.description} size="medio" color="var(--cor-texto-secundario)" />
                    </div>
                  )}
                </div>

              </motion.div>
            )
          })}
        </div>

        {/* CTA — alinhado ao início/esquerda (coerente com o header à esquerda da lista) */}
        {ctaVisible && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <CtaButton
              {...itemProps}
              label={c.ctaLabel}
              href={c.ctaHref || undefined}
              hover={se?.button?.hover}
              accentColor={accentColor}
            />
          </div>
        )}

      </motion.div>
      </div>
    </section>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface HowItWorksProps {
  type?:        "grade" | "lista"
  accentColor?: string
  content?:     HowItWorksContent
  [key: string]: unknown
}

export function HowItWorks({
  type        = "grade",
  accentColor = "#D4A017",
  content     = {},
}: HowItWorksProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile = useIsMobile()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  // Passos em cascata: só quando a entrada de seção está ativa ("subir"). Cada
  // passo é um item (itemVariants) que HERDA o stagger direto do container
  // externo ATIVO da seção — SEM wrapper aninhado (um sub-container que só herda
  // não dispara staggerChildren próprio; animava tudo junto). Padrão do Features
  // e do cabeçalho. Fora de "subir" (nenhum/fade): {} → comportamento atual
  // intacto. A Armadilha #10 (1ª seção zera sectionEntry) desliga isto sozinho.
  const staggerSteps   = se?.sectionEntry === "subir"
  // GRADE: passos herdam a cascata coordenada da seção (itemVariants).
  const stepItemProps: MotionProps = staggerSteps ? { variants: itemVariants } : {}
  // LISTA: cada passo tem gatilho PRÓPRIO (scroll-reveal) — anima quando ELE
  // entra na viewport, independente do container da seção. Reusa o mecanismo
  // scroll-reveal do projeto (buildCardItemProps). Fora de "subir" → {} (estático;
  // Armadilha #10 zera sectionEntry na 1ª seção → passos estáticos).
  const stepScrollRevealProps: MotionProps = staggerSteps
    ? buildCardItemProps("scroll-reveal", mode)
    : {}

  // Variation values — stored in section.content by Builder TypeTab/VariationTab
  const cv             = content as Record<string, unknown>
  const stepCount      = (cv.stepCount      as number  | undefined) ?? 3
  const showLine       = (cv.showLine       as boolean | undefined) ?? true
  const cardBackground = (cv.cardBackground as boolean | undefined) ?? true
  const numberStyle    = (cv.numberStyle    as string  | undefined) ?? "filled"
  const alternating    = (cv.alternating    as boolean | undefined) ?? false
  const ctaVisible     = (cv.ctaVisible     as boolean | undefined) ?? false

  // Build steps from typed fields to avoid dynamic key access
  const ALL_STEPS = [
    { title: c.step1Title, description: c.step1Description },
    { title: c.step2Title, description: c.step2Description },
    { title: c.step3Title, description: c.step3Description },
    { title: c.step4Title, description: c.step4Description },
    { title: c.step5Title, description: c.step5Description },
    { title: c.step6Title, description: c.step6Description },
  ]
  const steps = ALL_STEPS.slice(0, Math.max(1, Math.min(6, stepCount)))

  const subProps: SubProps = {
    c, se, containerProps, itemProps,
    accentColor, steps, showLine, cardBackground, numberStyle, alternating, ctaVisible, isMobile,
    stepItemProps, stepScrollRevealProps,
  }

  return type === "lista"
    ? <HowItWorksList {...subProps} />
    : <HowItWorksGrade {...subProps} />
}
