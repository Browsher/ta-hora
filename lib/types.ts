import type { Paleta } from "@/lib/paleta"

export type EditableFieldType = "text" | "textarea" | "color" | "image" | "url" | "ancora"

// ─── Tipos de efeito por elemento (novos) ─────────────────────────────────────

export type BadgeEntry       = "fade" | "subir" | "nenhum"
export type TitleEntry       = "fade" | "subir" | "nenhum"
export type CardEntry        = "stagger" | "scroll-reveal" | "nenhum"
export type CardHover        = "subir" | "escalar" | "tilt-3d" | "borda" | "glass" | "nenhum"
export type ButtonHover      = "levantar" | "pressionar" | "fill" | "slide" | "glow" | "magnetico" | "nenhum"
export type ButtonSecHover   = "levantar" | "pressionar" | "fill" | "slide" | "glow" | "magnetico" | "nenhum"
export type IconHover        = "rotacionar" | "escalar" | "bounce" | "glow" | "spin" | "nenhum"
export type ImageEntry       = "reveal-clip" | "fade" | "nenhum"
export type ImageHover       = "zoom" | "overlay" | "nenhum"
export type NavEntryEffect    = "slide-down" | "fade" | "nenhum"
export type FooterEntryEffect = "fade" | "subir" | "nenhum"
export type FooterLinkHover   = "cor" | "sublinhado" | "nenhum"

export interface SectionEffects {
  preset:         EffectsPreset
  sectionEntry?:  SectionEntryEffect   // stagger cascade da seção inteira
  badge?:         { entry: BadgeEntry }  // legado — mantido para scroll-reveal individual e compat
  title?:         { entry: TitleEntry }  // legado — mantido para compat
  cards?:        { entry: CardEntry; hover: CardHover }
  button?:       { hover: ButtonHover }
  buttonSec?:    { hover: ButtonSecHover }
  icons?:        { hover: IconHover }
  image?:        { entry: ImageEntry; hover: ImageHover }
  background?:   BackgroundSettings
  counter?:      boolean
  navEntry?:     NavEntryEffect
  footerEntry?:  FooterEntryEffect
  footerLinks?:  { hover: FooterLinkHover }
}

export interface GlobalEffectsSettings {
  smoothScroll:  boolean
  parallax:      ParallaxIntensity
  cursor:        CursorStyle
  globalPreset?: EffectsPreset
}

export interface DependsOnCondition {
  field: string       // chave em section.content ou section.variations
  value: unknown      // valor de comparação
  operator?: "eq" | "gte"  // default "eq"
}

export interface EditableField {
  type: EditableFieldType
  label: string
  textLevel?: "h1" | "h2" | "h3" | "h4" | "body" | "small"
  defaultValue?: string
  group?: string
  dependsOn?: DependsOnCondition | DependsOnCondition[]
  // OR: visível se PELO MENOS UMA condição bater (combinável com dependsOn, que é AND).
  // Ex.: campos do timer do CTAFinal aparecem com showTimer=true OU rightContent="countdown".
  dependsOnAny?: DependsOnCondition[]
  // Quando um toggle muda o TIPO do campo (ex: emoji→imagem, url→âncora).
  // O primeiro item cuja condição bater sobrescreve `type`. Senão, usa o type base.
  typeWhen?: { field: string; value: unknown; type: EditableFieldType }[]
}

export interface ComponentEntry {
  types:               string[]
  variations:          Record<string, Record<string, unknown[]>>
  // controles de variação que só aparecem quando uma condição bate
  // ex: iconPosition só aparece quando cardStyle="card" E iconVisible=true
  variationDependsOn?: Record<string, DependsOnCondition | DependsOnCondition[]>
  editable:            Record<string, EditableField>
}

export interface LayoutSection {
  id: string
  component: string
  type: string
  variation: string
  effect: string
  content: Record<string, unknown>
  effects?: SectionEffects
  paddingTop?: number
  paddingBottom?: number
}

// ─── Effects types ────────────────────────────────────────────────────────────

export type SectionEntryEffect = "fade" | "subir" | "direita" | "esquerda" | "zoom" | "nenhum"
export type CardEntryEffect    = "stagger" | "scroll-reveal" | "nenhum"
export type ImageEntryEffect   = "reveal-clip" | "fade" | "nenhum"
export type TitleEntryEffect   = "typewriter" | "scroll-reveal" | "nenhum"
export type IconEntryEffect    = "stagger" | "fade" | "nenhum"

export type CardInteraction   = "subir" | "escalar" | "borda" | "glass" | "tilt-3d" | "revelar-info" | "nenhum"
export type ButtonInteraction = "pressionar" | "levantar" | "fill-sutil" | "slide-fill" | "glow" | "icone-desliza" | "nenhum"
export type ImageInteraction  = "zoom" | "overlay" | "nenhum"
export type IconInteraction   = "rotacionar" | "escalar" | "bounce" | "glow" | "spin" | "nenhum"

