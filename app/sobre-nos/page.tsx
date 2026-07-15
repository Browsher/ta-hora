import { PreviewContent } from "@/components/preview/PreviewContent"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import layoutData from "@/layouts/sobre-nos.json"

// Rota do site: "Sobre-nos". O layout já vem RESOLVIDO (navbar/footer/paleta
// compartilhados do site embutidos) — o projeto exportado não conhece "Site",
// cada rota é um Layout completo renderizado pelo mesmo PreviewContent.
const layout = layoutData as unknown as Layout
const paleta = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo)
const fundo = paleta?.fundo ?? "#0D0A08"

export default function Page() {
  return (
    <main style={{ background: fundo, minHeight: "100vh" }} className="w-full">
      <PreviewContent layout={layout} />
    </main>
  )
}
