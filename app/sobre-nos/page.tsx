import type { Metadata } from "next"
import { PreviewContent } from "@/components/preview/PreviewContent"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import { semNotasInternas } from "@/lib/semNotasInternas"
import layoutData from "@/layouts/sobre-nos.json"

// Rota do site: "Sobre-nos". O layout já vem RESOLVIDO (navbar/footer/paleta
// compartilhados do site embutidos) — o projeto exportado não conhece "Site",
// cada rota é um Layout completo renderizado pelo mesmo PreviewContent.
// semNotasInternas: tira as chaves `_*` (anotacao de quem edita o JSON) antes
// de o layout virar prop de um componente client e vazar no payload RSC.
const layout = semNotasInternas(layoutData as unknown as Layout)
const paleta = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo)
const fundo = paleta?.fundo ?? "#0D0A08"

// Metadata ESTÁTICA (objeto, não generateMetadata): mantém a rota ○ (Static).
// `title` sem sufixo — o "| Ta Hora" vem do `template` do app/layout.tsx.
export const metadata: Metadata = {
  title: "Sobre Nós",
  description:
    "Quem é o Ta Hora: 4 anos vendendo eletrônicos originais em marketplaces, agora com loja própria. Produtos lacrados, nota fiscal e suporte por WhatsApp.",
  alternates: { canonical: "/sobre-nos" },
}

export default function Page() {
  return (
    <main style={{ background: fundo, minHeight: "100vh" }} className="w-full">
      <PreviewContent layout={layout} />
    </main>
  )
}
