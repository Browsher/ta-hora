import type { Paleta } from "@/lib/paleta"

// ─── Sistema de Estilos ───────────────────────────────────────────────────────
//
// Paletas nomeadas que o usuário escolhe na etapa Personalizar (aba "Cores").
// O layout guarda apenas o NOME do estilo em globalSettings.estilo; getPaleta()
// resolve o nome nas 9 cores. Nome ausente/inválido → null (paleta de fábrica).
//
// Cada estilo é um objeto Paleta (mesma interface de lib/paleta.ts) com as 9
// chaves. "Elegante" replica EXATAMENTE o :root de globals.css (a fábrica atual)
// — um layout sem estilo e um com "elegante" devem ficar visualmente idênticos.

export interface Estilo {
  nome:   string
  paleta: Paleta
}

export const ESTILOS: Record<string, Estilo> = {
  elegante: {
    nome: "Elegante",
    // Paleta de fábrica (:root em app/globals.css). O card guarda a COR BASE —
    // o gradiente é derivado na renderização (cardGradient em lib/paleta.ts).
    paleta: {
      fundo:           "#0D0A08",
      superficie:      "#141210",
      card:            "#1c1508",
      borda:           "#252015",
      texto:           "#E8DCC8",
      textoSecundario: "rgba(232, 220, 200, 0.7)",
      textoFraco:      "rgba(232, 220, 200, 0.55)",
      destaque:        "#D4A017",
      destaqueTexto:   "#000000",
    },
  },
  minimalista: {
    nome: "Minimalista",
    paleta: {
      fundo:           "#FAFAF8",
      superficie:      "#F0EFEB",
      card:            "#FFFFFF",
      borda:           "#E2E0DA",
      texto:           "#1A1A1A",
      textoSecundario: "#5A5A57",
      textoFraco:      "#8E8B85",
      destaque:        "#2563EB",
      destaqueTexto:   "#FFFFFF",
    },
  },
  neon: {
    nome: "Neon",
    paleta: {
      fundo:           "#0A0A12",
      superficie:      "#13131F",
      card:            "#16162a",
      borda:           "#2A2A40",
      texto:           "#EAEAFF",
      textoSecundario: "#9A9AB8",
      textoFraco:      "#6A6A85",
      destaque:        "#00E5FF",
      destaqueTexto:   "#0A0A12",
    },
  },
  retro: {
    nome: "Retro",
    paleta: {
      fundo:           "#F4ECD8",
      superficie:      "#EBE0C7",
      card:            "#FFFFFF",
      borda:           "#D9C9A3",
      texto:           "#3D2E1F",
      textoSecundario: "#6B5842",
      textoFraco:      "#9A8568",
      destaque:        "#C25E33",
      destaqueTexto:   "#FFFFFF",
    },
  },
  industrial: {
    nome: "Industrial",
    paleta: {
      fundo:           "#EDEDEA",
      superficie:      "#DEDEDA",
      card:            "#FFFFFF",
      borda:           "#C8C8C2",
      texto:           "#1F1F1D",
      textoSecundario: "#55554F",
      textoFraco:      "#88887F",
      destaque:        "#C0392B",
      destaqueTexto:   "#FFFFFF",
    },
  },
  natural: {
    nome: "Natural",
    paleta: {
      fundo:           "#F3F1EA",
      superficie:      "#E7E4D8",
      card:            "#FFFFFF",
      borda:           "#D2CDBB",
      texto:           "#2A2E24",
      textoSecundario: "#565B4C",
      textoFraco:      "#8A8D7C",
      destaque:        "#5F7355",
      destaqueTexto:   "#FFFFFF",
    },
  },
  moderno: {
    nome: "Moderno",
    paleta: {
      fundo:           "#FAFAFA",
      superficie:      "#F0F0F0",
      card:            "#FFFFFF",
      borda:           "#E4E4E4",
      texto:           "#141414",
      textoSecundario: "#565656",
      textoFraco:      "#8C8C8C",
      destaque:        "#FF4D2E",
      destaqueTexto:   "#FFFFFF",
    },
  },
  maximalista: {
    nome: "Maximalista",
    paleta: {
      fundo:           "#FBF7F0",
      superficie:      "#F3E8F5",
      card:            "#FFFFFF",
      borda:           "#E0C8E5",
      texto:           "#2D1B3D",
      textoSecundario: "#6B4A7A",
      textoFraco:      "#9A7AA8",
      destaque:        "#EC4899",
      destaqueTexto:   "#FFFFFF",
    },
  },
}

// Resolve o nome do estilo na paleta. Nome ausente ou desconhecido → null
// (o consumidor cai no fallback de fábrica: PALETA_ATIVA / :root).
export function getPaleta(nome?: string): Paleta | null {
  if (!nome) return null
  return ESTILOS[nome]?.paleta ?? null
}
