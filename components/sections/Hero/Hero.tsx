"use client"

import { useRef } from "react"
import { AnimatePresence, motion, type MotionProps, useReducedMotion } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { useCarousel } from "@/lib/useCarousel"
import { HighlightBadge } from "@/components/ui/HighlightBadge"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { CtaButton } from "@/components/ui/CtaButton"
import { ImageSlot } from "@/components/ui/ImageSlot"
import { StatNumber } from "@/components/ui/StatNumber"
import { Input } from "@/components/ui/Input"
import { NavArrow, type ArrowVariant } from "@/components/ui/NavArrow"
import { CarouselDots } from "@/components/ui/CarouselDots"
import type { SectionEffects } from "@/lib/types"

// ─── Content ─────────────────────────────────────────────────────────────────

interface HeroContent {
  badgeText?:        string
  headline?:         string
  subheadline?:      string
  ctaLabel?:         string
  ctaHref?:          string
  ctaSecLabel?:      string
  ctaSecHref?:       string
  imageSrc?:         string
  imageAlt?:         string
  videoSrc?:         string
  videoPoster?:      string
  bgVideoSrc?:       string
  bgVideoPoster?:    string
  emailPlaceholder?: string
  stat1Value?: string; stat1Label?: string
  stat2Value?: string; stat2Label?: string
  stat3Value?: string; stat3Label?: string
  // Banners do tipo "carrossel" (só este tipo os lê)
  banner1Image?: string; banner1ImageAlt?: string; banner1Href?: string
  banner2Image?: string; banner2ImageAlt?: string; banner2Href?: string
  banner3Image?: string; banner3ImageAlt?: string; banner3Href?: string
  banner4Image?: string; banner4ImageAlt?: string; banner4Href?: string
  banner5Image?: string; banner5ImageAlt?: string; banner5Href?: string
  banner6Image?: string; banner6ImageAlt?: string; banner6Href?: string
}

const DEFAULT_CONTENT: Required<HeroContent> = {
  badgeText:        "Novo",
  headline:         "Transforme visitantes em %%clientes%%",
  subheadline:      "A solução completa para vender mais, com menos esforço. Comece hoje e veja resultados na primeira semana.",
  ctaLabel:         "Começar agora",
  ctaHref:          "#",
  ctaSecLabel:      "Saber mais",
  ctaSecHref:       "#",
  imageSrc:         "",
  imageAlt:         "",
  videoSrc:         "",
  videoPoster:      "",
  bgVideoSrc:       "",
  bgVideoPoster:    "",
  emailPlaceholder: "Seu melhor email",
  stat1Value: "+10.000", stat1Label: "clientes atendidos",
  stat2Value: "98%",     stat2Label: "de satisfação",
  stat3Value: "4.9",     stat3Label: "avaliação média",
  banner1Image: "", banner1ImageAlt: "", banner1Href: "",
  banner2Image: "", banner2ImageAlt: "", banner2Href: "",
  banner3Image: "", banner3ImageAlt: "", banner3Href: "",
  banner4Image: "", banner4ImageAlt: "", banner4Href: "",
  banner5Image: "", banner5ImageAlt: "", banner5Href: "",
  banner6Image: "", banner6ImageAlt: "", banner6Href: "",
}

// ─── Sub-function props ───────────────────────────────────────────────────────

interface SubProps {
  c:              Required<HeroContent>
  se:             SectionEffects | null
  containerProps: MotionProps
  itemProps:      MotionProps
  accentColor:    string
  badgeVisible:   boolean
  primaryButtonVisible: boolean
  ctaSecVisible:  boolean
  statsVisible:   boolean
  stats:          { value: string; label: string }[]
  rightContent:   string
  isMobile:       boolean
  reducedMotion:  boolean
  // Tipo "carrossel"
  bannerCount:      number
  autoplay:         boolean
  showArrows:       boolean
  showDots:         boolean
  arrowStyle:       ArrowVariant
  heroWidth:        string
  bannersClickable: boolean
}

