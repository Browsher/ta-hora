"use client"

import { motion, type MotionProps } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { IconSlot } from "@/components/ui/IconSlot"
import { contrastColor } from "@/lib/utils"

// ─── Content ──────────────────────────────────────────────────────────────────

interface CanaisSuporteContent {
  rotulo?:             string
  titulo?:             string
  subtitulo?:          string
  whatsappNumero?:     string
  whatsappMensagem?:   string
  whatsappTitulo?:     string
  whatsappDescricao?:  string
  whatsappBotaoLabel?: string
  emailTitulo?:        string
  emailEndereco?:      string
  instagramTitulo?:    string
  instagramUsuario?:   string
  instagramUrl?:       string
  horarioTexto?:       string
}

// Fonte AUTORITATIVA do texto desta seção. O layouts/suporte.json copia daqui —
// não reescrever lá, senão as duas versões divergem sem ninguém notar.
const DEFAULT_CONTENT: Required<CanaisSuporteContent> = {
  rotulo:             "SUPORTE",
  titulo:             "Como podemos ajudar?",
  subtitulo:          "Estamos aqui pra tirar suas dúvidas antes e depois da compra",
  // Só dígitos, com DDI. O wa.me NÃO aceita máscara: "+55 (11) 98418-8541" quebra o link.
  whatsappNumero:     "5511984188541",
  // Texto CRU. O encode acontece na renderização (ver hrefWhatsApp) — guardar já
  // encodado transformaria uma edição futura em armadilha.
  whatsappMensagem:   "Olá, sou cliente do Ta Hora, preciso de um suporte",
  whatsappTitulo:     "Fale com a gente pelo WhatsApp",
  whatsappDescricao:  "É o jeito mais rápido de resolver. Chame que a gente responde no horário de atendimento.",
  whatsappBotaoLabel: "Falar no WhatsApp",
  emailTitulo:        "E-mail",
  emailEndereco:      "icamera6688@gmail.com",
  instagramTitulo:    "Instagram",
  instagramUsuario:   "@tahora.com.br",
  instagramUrl:       "https://instagram.com/tahora.com.br",
  horarioTexto:       "Atendimento: Segunda a Sexta, 9h às 18h",
}

// ─── Ícones de marca ──────────────────────────────────────────────────────────
//
// SVG inline, e não IconSlot, porque a `lucide-react` instalada (1.24) REMOVEU os
// ícones de marca: `LucideIcons.Instagram` é `undefined`. O IconSlot não falha
// nesse caso — cai no ramo de emoji/texto e renderiza a STRING "instagram" dentro
// do quadrado, sem erro e sem warning. Mail e Clock continuam existindo e seguem
// pelo IconSlot normalmente.
//
// currentColor: herdam a cor do contexto (corSobreAccent no bloco laranja, accent
// no card) em vez de fixar hex — o tema continua mandando.

function IconeWhatsApp({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function IconeInstagram({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0m0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324M12 16a4 4 0 110-8 4 4 0 010 8m6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881" />
    </svg>
  )
}

// ─── Layout tokens da seção ───────────────────────────────────────────────────
// Mesmo container das demais seções (1200px + padding fluido) — ver FAQ.tsx.

const CONTAINER: React.CSSProperties = {
  maxWidth: 1200,
  margin:   "0 auto",
  padding:  "0 clamp(20px, 5vw, 64px)",
}

// ─── Cabeçalho ────────────────────────────────────────────────────────────────

function Cabecalho({
  c,
  itemProps,
  accentColor,
}: {
  c:           Required<CanaisSuporteContent>
  itemProps:   MotionProps
  accentColor: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionLabel {...itemProps} text={c.rotulo} accentColor={accentColor} />
      {/* ÚNICO h1 da página: não há Hero nesta rota disputando o papel. */}
      <Heading
        {...itemProps}
        as="h1"
        size="grande"
        text={c.titulo}
        accentColor={accentColor}
        color="var(--cor-texto)"
      />
      <Text
        {...itemProps}
        size="grande"
        text={c.subtitulo}
        color="var(--cor-texto-secundario)"
      />
    </div>
  )
}

// ─── WhatsApp em destaque ─────────────────────────────────────────────────────

function DestaqueWhatsApp({
  c,
  itemProps,
  accentColor,
  corSobreAccent,
}: {
  c:              Required<CanaisSuporteContent>
  itemProps:      MotionProps
  accentColor:    string
  corSobreAccent: string
}) {
  // encodeURIComponent é determinístico → mesmo valor no pré-render e na
  // hidratação, sem risco de mismatch. Ele é OBRIGATÓRIO aqui: a mensagem tem
  // acento e vírgula, que corromperiam o parâmetro `text` se fossem crus.
  const hrefWhatsApp = `https://wa.me/${c.whatsappNumero}?text=${encodeURIComponent(c.whatsappMensagem)}`

  return (
    <motion.div
      {...itemProps}
      style={{
        background:    accentColor,
        borderRadius:  24,
        padding:       "clamp(28px, 4vw, 44px)",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "flex-start",
        gap:           16,
        color:         corSobreAccent,
      }}
    >
      <IconeWhatsApp />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{
          fontSize:   "clamp(20px, 2.8vw, 30px)",
          fontWeight: 700,
          lineHeight: 1.25,
        }}>
          {c.whatsappTitulo}
        </span>
        {/* color explícito: o Text default herdaria a cor do tema (clara), e o
            fundo aqui é o accent sólido. */}
        <Text size="medio" text={c.whatsappDescricao} color={corSobreAccent} />
      </div>
      {/*
        <a> próprio, e não CtaButton: o tipo dele é Omit<MotionProps, "ref"> e não
        declara `target`/`rel` — passá-los seria erro de TS. Alargar um primitivo
        usado pela Navbar e por várias seções por causa de uma tela seria risco
        desproporcional.
        Sem aria-label: o texto visível já nomeia o link (aria-label duplicaria
        o anúncio no leitor de tela).
      */}
      <a
        href={hrefWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             10,
          background:      corSobreAccent,
          color:           accentColor,
          borderRadius:    100,
          padding:         "14px 28px",
          fontSize:        15,
          fontWeight:      700,
          textDecoration:  "none",
        }}
      >
        <IconeWhatsApp size={18} />
        {c.whatsappBotaoLabel}
      </a>
    </motion.div>
  )
}

