import { PreviewContent } from "@/components/preview/PreviewContent"
import { getPaleta } from "@/lib/estilos"
import { getVitrineHome } from "@/lib/shopify/products"
import type { Layout } from "@/lib/types"
import type { ProductCard } from "@/lib/shopify/types"
import layoutData from "@/layouts/_home.json"

// Rota do site: "Home". O layout já vem RESOLVIDO (navbar/footer/paleta
// compartilhados do site embutidos) — o projeto exportado não conhece "Site",
// cada rota é um Layout completo renderizado pelo mesmo PreviewContent.
const layout = layoutData as unknown as Layout
const paleta = layout.globalSettings?.paleta ?? getPaleta(layout.globalSettings?.estilo)
const fundo = paleta?.fundo ?? "#0D0A08"

// 🔴 MUDANÇA DE REGIME DELIBERADA: a Home sai de `○ Static` e passa a ISR.
// É daqui que o ISR vem — do route segment, não do `fetch`. A janela é a MESMA
// de /catalogo e /produtos/[handle] (300s): a Home não tem motivo para ser mais
// fresca que o próprio catálogo. Já pré-autorizado em tech.md → "Home estática:
// o que é regra e o que NÃO é".
//
// ⚠️ NADA de `cookies()` nem `headers()` nesta rota — tirariam-na de ISR para
// `ƒ` (dynamic), um regime diferente e mais caro, sem ninguém notar na tela.
export const revalidate = 300

export default async function Page() {
  // A vitrine é um EXTRA comercial: se a loja não responder, a Home renderiza
  // as outras 8 seções normalmente e a seção de produtos simplesmente não
  // aparece (a VitrineHome devolve null com lista vazia). Cobre Shopify fora do
  // ar, timeout e `.env.local` ausente — é isto que mantém o build passando sem
  // env. A Home nunca cai por causa da loja.
  let produtosVitrine: ProductCard[] = []
  try {
    produtosVitrine = await getVitrineHome()
  } catch {
    // silêncio proposital na UI; quem faz barulho é `npm run verificar:vitrine`
  }

  return (
    <main style={{ background: fundo, minHeight: "100vh" }} className="w-full">
      <PreviewContent layout={layout} produtosVitrine={produtosVitrine} />
    </main>
  )
}
