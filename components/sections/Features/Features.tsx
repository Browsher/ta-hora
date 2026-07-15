"use client"

import { motion, type MotionProps } from "framer-motion"
import type { ReactNode } from "react"
import {
  buildSectionContainerProps,
  buildSectionItemProps,
  buildCardItemProps,
} from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { TiltCard } from "@/components/ui/TiltCard"
import { IconSlot } from "@/components/ui/IconSlot"
import type { SectionEffects, CardEntry } from "@/lib/types"

// ─── Content ──────────────────────────────────────────────────────────────────

interface FeaturesContent {
  sectionLabel?: string
  headline?: string
  sectionDesc?: string
  item1Icon?: string
  item1Title?: string
  item1Description?: string
  item2Icon?: string
  item2Title?: string
  item2Description?: string
  item3Icon?: string
  item3Title?: string
  item3Description?: string
  item4Icon?: string
  item4Title?: string
  item4Description?: string
  item5Icon?: string
  item5Title?: string
  item5Description?: string
  item6Icon?: string
  item6Title?: string
  item6Description?: string
}

const DEFAULT_CONTENT: Required<FeaturesContent> = {
  sectionLabel: "Recursos",
  headline: "Tudo que você precisa para %%crescer%%",
  sectionDesc: "Ferramentas poderosas para escalar seu negócio com confiança.",
  item1Icon: "⚡",
  item1Title: "Velocidade",
  item1Description: "Performance otimizada para cargas pesadas.",
  item2Icon: "🔒",
  item2Title: "Segurança",
  item2Description: "Seus dados protegidos com criptografia avançada.",
  item3Icon: "📊",
  item3Title: "Métricas",
  item3Description: "Visualize seus resultados em tempo real.",
  item4Icon: "🔗",
  item4Title: "Integrações",
  item4Description: "Conecte com suas ferramentas favoritas.",
  item5Icon: "🤝",
  item5Title: "Suporte",
  item5Description: "Equipe dedicada disponível 24 horas.",
  item6Icon: "🚀",
  item6Title: "Escalabilidade",
  item6Description: "Cresce junto com o seu negócio.",
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FeaturesProps {
  type?: "grid" | "flat"
  accentColor?: string
  content?: FeaturesContent
  // Variation controls — arrive via flat spread from section.content
  labelVisible?: boolean
  sectionDescVisible?: boolean
  iconVisible?: boolean
  itemDescVisible?: boolean
  iconType?: "emoji" | "image"
  itemCount?: number
  cardStyle?: "card" | "icone"
  iconPosition?: "top" | "left"
  [key: string]: unknown
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface ItemData {
  icon: string
  title: string
  description: string
}

interface RenderParams {
  items: ItemData[]
  accentColor: string
  iconVisible: boolean
  itemDescVisible: boolean
  iconType: "emoji" | "image"
  itemProps: MotionProps
  cardItemProps: MotionProps
  se: SectionEffects | null
}

// ─── Icon renderer ────────────────────────────────────────────────────────────
// Returns null-safe ReactNode — called from sub-functions (no hooks allowed here).

function renderIcon(
  item: ItemData,
  iconVisible: boolean,
  iconType: "emoji" | "image",
  accentColor: string,
  se: SectionEffects | null,
  size: number,
  withBox: boolean,
): ReactNode {
  if (!iconVisible) return null
  if (iconType === "image" && item.icon) {
    return (
      <img
        src={item.icon}
        alt={item.title}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: 8,
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <IconSlot
      icon={item.icon}
      hover={se?.icons?.hover}
      size={size}
      color={accentColor}
      {...(withBox
        ? { bgColor: `color-mix(in srgb, ${accentColor} 10.2%, transparent)`, borderColor: `color-mix(in srgb, ${accentColor} 25.1%, transparent)` }
        : {})}
    />
  )
}

// ─── Grid layout ─────────────────────────────────────────────────────────────
// Called as a regular function — no hooks. All computed values passed as params.

function renderGrid({
  items,
  accentColor,
  iconVisible,
  itemDescVisible,
  iconType,
  itemProps,
  cardItemProps,
  se,
  cardStyle,
  iconPosition,
}: RenderParams & { cardStyle: "card" | "icone"; iconPosition: "top" | "left" }) {
  const showLeft = iconVisible && cardStyle === "card" && iconPosition === "left"

  if (cardStyle === "card") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "clamp(16px, 2.5vw, 28px)",
        }}
      >
        {items.map((item, idx) => (
          <TiltCard
            key={idx}
            entry={se?.cards?.entry as CardEntry | undefined}
            hover={se?.cards?.hover}
            accentColor={accentColor}
            {...itemProps}
            style={{
              background: "var(--cor-card)",
              borderRadius: 24,
              border: `1px solid color-mix(in srgb, ${accentColor} 18.82%, transparent)`,
              padding: "clamp(20px, 2.5vw, 32px)",
              display: "flex",
              flexDirection: showLeft ? "row" : "column",
              alignItems: "flex-start",
              gap: showLeft ? 16 : 14,
            }}
          >
            {renderIcon(item, iconVisible, iconType, accentColor, se, 32, false)}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Heading
                as="h3"
                size="pequeno"
                text={item.title}
                color="var(--cor-texto)"
                accentColor={accentColor}
              />
              {itemDescVisible && (
                <Text
                  size="pequeno"
                  text={item.description}
                  color="var(--cor-texto-secundario)"
                />
              )}
            </div>
          </TiltCard>
        ))}
      </div>
    )
  }

  // cardStyle === "icone" — centered items, icon in a box, no card background
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "clamp(24px, 3vw, 40px)",
      }}
    >
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          {...cardItemProps}
          {...itemProps}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 12,
          }}
        >
          {renderIcon(item, iconVisible, iconType, accentColor, se, 48, true)}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Heading
              as="h3"
              size="pequeno"
              text={item.title}
              color="var(--cor-texto)"
              accentColor={accentColor}
            />
            {itemDescVisible && (
              <Text
                size="pequeno"
                text={item.description}
                color="var(--cor-texto-secundario)"
              />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Flat layout ─────────────────────────────────────────────────────────────
// Horizontal row on desktop; stacks vertically on mobile (via isMobile param).
// Dividers: vertical on desktop, horizontal on mobile.

function renderFlat({
  items,
  accentColor,
  iconVisible,
  itemDescVisible,
  iconType,
  itemProps,
  se,
  isMobile,
}: RenderParams & { isMobile: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "stretch",
        // clip (NÃO hidden): "hidden" num eixo força o OUTRO (overflow-y) a virar
        // `auto` → durante a entrada o translateY dos cards estoura a fileira e ela
        // exibe a própria scrollbar vertical de 6px (track escuro) na direita. `clip`
        // é compatível com `visible`, então overflow-y continua visible (a animação
        // dos cards sobe livre, sem barra) e o eixo X segue contido. Sem clip-margin.
        overflowX: "clip",
      }}
    >
      {items.flatMap((item, idx) => {
        const itemNode = (
          <motion.div
            key={`item-${idx}`}
            {...itemProps}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 10,
              padding: isMobile
                ? "20px 0"
                : `0 clamp(16px, 3vw, 40px)`,
              flex: 1,
            }}
          >
            {renderIcon(item, iconVisible, iconType, accentColor, se, 28, false)}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Heading
                as="h3"
                size="pequeno"
                text={item.title}
                color="var(--cor-texto)"
                accentColor={accentColor}
              />
              {itemDescVisible && (
                <Text
                  size="pequeno"
                  text={item.description}
                  color="var(--cor-texto-secundario)"
                />
              )}
            </div>
          </motion.div>
        )

        const dividerNode =
          idx < items.length - 1 ? (
            <div
              key={`div-${idx}`}
              aria-hidden
              style={
                isMobile
                  ? {
                      height: 1,
                      background: `color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
                      flexShrink: 0,
                    }
                  : {
                      width: 1,
                      background: `color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
                      flexShrink: 0,
                      alignSelf: "stretch",
                    }
              }
            />
          ) : null

        return dividerNode ? [itemNode, dividerNode] : [itemNode]
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Features({
  type = "grid",
  accentColor = "#D4A017",
  content = {},
  labelVisible = true,
  sectionDescVisible = true,
  iconVisible = true,
  itemDescVisible = true,
  iconType = "emoji",
  itemCount = 3,
  cardStyle = "card",
  iconPosition = "top",
}: FeaturesProps) {
  const c = { ...DEFAULT_CONTENT, ...content }

  const se       = useSectionEffects()
  const mode     = useEffectsMode()
  const isMobile = useIsMobile()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)
  const cardItemProps  = buildCardItemProps(se?.cards?.entry as CardEntry | undefined, mode)

  const count = Math.max(1, Math.min(6, typeof itemCount === "number" ? itemCount : Number(itemCount) || 3))
  const allItems: ItemData[] = [
    { icon: c.item1Icon, title: c.item1Title, description: c.item1Description },
    { icon: c.item2Icon, title: c.item2Title, description: c.item2Description },
    { icon: c.item3Icon, title: c.item3Title, description: c.item3Description },
    { icon: c.item4Icon, title: c.item4Title, description: c.item4Description },
    { icon: c.item5Icon, title: c.item5Title, description: c.item5Description },
    { icon: c.item6Icon, title: c.item6Title, description: c.item6Description },
  ]
  const items = allItems.slice(0, count)

  const sharedParams: RenderParams = {
    items,
    accentColor,
    iconVisible,
    itemDescVisible,
    iconType,
    itemProps,
    cardItemProps,
    se,
  }

  return (
    <section
      id="features"
      style={{ padding: "clamp(64px, 8vw, 96px) 0" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div
        {...containerProps}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(24px, 3vw, 40px)",
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            textAlign: "center",
          }}
        >
          {labelVisible && (
            <SectionLabel
              {...itemProps}
              text={c.sectionLabel}
              accentColor={accentColor}
            />
          )}
          <Heading
            {...itemProps}
            as="h2"
            size="medio"
            text={c.headline}
            color="var(--cor-texto)"
            accentColor={accentColor}
          />
          {sectionDescVisible && (
            <Text
              {...itemProps}
              size="grande"
              text={c.sectionDesc}
              color="var(--cor-texto-secundario)"
              align="centro"
            />
          )}
        </div>

        {/* Items area */}
        {type === "grid"
          ? renderGrid({ ...sharedParams, cardStyle, iconPosition })
          : renderFlat({ ...sharedParams, isMobile })}
      </motion.div>
      </div>
    </section>
  )
}
