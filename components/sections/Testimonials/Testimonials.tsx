"use client"

import { motion, type MotionProps } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { ImageSlot } from "@/components/ui/ImageSlot"
import { TiltCard } from "@/components/ui/TiltCard"
import { useCarousel } from "@/lib/useCarousel"
import { NavArrow } from "@/components/ui/NavArrow"
import { CarouselDots } from "@/components/ui/CarouselDots"
import { StarRating } from "@/components/ui/StarRating"
import type { SectionEffects } from "@/lib/types"

// ─── Content ─────────────────────────────────────────────────────────────────

interface TestimonialsContent {
  sectionLabel?: string
  headline?:     string
  testimonial1Text?:   string; testimonial1Name?:   string; testimonial1Role?:   string; testimonial1Avatar?:   string; testimonial1Rating?: string
  testimonial2Text?:   string; testimonial2Name?:   string; testimonial2Role?:   string; testimonial2Avatar?:   string; testimonial2Rating?: string
  testimonial3Text?:   string; testimonial3Name?:   string; testimonial3Role?:   string; testimonial3Avatar?:   string; testimonial3Rating?: string
  testimonial4Text?:   string; testimonial4Name?:   string; testimonial4Role?:   string; testimonial4Avatar?:   string; testimonial4Rating?: string
  testimonial5Text?:   string; testimonial5Name?:   string; testimonial5Role?:   string; testimonial5Avatar?:   string; testimonial5Rating?: string
  testimonial6Text?:   string; testimonial6Name?:   string; testimonial6Role?:   string; testimonial6Avatar?:   string; testimonial6Rating?: string
  testimonial7Text?:   string; testimonial7Name?:   string; testimonial7Role?:   string; testimonial7Avatar?:   string; testimonial7Rating?: string
  testimonial8Text?:   string; testimonial8Name?:   string; testimonial8Role?:   string; testimonial8Avatar?:   string; testimonial8Rating?: string
}

const DEFAULT_CONTENT: Required<TestimonialsContent> = {
  sectionLabel: "Depoimentos",
  headline:     "O que nossos %%clientes%% dizem",
  testimonial1Text:   "Este produto mudou completamente a forma como trabalho. Recomendo a todos que buscam eficiência real.",
  testimonial1Name:   "Ana Silva",      testimonial1Role: "CEO · Empresa X",      testimonial1Avatar: "", testimonial1Rating: "5",
  testimonial2Text:   "Suporte incrível e entrega rápida. A qualidade superou todas as minhas expectativas.",
  testimonial2Name:   "Carlos Souza",   testimonial2Role: "Designer · Studio Y",  testimonial2Avatar: "", testimonial2Rating: "5",
  testimonial3Text:   "Investimento que se paga rapidamente. Resultados reais desde o primeiro mês de uso.",
  testimonial3Name:   "Mariana Lima",   testimonial3Role: "Fundadora · StartZ",   testimonial3Avatar: "", testimonial3Rating: "4",
  testimonial4Text:   "A equipe de suporte é excepcional. Sempre disponível e extremamente prestativa.",
  testimonial4Name:   "Roberto Alves",  testimonial4Role: "CTO · Tech Corp",      testimonial4Avatar: "", testimonial4Rating: "5",
  testimonial5Text:   "Nunca pensei que seria tão simples. A curva de aprendizado é mínima e os resultados imediatos.",
  testimonial5Name:   "Fernanda Costa", testimonial5Role: "Gerente · Marca W",    testimonial5Avatar: "", testimonial5Rating: "4",
  testimonial6Text:   "Economizei horas de trabalho semanalmente. Vale cada centavo do investimento feito.",
  testimonial6Name:   "Lucas Martins",  testimonial6Role: "Freelancer",           testimonial6Avatar: "", testimonial6Rating: "5",
  testimonial7Text:   "A melhor decisão para o meu negócio. Resultados consistentes e completamente mensuráveis.",
  testimonial7Name:   "Isabela Rocha",  testimonial7Role: "Diretora · AgênciaQ",  testimonial7Avatar: "", testimonial7Rating: "5",
  testimonial8Text:   "Produto confiável com atualizações constantes. A equipe ouve o feedback dos usuários.",
  testimonial8Name:   "Thiago Mendes",  testimonial8Role: "Dev · Soluções Tech",  testimonial8Avatar: "", testimonial8Rating: "4",
}

// ─── Testimonial ──────────────────────────────────────────────────────────────

interface Testimonial {
  text:   string
  name:   string
  role:   string
  avatar: string
  rating: string
}

// ─── AvatarBlock — 1ª aparição, inline ───────────────────────────────────────
// foto → ImageSlot circular; iniciais (ou sem foto) → círculo accentColor com iniciais

