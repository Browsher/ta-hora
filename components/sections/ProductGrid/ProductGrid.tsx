"use client"

import { motion, type MotionProps } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { ImageSlot } from "@/components/ui/ImageSlot"
import { CtaButton } from "@/components/ui/CtaButton"
import { PriceTag } from "@/components/ui/PriceTag"
import { TiltCard } from "@/components/ui/TiltCard"
import { Text } from "@/components/ui/Text"
import { useCarousel } from "@/lib/useCarousel"
import { NavArrow } from "@/components/ui/NavArrow"
import { CarouselDots } from "@/components/ui/CarouselDots"
import { StarRating } from "@/components/ui/StarRating"
import type { SectionEffects } from "@/lib/types"

// ─── Content ─────────────────────────────────────────────────────────────────

interface ProductGridContent {
  sectionLabel?: string
  headline?:     string
  // Product 1
  product1Name?:     string; product1Price?:    string; product1OldPrice?: string
  product1Image?:    string; product1ImageAlt?: string; product1CtaLabel?: string; product1CtaHref?:  string; product1Rating?: string
  // Product 2
  product2Name?:     string; product2Price?:    string; product2OldPrice?: string
  product2Image?:    string; product2ImageAlt?: string; product2CtaLabel?: string; product2CtaHref?:  string; product2Rating?: string
  // Product 3
  product3Name?:     string; product3Price?:    string; product3OldPrice?: string
  product3Image?:    string; product3ImageAlt?: string; product3CtaLabel?: string; product3CtaHref?:  string; product3Rating?: string
  // Product 4
  product4Name?:     string; product4Price?:    string; product4OldPrice?: string
  product4Image?:    string; product4ImageAlt?: string; product4CtaLabel?: string; product4CtaHref?:  string; product4Rating?: string
  // Product 5
  product5Name?:     string; product5Price?:    string; product5OldPrice?: string
  product5Image?:    string; product5ImageAlt?: string; product5CtaLabel?: string; product5CtaHref?:  string; product5Rating?: string
  // Product 6
  product6Name?:     string; product6Price?:    string; product6OldPrice?: string
  product6Image?:    string; product6ImageAlt?: string; product6CtaLabel?: string; product6CtaHref?:  string; product6Rating?: string
  // Product 7
  product7Name?:     string; product7Price?:    string; product7OldPrice?: string
  product7Image?:    string; product7ImageAlt?: string; product7CtaLabel?: string; product7CtaHref?:  string; product7Rating?: string
  // Product 8
  product8Name?:     string; product8Price?:    string; product8OldPrice?: string
  product8Image?:    string; product8ImageAlt?: string; product8CtaLabel?: string; product8CtaHref?:  string; product8Rating?: string
}

const DEFAULT_CONTENT: Required<ProductGridContent> = {
  sectionLabel: "Nossos Produtos",
  headline:     "%%Escolha%% o plano ideal para você",
  product1Name: "Plano Básico",       product1Price: "97,00",  product1OldPrice: "De R$ 197",  product1Image: "", product1ImageAlt: "", product1CtaLabel: "Comprar agora", product1CtaHref: "#", product1Rating: "4",
  product2Name: "Plano Intermediário", product2Price: "197,00", product2OldPrice: "De R$ 397",  product2Image: "", product2ImageAlt: "", product2CtaLabel: "Comprar agora", product2CtaHref: "#", product2Rating: "4.5",
  product3Name: "Plano Premium",       product3Price: "297,00", product3OldPrice: "De R$ 597",  product3Image: "", product3ImageAlt: "", product3CtaLabel: "Comprar agora", product3CtaHref: "#", product3Rating: "5",
  product4Name: "Produto Extra 4",     product4Price: "147,00", product4OldPrice: "De R$ 297",  product4Image: "", product4ImageAlt: "", product4CtaLabel: "Comprar agora", product4CtaHref: "#", product4Rating: "4",
  product5Name: "Produto Extra 5",     product5Price: "247,00", product5OldPrice: "De R$ 497",  product5Image: "", product5ImageAlt: "", product5CtaLabel: "Comprar agora", product5CtaHref: "#", product5Rating: "4.5",
  product6Name: "Produto Extra 6",     product6Price: "347,00", product6OldPrice: "De R$ 697",  product6Image: "", product6ImageAlt: "", product6CtaLabel: "Comprar agora", product6CtaHref: "#", product6Rating: "4",
  product7Name: "Produto Extra 7",     product7Price: "447,00", product7OldPrice: "De R$ 897",  product7Image: "", product7ImageAlt: "", product7CtaLabel: "Comprar agora", product7CtaHref: "#", product7Rating: "4.5",
  product8Name: "Produto Extra 8",     product8Price: "547,00", product8OldPrice: "De R$ 997",  product8Image: "", product8ImageAlt: "", product8CtaLabel: "Comprar agora", product8CtaHref: "#", product8Rating: "5",
}

