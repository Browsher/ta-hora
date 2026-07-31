import type { Metadata } from "next"
import { CarrinhoProvider } from "@/components/loja/CarrinhoProvider"
import { CarrinhoDrawer } from "@/components/loja/CarrinhoDrawer"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import homeData from "@/layouts/_home.json"
import { SITE_URL } from "@/lib/site"
import "./globals.css"

// Metadata RAIZ — herdada por toda rota que não declarar a sua.
//
// Antes disto o site inteiro tinha `<title>Ta Hora</title>` em `/`, `/catalogo` e
// `/sobre-nos` (três páginas, um título), zero meta description e zero Open Graph:
// todo link colado no WhatsApp aparecia como texto cru. Para um negócio que vende
// por indicação e tem programa de afiliados, o Open Graph abaixo é o item de maior
// consequência deste arquivo.
export const metadata: Metadata = {
  // Torna RELATIVAS todas as URLs de metadata (canonical, imagens de OG) —
  // sem isto o Next emite `og:image` sem origem e nenhum crawler resolve.
  // ⚠️ O domínio vive em lib/site.ts. Trocar lá quando o tahora.com.br entrar.
  metadataBase: new URL(SITE_URL),

  title: {
    // Usado por `/` e por qualquer rota sem título próprio.
    default:  "Ta Hora — Câmeras de segurança Wi-Fi",
    // 🔴 As rotas filhas passam SÓ o próprio nome: "Suporte", não
    // "Suporte | Ta Hora". O sufixo é acrescentado aqui. Quem repetir o sufixo
    // no `title` da página gera "Suporte | Ta Hora | Ta Hora" — e isso NÃO quebra
    // o build, só sai errado na aba e no Google.
    template: "%s | Ta Hora",
  },
  description:
    "Você mesmo instala em minutos, sem obra e sem técnico. Loja com CNPJ, nota fiscal e 3 meses de garantia direto com a gente.",

  // 🔴 O CANONICAL É O ITEM CRÍTICO DESTE ARQUIVO, e a razão é o /afiliados:
  // cada link de afiliado carrega `?ref=` e, sem canonical, o Google vê uma URL
  // NOVA por afiliado — a mesma PDP diluída em N duplicatas. O canonical relativo
  // resolve contra o `metadataBase` SEM a query, colapsando todas de volta numa
  // URL só. Cada rota declara o seu; esta é a da Home.
  alternates: { canonical: "/" },

  openGraph: {
    type:     "website",
    locale:   "pt_BR",
    siteName: "Ta Hora",
    url:      "/",
    title:    "Ta Hora — Câmeras de Segurança Wi-Fi Originais",
    description:
      "Você mesmo instala em minutos, sem obra e sem técnico. Loja com CNPJ, nota fiscal e 3 meses de garantia direto com a gente.",
    images: [
      {
        // Arte dedicada de Open Graph — NÃO é a imagem do Hero (essa segue no
        // `_home.json`, intocada). As dimensões abaixo são as REAIS do arquivo
        // — declarar dimensão que não bate faz o WhatsApp recortar errado ou
        // descartar a prévia.
        url:    "/uploads/og-image.webp",
        width:  1200,
        height: 630,
        alt:    "Mão segurando celular com a imagem ao vivo de uma câmera Ta Hora apontada para o portão de uma casa, ao lado da chamada “Veja de onde estiver”",
      },
    ],
  },

  twitter: { card: "summary_large_image" },
  robots:  { index: true, follow: true },
}

// Paleta do site, resolvida AQUI (Server Component) e passada ao drawer por prop.
//
// Por que não deixar o drawer importar `_home.json` sozinho: ele é `"use client"`
// — o JSON inteiro (9 KB de conteúdo da Home) entraria no bundle de TODA rota,
// inclusive /catalogo. A paleta são 9 strings; só elas atravessam a fronteira.
//
// O drawer precisa disto porque é montado aqui, no root layout, FORA dos dois
// únicos wrappers de paleta do projeto (PreviewContent e StoreShell). Sem a
// paleta, ele herdaria o `:root` de fábrica e sairia dourado (#D4A017) num site
// laranja (#ff8903).
const layoutDaHome = homeData as unknown as Layout
const paleta = layoutDaHome.globalSettings?.paleta ?? getPaleta(layoutDaHome.globalSettings?.estilo)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      {/*
        ⚠️ SEGUNDO LUGAR ONDE O FUNDO DO SITE VIVE.
        Este hex precisa acompanhar `globalSettings.paleta.fundo` dos layouts —
        trocar a paleta nos JSONs SEM editar aqui deixa uma faixa da cor antiga
        aparecendo no overscroll e abaixo do rodapé.

        Por que não `var(--cor-fundo)`: o <body> está FORA dos três wrappers de
        paleta (PreviewContent, StoreShell, CarrinhoDrawer) — quem o alcança é o
        :root de globals.css, que é a paleta de FÁBRICA e segue ESCURA de
        propósito (é o fallback do builder e o detector do modo de falha "slot de
        paleta ausente"). Usar a var aqui pintaria o body de #0D0A08.

        É a única exceção ao princípio "a cor se ajusta em um lugar só".
      */}
      <body style={{ background: "#FAFAF8" }}>
        {/*
          ⚠️ A HOME ESTÁTICA DEPENDE DESTE ARQUIVO (Req 9.2).
          NÃO chame `cookies()`, `headers()` nem Server Action aqui. O
          `CarrinhoProvider` é "use client" e busca o carrinho num efeito, DEPOIS
          da montagem — por isso o carrinho existe em toda rota sem tornar
          nenhuma delas dinâmica.

          Se alguém passar dados de carrinho por prop a partir daqui, `/` e
          `/sobre-nos` viram `ƒ` (dynamic) SEM ERRO NENHUM: só some o `○` da
          saída do build. É o modo de falha mais silencioso desta spec.

          Escopo: isto vale para o CARRINHO. A frente do `ProductGrid` da Home por
          tag vai mover a Home para ISR de propósito — decisão daquela spec, não
          violação desta. Ver tech.md → "Home estática: o que é regra e o que NÃO é".
        */}
        <CarrinhoProvider>
          {children}
          {/* Montado UMA vez, acima de tudo — o drawer é global. */}
          <CarrinhoDrawer paleta={paleta} />
        </CarrinhoProvider>
      </body>
    </html>
  )
}
