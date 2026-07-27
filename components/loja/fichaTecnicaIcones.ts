import type { LucideIcon } from "lucide-react"
import {
  Video,
  Moon,
  MoonStar,
  Droplets,
  Mic,
  PersonStanding,
  Wifi,
  Siren,
  Smartphone,
  Info,
} from "lucide-react"

// Mapa `key da spec → ícone lucide` para os CARDS PRINCIPAIS da ficha técnica.
//
// Vive AQUI (UI), FORA de `lib/shopify/specs.ts` DE PROPÓSITO: o ícone é um
// componente React, e pô-lo no data layer arrastaria `lucide-react` para o grafo
// de import de `queries.ts`/`normalize.ts` (server-only). Aqui, `FichaTecnica`
// (Server Component) junta este mapa ao `SPEC_METAFIELDS` por `key` — mesma
// disciplina de `tags.ts` (dado) vs `ROTULO_MARCA` (exibição).

/** Ícone genérico para uma spec principal sem ícone dedicado (Req 6.2). */
export const ICONE_FALLBACK: LucideIcon = Info

/** Só as 9 chaves PRINCIPAIS têm ícone; secundárias vão na lista sem ícone. */
export const ICONES_SPEC: Record<string, LucideIcon> = {
  tipo_de_resolucao:          Video,
  visao_noturna:              Moon,
  com_visao_noturna_colorida: MoonStar,
  resistente_a_agua:          Droplets,
  audio_bidirecional:         Mic,
  com_sensor_de_movimento:    PersonStanding,
  conectividade:              Wifi,
  com_alarme:                 Siren,
  // 🔴 key `marca` (nome antigo — rename preserva a key) → rótulo "Aplicativo".
  marca:                      Smartphone,
}
