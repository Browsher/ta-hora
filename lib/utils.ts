import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Luminância relativa WCAG (sRGB → linear). Base do cálculo de ratio de contraste.
function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Escolhe preto ou branco pelo MAIOR ratio de contraste WCAG contra o fundo.
// (A luma simples com threshold 0.5 escolhia branco em fundos como #E53935,
// onde o ratio ficava abaixo de 4.5:1 — preto contrasta mais nesses casos.)
export function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const L = relativeLuminance(r, g, b)
  const ratioVsBlack = (L + 0.05) / 0.05
  const ratioVsWhite = 1.05 / (L + 0.05)
  return ratioVsBlack >= ratioVsWhite ? "#000000" : "#ffffff"
}

// Extrai número e sufixo de valores como "3.2x", "98%", "14d", "R$12"
export function parseCounterValue(raw: string): { num: number; suffix: string; prefix: string } {
  const match = raw.trim().match(/^([^0-9]*)(\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) return { num: 0, suffix: raw, prefix: "" }
  return {
    num:    parseFloat(match[2].replace(",", ".")),
    suffix: match[3].trim(),
    prefix: match[1].trim(),
  }
}