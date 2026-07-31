import type { Metadata } from "next"
import { StoreShell } from "@/components/loja/StoreShell"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { CtaButton } from "@/components/ui/CtaButton"

// Página 404 do site (App Router: `app/not-found.tsx` cobre todo `notFound()`
// e qualquer URL sem rota).
//
// Antes deste arquivo, a 404 era a do Next: "404: This page could not be found."
// em inglês, sem nenhum link, fora da paleta e da fonte do site. Beco sem saída.
// Isso passou a importar quando a PDP começou a 404-ar de propósito os handles
// fora da coleção `cameras` (acessórios) — ver `handleTemPagina` em
// `lib/shopify/products.ts`. Mandar alguém para um beco sem saída é pior que o
// vazamento que a guarda fechou.
//
// Dentro do `StoreShell` de propósito: é ele que traz navbar, rodapé e o wrapper
// de paleta. Sem ele, a página herdaria o `:root` de fábrica do globals.css, que
// é ESCURO — a 404 sairia preta num site claro.
//
// Server Component: nenhum dado, nenhum fetch. A 404 não pode depender da
// Shopify — ela é justamente a página que aparece quando algo não existe.

export const metadata: Metadata = {
  title: "Página não encontrada",
  // Sem `robots: noindex`: o status HTTP 404 já é a instrução autoritativa para
  // o crawler, e uma meta contradizendo o status só adiciona ruído.
}

export default function NotFound() {
  return (
    <StoreShell>
      <div
        style={{
          maxWidth:      560,
          margin:        "0 auto",
          padding:       "clamp(64px, 12vw, 120px) clamp(20px, 5vw, 64px)",
          textAlign:     "center",
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          gap:           16,
        }}
      >
        <p
          style={{
            fontSize:      13,
            fontWeight:    700,
            letterSpacing: "0.12em",
            color:         "var(--cor-texto-fraco)",
            margin:        0,
          }}
        >
          404
        </p>

        <Heading
          as="h1"
          size="medio"
          text="Esta página não existe"
          color="var(--cor-texto)"
          accentColor="var(--cor-destaque)"
        />

        <Text
          text="O link pode estar errado ou o produto pode ter saído do catálogo. Veja as câmeras disponíveis ou volte para o início."
          size="medio"
          align="centro"
          color="var(--cor-texto-secundario)"
        />

        <div
          style={{
            display:        "flex",
            gap:            12,
            flexWrap:       "wrap",
            justifyContent: "center",
            marginTop:      12,
          }}
        >
          <CtaButton
            label="Ver catálogo"
            href="/catalogo"
            accentColor="var(--cor-destaque)"
          />
          <CtaButton
            label="Ir para o início"
            href="/"
            fill="outline"
            accentColor="var(--cor-destaque)"
          />
        </div>
      </div>
    </StoreShell>
  )
}
