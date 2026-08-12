import type { Metadata } from "next"
import { PreviewContent } from "@/components/preview/PreviewContent"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import { semNotasInternas } from "@/lib/semNotasInternas"
import layoutData from "@/layouts/trocas-e-devolucoes.json"
import { metadataPagina } from "@/lib/seo/metadataPagina"

// Rota do site: "Trocas e Devoluções". Mesmo padrão do /suporte — layout
// RESOLVIDO, renderizado pelo PreviewContent. Estática (○): documento, sem Shopify.
// semNotasInternas: tira as chaves `_*` (anotacao de quem edita o JSON) antes
// de o layout virar prop de um componente client e vazar no payload RSC.
const layout = semNotasInternas(layoutData as unknown as Layout)
const paleta = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo)
const fundo = paleta?.fundo ?? "#0D0A08"

// Página legal — ver a nota em app/politica-de-privacidade/page.tsx.
export const metadata: Metadata = metadataPagina({
  // Sem sufixo — o "| Ta Hora" vem do `template` do app/layout.tsx.
  title: "Trocas e Devoluções",
  path:  "/trocas-e-devolucoes",
  description:
    "Prazos e condições para trocar ou devolver um produto comprado no Ta Hora, incluindo o direito de arrependimento de 7 dias previsto no CDC.",
})

export default function Page() {
  return (
    <main style={{ background: fundo, minHeight: "100vh" }} className="w-full">
      <PreviewContent layout={layout} />
    </main>
  )
}
