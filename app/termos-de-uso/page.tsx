import type { Metadata } from "next"
import { PreviewContent } from "@/components/preview/PreviewContent"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import { semNotasInternas } from "@/lib/semNotasInternas"
import layoutData from "@/layouts/termos-de-uso.json"

// Rota do site: "Termos de Uso". Mesmo padrão do /suporte — layout RESOLVIDO,
// renderizado pelo PreviewContent. Estática (○): documento legal, sem Shopify.
// semNotasInternas: tira as chaves `_*` (anotacao de quem edita o JSON) antes
// de o layout virar prop de um componente client e vazar no payload RSC.
const layout = semNotasInternas(layoutData as unknown as Layout)
const paleta = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo)
const fundo = paleta?.fundo ?? "#0D0A08"

export const metadata: Metadata = {
  // Sem sufixo — o "| Ta Hora" vem do `template` do app/layout.tsx.
  title: "Termos de Uso",
  description:
    "Condições de uso do site do Ta Hora: compras, pagamentos, entrega, responsabilidades e direitos do consumidor.",
  alternates: { canonical: "/termos-de-uso" },
}

export default function Page() {
  return (
    <main style={{ background: fundo, minHeight: "100vh" }} className="w-full">
      <PreviewContent layout={layout} />
    </main>
  )
}
