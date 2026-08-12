import type { Metadata } from "next"
import { PreviewContent } from "@/components/preview/PreviewContent"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import { semNotasInternas } from "@/lib/semNotasInternas"
import layoutData from "@/layouts/politica-de-privacidade.json"
import { metadataPagina } from "@/lib/seo/metadataPagina"

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

// Página legal: ninguém compartilha, e mesmo assim declara `openGraph` próprio.
// O motivo não é a prévia — é que `og:url` é uma AFIRMAÇÃO sobre qual URL esta
// página é, e deixá-la apontando para a home criaria a exceção que a próxima
// página nova copia. Com o helper o custo é uma linha. Sem `ogTitle`: o título já
// se descreve sozinho.
export const metadata: Metadata = metadataPagina({
  // Sem sufixo — o "| Ta Hora" vem do `template` do app/layout.tsx.
  title: "Política de Privacidade",
  path:  "/politica-de-privacidade",
  description:
    "Como o Ta Hora coleta, usa e protege os seus dados pessoais, incluindo cookies e a base legal de cada tratamento.",
})

export default function Page() {
  return (
    <main style={{ background: fundo, minHeight: "100vh" }} className="w-full">
      <PreviewContent layout={layout} />
    </main>
  )
}
