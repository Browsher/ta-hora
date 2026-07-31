import type React from "react"
import { Navbar } from "@/components/sections/Navbar"
import { Footer } from "@/components/sections/Footer"
import { getPaleta } from "@/lib/estilos"
import { paletaWrapperStyle } from "@/lib/paleta"
import type { Layout } from "@/lib/types"
import { semNotasInternas } from "@/lib/semNotasInternas"
import homeData from "@/layouts/_home.json"

// Chrome compartilhado das rotas da loja (/catalogo, /produtos/[handle]):
// renderiza a MESMA Navbar/Footer da home e aplica a paleta CARIMBADA do site
// (globalSettings.paleta) — assim as páginas da loja batem com o resto do site,
// em vez de herdar o :root de fábrica.
//
// Navbar/Footer são content-driven e seus hooks de efeito (useSectionEffects/
// useEffectsMode) têm default null → funcionam standalone, sem os providers do
// Builder. Fora do modo "preview", a Navbar renderiza relative (não fixed).

// semNotasInternas: o `content` da Navbar e do Footer vai como prop para
// componentes client em TODA página de loja. Sem o filtro, uma nota `_*` que
// alguém acrescente nessas duas seções do _home.json vazaria no payload RSC.
const layout        = semNotasInternas(homeData as unknown as Layout)
const paleta        = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo)
const navSection    = layout.sections.find((s) => s.component === "Navbar")
const footerSection = layout.sections.find((s) => s.component === "Footer")

const accentOf = (s?: { content?: Record<string, unknown> }) =>
  (s?.content?.accentColor as string | undefined) ?? "var(--cor-destaque)"

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", ...paletaWrapperStyle(paleta) }}>
      {navSection && (
        <Navbar
          type={navSection.type as React.ComponentProps<typeof Navbar>["type"]}
          accentColor={accentOf(navSection)}
          content={navSection.content as React.ComponentProps<typeof Navbar>["content"]}
        />
      )}

      <main>{children}</main>

      {footerSection && (
        <Footer
          type={footerSection.type as React.ComponentProps<typeof Footer>["type"]}
          accentColor={accentOf(footerSection)}
          content={footerSection.content as React.ComponentProps<typeof Footer>["content"]}
        />
      )}
    </div>
  )
}
