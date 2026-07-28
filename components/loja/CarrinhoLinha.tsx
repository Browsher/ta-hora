"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import { tokens } from "@/lib/tokens"
import { useCarrinho } from "./CarrinhoProvider"
import type { LinhaCarrinho } from "@/lib/shopify/types"

// Uma linha do drawer. Só tipos vêm da camada de dados (`import type`).

const botaoQtd: React.CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  width:          28,
  height:         28,
  background:     "none",
  border:         "1px solid color-mix(in srgb, var(--cor-texto) 20%, transparent)",
  borderRadius:   tokens.radius.sm,
  color:          "var(--cor-texto)",
  cursor:         "pointer",
  flexShrink:     0,
}

export function CarrinhoLinha({ linha }: { linha: LinhaCarrinho }) {
  const ctx = useCarrinho()
  if (!ctx) return null

  const { carregando, alterarQuantidade, remover } = ctx

  // `−` em 1 remove a linha (Req 3.5). A action já trata quantidade 0 como
  // remoção; aqui é só o rótulo acessível que muda.
  const vaiRemover = linha.quantidade <= 1

  /*
    ⚠️ `estoqueMaximo` NÃO é o teto real do carrinho — medido na loja:
    a variante reporta `quantityAvailable: 999`, mas a Shopify corta a linha em
    50. Ou seja, desabilitar o `+` aqui quase nunca dispara, e NÃO é a proteção.
    A rede real é o `aviso` de `warnings` ("Ajustamos a quantidade ao estoque
    disponível"), que o drawer exibe. Este disable é só cortesia para o caso em
    que o estoque é de fato baixo.
  */
  const noTeto = linha.estoqueMaximo !== null && linha.quantidade >= linha.estoqueMaximo

  return (
    <li
      style={{
        display:  "flex",
        gap:      12,
        padding:  "14px 0",
        borderBottom: "1px solid color-mix(in srgb, var(--cor-texto) 10%, transparent)",
        // Linha que ficou indisponível DEPOIS de adicionada (Req 3.13).
        opacity:  linha.disponivel ? 1 : 0.55,
      }}
    >
      {/* Foto — <img> puro com URL do CDN da Shopify, padrão da loja */}
      {linha.imagem ? (
        <img
          src={linha.imagem.url}
          alt={linha.imagem.altText ?? linha.titulo}
          width={64}
          height={64}
          style={{
            width: 64, height: 64, objectFit: "cover",
            borderRadius: tokens.radius.sm, flexShrink: 0,
            background: "color-mix(in srgb, var(--cor-texto) 8%, transparent)",
          }}
        />
      ) : (
        <div style={{ width: 64, height: 64, borderRadius: tokens.radius.sm, flexShrink: 0, background: "color-mix(in srgb, var(--cor-texto) 8%, transparent)" }} />
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--cor-texto)", lineHeight: 1.3 }}>
          {linha.titulo}
        </span>

        {!linha.disponivel && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cor-destaque-texto-forte, var(--cor-destaque))" }}>
            Indisponível
          </span>
        )}

        <span style={{ fontSize: 12, color: "var(--cor-texto-secundario)" }}>
          {/* Preço unitário — vem PRONTO da Shopify, nunca total/quantidade */}
          {linha.precoUnitario.currency} {linha.precoUnitario.price} cada
        </span>

        {/* Descontos: LISTA, não somada — cada alocação como a Shopify devolveu */}
        {linha.descontos.map((d, i) => (
          <span key={i} style={{ fontSize: 11, color: "var(--cor-destaque-texto-forte, var(--cor-destaque))" }}>
            − {d.currency} {d.price}
          </span>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <button
            type="button"
            onClick={() => alterarQuantidade(linha.id, linha.quantidade - 1)}
            disabled={carregando}
            aria-label={vaiRemover ? `Remover ${linha.titulo} do carrinho` : `Diminuir quantidade de ${linha.titulo}`}
            style={{ ...botaoQtd, opacity: carregando ? 0.5 : 1 }}
          >
            <Minus size={13} aria-hidden="true" />
          </button>

          <span
            aria-live="polite"
            style={{ fontSize: 14, fontWeight: 600, color: "var(--cor-texto)", minWidth: 20, textAlign: "center" }}
          >
            {linha.quantidade}
          </span>

          <button
            type="button"
            onClick={() => alterarQuantidade(linha.id, linha.quantidade + 1)}
            disabled={carregando || noTeto}
            aria-label={`Aumentar quantidade de ${linha.titulo}`}
            style={{ ...botaoQtd, opacity: carregando || noTeto ? 0.5 : 1 }}
          >
            <Plus size={13} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => remover(linha.id)}
            disabled={carregando}
            aria-label={`Remover ${linha.titulo} do carrinho`}
            style={{ ...botaoQtd, marginLeft: 4, border: "none", opacity: carregando ? 0.5 : 1 }}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Total da linha — `cost.totalAmount`, calculado pela Shopify */}
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--cor-texto)", whiteSpace: "nowrap" }}>
        {linha.precoTotal.currency} {linha.precoTotal.price}
      </span>
    </li>
  )
}
