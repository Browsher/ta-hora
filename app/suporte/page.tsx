import type { Metadata } from "next"
import { PreviewContent } from "@/components/preview/PreviewContent"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import { semNotasInternas } from "@/lib/semNotasInternas"
import layoutData from "@/layouts/suporte.json"
import { metadataPagina } from "@/lib/seo/metadataPagina"

// Rota do site: "Suporte". Mesmo padrão do /sobre-nos — o layout já vem RESOLVIDO
// (navbar/footer/paleta compartilhados embutidos) e cada rota é um Layout completo
// renderizado pelo mesmo PreviewContent.
//
// Esta rota é ○ (Static) DE PROPÓSITO: é conteúdo editorial, não dado da Shopify.
// Sem cookies()/headers(), sem `export const revalidate`, sem fetch — qualquer um
// dos três a tiraria do estático SEM erro visível, só sumindo o ○ do build.
// semNotasInternas: tira as chaves `_*` (anotacao de quem edita o JSON) antes
// de o layout virar prop de um componente client e vazar no payload RSC.
const layout = semNotasInternas(layoutData as unknown as Layout)
const paleta = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo)
const fundo = paleta?.fundo ?? "#0D0A08"

// Metadata ESTÁTICA (objeto, não generateMetadata): não torna a rota dinâmica.
// `title` sem sufixo — o "| Ta Hora" vem do `template` do app/layout.tsx.
export const metadata: Metadata = metadataPagina({
  title: "Suporte",
  path:  "/suporte",
  // `ogTitle` próprio pelo mesmo motivo do /sobre-nos: "Suporte" sozinho não diz
  // suporte de quê nem para quê na prévia de um link. Ver metadataPagina.ts.
  ogTitle: "Suporte Ta Hora — dúvidas sobre câmeras Wi-Fi",
  description:
    "Fale com o Ta Hora pelo WhatsApp, e-mail ou Instagram. Tire suas dúvidas sobre entrega, garantia, pagamento e acompanhamento do pedido.",
})

export default function Page() {
  return (
    <main style={{ background: fundo, minHeight: "100vh" }} className="w-full">
      <PreviewContent layout={layout} />
    </main>
  )
}
