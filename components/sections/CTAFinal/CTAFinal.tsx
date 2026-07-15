"use client"

import { useState, useEffect } from "react"
import { motion, type MotionProps } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { CtaButton } from "@/components/ui/CtaButton"
import { ImageSlot } from "@/components/ui/ImageSlot"
import type { SectionEffects } from "@/lib/types"

// ─── Content ─────────────────────────────────────────────────────────────────

interface CTAFinalContent {
  sectionLabel?:  string
  headline?:      string
  subtitle?:      string
  ctaLabel?:      string
  ctaHref?:       string
  ctaSecLabel?:   string
  ctaSecHref?:    string
  timerEndDate?:  string   // ISO: "2026-07-15T23:59" — data real do prazo
  timerDeadline?: string   // texto de legenda acima dos dígitos
  imageSrc?:      string
  imageAlt?:      string
}

const DEFAULT_CONTENT: Required<CTAFinalContent> = {
  sectionLabel:  "Últimas vagas",
  headline:      "%%Comece agora%% e transforme seus resultados",
  subtitle:      "Mais de 10.000 pessoas já escolheram nossa solução. Não perca essa oportunidade.",
  ctaLabel:      "Garantir minha vaga",
  ctaHref:       "#",
  ctaSecLabel:   "Saber mais",
  ctaSecHref:    "#",
  timerEndDate:  "",
  timerDeadline: "A oferta encerra em breve",
  imageSrc:      "",
  imageAlt:      "",
}

// ─── Countdown helpers ────────────────────────────────────────────────────────

type HMS = { h: number; m: number; s: number }

// Retorna segundos restantes até a data ISO. Negativo = data inválida ou passada.
function getRemainingSeconds(endDateStr: string): number {
  if (!endDateStr) return -1
  const end = new Date(endDateStr).getTime()
  if (isNaN(end)) return -1
  return Math.floor((end - Date.now()) / 1000)
}