interface AvatarBlockProps {
  testimonial: Testimonial
  accentColor: string
  avatarStyle: string
  se:          SectionEffects | null
  size?:       number
}

function AvatarBlock({ testimonial, accentColor, avatarStyle, se, size = 44 }: AvatarBlockProps) {
  const usePhoto = avatarStyle === "foto" && !!testimonial.avatar

  if (usePhoto) {
    return (
      <ImageSlot
        src={testimonial.avatar}
        alt={testimonial.name}
        entry={se?.image?.entry}
        hover={se?.image?.hover}
        style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0 }}
      />
    )
  }

  const initials = testimonial.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0] ?? "")
    .join("")
    .toUpperCase() || "?"

  return (
    <div style={{
      width:           size,
      height:          size,
      borderRadius:    "50%",
      flexShrink:      0,
      background:      accentColor,
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      fontSize:        Math.round(size * 0.35),
      fontWeight:      700,
      color:           "var(--cor-destaque-texto)",
    }}>
      {initials}
    </div>
  )
}

// ─── TestimonialCard (grid / carrossel / destaque) ────────────────────────────

interface TestimonialCardProps {
  testimonial: Testimonial
  se:          SectionEffects | null
  accentColor: string
  showRating:  boolean
  showAvatar:  boolean
  showRole:    boolean
  avatarStyle: string
  featured?:   boolean
}

