"use client"

interface StarRatingProps {
  value:       string
  accentColor: string
  size?:       number
}

export function StarRating({ value, accentColor, size = 13 }: StarRatingProps) {
  const num  = Math.max(0, Math.min(5, parseFloat(value) || 0))
  const full = Math.floor(num)
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            // Estrela cheia: accent como GLIFO → tom forte (ver lib/paleta.ts).
            color:   i < full || (i === full && num - full >= 0.5) ? `var(--cor-destaque-texto-forte, ${accentColor})` : "color-mix(in srgb, var(--cor-texto) 20%, transparent)",
            opacity: i === full && num - full >= 0.5 ? 0.6 : 1,
            fontSize: size,
          }}
        >
          ★
        </span>
      ))}
      {value && (
        <span style={{ fontSize: 10, color: "var(--cor-texto-fraco)", marginLeft: 3 }}>
          {num.toFixed(1)}
        </span>
      )}
    </div>
  )
}