function secondsToHMS(total: number): HMS {
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

// ─── CountdownBlock ───────────────────────────────────────────────────────────
// Recebe timeLeft não-nulo — a decisão de mostrar/ocultar fica no consumer.

function CountdownBlock({
  timeLeft,
  accentColor,
  label,
  isMobile,
}: {
  timeLeft:    HMS
  accentColor: string
  label:       string
  isMobile:    boolean
}) {
  const pad       = (n: number) => String(n).padStart(2, "0")
  const digitSize = isMobile ? 40 : 56
  const units     = [
    { value: timeLeft.h, unit: "h" },
    { value: timeLeft.m, unit: "m" },
    { value: timeLeft.s, unit: "s" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {label && (
        <span style={{
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color:         "var(--cor-texto-fraco)",
        }}>
          {label}
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
        {units.map((item, i) => (
          <div key={item.unit} style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{
                fontSize:           digitSize,
                fontWeight:         800,
                color:              accentColor,
                lineHeight:         1,
                fontVariantNumeric: "tabular-nums",
                letterSpacing:      "-0.02em",
                fontFamily:         "inherit",
              }}>
                {pad(item.value)}
              </span>
              <span style={{
                fontSize:      10,
                fontWeight:    600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color:         "var(--cor-texto-fraco)",
              }}>
                {item.unit}
              </span>
            </div>
            {i < units.length - 1 && (
              <span style={{
                fontSize:      Math.round(digitSize * 0.6),
                fontWeight:    700,
                color:         accentColor,
                lineHeight:    1,
                paddingBottom: Math.round(digitSize * 0.28),
                opacity:       0.65,
              }}>
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sub-function props ───────────────────────────────────────────────────────

interface SubProps {
  c:              Required<CTAFinalContent>
  se:             SectionEffects | null
  containerProps: MotionProps
  itemProps:      MotionProps
  accentColor:    string
  timeLeft:       HMS | null   // null = data passada/inválida → countdown some
  showTimer:      boolean
  ctaSecVisible:  boolean
  rightContent:   string
  isMobile:       boolean
}

// ─── CTA buttons ─────────────────────────────────────────────────────────────

function CtaRow({
  c, se, accentColor, ctaSecVisible, isMobile, itemProps, align,
}: Pick<SubProps, "c" | "se" | "accentColor" | "ctaSecVisible" | "isMobile" | "itemProps"> & { align?: "center" | "flex-start" }) {
  return (
    <motion.div
      {...itemProps}
      style={{
        display:        "flex",
        flexDirection:  isMobile ? "column" : "row",
        gap:            12,
        alignItems:     isMobile ? "stretch" : (align ?? "center"),
        flexWrap:       "wrap",
        justifyContent: align === "flex-start" ? "flex-start" : "center",
      }}
    >
      <CtaButton
        label={c.ctaLabel}
        href={c.ctaHref || undefined}
        hover={se?.button?.hover}
        accentColor={accentColor}
      />
      {ctaSecVisible && (
        <CtaButton
          label={c.ctaSecLabel}
          href={c.ctaSecHref || undefined}
          hover={se?.buttonSec?.hover}
          accentColor={accentColor}
          fill="outline"
        />
      )}
    </motion.div>
  )
}

// ─── Centralizado type ────────────────────────────────────────────────────────

function CTAFinalCentralizado({
  c, se, containerProps, itemProps,
  accentColor, timeLeft, showTimer, ctaSecVisible, isMobile,
}: SubProps) {
  return (
    <section id="ctafinal" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div
        {...containerProps}
        style={{
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          textAlign:     "center",
          gap:           24,
          maxWidth:      720,
          margin:        "0 auto",
        }}
      >
        <SectionLabel {...itemProps} text={c.sectionLabel} accentColor={accentColor} />
        <Heading
          {...itemProps}
          as="h2"
          size="grande"
          text={c.headline}
          accentColor={accentColor}
          color="var(--cor-texto)"
        />
        <Text {...itemProps} text={c.subtitle} size="medio" color="var(--cor-texto-secundario)" />

        {/* Countdown: só aparece se showTimer=true E ainda há tempo restante */}
        {showTimer && timeLeft && (
          <motion.div {...itemProps}>
            <CountdownBlock
              timeLeft={timeLeft}
              accentColor={accentColor}
              label={c.timerDeadline}
              isMobile={isMobile}
            />
          </motion.div>
        )}

        <CtaRow
          c={c} se={se} accentColor={accentColor}
          ctaSecVisible={ctaSecVisible} isMobile={isMobile}
          itemProps={itemProps} align="center"
        />
      </motion.div>
      </div>
    </section>
  )
}

// ─── Split type ───────────────────────────────────────────────────────────────

function CTAFinalSplit({
  c, se, containerProps, itemProps,
  accentColor, timeLeft, showTimer, ctaSecVisible, rightContent, isMobile,
}: SubProps) {
  const isCountdownRight = rightContent === "countdown"
  // Coluna direita com countdown: some quando timeLeft=null (prazo passou)
  const showRightColumn = !isCountdownRight || timeLeft !== null

  return (
    <section id="ctafinal" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div
        {...containerProps}
        style={{
          display:       "flex",
          flexDirection: isMobile ? "column" : "row",
          gap:           isMobile ? 32 : 48,
          alignItems:    "stretch",
        }}
      >
        {/* Left: content column */}
        <div style={{
          flex:           showRightColumn ? "1 1 0%" : "1 1 auto",
          display:        "flex",
          flexDirection:  "column",
          gap:            20,
          justifyContent: "center",
        }}>
          <SectionLabel {...itemProps} text={c.sectionLabel} accentColor={accentColor} />
          <Heading
            {...itemProps}
            as="h2"
            size="medio"
            text={c.headline}
            accentColor={accentColor}
            color="var(--cor-texto)"
          />
          <Text {...itemProps} text={c.subtitle} size="medio" color="var(--cor-texto-secundario)" />

          {/* Countdown inline: showTimer=true + imagem na direita (não countdown) + ainda há tempo */}
          {showTimer && !isCountdownRight && timeLeft && (
            <motion.div {...itemProps}>
              <CountdownBlock
                timeLeft={timeLeft}
                accentColor={accentColor}
                label={c.timerDeadline}
                isMobile={isMobile}
              />
            </motion.div>
          )}

          <CtaRow
            c={c} se={se} accentColor={accentColor}
            ctaSecVisible={ctaSecVisible} isMobile={isMobile}
            itemProps={itemProps} align="flex-start"
          />
        </div>

        {/* Right: some se countdown expirou; mantém se imagem ou countdown ativo */}
        {showRightColumn && (
          <motion.div
            {...itemProps}
            style={{
              flex:           "1 1 0%",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              borderRadius:   24,
              overflow:       "hidden",
              minHeight:      isMobile ? 220 : undefined,
              ...(isCountdownRight ? {
                background: `color-mix(in srgb, ${accentColor} 3.14%, transparent)`,
                border:     `1px solid color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
                padding:    isMobile ? "40px 24px" : "48px 40px",
              } : {}),
            }}
          >
            {isCountdownRight && timeLeft ? (
              <CountdownBlock
                timeLeft={timeLeft}
                accentColor={accentColor}
                label={c.timerDeadline}
                isMobile={isMobile}
              />
            ) : (
              <ImageSlot
                src={c.imageSrc || undefined}
                alt={c.imageAlt}
                entry={se?.image?.entry}
                hover={se?.image?.hover}
                style={{ width: "100%", height: "100%" }}
              />
            )}
          </motion.div>
        )}
      </motion.div>
      </div>
    </section>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface CTAFinalProps {
  type?:        "centralizado" | "split"
  accentColor?: string
  content?:     CTAFinalContent
  [key: string]: unknown
}

export function CTAFinal({
  type        = "centralizado",
  accentColor = "#D4A017",
  content     = {},
}: CTAFinalProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile = useIsMobile()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  const cv            = content as Record<string, unknown>
  const showTimer     = (cv.showTimer     as boolean | undefined) ?? false
  const ctaSecVisible = (cv.ctaSecVisible as boolean | undefined) ?? false
  const rightContent  = (cv.rightContent  as string  | undefined) ?? "imagem"

  // Countdown ativo quando showTimer=true OU split com countdown na direita
  const shouldRunTimer = showTimer || (type === "split" && rightContent === "countdown")

  // Inicia null e calcula só no cliente (useEffect abaixo dispara tick() no mount).
  // Date.now() no initializer causava hydration mismatch (HTML do servidor com hora
  // diferente do cliente) e hora congelada no export estático. null = countdown oculto
  // até o primeiro tick — placeholder estável, igual no servidor e no cliente.
  const [timeLeft, setTimeLeft] = useState<HMS | null>(null)

  useEffect(() => {
    if (!shouldRunTimer) return

    // Captura o endDate no momento em que o efeito roda (dep array garante que é o valor atual)
    const endDate = c.timerEndDate

    function tick() {
      const rem = getRemainingSeconds(endDate)
      // rem <= 0: data passou ou inválida → null → countdown some
      setTimeLeft(rem > 0 ? secondsToHMS(rem) : null)
    }

    tick() // dispara imediatamente (sem aguardar o primeiro segundo)
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [shouldRunTimer, c.timerEndDate]) // dep: shouldRunTimer muda → reinicia; endDate muda → recalcula

  const subProps: SubProps = {
    c, se, containerProps, itemProps,
    accentColor, timeLeft, showTimer, ctaSecVisible, rightContent, isMobile,
  }

  return type === "split"
    ? <CTAFinalSplit        {...subProps} />
    : <CTAFinalCentralizado {...subProps} />
}
