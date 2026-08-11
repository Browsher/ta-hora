"use client"

import { useMemo, useState } from "react"
import { CameraBloco } from "./CameraBloco"
import { ordenarCatalogo, type FiltroCatalogo } from "./ordenarCatalogo"
// import type: só o TIPO — o cliente NUNCA importa um módulo server-only da
// camada Shopify. Os únicos imports de VALOR aqui são ./ordenarCatalogo (puro) e
// ./CameraBloco (apresentacional).
import type { ProductCard } from "@/lib/shopify/types"

// As 5 opções do filtro, com rótulo pt-BR (Req 3.1/3.8). Ordem fixa; sempre os 5
// botões aparecem (Req 8.3), mesmo que um não suba nenhuma câmera.
const OPCOES: { valor: FiltroCatalogo; rotulo: string }[] = [
  { valor: "todas",         rotulo: "Todas" },
  { valor: "melhor-preco",  rotulo: "Melhor preço" },
  { valor: "mais-recursos", rotulo: "Mais recursos" },
  { valor: "eseecloud",     rotulo: "EseeCloud" },
  { valor: "icsee",         rotulo: "iCSee" },
]

// Barra de filtros — apresentacional. A11y (Req 3.10): `<button>` nativo (foco e
// ativação por Tab/Enter/Space de graça) + `aria-pressed` anunciando o ativo.
function FiltroBar({
  filtro,
  onSelect,
}: {
  filtro: FiltroCatalogo
  onSelect: (f: FiltroCatalogo) => void
}) {
  return (
    <div className="catalogo-filtros" role="group" aria-label="Ordenar catálogo">
      {OPCOES.map((opcao) => {
        const ativo = filtro === opcao.valor
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => onSelect(opcao.valor)}
            className="catalogo-filtro"
            data-ativo={ativo}
          >
            {opcao.rotulo}
          </button>
        )
      })}
    </div>
  )
}

// Vitrine consultiva: guarda UM estado (o filtro) e reordena a lista já carregada
// por uma função pura. Sem fetch, sem token, sem esconder — o SSR entrega TODAS
// as câmeras na ordem do servidor no HTML inicial (filtro = "todas" = identidade).
export function CatalogoConsultivo({ produtos }: { produtos: ProductCard[] }) {
  const [filtro, setFiltro] = useState<FiltroCatalogo>("todas")
  const ordenados = useMemo(() => ordenarCatalogo(produtos, filtro), [produtos, filtro])

  // Zero câmeras: estado vazio SEM barra de filtros (Req 8.1).
  if (produtos.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding:   "64px 24px",
          color:     "var(--cor-texto-secundario)",
          fontSize:  16,
        }}
      >
        Nenhum produto disponível no momento.
      </div>
    )
  }

  return (
    <>
      <FiltroBar filtro={filtro} onSelect={setFiltro} />
      <div className="catalogo-lista">
        {/* key={p.id}: React REORDENA os nós existentes em vez de recriá-los —
            imagens não recarregam ao trocar de filtro (Req 3.9). */}
        {ordenados.map((p, i) => (
          // Só o PRIMEIRO bloco carrega eager; os demais viram `lazy` e saem do
          // preload automático do React 19 (ver a prop `loading` do ImageSlot).
          //
          // Medido em 11/08/2026, viewport 1920×855: o LCP desta página é a
          // imagem do 1º card (`A31H3_4.png`, 216 ms), e das 7 imagens só as
          // duas primeiras ficam acima da dobra (`top` 321 e 797; a terceira já
          // em 1.274). As 5 de baixo somavam 74,4 KB em prioridade máxima.
          //
          // O índice é o da lista JÁ FILTRADA E ORDENADA, e é o certo: quem está
          // em primeiro depois do filtro é quem o usuário vê primeiro. O 2º card,
          // que também está acima da dobra em desktop, fica `lazy` de propósito —
          // imagem lazy DENTRO do viewport é buscada pelo navegador assim que o
          // layout resolve, sem esperar scroll, então não há pop-in.
          <CameraBloco key={p.id} produto={p} foraDaDobra={i > 0} />
        ))}
      </div>
    </>
  )
}
