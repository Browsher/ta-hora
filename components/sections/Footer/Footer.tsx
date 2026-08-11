"use client"

import { useState } from "react"
import { motion, type MotionProps } from "framer-motion"
import { buildFooterEntryProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { Input } from "@/components/ui/Input"
import { CtaButton } from "@/components/ui/CtaButton"
import { IconSlot } from "@/components/ui/IconSlot"
import type { SectionEffects } from "@/lib/types"

// ─── Content ──────────────────────────────────────────────────────────────────

interface FooterContent {
  logoText?:    string
  logoImage?:   string
  description?: string

  column1Title?:      string
  column1Link1Label?: string; column1Link1Href?: string
  column1Link2Label?: string; column1Link2Href?: string
  column1Link3Label?: string; column1Link3Href?: string
  column1Link4Label?: string; column1Link4Href?: string

  column2Title?:      string
  column2Link1Label?: string; column2Link1Href?: string
  column2Link2Label?: string; column2Link2Href?: string
  column2Link3Label?: string; column2Link3Href?: string
  column2Link4Label?: string; column2Link4Href?: string

  column3Title?:      string
  column3Link1Label?: string; column3Link1Href?: string
  column3Link2Label?: string; column3Link2Href?: string
  column3Link3Label?: string; column3Link3Href?: string
  column3Link4Label?: string; column3Link4Href?: string

  column4Title?:      string
  column4Link1Label?: string; column4Link1Href?: string
  column4Link2Label?: string; column4Link2Href?: string
  column4Link3Label?: string; column4Link3Href?: string
  column4Link4Label?: string; column4Link4Href?: string

  newsletterLabel?:       string
  newsletterPlaceholder?: string
  newsletterCta?:         string

  social1Icon?: string; social1Href?: string
  social2Icon?: string; social2Href?: string
  social3Icon?: string; social3Href?: string
  social4Icon?: string; social4Href?: string

  copyright?: string
}

// Defaults da LOJA (não de template SaaS). Todo layout em layouts/*.json pode
// sobrescrever qualquer chave; o que não sobrescrever cai aqui. Regra do bloco:
// nenhum default aponta para destino inexistente — link cujo destino ainda não
// existe entra com label "" e some via .filter(l => l.label) do buildColumns.
const DEFAULT_CONTENT: Required<FooterContent> = {
  logoText:    "TA%%Hora%%",
  logoImage:   "",
  description: "Câmeras de segurança Wi-Fi originais, com nota fiscal e entrega para todo o Brasil.",

  column1Title:      "Loja",
  column1Link1Label: "Catálogo",         column1Link1Href: "/catalogo",
  column1Link2Label: "Sobre Nós",        column1Link2Href: "/sobre-nos",
  column1Link3Label: "Suporte",          column1Link3Href: "/suporte",
  column1Link4Label: "",                 column1Link4Href: "",

  // Os LABELS desta coluna são sobrescritos pelos layouts ("Seja um Afiliado",
  // "Política de privacidade", "Termos de uso"); os HREFS não — vivem só aqui.
  // Era daqui que saíam os #blog / #carreiras que apontavam para lugar nenhum.
  column2Title:      "Empresa",
  // Link1: os layouts rotulam este item como "Seja um Afiliado". O destino é
  // EXTERNO de propósito — a landing do programa vive em domínio próprio
  // (afiliados.tahora.com.br), não em uma rota deste site. Não trocar por path
  // relativo tipo "/afiliados": essa rota não existe e não está planejada.
  // Mesma aba (sem target="_blank"): é jornada de mão única, quem vai se
  // cadastrar não volta para continuar comprando.
  column2Link1Label: "Seja um Afiliado", column2Link1Href: "https://afiliados.tahora.com.br",
  column2Link2Label: "Política de privacidade", column2Link2Href: "/politica-de-privacidade",
  column2Link3Label: "Termos de uso",    column2Link3Href: "/termos-de-uso",
  column2Link4Label: "Trocas e devoluções",     column2Link4Href: "/trocas-e-devolucoes",

  column3Title:      "Suporte",
  column3Link1Label: "Fale com a gente", column3Link1Href: "/suporte",
  column3Link2Label: "",                 column3Link2Href: "",
  column3Link3Label: "",                 column3Link3Href: "",
  column3Link4Label: "",                 column3Link4Href: "",

  // Preenchida quando /politica-de-privacidade e /termos-de-uso existirem.
  column4Title:      "Legal",
  column4Link1Label: "",                 column4Link1Href: "",
  column4Link2Label: "",                 column4Link2Href: "",
  column4Link3Label: "",                 column4Link3Href: "",
  column4Link4Label: "",                 column4Link4Href: "",

  newsletterLabel:       "Receba as ofertas por email",
  newsletterPlaceholder: "Seu melhor email",
  newsletterCta:         "Assinar",

  social1Icon: "instagram", social1Href: "https://instagram.com/tahora.com.br",
  social2Icon: "",          social2Href: "",
  social3Icon: "",          social3Href: "",
  social4Icon: "",          social4Href: "",

  // 🔴 NAP (Name-Address-Phone) — OS TRÊS, e o telefone é o mais fácil de perder.
  //
  // O "P" entrou em 11/08/2026: até então o rodapé trazia razão social, CNPJ e
  // endereço, sem telefone nenhum — ele só existia dentro do `CanaisSuporte`, na
  // página /suporte. NAP sem o P não é NAP: a consistência dos TRÊS entre site,
  // marketplaces e diretórios é o sinal que o Google usa para casar a entidade.
  //
  // ⚠️ ESTES DADOS TÊM UMA SEGUNDA FONTE: `lib/seo/organizacaoSchema.ts` afirma
  // os mesmos fatos em JSON-LD (`legalName`, `taxID`, `address`, `telephone`).
  // Mudou um deles? Mude nos DOIS lugares — schema que diverge do que a página
  // mostra é sinal de baixa confiança, não de nenhuma.
  //
  // O telefone aqui é o MESMO número do WhatsApp (`whatsappNumero` em
  // CanaisSuporte.tsx e em layouts/suporte.json), só que em formato humano. Lá
  // ele é "5511984188541" porque o wa.me não aceita máscara.
  copyright: "© 2026 Ta Hora — CH CFTV & Eletrônicos — CNPJ 46.340.461/0001-04 — Rua André de Leão, 78, Brás, São Paulo/SP, CEP 03101-010 — (11) 98418-8541",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ColData { title: string; links: { label: string; href: string }[] }

function buildColumns(c: Required<FooterContent>, count: number): ColData[] {
  return [
    {
      title: c.column1Title,
      links: [
        { label: c.column1Link1Label, href: c.column1Link1Href },
        { label: c.column1Link2Label, href: c.column1Link2Href },
        { label: c.column1Link3Label, href: c.column1Link3Href },
        { label: c.column1Link4Label, href: c.column1Link4Href },
      ].filter(l => l.label),
    },
    {
      title: c.column2Title,
      links: [
        { label: c.column2Link1Label, href: c.column2Link1Href },
        { label: c.column2Link2Label, href: c.column2Link2Href },
        { label: c.column2Link3Label, href: c.column2Link3Href },
        { label: c.column2Link4Label, href: c.column2Link4Href },
      ].filter(l => l.label),
    },
    {
      title: c.column3Title,
      links: [
        { label: c.column3Link1Label, href: c.column3Link1Href },
        { label: c.column3Link2Label, href: c.column3Link2Href },
        { label: c.column3Link3Label, href: c.column3Link3Href },
        { label: c.column3Link4Label, href: c.column3Link4Href },
      ].filter(l => l.label),
    },
    {
      title: c.column4Title,
      links: [
        { label: c.column4Link1Label, href: c.column4Link1Href },
        { label: c.column4Link2Label, href: c.column4Link2Href },
        { label: c.column4Link3Label, href: c.column4Link3Href },
        { label: c.column4Link4Label, href: c.column4Link4Href },
      ].filter(l => l.label),
    },
  ].slice(0, count)
}

function buildSocials(c: Required<FooterContent>) {
  return [
    { icon: c.social1Icon, href: c.social1Href },
    { icon: c.social2Icon, href: c.social2Href },
    { icon: c.social3Icon, href: c.social3Href },
    { icon: c.social4Icon, href: c.social4Href },
  ].filter(s => s.icon && s.href)
}

// ─── FooterLink — hover cor/sublinhado via estado local ───────────────────────

function FooterLink({
  href, label, hover, accentColor,
}: { href: string; label: string; hover: string | undefined; accentColor: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        "block",
        fontSize:       13,
        lineHeight:     1.7,
        cursor:         "pointer",
        textDecoration: hover === "sublinhado" && hovered ? "underline" : "none",
        // Link em hover = TEXTO.
        color:          hover === "cor" && hovered ? `var(--cor-destaque-texto-forte, ${accentColor})` : "var(--cor-texto-fraco)",
        transition:     "color 0.15s ease",
      }}
    >
      {label}
    </a>
  )
}