// ─── HeroVideo — lógica estrutural (vídeo decorativo) ─────────────────────────
// Mudo, loop, playsInline; autoplay só sem prefers-reduced-motion (regra 11 do
// molde — movimento contínuo respeita reduced motion; com ele ativo mostra o
// poster/1º frame). Decorativo: aria-hidden, fora do sistema de efeitos.

function HeroVideo({
  src, poster, reducedMotion, style,
}: { src: string; poster: string; reducedMotion: boolean; style?: React.CSSProperties }) {
  if (!src && !poster) {
    return (
      <div
        style={{
          width:          "100%",
          height:         "100%",
          minHeight:      200,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          background:     "var(--cor-card)",
          color:          "var(--cor-texto-fraco)",
          fontSize:       12,
          fontWeight:     600,
          letterSpacing:  "0.1em",
          textTransform:  "uppercase",
          ...style,
        }}
      >
        Vídeo aqui
      </div>
    )
  }

  return (
    <video
      src={src || undefined}
      poster={poster || undefined}
      autoPlay={!reducedMotion}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}
    />
  )
}

// ─── HeroTextStack — bloco badge + h1 + subtítulo + CTAs/form + stats ─────────
// Compartilhado pelos 4 tipos. O headline é o ÚNICO h1 da página (Heading as="h1").

function HeroTextStack({
  c, se, itemProps, accentColor,
  badgeVisible, primaryButtonVisible, ctaSecVisible, statsVisible, stats,
  isMobile, align, emailCapture,
}: Pick<SubProps, "c" | "se" | "itemProps" | "accentColor" | "badgeVisible" | "primaryButtonVisible" | "ctaSecVisible" | "statsVisible" | "stats" | "isMobile"> & {
  align:        "centro" | "esquerda"
  emailCapture: boolean
}) {
  const isCenter = align === "centro"

  return (
    <>
      {badgeVisible && (
        <div style={{ display: "flex", justifyContent: isCenter ? "center" : "flex-start" }}>
          <HighlightBadge {...itemProps} text={c.badgeText} accentColor={accentColor} />
        </div>
      )}

      <Heading
        {...itemProps}
        as="h1"
        size="grande"
        text={c.headline}
        accentColor={accentColor}
        color="var(--cor-texto)"
      />

      <Text
        {...itemProps}
        text={c.subheadline}
        size="medio"
        color="var(--cor-texto-secundario)"
        style={{ maxWidth: 640, ...(isCenter ? { marginLeft: "auto", marginRight: "auto" } : {}) }}
      />

      {emailCapture ? (
        <motion.form
          {...itemProps}
          onSubmit={(e) => e.preventDefault()}
          style={{
            display:       "flex",
            flexDirection: isMobile ? "column" : "row",
            gap:           10,
            width:         "100%",
            maxWidth:      480,
            ...(isCenter ? { marginLeft: "auto", marginRight: "auto" } : {}),
          }}
        >
          <Input
            type="email"
            placeholder={c.emailPlaceholder}
            ariaLabel={c.emailPlaceholder}
            accentColor={accentColor}
            size="grande"
          />
          <CtaButton
            label={c.ctaLabel}
            hover={se?.button?.hover}
            accentColor={accentColor}
            paddingX={24}
          />
        </motion.form>
      ) : (
        <motion.div
          {...itemProps}
          style={{
            display:        "flex",
            flexDirection:  isMobile ? "column" : "row",
            gap:            12,
            alignItems:     isMobile ? "stretch" : "center",
            justifyContent: isCenter ? "center" : "flex-start",
            flexWrap:       "wrap",
          }}
        >
          {primaryButtonVisible && (
            <CtaButton
              label={c.ctaLabel}
              href={c.ctaHref || undefined}
              hover={se?.button?.hover}
              accentColor={accentColor}
            />
          )}
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
      )}

      {statsVisible && stats.length > 0 && (
        <motion.div
          {...itemProps}
          style={{
            display:        "flex",
            gap:            isMobile ? 24 : 40,
            justifyContent: isCenter ? "center" : "flex-start",
            flexWrap:       "wrap",
            marginTop:      8,
          }}
        >
          {stats.map((stat, i) => (
            <StatNumber
              key={i}
              value={stat.value}
              label={stat.label}
              enabled={se?.counter ?? false}
              accentColor={accentColor}
              align={isCenter ? "centro" : "esquerda"}
            />
          ))}
        </motion.div>
      )}
    </>
  )
}

