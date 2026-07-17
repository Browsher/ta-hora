"use client"

import { Plus } from "lucide-react"
import { tokens } from "@/lib/tokens"
import { useCarrinho } from "./CarrinhoProvider"

// Seção "Você também vai precisar" do drawer: aparece quando há uma câmera no
// carrinho e ainda sobra acessório para sugerir.
//
// É um componente BURRO de propósito. Toda a decisão — o gatilho, o filtro do
// que já está no carrinho, a busca 1x — mora no `CarrinhoProvider`. Aqui só
// renderiza o que chegou pronto em `sugestoes`.

export function AcessoriosSugeridos() {
  const ctx = useCarrinho()

  // GUARDA ÚNICA — cobre os CINCO casos de "não aparecer":
  //   1. fora do provider (a Navbar precisa continuar montável isolada)
  //   2. sem gatilho (nenhuma câmera no carrinho)
  //   3. todos os acessórios já estão no carrinho
  //   4. nenhum acessório publicado com a tag
  //   5. a busca falhou (a action devolve [], nunca lança)
  //
  // ⚠️ Isto só é verdade porque o `CarrinhoProvider` embute o gatilho na
  // DERIVAÇÃO de `sugestoes` (`if (!temCamera) return []` dentro do useMemo).
  // Se o gatilho estivesse só aqui no render, `acessorios` sobreviveria à
  // remoção da câmera e esta guarda passaria com a seção órfã. Não mova o
  // gatilho para cá achando que é o mesmo.
  if (!ctx || ctx.sugestoes.length === 0) return null

  const { sugestoes, carregando, adicionar } = ctx

  return (
    <section
      aria-label="Acessórios sugeridos"
      style={{
        padding:   "18px 0 4px",
        borderTop: "1px solid color-mix(in srgb, var(--cor-texto) 10%, transparent)",
      }}
    >
      {/*
        Copy FIXA no código — exceção consciente ao "mudar conteúdo = editar JSON"
        do product.md: o drawer não é seção de layout e não passa pelo
        PreviewContent. Mesmo precedente do SeloPagamento.
      */}
      <h3
        style={{
          margin:     "0 0 12px",
          fontSize:   13,
          fontWeight: 700,
          color:      "var(--cor-texto)",
        }}
      >
        Você também vai precisar
      </h3>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {sugestoes.map((acessorio) => (
          <li
            key={acessorio.handle}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              padding:      8,
              borderRadius: tokens.radius.sm,
              background:   "color-mix(in srgb, var(--cor-texto) 4%, transparent)",
            }}
          >
            {/* <img> puro com URL do CDN — padrão da loja (images.unoptimized) */}
            {acessorio.image ? (
              <img
                src={acessorio.image.url}
                alt={acessorio.image.altText ?? acessorio.title}
                width={44}
                height={44}
                style={{
                  width: 44, height: 44, objectFit: "cover", flexShrink: 0,
                  borderRadius: tokens.radius.sm,
                  background: "color-mix(in srgb, var(--cor-texto) 8%, transparent)",
                }}
              />
            ) : (
              <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: tokens.radius.sm, background: "color-mix(in srgb, var(--cor-texto) 8%, transparent)" }} />
            )}

            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 12.5, fontWeight: 600, color: "var(--cor-texto)", lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}
              >
                {acessorio.title}
              </span>
              {/*
                O campo é `price` — `acessorio` é um ProductCard, não uma
                LinhaCarrinho (que tem `precoUnitario`). Mesmo padrão do
                ProductCardLink, o outro consumidor de ProductCard.
                O preço vem formatado da Shopify; nada é calculado aqui.
              */}
              <span style={{ fontSize: 12, color: "var(--cor-texto-secundario)" }}>
                {acessorio.price.currency} {acessorio.price.price}
              </span>
            </div>

            <button
              type="button"
              onClick={() => adicionar(acessorio.handle)}
              disabled={carregando}
              // Nomeia O QUE está sendo adicionado: "+ Add" sozinho não diz nada
              // para quem usa leitor de tela, e há um botão desses por item.
              aria-label={`Adicionar ${acessorio.title} ao carrinho`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0,
                background:   "none",
                border:       "1px solid var(--cor-destaque)",
                borderRadius: tokens.radius.btn,
                color:        "var(--cor-destaque)",
                padding:      "6px 10px",
                fontSize:     12,
                fontWeight:   600,
                cursor:       carregando ? "not-allowed" : "pointer",
                opacity:      carregando ? 0.5 : 1,
              }}
            >
              <Plus size={13} aria-hidden="true" />
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