// ─── LogoArea ─────────────────────────────────────────────────────────────────

function LogoArea({
  c, showLogo, logoType, accentColor,
}: { c: Required<FooterContent>; showLogo: boolean; logoType: string; accentColor: string }) {
  if (!showLogo) return null
  if (logoType === "imagem" && c.logoImage) {
    return <img src={c.logoImage} alt={c.logoText.replace(/%%/g, "") || "Logo"} style={{ height: 32, objectFit: "contain", display: "block" }} />
  }
  return (
    <Heading as="h2" size="pequeno" text={c.logoText} accentColor={accentColor} color="var(--cor-texto)" />
  )
}

// ─── Column block ─────────────────────────────────────────────────────────────

function ColumnBlock({
  col, linkHover, accentColor,
}: { col: ColData; linkHover: string | undefined; accentColor: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{
        fontSize:      11,
        fontWeight:    700,
        color:         "var(--cor-texto)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        margin:        0,
      }}>
        {col.title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {col.links.map((link, i) => (
          <FooterLink key={i} href={link.href} label={link.label} hover={linkHover} accentColor={accentColor} />
        ))}
      </div>
    </div>
  )
}

// ─── Social icons bar ─────────────────────────────────────────────────────────

function SocialBar({
  socials, se,
}: { socials: { icon: string; href: string }[]; se: SectionEffects | null }) {
  if (socials.length === 0) return null
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      {socials.map((s, i) => (
        <a
          key={i}
          href={s.href}
          aria-label={/^[a-z][a-z-]*$/i.test(s.icon) ? s.icon.charAt(0).toUpperCase() + s.icon.slice(1) : `Rede social ${i + 1}`}
          style={{ display: "inline-flex" }}
        >
          <IconSlot icon={s.icon} size={18} color="var(--cor-texto-fraco)" hover={se?.icons?.hover} />
        </a>
      ))}
    </div>
  )
}

