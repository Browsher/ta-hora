"use client"

import { motion, type MotionProps } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { HighlightBadge } from "@/components/ui/HighlightBadge"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { ImageSlot } from "@/components/ui/ImageSlot"
import type { SectionEffects } from "@/lib/types"

// ─── Content ─────────────────────────────────────────────────────────────────

interface MarketplacesContent {
  badgeText?: string
  titleText?: string
  descriptionText?: string
  // Marketplace 1
  marketplace1Logo?: string; marketplace1LogoAlt?: string; marketplace1Href?: string; marketplace1Name?: string; marketplace1Phrase?: string
  // Marketplace 2
  marketplace2Logo?: string; marketplace2LogoAlt?: string; marketplace2Href?: string; marketplace2Name?: string; marketplace2Phrase?: string
  // Marketplace 3
  marketplace3Logo?: string; marketplace3LogoAlt?: string; marketplace3Href?: string; marketplace3Name?: string; marketplace3Phrase?: string
  // Marketplace 4
  marketplace4Logo?: string; marketplace4LogoAlt?: string; marketplace4Href?: string; marketplace4Name?: string; marketplace4Phrase?: string
}

const DEFAULT_CONTENT: Required<MarketplacesContent> = {
  badgeText: "Onde comprar",
  titleText: "Também estamos nos %%marketplaces%%",
  descriptionText: "Compre com a gente onde você já confia.",
  marketplace1Logo: "", marketplace1LogoAlt: "Logo do Mercado Livre — loja oficial", marketplace1Href: "#", marketplace1Name: "Mercado Livre", marketplace1Phrase: "Loja oficial",
  marketplace2Logo: "", marketplace2LogoAlt: "Logo da Shopee — loja oficial",        marketplace2Href: "#", marketplace2Name: "Shopee",        marketplace2Phrase: "Reputação verde",
  marketplace3Logo: "", marketplace3LogoAlt: "Logo da Amazon — loja oficial",        marketplace3Href: "#", marketplace3Name: "Amazon",        marketplace3Phrase: "Envio rápido",
  marketplace4Logo: "", marketplace4LogoAlt: "Logo da Magalu — loja oficial",        marketplace4Href: "#", marketplace4Name: "Magalu",        marketplace4Phrase: "Frete grátis",
}

// ─── Item model ──────────────────────────────────────────────────────────────

interface Marketplace {
  logo:   string
  alt:    string
  href:   string
  name:   string
  phrase: string
}

// ─── MarketplaceItem — o item INTEIRO é o <a> clicável (abre em nova aba) ──────
// Logo exibido INTEIRO (objectFit="contain"). O nome/frase aparecem conforme os
// toggles nameVisible/phraseVisible.

interface MarketplaceItemProps {
  item:          Marketplace
  se:            SectionEffects | null
  itemProps:     MotionProps
  accentColor:   string
  nameVisible:   boolean
  phraseVisible: boolean
  variant:       "grade" | "faixa"
}

