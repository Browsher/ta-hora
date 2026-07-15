"use client"

import { motion, type MotionProps } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { CtaButton } from "@/components/ui/CtaButton"
import { IconSlot } from "@/components/ui/IconSlot"
import { StatNumber } from "@/components/ui/StatNumber"
import { TiltCard } from "@/components/ui/TiltCard"
import { ImageSlot } from "@/components/ui/ImageSlot"
import type { SectionEffects } from "@/lib/types"

// ─── Content ─────────────────────────────────────────────────────────────────

interface BenefitsCardContent {
  sectionLabel?:     string
  headline?:         string
  benefit1?:         string
  benefit2?:         string
  benefit3?:         string
  benefit4?:         string
  benefit5?:         string
  ctaLabel?:         string
  ctaHref?:          string
  iconEmoji?:        string
  highlightNumber?:  string
  highlightCaption?: string
  imageSrc?:         string
  imageAlt?:         string
}

const DEFAULT_CONTENT: Required<BenefitsCardContent> = {
  sectionLabel:     "Por que escolher?",
  headline:         "%%Resultados reais%% para você",
  benefit1:         "Resultado comprovado em 30 dias",
  benefit2:         "Suporte dedicado em tempo real",
  benefit3:         "Sem taxa de adesão ou contrato",
  benefit4:         "Acesso completo a todas as funções",
  benefit5:         "Garantia de satisfação ou devolução",
  ctaLabel:         "Quero começar agora",
  ctaHref:          "#",
  iconEmoji:        "⚡",
  highlightNumber:  "98%",
  highlightCaption: "de satisfação",
  imageSrc:         "",
  imageAlt:         "",
}

// ─── Benefit item (inline — checkmark + text) ─────────────────────────────────

function BenefitItem({ text, accentColor }: { text: string; accentColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span style={{
        color:      accentColor,
        flexShrink: 0,
        fontSize:   15,
        lineHeight: "1.6",
        fontWeight: 700,
      }}>
        ✓
      </span>
      <Text text={text} size="medio" color="var(--cor-texto)" />
    </div>
  )
}

// ─── Icon renderer for card type ──────────────────────────────────────────────
//
// filled  → bgColor = accentColor (filled circle box)
// outline → bgColor = transparent + borderColor = accentColor
// ghost   → no box, large raw icon

function CardIcon({
  iconEmoji,
  iconStyle,
  accentColor,
  size,
  se,
}: {
  iconEmoji:   string
  iconStyle:   string
  accentColor: string
  size:        number
  se:          SectionEffects | null
}) {
  if (iconStyle === "outline") {
    return (
      <IconSlot
        icon={iconEmoji}
        hover={se?.icons?.hover}
        size={size}
        bgColor="transparent"
        borderColor={accentColor}
        color={accentColor}
      />
    )
  }
  if (iconStyle === "ghost") {
    return (
      <IconSlot
        icon={iconEmoji}
        hover={se?.icons?.hover}
        size={size}
        color={accentColor}
      />
    )
  }
  // filled (default)
  return (
    <IconSlot
      icon={iconEmoji}
      hover={se?.icons?.hover}
      size={size}
      bgColor={accentColor}
      color={"var(--cor-destaque-texto)"}
    />
  )
}

// ─── Sub-function props ───────────────────────────────────────────────────────

interface SubProps {
  c:            Required<BenefitsCardContent>
  se:           SectionEffects | null
  containerProps: MotionProps
  itemProps:    MotionProps
  accentColor:  string
  benefits:     string[]
  ctaVisible:   boolean
  iconVisible:  boolean
  iconStyle:    string
  rightContent: string
  isMobile:     boolean
}

// ─── Card type ────────────────────────────────────────────────────────────────
// Single centered card (TiltCard). Optional icon at top, benefits list, CTA.

