"use client"

interface CarouselDotsProps {
  total:       number
  active:      number
  onDotClick:  (i: number) => void
  accentColor: string
}

export function CarouselDots({ total, active, onDotClick, accentColor }: CarouselDotsProps) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          aria-label={`Ir para item ${i + 1}`}
          aria-current={i === active}
          style={{
            width:        i === active ? 20 : 8,
            height:       8,
            borderRadius: 4,
            background:   i === active ? accentColor : `color-mix(in srgb, ${accentColor} 20.78%, transparent)`,
            border:       "none",
            padding:      0,
            cursor:       "pointer",
            transition:   "width 0.2s ease, background 0.2s ease",
            flexShrink:   0,
          }}
        />
      ))}
    </div>
  )
}