// ─── Bottom divider (social + copyright) ─────────────────────────────────────

function BottomBar({
  c, se, isMobile, showSocial, socials,
}: { c: Required<FooterContent>; se: SectionEffects | null; isMobile: boolean; showSocial: boolean; socials: ReturnType<typeof buildSocials> }) {
  return (
    <div style={{
      borderTop:      "1px solid var(--cor-borda)",
      padding:        "20px 0 28px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      flexDirection:  isMobile ? "column" : "row",
      gap:            isMobile ? 16 : 0,
    }}>
      <Text text={c.copyright} size="pequeno" color="var(--cor-texto-fraco)" />
      {showSocial && <SocialBar socials={socials} se={se} />}
    </div>
  )
}

// ─── Sub-function props ───────────────────────────────────────────────────────

interface FooterSubProps {
  c:                Required<FooterContent>
  se:               SectionEffects | null
  isMobile:         boolean
  accentColor:      string
  columnCount:      number
  showNewsletter:   boolean
  showSocial:       boolean
  showLogo:         boolean
  logoType:         string
  footerEntryProps: MotionProps
}

// ─── TIPO completo ────────────────────────────────────────────────────────────

function FooterCompleto({
  c, se, isMobile, accentColor, columnCount, showNewsletter,
  showSocial, showLogo, logoType, footerEntryProps,
}: FooterSubProps) {
  const linkHover = se?.footerLinks?.hover as string | undefined
  const columns   = buildColumns(c, columnCount)
  const socials   = buildSocials(c)

  return (
    <motion.footer
      {...footerEntryProps}
      style={{
        background: "var(--cor-fundo)",
        borderTop:  "1px solid var(--cor-borda)",
        padding:    "clamp(48px, 6vw, 72px) clamp(20px, 5vw, 64px) 0",
      }}
    >
      {/* Main grid: left col + link columns */}
      <div style={{
        display:             isMobile ? "flex" : "grid",
        flexDirection:       isMobile ? "column" : undefined,
        gridTemplateColumns: isMobile ? undefined : `minmax(200px, 260px) repeat(${columnCount}, 1fr)`,
        gap:                 isMobile ? 40 : 48,
        marginBottom:        isMobile ? 40 : 56,
      }}>
        {/* Left: logo + desc + newsletter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <LogoArea c={c} showLogo={showLogo} logoType={logoType} accentColor={accentColor} />
          <Text text={c.description} size="pequeno" color="var(--cor-texto-fraco)" />
          {showNewsletter && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <Text text={c.newsletterLabel} size="pequeno" color="var(--cor-texto-secundario)" />
              <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 8 }}>
                <Input
                  type="email"
                  placeholder={c.newsletterPlaceholder}
                  ariaLabel={c.newsletterLabel}
                  accentColor={accentColor}
                />
                <CtaButton
                  label={c.newsletterCta}
                  accentColor={accentColor}
                  hover={se?.button?.hover}
                  paddingX={16}
                />
              </form>
            </div>
          )}
        </div>

        {/* Link columns */}
        {columns.map((col, idx) => (
          <ColumnBlock key={idx} col={col} linkHover={linkHover} accentColor={accentColor} />
        ))}
      </div>

      <BottomBar c={c} se={se} isMobile={isMobile} showSocial={showSocial} socials={socials} />
    </motion.footer>
  )
}