function BenefitsCardCard({
  c, se, containerProps, itemProps,
  accentColor, benefits, ctaVisible, iconVisible, iconStyle, isMobile,
}: SubProps) {
  const iconSize = isMobile ? 48 : 64

  return (
    <section id="benefitscard" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", justifyContent: "center" }}>
        <TiltCard
          hover={se?.cards?.hover}
          entry={se?.cards?.entry}
          accentColor={accentColor}
          style={{
            width:         "100%",
            maxWidth:      520,
            background:    "var(--cor-card)",
            border:        `1px solid color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
            borderRadius:  24,
            padding:       isMobile ? "32px 24px" : "48px 40px",
            display:       "flex",
            flexDirection: "column",
            gap:           24,
          }}
        >
          {/* Icon */}
          {iconVisible && (
            <div>
              <CardIcon
                iconEmoji={c.iconEmoji}
                iconStyle={iconStyle}
                accentColor={accentColor}
                size={iconSize}
                se={se}
              />
            </div>
          )}

          {/* Label + Heading */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionLabel {...itemProps} text={c.sectionLabel} accentColor={accentColor} />
            <Heading
              {...itemProps}
              as="h2"
              size="medio"
              text={c.headline}
              accentColor={accentColor}
              color="var(--cor-texto)"
            />
          </div>

          {/* Benefits list */}
          <motion.div
            {...itemProps}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {benefits.map((benefit, i) => (
              <BenefitItem key={i} text={benefit} accentColor={accentColor} />
            ))}
          </motion.div>

          {/* CTA */}
          {ctaVisible && (
            <div>
              <CtaButton
                {...itemProps}
                label={c.ctaLabel}
                href={c.ctaHref || undefined}
                hover={se?.button?.hover}
                accentColor={accentColor}
              />
            </div>
          )}
        </TiltCard>
      </motion.div>
      </div>
    </section>
  )
}

// ─── Split type ───────────────────────────────────────────────────────────────
// Two-column layout: content left + StatNumber or ImageSlot right.
// Mobile: stacks to column.

function BenefitsCardSplit({
  c, se, containerProps, itemProps,
  accentColor, benefits, ctaVisible, rightContent, isMobile,
}: SubProps) {
  const isNumero = rightContent === "numero"

  return (
    <section id="benefitscard" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div
        {...containerProps}
        style={{
          display:       "flex",
          flexDirection: isMobile ? "column" : "row",
          gap:           isMobile ? 24 : 32,
          alignItems:    "stretch",
        }}
      >
        {/* Left: content column */}
        <div style={{
          flex:          isMobile ? "1 1 auto" : "7 7 0%",
          background:    "var(--cor-card)",
          border:        `1px solid color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
          borderRadius:  24,
          padding:       isMobile ? "32px 24px" : "40px 36px",
          display:       "flex",
          flexDirection: "column",
          gap:           24,
        }}>
          {/* Label + Heading */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionLabel {...itemProps} text={c.sectionLabel} accentColor={accentColor} />
            <Heading
              {...itemProps}
              as="h2"
              size="medio"
              text={c.headline}
              accentColor={accentColor}
              color="var(--cor-texto)"
            />
          </div>

          {/* Benefits list */}
          <motion.div
            {...itemProps}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {benefits.map((benefit, i) => (
              <BenefitItem key={i} text={benefit} accentColor={accentColor} />
            ))}
          </motion.div>

          {/* CTA */}
          {ctaVisible && (
            <div>
              <CtaButton
                {...itemProps}
                label={c.ctaLabel}
                href={c.ctaHref || undefined}
                hover={se?.button?.hover}
                accentColor={accentColor}
              />
            </div>
          )}
        </div>

        {/* Right: StatNumber or ImageSlot */}
        <motion.div
          {...itemProps}
          style={{
            // Numero e imagem partilham o mesmo ~30% — ambos flex: "3 3 0%"
            ...(isMobile
              ? { flex: "1 1 auto", minHeight: 200 }
              : { flex: "3 3 0%" }
            ),
            border:         `1px solid color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
            borderRadius:   24,
            overflow:       "hidden",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            background:     isNumero ? `color-mix(in srgb, ${accentColor} 3.14%, transparent)` : "transparent",
            padding:        isNumero ? (isMobile ? "40px 24px" : "40px") : 0,
          }}
        >
          {isNumero ? (
            <StatNumber
              value={c.highlightNumber}
              label={c.highlightCaption}
              enabled={se?.counter ?? false}
              accentColor={accentColor}
              size="grande"
              align="centro"
            />
          ) : (
            <ImageSlot
              src={c.imageSrc || undefined}
              alt={c.imageAlt}
              entry={se?.image?.entry}
              hover={se?.image?.hover}
              style={{ height: "100%", width: "100%" }}
            />
          )}
        </motion.div>
      </motion.div>
      </div>
    </section>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface BenefitsCardProps {
  type?:        "card" | "split"
  accentColor?: string
  content?:     BenefitsCardContent
  [key: string]: unknown
}

export function BenefitsCard({
  type        = "card",
  accentColor = "#D4A017",
  content     = {},
}: BenefitsCardProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile = useIsMobile()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  // Variation values — written by Builder TypeTab/VariationTab into section.content
  const cv           = content as Record<string, unknown>
  const benefitCount = (cv.benefitCount as number  | undefined) ?? 3
  const ctaVisible   = (cv.ctaVisible   as boolean | undefined) ?? true
  const iconVisible  = (cv.iconVisible  as boolean | undefined) ?? false
  const iconStyle    = (cv.iconStyle    as string  | undefined) ?? "filled"
  const rightContent = (cv.rightContent as string  | undefined) ?? "numero"

  const ALL_BENEFITS = [c.benefit1, c.benefit2, c.benefit3, c.benefit4, c.benefit5]
  const benefits     = ALL_BENEFITS.slice(0, Math.max(1, Math.min(5, benefitCount)))

  const subProps: SubProps = {
    c, se, containerProps, itemProps,
    accentColor, benefits, ctaVisible, iconVisible, iconStyle, rightContent, isMobile,
  }

  return type === "split"
    ? <BenefitsCardSplit {...subProps} />
    : <BenefitsCardCard  {...subProps} />
}
