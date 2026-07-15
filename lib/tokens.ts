export const tokens = {
  colors: {
    bg:      "#0D0A08",
    surface: "#141210",
    card:    "linear-gradient(160deg, #1c1508 0%, #110e06 100%)",
    border:  "#252015",
    text:    "#E8DCC8",
    muted:   "#7A6A50",
    faint:   "#4A3A20",
  },

  radius: {
    card: "24px",
    md:   "12px",
    btn:  "8px",
    sm:   "6px",
  },

  label: "text-[11px] font-bold uppercase tracking-[.14em]",

  accent: {
    default: "#D4A017",
  },
} as const

export type TokenColors = typeof tokens.colors