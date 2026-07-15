import type { CSSProperties } from "react"

// ─── Paleta de tema (sistema de "Estilos") ────────────────────────────────────
//
// Uma paleta sobrescreve as variáveis --cor-* num WRAPPER que envolve só o
// conteúdo da página renderizada (PreviewContent e SectionCanvas) — NUNCA no
// :root. O :root (globals.css) permanece como paleta de fábrica/fallback e é o
// que pinta a UI do builder; o tema do site só pinta a página sendo criada.
//
// PALETA_ATIVA é o fallback padrão (null = fábrica). As paletas nomeadas do
// sistema de Estilos vivem em lib/estilos.ts; o layout escolhe uma por nome
// (globalSettings.estilo) e PreviewContent/SectionCanvas a resolvem.

export interface Paleta {
  fundo?:           string
  superficie?:      string
  card?:            string
  borda?:           string
  texto?:           string
  textoSecundario?: string
  textoFraco?:      string
  destaque?:        string
  destaqueTexto?:   string
}

// ─── Card: cor base → gradiente derivado ─────────────────────────────────────
// O slot `card` guarda UMA cor base (hex simples, editável no ColorField).
// O gradiente (160deg, base → base escurecida 8%) é DERIVADO na renderização —
// nunca salvo montado. Compat: valores legados que já são gradiente (JSONs
// antigos carimbados; :root de fábrica) passam direto, preservando a aparência.
export function cardGradient(card: string): string {
  if (card.includes("gradient")) return card // legado: gradiente pronto
  return `linear-gradient(160deg, ${card} 0%, color-mix(in srgb, ${card} 92%, black) 100%)`
}

// Base editável do card: extrai o 1º hex de um gradiente legado; hex passa direto.
export function cardBase(card: string): string {
  if (!card.includes("gradient")) return card
  return card.match(/#[0-9a-fA-F]{3,8}/)?.[0] ?? card
}

// Mapa slot → variável CSS. Usado por paletaToVars e pelo preview AO VIVO da
// edição de cor (ColorsPanel seta a var direto no DOM durante o arrasto do
// picker, sem passar pelo setState global — evita o loop que quebrava o gesto).
export const PALETA_VARS: Record<keyof Paleta, string> = {
  fundo:           "--cor-fundo",
  superficie:      "--cor-superficie",
  card:            "--cor-card",
  borda:           "--cor-borda",
  texto:           "--cor-texto",
  textoSecundario: "--cor-texto-secundario",
  textoFraco:      "--cor-texto-fraco",
  destaque:        "--cor-destaque",
  destaqueTexto:   "--cor-destaque-texto",
}

// Converte a paleta em CSS custom properties para o style do wrapper.
// Só emite as chaves presentes — as ausentes herdam do :root (fábrica).
// Uso interno (via paletaWrapperStyle); sem consumidor externo → não exportada.
function paletaToVars(p: Paleta | null): CSSProperties | undefined {
  if (!p) return undefined
  const vars: Record<string, string> = {}
  for (const slot of Object.keys(PALETA_VARS) as Array<keyof Paleta>) {
    const valor = p[slot]
    if (valor) vars[PALETA_VARS[slot]] = slot === "card" ? cardGradient(valor) : valor
  }
  return vars as CSSProperties
}

// Style completo do wrapper da página: as variáveis + fundo + cor de texto.
// O background é necessário porque o body continua com a paleta de fábrica
// (:root); com uma paleta ativa, é o wrapper que pinta o "chão" da página.
// O color é necessário porque herança de CSS propaga o VALOR computado do
// body (fábrica), não a referência à variável — sem re-declarar color aqui,
// textos sem cor explícita herdariam o creme de fábrica mesmo no tema claro.
export function paletaWrapperStyle(p: Paleta | null): CSSProperties | undefined {
  const vars = paletaToVars(p)
  if (!vars) return undefined
  return { ...vars, background: "var(--cor-fundo)", color: "var(--cor-texto)" }
}

// Fallback padrão do tema: null = paleta de fábrica (o :root escuro vale sozinho).
// Os estilos nomeados (claro/escuro) ficam em lib/estilos.ts.
export const PALETA_ATIVA: Paleta | null = null
