import type { Metadata } from "next"
import { PreviewContent } from "@/components/preview/PreviewContent"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import { semNotasInternas } from "@/lib/semNotasInternas"
import layoutData from "@/layouts/politica-de-privacidade.json"

// Rota do site: "Política de Privacidade". Mesmo padrão do /suporte — o layout
// já vem RESOLVIDO (navbar/footer/paleta compartilhados embutidos) e a rota é um
// Layout completo renderizado pelo mesmo PreviewContent.
//
// Estática (○) de propósito: documento legal, não dado da Shopify. Sem
// cookies()/headers(), sem `export const revalidate`, sem fetch.
// semNotasInternas: tira as chaves `_*` (anotacao de quem edita o JSON) antes
// de o layout virar prop de um componente client e vazar no payload RSC.
const layout = semNotasInternas(layoutData as unknown as Layout)
const paleta = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo)
const fundo = paleta?.fundo ?? "#0D0A08"

export const metadata: Metadata = {
  title: "Política de Privacidade | Ta Hora",
  description:
    "Como o Ta Hora coleta, usa e protege os seus dados pessoais, incluindo cookies e a base legal de cada tratamento.",
}

export default function Page() {
  return (
    <main style={{ background: fundo, minHeight: "100vh" }} className="w-full">
      <PreviewContent layout={layout} />
    </main>
  )
}