// ─── Centralizado type ────────────────────────────────────────────────────────

function HeroCentralizado(p: SubProps) {
  return (
    <section id="hero" style={{ padding: "clamp(72px, 10vw, 128px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div
          {...p.containerProps}
          style={{
            display:       "flex",
            flexDirection: "column",
            gap:           24,
            maxWidth:      760,
            margin:        "0 auto",
            textAlign:     "center",
          }}
        >
          <HeroTextStack {...p} align="centro" emailCapture={false} />
        </motion.div>
      </div>
    </section>
  )
}

// ─── Split type (50/50: texto | imagem OU vídeo) ──────────────────────────────

function HeroSplit(p: SubProps) {
  const isVideo = p.rightContent === "video"

  return (
    <section id="hero" style={{ padding: "clamp(72px, 10vw, 128px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div
          {...p.containerProps}
          style={{
            display:       "flex",
            flexDirection: p.isMobile ? "column" : "row",
            gap:           p.isMobile ? 32 : 48,
            alignItems:    "stretch",
          }}
        >
          {/* Esquerda: texto */}
          <div
            style={{
              flex:           p.isMobile ? "1 1 auto" : "1 1 0%",
              display:        "flex",
              flexDirection:  "column",
              gap:            24,
              justifyContent: "center",
              minWidth:       0,
            }}
          >
            <HeroTextStack {...p} align="esquerda" emailCapture={false} />
          </div>

          {/* Direita: imagem ou vídeo (50/50) */}
          <motion.div
            {...p.itemProps}
            style={{
              flex:         p.isMobile ? "1 1 auto" : "1 1 0%",
              minHeight:    p.isMobile ? 240 : 420,
              minWidth:     0,
              borderRadius: 24,
              overflow:     "hidden",
              border:       `1px solid color-mix(in srgb, ${p.accentColor} 14.51%, transparent)`,
            }}
          >
            {isVideo ? (
              <HeroVideo src={p.c.videoSrc} poster={p.c.videoPoster} reducedMotion={p.reducedMotion} />
            ) : (
              <ImageSlot
                src={p.c.imageSrc || undefined}
                alt={p.c.imageAlt}
                entry={p.se?.image?.entry}
                hover={p.se?.image?.hover}
                style={{ height: "100%", width: "100%" }}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Video-bg type (texto sobre vídeo de fundo full-bleed) ────────────────────

function HeroVideoBg(p: SubProps) {
  const hasMedia = !!(p.c.bgVideoSrc || p.c.bgVideoPoster)

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        overflow: "hidden",
        padding:  "clamp(110px, 16vw, 200px) 0",
      }}
    >
      {/* Vídeo de fundo — decorativo, cobre a seção inteira */}
      {hasMedia && (
        <div style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          <HeroVideo src={p.c.bgVideoSrc} poster={p.c.bgVideoPoster} reducedMotion={p.reducedMotion} />
        </div>
      )}

      {/* Overlay escura — garante contraste do texto sobre qualquer vídeo */}
      <div
        aria-hidden="true"
        style={{
          position:   "absolute",
          inset:      0,
          // Overlay derivado de --cor-fundo (mesmo #0D0A08) com alpha via color-mix —
          // acompanha o tema mantendo o mesmo tom de rgba(13,10,8,0.72→0.85).
          background: "linear-gradient(180deg, color-mix(in srgb, var(--cor-fundo) 72%, transparent) 0%, color-mix(in srgb, var(--cor-fundo) 85%, transparent) 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div
          {...p.containerProps}
          style={{
            display:       "flex",
            flexDirection: "column",
            gap:           24,
            maxWidth:      760,
            margin:        "0 auto",
            textAlign:     "center",
          }}
        >
          <HeroTextStack {...p} align="centro" emailCapture={false} />
        </motion.div>
      </div>
    </section>
  )
}

// ─── Input-capture type (headline + subtítulo + email + CTA) ──────────────────

function HeroInputCapture(p: SubProps) {
  return (
    <section id="hero" style={{ padding: "clamp(72px, 10vw, 128px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div
          {...p.containerProps}
          style={{
            display:       "flex",
            flexDirection: "column",
            gap:           24,
            maxWidth:      680,
            margin:        "0 auto",
            textAlign:     "center",
          }}
        >
          <HeroTextStack {...p} align="centro" emailCapture={true} />
        </motion.div>
      </div>
    </section>
  )
}

// ─── Carrossel type (banners de imagem, sem texto) ────────────────────────────
// Único tipo sem <h1> — não tem texto. Lacuna de SEO conhecida e aceita: o h1
// oculto fica como pendência pré-publicação.
//
// O slide é desenhado pelo AnimatePresence (não por translateX), então do
// useCarousel usamos só o ESTADO (index/goNext/goPrev/maxIndex/pauseHandlers);
// itemWidth/gap/trackRef são do padrão de track transladado (ProductGrid) e não
// se aplicam aqui.

const BANNER_VARIANTS = {
  enter:  (dir: number) => ({ x: dir > 0 ? "100%"  : "-100%" }),
  center: { x: "0%" },
  exit:   (dir: number) => ({ x: dir > 0 ? "-100%" : "100%"  }),
}

function HeroCarrossel(p: SubProps) {
  const count = Math.max(1, Math.min(6, p.bannerCount))

  const banners = ([1, 2, 3, 4, 5, 6] as const)
    .map((n) => ({
      src:  p.c[`banner${n}Image`    as keyof HeroContent] as string,
      alt:  p.c[`banner${n}ImageAlt` as keyof HeroContent] as string,
      href: p.c[`banner${n}Href`     as keyof HeroContent] as string,
    }))
    .slice(0, count)

  const car = useCarousel({
    itemCount:    banners.length,
    visibleCount: 1,
    autoplay:     p.autoplay,
    autoplayMs:   5000,
  })
  const { index, maxIndex, goNext, goPrev, setIndex, pauseHandlers } = car

  // Direção do slide — o hook não a expõe. Derivada do delta do índice, tratando
  // os DOIS wraps: sem isso o salto maxIndex→0 do autoplay é lido como "voltou"
  // e a tela rebobina em vez de seguir para frente.
  const prevIndexRef = useRef(0)
  const dirRef       = useRef(1)
  const prev         = prevIndexRef.current
  if (prev !== index) {
    if      (prev === maxIndex && index === 0)       dirRef.current = 1   // wrap p/ frente
    else if (prev === 0       && index === maxIndex) dirRef.current = -1  // wrap p/ trás
    else                                             dirRef.current = index > prev ? 1 : -1
    prevIndexRef.current = index
  }
  const direction = dirRef.current

  const isFull    = p.heroWidth === "total"
  const current   = banners[Math.min(index, banners.length - 1)]

  // Altura do palco. "centralizado" mantém 16/9 (o formato original).
  // "total" (full-width) usa 16/3 no desktop — a MESMA largura sobre 1/3 da altura
  // (16/9 → 16/3 é exatamente 3× mais achatado): vira faixa panorâmica em vez de
  // ocupar a tela inteira. No mobile a largura é pequena, e 16/3 daria uma tira de
  // ~73px em 390px — ilegível; lá o full-width volta ao 16/9.
  const aspectRatio = isFull && !p.isMobile ? "16 / 3" : "16 / 9"
  const hasArrows = p.showArrows && banners.length > 1
  const hasDots   = p.showDots   && banners.length > 1

  const slot = (
    <ImageSlot
      src={current?.src || undefined}
      alt={current?.alt ?? ""}
      entry={p.se?.image?.entry}
      hover={p.se?.image?.hover}
      borderRadius={0}
      style={{ height: "100%" }}
    />
  )

  const body = (
    <motion.div
      {...p.containerProps}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Palco do carrossel — pauseHandlers: autoplay pausa em hover/foco (WCAG 2.2.2) */}
      <motion.div
        {...p.itemProps}
        {...pauseHandlers}
        style={{
          position:     "relative",
          width:        "100%",
          aspectRatio,
          overflow:     "hidden",
          borderRadius: isFull ? 0 : 24,
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={BANNER_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0 }}
          >
            {p.bannersClickable ? (
              <a
                href={current?.href || undefined}
                aria-label={current?.alt || `Banner ${index + 1}`}
                style={{ display: "block", width: "100%", height: "100%" }}
              >
                {slot}
              </a>
            ) : (
              slot
            )}
          </motion.div>
        </AnimatePresence>

        {hasArrows && (
          <>
            <NavArrow
              direction="prev"
              onClick={goPrev}
              accentColor={p.accentColor}
              variant={p.arrowStyle}
              style={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", zIndex: 2 }}
            />
            <NavArrow
              direction="next"
              onClick={goNext}
              accentColor={p.accentColor}
              variant={p.arrowStyle}
              style={{ position: "absolute", top: "50%", right: 16, transform: "translateY(-50%)", zIndex: 2 }}
            />
          </>
        )}
      </motion.div>

      {hasDots && (
        <motion.div {...p.itemProps} style={{ display: "flex", justifyContent: "center" }}>
          <CarouselDots
            total={banners.length}
            active={index}
            onDotClick={setIndex}
            accentColor={p.accentColor}
          />
        </motion.div>
      )}
    </motion.div>
  )

  return (
    <section
      id="hero"
      style={{ padding: isFull ? "0 0 24px" : "clamp(72px, 10vw, 128px) 0" }}
    >
      {isFull ? (
        body
      ) : (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
          {body}
        </div>
      )}
    </section>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface HeroProps {
  type?:        "centralizado" | "split" | "video-bg" | "input-capture" | "carrossel"
  accentColor?: string
  content?:     HeroContent
  [key: string]: unknown
}

export function Hero({
  type        = "centralizado",
  accentColor = "#D4A017",
  content     = {},
}: HeroProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile      = useIsMobile()
  const reducedMotion = useReducedMotion() ?? false

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  const cv            = content as Record<string, unknown>
  const badgeVisible  = (cv.badgeVisible  as boolean | undefined) ?? false
  const primaryButtonVisible = (cv.primaryButtonVisible as boolean | undefined) ?? true
  const ctaSecVisible = (cv.ctaSecVisible as boolean | undefined) ?? false
  const statsVisible  = (cv.statsVisible  as boolean | undefined) ?? false
  const statCount     = (cv.statCount     as number  | undefined) ?? 3
  const rightContent  = (cv.rightContent  as string  | undefined) ?? "imagem"

  // Toggles do tipo "carrossel" — defaults batem com o 1º valor de variations["carrossel"]
  const bannerCount      = (cv.bannerCount      as number  | undefined) ?? 3
  const autoplay         = (cv.autoplay         as boolean | undefined) ?? false
  const showArrows       = (cv.showArrows       as boolean | undefined) ?? true
  const showDots         = (cv.showDots         as boolean | undefined) ?? true
  const arrowStyle       = (cv.arrowStyle       as ArrowVariant | undefined) ?? "circular"
  const heroWidth        = (cv.heroWidth        as string  | undefined) ?? "total"
  const bannersClickable = (cv.bannersClickable as boolean | undefined) ?? false

  const ALL_STATS = [
    { value: c.stat1Value, label: c.stat1Label },
    { value: c.stat2Value, label: c.stat2Label },
    { value: c.stat3Value, label: c.stat3Label },
  ]
  const stats = ALL_STATS.slice(0, Math.max(1, Math.min(3, statCount)))

  const subProps: SubProps = {
    c, se, containerProps, itemProps,
    accentColor, badgeVisible, primaryButtonVisible, ctaSecVisible, statsVisible, stats,
    rightContent, isMobile, reducedMotion,
    bannerCount, autoplay, showArrows, showDots, arrowStyle, heroWidth, bannersClickable,
  }

  switch (type) {
    case "split":         return <HeroSplit        {...subProps} />
    case "video-bg":      return <HeroVideoBg      {...subProps} />
    case "input-capture": return <HeroInputCapture {...subProps} />
    case "carrossel":     return <HeroCarrossel    {...subProps} />
    default:              return <HeroCentralizado {...subProps} />
  }
}