export type AnimatedBackground  = "aurora" | "mesh-gradient" | "orbs" | "starfield" | "beam" | "nenhum"
export type BackgroundIntensity = "suave" | "medio" | "intenso"
export type ParallaxIntensity   = "sutil" | "medio" | "forte" | "nenhum"

export interface BackgroundSettings {
  type:      AnimatedBackground
  intensity: BackgroundIntensity
}

/** Normalises legacy string format (pre-intensity) or new object format. Returns undefined for "nenhum"/absent. */
export function migrateBackground(bg: unknown): BackgroundSettings | undefined {
  if (!bg) return undefined
  const REMOVED = new Set(["noise-grain", "nenhum"])
  if (typeof bg === "string") {
    if (REMOVED.has(bg)) return undefined
    return { type: bg as AnimatedBackground, intensity: "medio" }
  }
  if (typeof bg === "object" && bg !== null && "type" in bg) {
    const b = bg as Partial<BackgroundSettings>
    if (!b.type || REMOVED.has(b.type)) return undefined
    return { type: b.type, intensity: b.intensity ?? "medio" }
  }
  return undefined
}
export type CursorStyle        = "ponto" | "circulo" | "nenhum"
export type EffectsPreset      = "suave" | "profissional" | "dinamico" | "nenhum" | "personalizado"

/** @deprecated use SectionEffects.title.entry */
export interface EntryEffects {
  sections: SectionEntryEffect
  cards:    CardEntryEffect
  images:   ImageEntryEffect
  titles:   TitleEntryEffect
  icons:    IconEntryEffect
}

/** @deprecated use SectionEffects.cards / button / icons */
export interface InteractionEffects {
  cards:   CardInteraction
  buttons: ButtonInteraction
  images:  ImageInteraction
  icons:   IconInteraction
}

/** @deprecated use GlobalEffectsSettings */
export interface GlobalEffects {
  parallax:     ParallaxIntensity
  counter:      boolean
  smoothScroll: boolean
  magneticCta:  boolean
  cursor:       CursorStyle
  typewriter:   boolean
}

/** @deprecated use GlobalEffectsSettings (globalSettings.effects) and SectionEffects (per section) */
export interface EffectsSettings {
  preset:      EffectsPreset
  entry:       EntryEffects
  interaction: InteractionEffects
  backgrounds: Record<string, AnimatedBackground>
  globals:     GlobalEffects
}

// ─── Global settings ──────────────────────────────────────────────────────────

export interface GlobalSettings {
  effects?: GlobalEffectsSettings
  /** Nome do estilo aplicado — rótulo/"✓ Ativo" e fallback de compat. NÃO é a fonte da verdade. */
  estilo?: string
  /** Paleta CARIMBADA no layout (as 9 cores copiadas do estilo ao aplicar). Fonte da verdade. */
  paleta?: Paleta
}

export interface Layout {
  id: string
  name: string
  template: string
  updatedAt: string
  sections: LayoutSection[]
  globalSettings?: GlobalSettings

  // ─── Multipágina (spec `multipagina`) ───────────────────────────────────────
  // TODOS OPCIONAIS: os JSONs antigos (sem estes campos) continuam válidos e
  // abrem sem migração. Um Layout sem `siteId` é uma Landing — o caminho de hoje.
  /** Ausente ⇒ "landing" (compat retroativa). */
  kind?:   "landing" | "site-page"
  /** A que Site esta página pertence. A página declara o vínculo; o Site não
   *  guarda lista de páginas (fonte única da verdade — não dessincroniza). */
  siteId?: string
  /** "" na home; "sobre", "politica-privacidade" nas demais. Vira caminho de
   *  diretório no export — validado por lib/slug.ts. */
  slug?:   string
  /** Marcação explícita da home (NÃO um slug "/", que contradiria a regra de
   *  "sem barras"). Invariante: exatamente uma por Site. */
  isHome?: boolean
  /** Posição na árvore/listagens — NÃO na rota (rotas estáticas não têm ordem). */
  order?:  number
}

export interface LayoutMeta {
  id: string
  name: string
  template: string
  updatedAt: string
  kind?:   "landing" | "site-page"
  siteId?: string
  slug?:   string
  isHome?: boolean
  order?:  number
}

// ─── Site (agrupamento de páginas) ────────────────────────────────────────────
// Uma PÁGINA continua sendo um `Layout`. O Site é a camada de agrupamento por
// cima, guardando o que é COMPARTILHADO entre as páginas.
//
// `navbar`/`footer` são `LayoutSection` — o MESMO tipo das seções de página. É
// isso que permite reusar TypeTab/FlatSectionContent/SectionEffectsPanel sem
// adaptação. Os efeitos da navbar (navEntry) moram em `site.navbar.effects`.
//
// `globalSettings` do Site carrega paleta E efeitos globais (parallax/cursor/
// smoothScroll) — num Site, ambos pertencem ao Site, não à página.

export interface Site {
  id: string
  name: string
  updatedAt: string
  globalSettings?: GlobalSettings
  navbar?: LayoutSection
  footer?: LayoutSection
}

export interface SiteMeta {
  id: string
  name: string
  updatedAt: string
}
