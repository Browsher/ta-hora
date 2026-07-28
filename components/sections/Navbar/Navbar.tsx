"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { buildNavEntryProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { useIsMobile } from "@/lib/useIsMobile"
import { CtaButton } from "@/components/ui/CtaButton"
import { IconeCarrinho } from "@/components/loja/IconeCarrinho"

// ─── Content ──────────────────────────────────────────────────────────────────

interface NavbarContent {
  logoText?:   string
  logoImage?:  string
  link1Label?: string; link1Href?: string
  link2Label?: string; link2Href?: string
  link3Label?: string; link3Href?: string
  link4Label?: string; link4Href?: string
  link5Label?: string; link5Href?: string
  link6Label?: string; link6Href?: string
  ctaLabel?:   string
  ctaHref?:    string
}

const DEFAULT_CONTENT: Required<NavbarContent> = {
  logoText:   "%%Marca%%",
  logoImage:  "",
  link1Label: "Início",    link1Href: "#",
  link2Label: "Recursos",  link2Href: "#recursos",
  link3Label: "Preços",    link3Href: "#precos",
  link4Label: "Sobre",     link4Href: "#sobre",
  link5Label: "Blog",      link5Href: "#blog",
  link6Label: "Contato",   link6Href: "#contato",
  ctaLabel:   "Começar",
  ctaHref:    "#comecar",
}

// ─── Logo text with %%highlight%% parser ──────────────────────────────────────