function TestimonialCard({
  testimonial, se, accentColor, showRating, showAvatar, showRole, avatarStyle, featured,
}: TestimonialCardProps) {
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
        gap:           16,
        padding:       featured ? "32px 36px" : "22px 24px",
        height:        "100%",
      }}
    >
      {/* Aspas decorativas */}
      <span style={{
        fontSize:   featured ? 48 : 32,
        lineHeight: 1,
        color:      `color-mix(in srgb, ${accentColor} 31.37%, transparent)`,
        fontFamily: "Georgia, serif",
        marginBottom: -8,
        display:    "block",
      }}>
        "
      </span>

      {/* Quote text */}
      <Text
        text={testimonial.text}
        size={featured ? "medio" : "pequeno"}
        color="var(--cor-texto)"
        style={{ flex: 1, margin: 0 }}
      />

      {showRating && testimonial.rating && (
        <StarRating value={testimonial.rating} accentColor={accentColor} />
      )}

      {/* Footer: avatar + nome + cargo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
        {showAvatar && (
          <AvatarBlock
            testimonial={testimonial}
            accentColor={accentColor}
            avatarStyle={avatarStyle}
            se={se}
            size={featured ? 52 : 40}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <Text
            text={testimonial.name}
            size="pequeno"
            color="var(--cor-texto)"
            style={{ fontWeight: 600, margin: 0 }}
          />
          {showRole && testimonial.role && (
            <Text
              text={testimonial.role}
              size="pequeno"
              color="var(--cor-texto-fraco)"
              style={{ margin: 0 }}
            />
          )}
        </div>
      </div>
    </TiltCard>
  )
}

// ─── Sub-function props ───────────────────────────────────────────────────────

interface SubProps {
  c:              Required<TestimonialsContent>
  se:             SectionEffects | null
  containerProps: MotionProps
  itemProps:      MotionProps
  accentColor:    string
  testimonials:   Testimonial[]
  showRating:     boolean
  showAvatar:     boolean
  showRole:       boolean
  avatarStyle:    string
  autoplay:       boolean
  showArrows:     boolean
  showDots:       boolean
  isMobile:       boolean
}

// ─── Shared header ────────────────────────────────────────────────────────────

function TestimonialsHeader({ c, itemProps, accentColor }: Pick<SubProps, "c" | "itemProps" | "accentColor">) {
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
// Cards em auto-fit. minmax 280px → colunas naturais no desktop, empilha no mobile.

function TestimonialsGrid({
  c, se, containerProps, itemProps, accentColor,
  testimonials, showRating, showAvatar, showRole, avatarStyle, isMobile,
}: SubProps) {
  return (
    <section id="testimonials" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <TestimonialsHeader c={c} itemProps={itemProps} accentColor={accentColor} />

        <motion.div
          {...itemProps}
          style={{
            display:             "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "260px" : "280px"}, 1fr))`,
            gap:                 isMobile ? 14 : 20,
          }}
        >
          {testimonials.map((t, i) => (
            <TestimonialCard
              key={i}
              testimonial={t}
              se={se}
              accentColor={accentColor}
              showRating={showRating}
              showAvatar={showAvatar}
              showRole={showRole}
              avatarStyle={avatarStyle}
            />
          ))}
        </motion.div>
      </motion.div>
      </div>
    </section>
  )
}

// ─── Lista type ───────────────────────────────────────────────────────────────
// Depoimentos em linhas horizontais planas, sem TiltCard.
// Mobile: avatar+nome em cima, texto abaixo (coluna).
// Nota: cards.hover não se aplica (sem TiltCard).

function TestimonialsLista({
  c, se, containerProps, itemProps, accentColor,
  testimonials, showRating, showAvatar, showRole, avatarStyle, isMobile,
}: SubProps) {
  return (
    <section id="testimonials" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <TestimonialsHeader c={c} itemProps={itemProps} accentColor={accentColor} />

        <motion.div {...itemProps} style={{ display: "flex", flexDirection: "column" }}>
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{
                borderTop:     `1px solid color-mix(in srgb, ${accentColor} 9.41%, transparent)`,
                padding:       isMobile ? "28px 0" : "36px 0",
                display:       "flex",
                flexDirection: isMobile ? "column" : "row",
                gap:           isMobile ? 16 : 40,
                alignItems:    "flex-start",
              }}
            >
              {/* Esquerda: avatar + nome + cargo + stars */}
              <div style={{
                flexShrink:    0,
                width:         isMobile ? "auto" : 190,
                display:       "flex",
                flexDirection: "row",
                alignItems:    "center",
                gap:           12,
              }}>
                {showAvatar && (
                  <AvatarBlock
                    testimonial={t}
                    accentColor={accentColor}
                    avatarStyle={avatarStyle}
                    se={se}
                    size={44}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <Text text={t.name}  size="pequeno" color="var(--cor-texto)" style={{ fontWeight: 600, margin: 0 }} />
                  {showRole && t.role && (
                    <Text text={t.role} size="pequeno" color="var(--cor-texto-fraco)" style={{ margin: 0 }} />
                  )}
                  {showRating && t.rating && (
                    <StarRating value={t.rating} accentColor={accentColor} />
                  )}
                </div>
              </div>

              {/* Direita: texto do depoimento */}
              <div style={{ flex: 1 }}>
                <Text
                  text={`"${t.text}"`}
                  size="medio"
                  color="var(--cor-texto)"
                  style={{ margin: 0 }}
                />
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid color-mix(in srgb, ${accentColor} 9.41%, transparent)` }} />
        </motion.div>
      </motion.div>
      </div>
    </section>
  )
}

// ─── Carrossel type ───────────────────────────────────────────────────────────
// Navegável com setas + dots. 2 visíveis no desktop, 1 no mobile.
// 2ª aparição do padrão de carrossel (1ª em ProductGrid).
// ⚑ CANDIDATO A EXTRAÇÃO: lib/useCarousel + components/ui/NavArrow + components/ui/CarouselDots

function TestimonialsCarrossel({
  c, se, containerProps, itemProps, accentColor,
  testimonials, showRating, showAvatar, showRole, avatarStyle,
  autoplay, showArrows, showDots, isMobile,
}: SubProps) {
  const VISIBLE = Math.min(isMobile ? 1 : 2, testimonials.length)

  const { index, maxIndex, itemWidth, gap, trackRef, goNext, goPrev, setIndex, pauseHandlers } = useCarousel({
    itemCount:    testimonials.length,
    visibleCount: VISIBLE,
    autoplay,
    autoplayMs:   4000,
  })

  return (
    <section id="testimonials" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <TestimonialsHeader c={c} itemProps={itemProps} accentColor={accentColor} />

        <motion.div {...itemProps} {...pauseHandlers} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Track */}
          <div ref={trackRef} style={{ overflow: "hidden" }}>
            <motion.div
              animate={{ x: itemWidth > 0 ? -(index * (itemWidth + gap)) : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ display: "flex", gap }}
            >
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  style={{
                    width:      itemWidth > 0 ? itemWidth : "auto",
                    flexShrink: 0,
                    minWidth:   itemWidth > 0 ? undefined : `calc((100% - ${gap * (VISIBLE - 1)}px) / ${VISIBLE})`,
                  }}
                >
                  <TestimonialCard
                    testimonial={t}
                    se={se}
                    accentColor={accentColor}
                    showRating={showRating}
                    showAvatar={showAvatar}
                    showRole={showRole}
                    avatarStyle={avatarStyle}
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Controls */}
          {(showArrows || showDots) && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 24 }}>
              {showArrows && <NavArrow direction="prev" onClick={goPrev} accentColor={accentColor} />}
              {showDots && <CarouselDots total={maxIndex + 1} active={index} onDotClick={setIndex} accentColor={accentColor} />}
              {showArrows && <NavArrow direction="next" onClick={goNext} accentColor={accentColor} />}
            </div>
          )}
        </motion.div>
      </motion.div>
      </div>
    </section>
  )
}

// ─── Destaque type ────────────────────────────────────────────────────────────
// Primeiro depoimento em destaque (grande, centrado). Restantes em grade abaixo.

function TestimonialsDestaque({
  c, se, containerProps, itemProps, accentColor,
  testimonials, showRating, showAvatar, showRole, avatarStyle, isMobile,
}: SubProps) {
  const [featured, ...rest] = testimonials

  return (
    <section id="testimonials" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
      <motion.div {...containerProps} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <TestimonialsHeader c={c} itemProps={itemProps} accentColor={accentColor} />

        {/* Depoimento em destaque */}
        <motion.div
          {...itemProps}
          style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}
        >
          <TestimonialCard
            testimonial={featured}
            se={se}
            accentColor={accentColor}
            showRating={showRating}
            showAvatar={showAvatar}
            showRole={showRole}
            avatarStyle={avatarStyle}
            featured
          />
        </motion.div>

        {/* Restantes em grade */}
        {rest.length > 0 && (
          <motion.div
            {...itemProps}
            style={{
              display:             "grid",
              gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "240px" : "260px"}, 1fr))`,
              gap:                 isMobile ? 12 : 16,
            }}
          >
            {rest.map((t, i) => (
              <TestimonialCard
                key={i}
                testimonial={t}
                se={se}
                accentColor={accentColor}
                showRating={showRating}
                showAvatar={showAvatar}
                showRole={showRole}
                avatarStyle={avatarStyle}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
      </div>
    </section>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface TestimonialsProps {
  type?:        "grid" | "lista" | "carrossel" | "destaque"
  accentColor?: string
  content?:     TestimonialsContent
  [key: string]: unknown
}

export function Testimonials({
  type        = "grid",
  accentColor = "#D4A017",
  content     = {},
}: TestimonialsProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile = useIsMobile()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  const cv               = content as Record<string, unknown>
  const testimonialCount = (cv.testimonialCount as number  | undefined) ?? 3
  const showRating       = (cv.showRating       as boolean | undefined) ?? false
  const showAvatar       = (cv.showAvatar       as boolean | undefined) ?? true
  const avatarStyle      = (cv.avatarStyle      as string  | undefined) ?? "foto"
  const showRole         = (cv.showRole         as boolean | undefined) ?? true
  const autoplay         = (cv.autoplay         as boolean | undefined) ?? false
  const showArrows       = (cv.showArrows       as boolean | undefined) ?? true
  const showDots         = (cv.showDots         as boolean | undefined) ?? true

  const ALL_TESTIMONIALS: Testimonial[] = [
    { text: c.testimonial1Text, name: c.testimonial1Name, role: c.testimonial1Role, avatar: c.testimonial1Avatar, rating: c.testimonial1Rating },
    { text: c.testimonial2Text, name: c.testimonial2Name, role: c.testimonial2Role, avatar: c.testimonial2Avatar, rating: c.testimonial2Rating },
    { text: c.testimonial3Text, name: c.testimonial3Name, role: c.testimonial3Role, avatar: c.testimonial3Avatar, rating: c.testimonial3Rating },
    { text: c.testimonial4Text, name: c.testimonial4Name, role: c.testimonial4Role, avatar: c.testimonial4Avatar, rating: c.testimonial4Rating },
    { text: c.testimonial5Text, name: c.testimonial5Name, role: c.testimonial5Role, avatar: c.testimonial5Avatar, rating: c.testimonial5Rating },
    { text: c.testimonial6Text, name: c.testimonial6Name, role: c.testimonial6Role, avatar: c.testimonial6Avatar, rating: c.testimonial6Rating },
    { text: c.testimonial7Text, name: c.testimonial7Name, role: c.testimonial7Role, avatar: c.testimonial7Avatar, rating: c.testimonial7Rating },
    { text: c.testimonial8Text, name: c.testimonial8Name, role: c.testimonial8Role, avatar: c.testimonial8Avatar, rating: c.testimonial8Rating },
  ]
  const testimonials = ALL_TESTIMONIALS.slice(0, Math.max(1, Math.min(8, testimonialCount)))

  const subProps: SubProps = {
    c, se, containerProps, itemProps,
    accentColor, testimonials, showRating, showAvatar, showRole, avatarStyle,
    autoplay, showArrows, showDots, isMobile,
  }

  if (type === "lista")     return <TestimonialsLista     {...subProps} />
  if (type === "carrossel") return <TestimonialsCarrossel {...subProps} />
  if (type === "destaque")  return <TestimonialsDestaque  {...subProps} />
  return <TestimonialsGrid {...subProps} />
}