// ─── Cards dos canais secundários ─────────────────────────────────────────────

function CardCanal({
  titulo,
  valor,
  href,
  icone,
  accentColor,
  externo,
}: {
  titulo:      string
  valor:       string
  href:        string
  icone:       React.ReactNode
  accentColor: string
  externo:     boolean
}) {
  return (
    <a
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={{
        // var(--cor-card) JÁ É o gradiente: paletaToVars passa o slot `card` por
        // cardGradient() (lib/paleta.ts). Escrever o linear-gradient à mão aqui
        // duplicaria o tema e dessincronizaria dos cards do FAQ logo abaixo.
        background:      "var(--cor-card)",
        border:          `1px solid color-mix(in srgb, ${accentColor} 12.55%, transparent)`,
        borderRadius:    12,
        padding:         "24px 28px",
        display:         "flex",
        alignItems:      "center",
        gap:             16,
        textDecoration:  "none",
      }}
    >
      <span style={{ color: `var(--cor-destaque-texto-forte, ${accentColor})`, display: "inline-flex", flexShrink: 0 }}>
        {icone}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span style={{
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          // Rótulo do card, sobre var(--cor-card) = TEXTO.
          color:         `var(--cor-destaque-texto-forte, ${accentColor})`,
        }}>
          {titulo}
        </span>
        {/* overflowWrap: e-mail longo não estoura o card em tela estreita. */}
        <span style={{
          fontSize:     "clamp(14px, 1.6vw, 16px)",
          fontWeight:   600,
          color:        "var(--cor-texto)",
          overflowWrap: "anywhere",
        }}>
          {valor}
        </span>
      </span>
    </a>
  )
}

function CardsCanais({
  c,
  itemProps,
  accentColor,
}: {
  c:           Required<CanaisSuporteContent>
  itemProps:   MotionProps
  accentColor: string
}) {
  return (
    <motion.div
      {...itemProps}
      style={{
        display:             "grid",
        // auto-fit + minmax: empilha sozinho em tela estreita, sem media query.
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap:                 24,
      }}
    >
      <CardCanal
        titulo={c.emailTitulo}
        valor={c.emailEndereco}
        href={`mailto:${c.emailEndereco}`}
        icone={<IconSlot icon="mail" size={22} aria-hidden="true" />}
        accentColor={accentColor}
        externo={false}
      />
      <CardCanal
        titulo={c.instagramTitulo}
        valor={c.instagramUsuario}
        href={c.instagramUrl}
        icone={<IconeInstagram />}
        accentColor={accentColor}
        externo
      />
    </motion.div>
  )
}

// ─── Faixa de horário ─────────────────────────────────────────────────────────

function FaixaHorario({
  c,
  itemProps,
  accentColor,
}: {
  c:           Required<CanaisSuporteContent>
  itemProps:   MotionProps
  accentColor: string
}) {
  return (
    <motion.div
      {...itemProps}
      style={{
        display:    "flex",
        alignItems: "center",
        gap:        10,
      }}
    >
      {/* Decorativo: o texto ao lado já carrega a informação. */}
      <IconSlot icon="clock" size={16} color={`var(--cor-destaque-texto-forte, ${accentColor})`} aria-hidden="true" />
      {/* texto-fraco = alpha 0.55, o piso permitido sobre fundo escuro. */}
      <Text size="pequeno" text={c.horarioTexto} color="var(--cor-texto-fraco)" />
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CanaisSuporteProps {
  type?:        string
  accentColor?: string
  content?:     CanaisSuporteContent
  [key: string]: unknown
}

export function CanaisSuporte({
  accentColor = "#D4A017",
  content     = {},
}: CanaisSuporteProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  // Texto sobre o accent SÓLIDO. NÃO usar var(--cor-destaque-texto): a paleta do
  // site carimba #ffffff nesse token, e branco sobre #ff8903 dá 2.38:1 — reprova
  // no WCAG AA. contrastColor devolve #000000 (8.83:1).
  //
  // O ramo var(--cor-fundo) é o caminho normal (o PreviewContent passa
  // var(--cor-destaque) quando o JSON não fixa um hex) e ASSUME uma paleta de
  // fundo escuro — verdade em todas as paletas do site hoje. Numa paleta de fundo
  // claro este bloco precisa ser reavaliado.
  const corSobreAccent = accentColor.startsWith("#")
    ? contrastColor(accentColor)
    : "var(--cor-fundo)"

  return (
    <section id="suporte" style={{ padding: "clamp(48px, 6vw, 72px) 0" }}>
      <div style={CONTAINER}>
        <motion.div
          {...containerProps}
          style={{ display: "flex", flexDirection: "column", gap: 40 }}
        >
          <Cabecalho c={c} itemProps={itemProps} accentColor={accentColor} />
          <DestaqueWhatsApp
            c={c}
            itemProps={itemProps}
            accentColor={accentColor}
            corSobreAccent={corSobreAccent}
          />
          <CardsCanais c={c} itemProps={itemProps} accentColor={accentColor} />
          <FaixaHorario c={c} itemProps={itemProps} accentColor={accentColor} />
        </motion.div>
      </div>
    </section>
  )
}
