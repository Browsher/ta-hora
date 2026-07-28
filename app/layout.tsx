import type { Metadata } from "next"
import { CarrinhoProvider } from "@/components/loja/CarrinhoProvider"
import { CarrinhoDrawer } from "@/components/loja/CarrinhoDrawer"
import { getPaleta } from "@/lib/estilos"
import type { Layout } from "@/lib/types"
import homeData from "@/layouts/_home.json"
import "./globals.css"

export const metadata: Metadata = {
  title: "Ta Hora",
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
