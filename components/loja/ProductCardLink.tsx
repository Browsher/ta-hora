"use client"

import Link from "next/link"
import { ImageSlot } from "@/components/ui/ImageSlot"
import { Text } from "@/components/ui/Text"
import { PriceTag } from "@/components/ui/PriceTag"
// import type: só o TIPO (apagado na compilação) — nunca arrasta a camada de
// dados server-only para o bundle do cliente.
import type { ProductCard } from "@/lib/shopify/types"

// Card clicável da vitrine: imagem + título + preço, linkando para a página do
// produto. Reusa os primitivos de components/ui/.
//
// `verDetalhes` é ADITIVO e OPT-IN (feature home-produtos-carrossel): a vitrine
// da Home pede a chamada "Ver detalhes"; os recomendados ("Você também pode
// gostar") NÃO. 🔴 O default `false` é o que mantém os recomendados renderizando
// EXATAMENTE como hoje — nenhum outro consumidor precisou mudar.
//
// `foraDaDobra` é ADITIVO e OPT-IN, pelo mesmo molde do `verDetalhes`: marca a
// imagem como `loading="lazy"`, o que a tira da lista de preload automático do
// React 19 (ver o comentário da prop `loading` em ImageSlot).
//
// 🔴 QUEM SABE SE O CARD ESTÁ ABAIXO DA DOBRA É QUEM ITERA A LISTA, não o card.
// Por isso é prop e não decisão interna: na vitrine da Home os 3 cards estão
// sempre abaixo da dobra; nos recomendados da PDP, também; num grid futuro em
// que o primeiro card seja o LCP, o índice 0 não deve recebê-la.
//
// Default `false` = comportamento de sempre (eager + preload). Nenhum consumidor
// existente muda sem pedir.
// `prioritaria` é ADITIVO e OPT-IN, mesmo molde dos dois acima, e é o PAR do
// `foraDaDobra`: aquele TIRA a imagem da fila de preload, este a coloca na
// FRENTE dela.
//
// Existe porque tirar as concorrentes não basta no /catalogo. Com 7 cards
// renderizados no SSR e nenhum marcado, o React 19 emitia 7 preloads de mesma
// prioridade e o navegador baixava todos em paralelo — inclusive os 3 que nem
// aparecem na primeira tela do celular. A imagem que É o LCP disputava banda com
// elas em pé de igualdade.
//
// 🔴 SÓ UMA IMAGEM POR PÁGINA DEVE RECEBER. `fetchPriority="high"` é uma ordem
// RELATIVA: se todos os cards forem prioritários, nenhum é — volta a ser a fila
// plana de antes, só que com outro nome.
//
// ⚠️ NÃO É O MESMO QUE `!foraDaDobra`. Um card pode estar acima da dobra e não ser
// o LCP (o segundo da linha, no desktop): ele quer preload normal, sem lazy e sem
// high. Os três estados são distintos, e é por isso que são duas props e não um
// enum de dois valores.
export function ProductCardLink({
  product,
  verDetalhes = false,
  foraDaDobra = false,
  prioritaria = false,
}: {
  product:      ProductCard
  verDetalhes?: boolean
  foraDaDobra?: boolean
  prioritaria?: boolean
}) {
  return (
    <Link
      href={`/produtos/${product.handle}`}
      className="block no-underline transition-transform duration-200 hover:-translate-y-1"
      style={{
        background:   "var(--cor-card)",
        border:       "1px solid color-mix(in srgb, var(--cor-destaque) 14%, transparent)",
        borderRadius: 20,
        overflow:     "hidden",
        color:        "var(--cor-texto)",
        height:       "100%",
        display:      "flex",
        flexDirection: "column",
      }}
    >
      <ImageSlot
        src={product.image?.url || undefined}
        alt={product.image?.altText ?? product.title}
        borderRadius={0}
        objectFit="contain"
        loading={foraDaDobra ? "lazy" : undefined}
        fetchPriority={prioritaria ? "high" : undefined}
        style={{ aspectRatio: "1 / 1", width: "100%" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px 18px" }}>
        <Text
          text={product.title}
          size="pequeno"
          color="var(--cor-texto)"
          style={{
            fontWeight:       600,
            // Trava em 2 linhas com reticências → todos os cards com a mesma
            // altura de título (grid uniforme). minHeight reserva as 2 linhas
            // mesmo quando o título tem só 1.
            display:          "-webkit-box",
            WebkitLineClamp:  2,
            WebkitBoxOrient:  "vertical",
            overflow:         "hidden",
            minHeight:        "3.1em", // 2 linhas × lineHeight 1.55
          }}
        />
        <PriceTag price={product.price.price} currency={product.price.currency} size="medio" />
        {/* 🔴 <span>, NUNCA <button> nem um segundo <a>: o card INTEIRO já é o
            link (o <Link> aqui em volta). Um controle aninhado dentro de um link
            é DOM inválido, quebra teclado e leitor de tela, e dobraria a
            navegação por Tab para o mesmo destino. Isto é aparência — a
            semântica de "clicável" é do <Link>. Estilizado por
            `.vitrine-home__ver-detalhes` em globals.css. */}
        {verDetalhes && <span className="vitrine-home__ver-detalhes">Ver detalhes</span>}
      </div>
    </Link>
  )
}
