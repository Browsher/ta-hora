import { getProducts } from "@/lib/shopify/products"
import { CatalogGrid } from "@/components/loja/CatalogGrid"
import { StoreShell } from "@/components/loja/StoreShell"
import { Heading } from "@/components/ui/Heading"
import { SectionLabel } from "@/components/ui/SectionLabel"

// ISR: revalida a cada 5 min (preço/estoque frescos sem novo deploy).
export const revalidate = 300

export default async function CatalogoPage() {
  let corpo: React.ReactNode
  try {
    const produtos = await getProducts()
    corpo = <CatalogGrid products={produtos} />
  } catch {
    // Shopify offline / erro → estado amigável (Req 4.4). O resto do site
    // (home, Sobre Nós) não depende da Shopify e segue funcionando.
    corpo = (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--cor-texto-secundario)", fontSize: 16 }}>
        Não foi possível carregar os produtos. Tente novamente em instantes.
      </div>
    )
  }

  return (
    <StoreShell>
      <div
        style={{
          maxWidth:      1200,
          margin:        "0 auto",
          padding:       "40px clamp(20px, 5vw, 64px) 72px",
          display:       "flex",
          flexDirection: "column",
          gap:           28,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel text="Nossos produtos" accentColor="var(--cor-destaque)" />
          <Heading as="h1" size="medio" text="Catálogo" color="var(--cor-texto)" accentColor="var(--cor-destaque)" />
        </div>
        {corpo}
      </div>
    </StoreShell>
  )
}