function MarketplaceItem({
  item, se, itemProps, accentColor, nameVisible, phraseVisible, variant,
}: MarketplaceItemProps) {
  const isGrade   = variant === "grade"
  const logoHeight = isGrade ? 56 : 44

  return (
    <motion.a
      {...itemProps}
      href={item.href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            10,
        textDecoration: "none",
        color:          "inherit",
        cursor:         "pointer",
        // grade: card de confiança (fundo + borda). faixa: minimalista, sem card.
        ...(isGrade
          ? {
              background:   "var(--cor-card)",
              border:       `1px solid color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
              borderRadius: 16,
              padding:      "24px 20px",
            }
          : {
              padding: "8px 16px",
            }),
      }}
    >
      <ImageSlot
        src={item.logo || undefined}
        alt={item.alt}
        objectFit="contain"
        entry={se?.image?.entry}
        hover={se?.image?.hover}
        borderRadius={8}
        style={{ height: logoHeight }}
      />
      {(nameVisible || phraseVisible) && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {nameVisible && (
            <Text
              text={item.name}
              size="pequeno"
              color="var(--cor-texto)"
              align="centro"
              style={{ fontWeight: 600, margin: 0 }}
            />
          )}
          {phraseVisible && (
            <Text
              text={item.phrase}
              size="pequeno"
              color="var(--cor-texto-secundario)"
              align="centro"
              style={{ margin: 0 }}
            />
          )}
        </div>
      )}
    </motion.a>
  )
}

// ─── Header (compartilhado pelos dois tipos) ──────────────────────────────────

function MarketplacesHeader({
  c, itemProps, accentColor, badgeVisible, titleVisible, descriptionVisible,
}: {
  c:                  Required<MarketplacesContent>
  itemProps:          MotionProps
  accentColor:        string
  badgeVisible:       boolean
  titleVisible:       boolean
  descriptionVisible: boolean
}) {
  if (!badgeVisible && !titleVisible && !descriptionVisible) return null
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
      {badgeVisible && <HighlightBadge {...itemProps} text={c.badgeText} accentColor={accentColor} />}
      {titleVisible && (
        <Heading
          {...itemProps}
          as="h2"
          size="medio"
          text={c.titleText}
          accentColor={accentColor}
          color="var(--cor-texto)"
        />
      )}
      {descriptionVisible && (
        <Text
          {...itemProps}
          text={c.descriptionText}
          size="grande"
          color="var(--cor-texto-secundario)"
          align="centro"
          style={{ maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}
        />
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MarketplacesProps {
  type?:        "grade" | "faixa"
  accentColor?: string
  content?:     MarketplacesContent
  [key: string]: unknown
}

export function Marketplaces({
  type        = "grade",
  accentColor = "#D4A017",
  content     = {},
}: MarketplacesProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile = useIsMobile()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  const cv            = content as Record<string, unknown>
  const marketplaceCount = Math.max(2, Math.min(4, (cv.marketplaceCount as number | undefined) ?? 3))
  const badgeVisible       = (cv.badgeVisible       as boolean | undefined) ?? true
  const titleVisible       = (cv.titleVisible       as boolean | undefined) ?? true
  const descriptionVisible = (cv.descriptionVisible as boolean | undefined) ?? false
  const nameVisible   = (cv.nameVisible   as boolean | undefined) ?? false
  const phraseVisible = (cv.phraseVisible as boolean | undefined) ?? false

  const ALL: Marketplace[] = [
    { logo: c.marketplace1Logo, alt: c.marketplace1LogoAlt, href: c.marketplace1Href, name: c.marketplace1Name, phrase: c.marketplace1Phrase },
    { logo: c.marketplace2Logo, alt: c.marketplace2LogoAlt, href: c.marketplace2Href, name: c.marketplace2Name, phrase: c.marketplace2Phrase },
    { logo: c.marketplace3Logo, alt: c.marketplace3LogoAlt, href: c.marketplace3Href, name: c.marketplace3Name, phrase: c.marketplace3Phrase },
    { logo: c.marketplace4Logo, alt: c.marketplace4LogoAlt, href: c.marketplace4Href, name: c.marketplace4Name, phrase: c.marketplace4Phrase },
  ]
  const items = ALL.slice(0, marketplaceCount)

  const isFaixa = type === "faixa"

  // grade → grid auto-fit (empilha no mobile). faixa → linha horizontal com wrap.
  const listStyle: React.CSSProperties = isFaixa
    ? {
        display:        "flex",
        flexWrap:       "wrap",
        justifyContent: "center",
        alignItems:     "center",
        gap:            isMobile ? 16 : "clamp(20px, 4vw, 48px)",
      }
    : {
        display:             "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 150 : 200}px, 1fr))`,
        gap:                 isMobile ? 14 : 20,
      }

  return (
    <section id="marketplaces" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <MarketplacesHeader
            c={c}
            itemProps={itemProps}
            accentColor={accentColor}
            badgeVisible={badgeVisible}
            titleVisible={titleVisible}
            descriptionVisible={descriptionVisible}
          />

          <div style={listStyle}>
            {items.map((item, i) => (
              <MarketplaceItem
                key={i}
                item={item}
                se={se}
                itemProps={itemProps}
                accentColor={accentColor}
                nameVisible={nameVisible}
                phraseVisible={phraseVisible}
                variant={isFaixa ? "faixa" : "grade"}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