// ─── TIPO compacto ────────────────────────────────────────────────────────────

function FooterCompacto({
  c, se, isMobile, accentColor, columnCount,
  showSocial, showLogo, logoType, footerEntryProps,
}: FooterSubProps) {
  const linkHover = se?.footerLinks?.hover as string | undefined
  const columns   = buildColumns(c, columnCount)
  const socials   = buildSocials(c)

  return (
    <motion.footer
      {...footerEntryProps}
      style={{
        background: "var(--cor-fundo)",
        borderTop:  "1px solid var(--cor-borda)",
        padding:    "clamp(36px, 5vw, 56px) clamp(20px, 5vw, 64px) 0",
      }}
    >
      {/* Logo + columns */}
      <div style={{
        display:             isMobile ? "flex" : "grid",
        flexDirection:       isMobile ? "column" : undefined,
        gridTemplateColumns: isMobile ? undefined : `auto repeat(${columnCount}, 1fr)`,
        gap:                 isMobile ? 36 : 48,
        alignItems:          "start",
        marginBottom:        isMobile ? 36 : 48,
      }}>
        <div>
          <LogoArea c={c} showLogo={showLogo} logoType={logoType} accentColor={accentColor} />
        </div>
        {columns.map((col, idx) => (
          <ColumnBlock key={idx} col={col} linkHover={linkHover} accentColor={accentColor} />
        ))}
      </div>

      <BottomBar c={c} se={se} isMobile={isMobile} showSocial={showSocial} socials={socials} />
    </motion.footer>
  )
}

// ─── TIPO minimal ─────────────────────────────────────────────────────────────

function FooterMinimal({
  c, se, isMobile, accentColor,
  showSocial, showLogo, logoType, footerEntryProps,
}: FooterSubProps) {
  const linkHover = se?.footerLinks?.hover as string | undefined
  const col1      = buildColumns(c, 1)[0]
  const socials   = buildSocials(c)

  return (
    <motion.footer
      {...footerEntryProps}
      style={{
        background: "var(--cor-fundo)",
        borderTop:  "1px solid var(--cor-borda)",
        padding:    "20px clamp(20px, 5vw, 64px)",
      }}
    >
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        flexDirection:  isMobile ? "column" : "row",
        gap:            isMobile ? 20 : 32,
      }}>
        {/* Logo + flat links */}
        <div style={{
          display:       "flex",
          alignItems:    isMobile ? "center" : "center",
          gap:           isMobile ? 12 : 28,
          flexWrap:      "wrap",
          flexDirection: isMobile ? "column" : "row",
        }}>
          <LogoArea c={c} showLogo={showLogo} logoType={logoType} accentColor={accentColor} />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {col1.links.map((link, i) => (
              <FooterLink key={i} href={link.href} label={link.label} hover={linkHover} accentColor={accentColor} />
            ))}
          </div>
        </div>

        {/* Social + copyright */}
        <div style={{
          display:       "flex",
          alignItems:    "center",
          gap:           16,
          flexDirection: isMobile ? "column" : "row",
        }}>
          {showSocial && <SocialBar socials={socials} se={se} />}
          <Text text={c.copyright} size="pequeno" color="var(--cor-texto-fraco)" />
        </div>
      </div>
    </motion.footer>
  )
}

// ─── Footer (main) ────────────────────────────────────────────────────────────

interface FooterProps {
  type?:        "completo" | "compacto" | "minimal"
  accentColor?: string
  content?:     FooterContent
  [key: string]: unknown
}

export function Footer({
  type        = "completo",
  accentColor = "#D4A017",
  content     = {},
}: FooterProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile = useIsMobile()

  const footerEntryProps = buildFooterEntryProps(se?.footerEntry, mode)

  const cv             = content as Record<string, unknown>
  const columnCount    = Math.min(Math.max((cv.columnCount    as number  | undefined) ?? 3, 1), 4)
  const showNewsletter = (cv.showNewsletter as boolean | undefined) ?? true
  const showSocial     = (cv.showSocial    as boolean | undefined) ?? true
  const showLogo       = (cv.showLogo      as boolean | undefined) ?? true
  const logoType       = (cv.logoType      as string  | undefined) ?? "texto"

  const sharedProps: FooterSubProps = {
    c, se, isMobile, accentColor, columnCount,
    showNewsletter, showSocial, showLogo, logoType, footerEntryProps,
  }

  if (type === "minimal")  return <FooterMinimal  {...sharedProps} />
  if (type === "compacto") return <FooterCompacto {...sharedProps} />
  return <FooterCompleto {...sharedProps} />
}
