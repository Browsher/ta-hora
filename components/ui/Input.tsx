"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type React from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputProps = {
  type?:        string
  placeholder?: string
  value?:       string
  onChange?:    (e: React.ChangeEvent<HTMLInputElement>) => void
  accentColor?: string
  size?:        "medio" | "grande"
  ariaLabel?:   string
  className?:   string
  style?:       React.CSSProperties
}

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE_STYLE: Record<"medio" | "grande", React.CSSProperties> = {
  medio:  { fontSize: 13, padding: "9px 12px" },
  grande: { fontSize: 15, padding: "11px 14px" },
}

// ─── Component ────────────────────────────────────────────────────────────────
//
// Plain HTML input — no Framer Motion, no entry/hover effects.
// Focus border uses React state (onFocus/onBlur) instead of CSS :focus-visible
// to avoid needing a <style> tag injection.

export function Input({
  type        = "email",
  placeholder = "Seu melhor email",
  value,
  onChange,
  accentColor = "#D4A017",
  size        = "medio",
  ariaLabel,
  className,
  style,
}: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(className)}
      style={{
        ...SIZE_STYLE[size],
        flex:         1,
        width:        "100%",
        borderRadius: 8,
        background:   "color-mix(in srgb, var(--cor-texto) 5%, transparent)",
        border:       `1px solid ${focused ? accentColor : "color-mix(in srgb, var(--cor-texto) 10%, transparent)"}`,
        color:        "var(--cor-texto)",
        outline:      "none",
        transition:   "border-color 0.15s ease",
        ...style,
      }}
    />
  )
}