// ─── Product ──────────────────────────────────────────────────────────────────

interface Product {
  name:     string
  price:    string
  oldPrice: string
  image:    string
  imageAlt: string
  ctaLabel: string
  ctaHref:  string
  rating:   string
}

// ─── ProductCard (shared by all 3 types) ─────────────────────────────────────

interface ProductCardProps {
  product:       Product
  se:            SectionEffects | null
  accentColor:   string
  showPrice:     boolean
  showRating:    boolean
  ctaPerProduct: boolean
  priceStyle:    string
  featured?:     boolean
  isMobile:      boolean
}

function ProductCard({
  product, se, accentColor, showPrice, showRating, ctaPerProduct, priceStyle, featured, isMobile,
}: ProductCardProps) {
  return (
    <TiltCard
      hover={se?.cards?.hover}
      entry={se?.cards?.entry}
      accentColor={accentColor}
      style={{
        background:    "var(--cor-card)",
        border:        `1px solid color-mix(in srgb, ${accentColor} 14.51%, transparent)`,
        borderRadius:  20,
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
        height:        "100%",
      }}
    >
      <ImageSlot
        src={product.image || undefined}
        alt={product.imageAlt || product.name}
        entry={se?.image?.entry}
        hover={se?.image?.hover}
        style={{ aspectRatio: featured ? "3/2" : "4/3", width: "100%" }}
      />
      <div style={{
        padding:       featured ? "20px 24px 24px" : "12px 16px 18px",
        display:       "flex",
        flexDirection: "column",
        gap:           8,
        flex:          1,
      }}>
        <Text
          text={product.name}
          size={featured ? "medio" : "pequeno"}
          color="var(--cor-texto)"
          style={{ fontWeight: 600, margin: 0 }}
        />
        {showRating && product.rating && (
          <StarRating value={product.rating} accentColor={accentColor} size={12} />
        )}
        {showPrice && product.price && (
          <PriceTag
            price={product.price}
            oldPrice={priceStyle === "com-desconto" ? (product.oldPrice || undefined) : undefined}
            accentColor={accentColor}
            size="medio"
          />
        )}
        {ctaPerProduct && product.ctaLabel && (
          <div style={{ marginTop: "auto", paddingTop: 10 }}>
            <CtaButton
              label={product.ctaLabel}
              href={product.ctaHref || undefined}
              hover={se?.button?.hover}
              accentColor={accentColor}
            />
          </div>
        )}
      </div>
    </TiltCard>
  )
}

// ─── Sub-function props ───────────────────────────────────────────────────────

interface SubProps {
  c:              Required<ProductGridContent>
  se:             SectionEffects | null
  containerProps: MotionProps
  itemProps:      MotionProps
  accentColor:    string
  products:       Product[]
  showPrice:      boolean
  showRating:     boolean
  ctaPerProduct:  boolean
  priceStyle:     string
  gridWidth:      string
  autoplay:       boolean
  showArrows:     boolean
  showDots:       boolean
  isMobile:       boolean
}

// ─── Shared header ────────────────────────────────────────────────────────────

function GridHeader({ c, itemProps, accentColor }: Pick<SubProps, "c" | "itemProps" | "accentColor">) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
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
  )
}

// ─── Grid type ────────────────────────────────────────────────────────────────
// total      → grid ocupa a largura toda (cards esticam com 1fr).
// centralizado → grid recebe max-width + margin auto → miolo estreito centralizado.
// Cards mantêm o mesmo tamanho em ambos os modos; só o container muda de largura.
// Mobile: max-width de 860px não afeta telas < 860px → full-width sem código extra.

function ProductGridGrid({
  c, se, containerProps, itemProps, accentColor,
  products, showPrice, showRating, ctaPerProduct, priceStyle, gridWidth, isMobile,
}: SubProps) {
  const isCentralizado = gridWidth === "centralizado"

  return (
    <section id="productgrid" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <GridHeader c={c} itemProps={itemProps} accentColor={accentColor} />

        <motion.div
          {...itemProps}
          style={{
            display:             "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "140px" : "200px"}, 1fr))`,
            gap:                 isMobile ? 14 : 20,
            maxWidth:            isCentralizado ? 860 : undefined,
            marginLeft:          isCentralizado ? "auto" : undefined,
            marginRight:         isCentralizado ? "auto" : undefined,
            width:               "100%",
          }}
        >
          {products.map((product, i) => (
            <ProductCard
              key={i}
              product={product}
              se={se}
              accentColor={accentColor}
              showPrice={showPrice}
              showRating={showRating}
              ctaPerProduct={ctaPerProduct}
              priceStyle={priceStyle}
              isMobile={isMobile}
            />
          ))}
        </motion.div>
      </motion.div>
      </div>
    </section>
  )
}