function LogoText({ text, accentColor }: { text: string; accentColor: string }) {
  const parts = text.split(/(%%[^%]+%%)/g)
  return (
    <span style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--cor-texto)" }}>
      {parts.map((part, i) =>
        part.startsWith("%%") && part.endsWith("%%") ? (
          <span key={i} style={{ color: `var(--cor-destaque-texto-forte, ${accentColor})` }}>{part.slice(2, -2)}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

interface NavbarProps {
  type?:        "barra" | "flutuante"
  accentColor?: string
  content?:     NavbarContent
  [key: string]: unknown
}

export function Navbar({
  type        = "barra",
  accentColor = "#D4A017",
  content     = {},
}: NavbarProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()
  const isMobile = useIsMobile()

  const navEntryProps = buildNavEntryProps(se?.navEntry, mode)

  const cv         = content as Record<string, unknown>
  const linkCount  = Math.min(Math.max((cv.linkCount  as number  | undefined) ?? 4, 1), 6)
  const ctaVisible = (cv.ctaVisible as boolean | undefined) ?? true
  const showLogo   = (cv.showLogo   as boolean | undefined) ?? true
  const logoType   = (cv.logoType   as string  | undefined) ?? "texto"

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMobile) setMenuOpen(false)
  }, [isMobile])

  const ALL_LINKS = [
    { label: c.link1Label, href: c.link1Href },
    { label: c.link2Label, href: c.link2Href },
    { label: c.link3Label, href: c.link3Href },
    { label: c.link4Label, href: c.link4Href },
    { label: c.link5Label, href: c.link5Href },
    { label: c.link6Label, href: c.link6Href },
  ]
  const links = ALL_LINKS.slice(0, linkCount)

  const isFlutuante = type === "flutuante"
  const navPosition = (cv.navPosition as string | undefined) ?? "fixa"
  // fixed só no preview final E quando navPosition="fixa" — Builder/canvas sempre relative
  const isFixed = mode === "preview" && navPosition === "fixa"

  const navStyle: React.CSSProperties = isFlutuante ? {
    position:             isFixed ? "fixed" : "relative",
    ...(isFixed
      ? { top: 12, left: 16, right: 16, zIndex: 1000 }
      : { margin: "12px 16px" }),
    background:           "color-mix(in srgb, var(--cor-superficie) 85%, transparent)",
    backdropFilter:       "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border:               `1px solid color-mix(in srgb, ${accentColor} 13.33%, transparent)`,
    borderRadius:         16,
    padding:              "0 24px",
  } : {
    position:             isFixed ? "fixed" : "relative",
    ...(isFixed ? { top: 0, left: 0, right: 0, zIndex: 1000 } : {}),
    background:           "var(--cor-superficie)",
    borderBottom:         `1px solid color-mix(in srgb, ${accentColor} 9.41%, transparent)`,
    padding:              "0 clamp(20px, 5vw, 48px)",
  }

  const mobileMenuStyle: React.CSSProperties = {
    position:   "absolute",
    top:        "100%",
    left:       0,
    right:      0,
    background: isFlutuante ? "color-mix(in srgb, var(--cor-superficie) 96%, transparent)" : "var(--cor-superficie)",
    borderTop:  `1px solid color-mix(in srgb, ${accentColor} 9.41%, transparent)`,
    borderRadius: isFlutuante ? "0 0 16px 16px" : 0,
    padding:    "8px 0 16px",
    zIndex:     999,
    overflow:   "hidden",
  }

  const linkStyle: React.CSSProperties = {
    fontSize:       14,
    fontWeight:     500,
    color:          "var(--cor-texto-secundario)",
    textDecoration: "none",
    letterSpacing:  "0.01em",
    whiteSpace:     "nowrap",
  }

  return (
    <motion.nav
      {...navEntryProps}
      style={navStyle}
    >
      <div style={{
        display:     "flex",
        alignItems:  "center",
        height:      64,
        gap:         32,
      }}>
        {/* Logo */}
        {showLogo && (
          <a href="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center" }}>
            {logoType === "imagem" && c.logoImage ? (
              <img
                src={c.logoImage}
                alt={c.logoText.replace(/%%/g, "") || "Logo"}
                style={{ height: 32, objectFit: "contain" }}
              />
            ) : (
              <LogoText text={c.logoText} accentColor={accentColor} />
            )}
          </a>
        )}

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 28, flex: 1, justifyContent: "center" }}>
            {links.map((link, idx) => (
              <a key={idx} href={link.href} style={linkStyle}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Right side: carrinho + CTA + hamburger */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
          {/*
            Ícone do carrinho — ADITIVO: nenhuma prop nova, o contrato
            type/variation/content/accentColor do PreviewContent segue intacto e
            os JSONs não precisam migrar.

            ⚠️ FORA do gate `!isMobile`, de propósito. No mobile esta navbar
            esconde o CTA e mostra só o hambúrguer; se o ícone entrasse junto do
            CtaButton, o carrinho ficaria INACESSÍVEL no celular — e o build não
            pegaria isso. O ícone é a única entrada do carrinho em toda página.

            Fora do CarrinhoProvider ele renderiza `null`, então a Navbar continua
            montável isolada (como StoreShell e PreviewContent já assumem).
          */}
          <IconeCarrinho accentColor={accentColor} />

          {!isMobile && ctaVisible && (
            <CtaButton
              label={c.ctaLabel}
              href={c.ctaHref}
              accentColor={accentColor}
              hover={se?.button?.hover}
              paddingX={20}
            />
          )}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              style={{
                background:   "none",
                // Esta borda é o ÚNICO contorno do botão (background: none) —
                // identificação de controle, não decoração (WCAG 1.4.11) → tom forte.
                border:       `1px solid color-mix(in srgb, var(--cor-destaque-texto-forte, ${accentColor}) 20.78%, transparent)`,
                borderRadius: 6,
                padding:      "6px 10px",
                color:        `var(--cor-destaque-texto-forte, ${accentColor})`,
                fontSize:     18,
                cursor:       "pointer",
                lineHeight:   1,
              }}
            >
              <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={mobileMenuStyle}
          >
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  ...linkStyle,
                  display:  "block",
                  padding:  "12px 24px",
                  fontSize: 15,
                }}
              >
                {link.label}
              </a>
            ))}
            {ctaVisible && (
              <div style={{ padding: "8px 24px 0" }}>
                <CtaButton
                  label={c.ctaLabel}
                  href={c.ctaHref}
                  accentColor={accentColor}
                  hover={se?.button?.hover}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