// ─── Destaque type ────────────────────────────────────────────────────────────
// Produto 1 grande à esquerda, restantes em grade menor à direita.
// Mobile: empilha em coluna. gridWidth não se aplica — destaque é compacto por definição.

function ProductGridDestaque({
  c, se, containerProps, itemProps, accentColor,
  products, showPrice, showRating, ctaPerProduct, priceStyle, isMobile,
}: SubProps) {
  const [featured, ...rest] = products

  return (
    <section id="productgrid" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <GridHeader c={c} itemProps={itemProps} accentColor={accentColor} />

        <motion.div
          {...itemProps}
          style={{
            display:       "flex",
            flexDirection: isMobile ? "column" : "row",
            gap:           isMobile ? 16 : 20,
            alignItems:    "stretch",
          }}
        >
          {/* Featured product */}
          <div style={{ flex: "1 1 0%", minWidth: 0 }}>
            <ProductCard
              product={featured}
              se={se}
              accentColor={accentColor}
              showPrice={showPrice}
              showRating={showRating}
              ctaPerProduct={ctaPerProduct}
              priceStyle={priceStyle}
              featured
              isMobile={isMobile}
            />
          </div>

          {/* Rest in smaller grid */}
          {rest.length > 0 && (
            <div style={{
              flex:                "1 1 0%",
              display:             "grid",
              gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "120px" : "160px"}, 1fr))`,
              gap:                 isMobile ? 12 : 16,
              alignContent:        "start",
            }}>
              {rest.map((product, i) => (
                <ProductCard
                  key={i}
                  product={product}
                  se={se}
                  accentColor={accentColor}
                  showPrice={showPrice}
                  showRating={showRating}
                  ctaPerProduct={ctaPerProduct}
                  priceStyle={priceStyle}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
      </div>
    </section>
  )
}

// ─── Carrossel type ───────────────────────────────────────────────────────────
// Carrossel horizontal navegável. Hooks próprios (React component válido).
// Lógica estrutural inline — 1ª aparição; será 2ª em Testimonials → candidato a lib/useCarousel.
// Armadilha #7: VISIBLE e GAP entram no dep array do useEffect de medição.
// Autoplay com updater funcional (não lê index no closure).

function ProductGridCarrossel({
  c, se, containerProps, itemProps, accentColor,
  products, showPrice, showRating, ctaPerProduct, priceStyle, gridWidth,
  autoplay, showArrows, showDots, isMobile,
}: SubProps) {
  const isCentralizado = gridWidth === "centralizado"
  const VISIBLE = Math.min(isMobile ? 1 : 3, products.length)

  const { index, maxIndex, itemWidth, gap, trackRef, goNext, goPrev, setIndex, pauseHandlers } = useCarousel({
    itemCount:    products.length,
    visibleCount: VISIBLE,
    autoplay,
    autoplayMs:   3500,
  })

  return (
    <section id="productgrid" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <GridHeader c={c} itemProps={itemProps} accentColor={accentColor} />

        <motion.div {...itemProps} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Wrapper centralizado: max-width quando gridWidth=centralizado; mobile não é afetado (<860px) */}
          <div {...pauseHandlers} style={{ maxWidth: isCentralizado ? 860 : undefined, margin: isCentralizado ? "0 auto" : undefined, width: "100%" }}>
          {/* Track */}
          <div ref={trackRef} style={{ overflow: "hidden" }}>
            <motion.div
              animate={{ x: itemWidth > 0 ? -(index * (itemWidth + gap)) : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ display: "flex", gap }}
            >
              {products.map((product, i) => (
                <div
                  key={i}
                  style={{
                    width:     itemWidth > 0 ? itemWidth : "auto",
                    flexShrink: 0,
                    minWidth:  itemWidth > 0 ? undefined : `calc((100% - ${gap * (VISIBLE - 1)}px) / ${VISIBLE})`,
                  }}
                >
                  <ProductCard
                    product={product}
                    se={se}
                    accentColor={accentColor}
                    showPrice={showPrice}
                    showRating={showRating}
                    ctaPerProduct={ctaPerProduct}
                    priceStyle={priceStyle}
                    isMobile={isMobile}
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {(showArrows || showDots) && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 24 }}>
              {showArrows && <NavArrow direction="prev" onClick={goPrev} accentColor={accentColor} />}
              {showDots && <CarouselDots total={maxIndex + 1} active={index} onDotClick={setIndex} accentColor={accentColor} />}
              {showArrows && <NavArrow direction="next" onClick={goNext} accentColor={accentColor} />}
            </div>
          )}
          </div>{/* /wrapper centralizado */}
        </motion.div>
      </motion.div>
      </div>
    </section>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface ProductGridProps {
  type?:        "grid" | "destaque" | "carrossel"
  accentColor?: string
  content?:     ProductGridContent
  [key: string]: unknown
}

export function ProductGrid({
  type        = "grid",
  accentColor = "#D4A017",
  content     = {},
}: ProductGridProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile = useIsMobile()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  const cv            = content as Record<string, unknown>
  const productCount  = (cv.productCount  as number  | undefined) ?? 3
  const showPrice     = (cv.showPrice     as boolean | undefined) ?? true
  const showRating    = (cv.showRating    as boolean | undefined) ?? false
  const ctaPerProduct = (cv.ctaPerProduct as boolean | undefined) ?? true
  const priceStyle    = (cv.priceStyle    as string  | undefined) ?? "normal"
  const gridWidth     = (cv.gridWidth     as string  | undefined) ?? "total"
  const autoplay      = (cv.autoplay      as boolean | undefined) ?? false
  const showArrows    = (cv.showArrows    as boolean | undefined) ?? true
  const showDots      = (cv.showDots      as boolean | undefined) ?? true

  const ALL_PRODUCTS: Product[] = [
    { name: c.product1Name, price: c.product1Price, oldPrice: c.product1OldPrice, image: c.product1Image, imageAlt: c.product1ImageAlt, ctaLabel: c.product1CtaLabel, ctaHref: c.product1CtaHref, rating: c.product1Rating },
    { name: c.product2Name, price: c.product2Price, oldPrice: c.product2OldPrice, image: c.product2Image, imageAlt: c.product2ImageAlt, ctaLabel: c.product2CtaLabel, ctaHref: c.product2CtaHref, rating: c.product2Rating },
    { name: c.product3Name, price: c.product3Price, oldPrice: c.product3OldPrice, image: c.product3Image, imageAlt: c.product3ImageAlt, ctaLabel: c.product3CtaLabel, ctaHref: c.product3CtaHref, rating: c.product3Rating },
    { name: c.product4Name, price: c.product4Price, oldPrice: c.product4OldPrice, image: c.product4Image, imageAlt: c.product4ImageAlt, ctaLabel: c.product4CtaLabel, ctaHref: c.product4CtaHref, rating: c.product4Rating },
    { name: c.product5Name, price: c.product5Price, oldPrice: c.product5OldPrice, image: c.product5Image, imageAlt: c.product5ImageAlt, ctaLabel: c.product5CtaLabel, ctaHref: c.product5CtaHref, rating: c.product5Rating },
    { name: c.product6Name, price: c.product6Price, oldPrice: c.product6OldPrice, image: c.product6Image, imageAlt: c.product6ImageAlt, ctaLabel: c.product6CtaLabel, ctaHref: c.product6CtaHref, rating: c.product6Rating },
    { name: c.product7Name, price: c.product7Price, oldPrice: c.product7OldPrice, image: c.product7Image, imageAlt: c.product7ImageAlt, ctaLabel: c.product7CtaLabel, ctaHref: c.product7CtaHref, rating: c.product7Rating },
    { name: c.product8Name, price: c.product8Price, oldPrice: c.product8OldPrice, image: c.product8Image, imageAlt: c.product8ImageAlt, ctaLabel: c.product8CtaLabel, ctaHref: c.product8CtaHref, rating: c.product8Rating },
  ]
  const products = ALL_PRODUCTS.slice(0, Math.max(1, Math.min(8, productCount)))

  const subProps: SubProps = {
    c, se, containerProps, itemProps,
    accentColor, products, showPrice, showRating, ctaPerProduct, priceStyle, gridWidth,
    autoplay, showArrows, showDots, isMobile,
  }

  if (type === "destaque")  return <ProductGridDestaque  {...subProps} />
  if (type === "carrossel") return <ProductGridCarrossel {...subProps} />
  return <ProductGridGrid {...subProps} />
}
