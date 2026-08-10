"use client"

import { useEffect, useRef } from "react"
import { verLista, type ItemGA } from "@/lib/analytics/gtag"

// `view_item_list`. Renderiza NADA.
//
// ─── DECISÃO: A LISTA REPORTADA É A INICIAL, NÃO A FILTRADA ──────────────────
//
// O /catalogo tem filtro no cliente (`CatalogoConsultivo`) e a lista muda sem
// navegação. Duas opções existiam:
//
//   (a) disparar a cada mudança de filtro
//   (b) disparar uma vez, com a lista completa que o servidor entregou
//
// Escolhido (b). Com (a), quem clica nos 5 filtros gera 5 `view_item_list` e o
// mesmo produto conta 5 impressões — o relatório de "produtos mais vistos na
// lista" passa a medir uso de filtro, não interesse em produto. E a informação
// que (a) daria de verdade (qual filtro as pessoas usam) é outra pergunta, que
// pede outro evento; não é para ser enfiada nesta.
//
// Consequência aceita: não sabemos qual recorte a pessoa estava vendo quando
// clicou no card. Se isso virar pergunta real, o caminho é `select_item` com
// `item_list_name` incluindo o filtro — aditivo, sem mexer aqui.
//
// ─── POR QUE ELE É MONTADO EM DOIS LUGARES DIFERENTES ────────────────────────
//
// No /catalogo, na `page.tsx` (Server Component) — o lugar natural, ao lado do
// componente que recebe a mesma lista.
//
// Na Home, DENTRO da `VitrineHome`. A árvore de seções da Home é dirigida por
// `layouts/_home.json` e montada pelo `PreviewContent` a partir de um
// `componentMap`: a `page.tsx` da Home não tem como pendurar um irmão ao lado de
// uma seção específica sem inventar uma entrada de JSON para um componente que
// não renderiza nada. A assimetria é do roteamento de seções, não descuido.

export function EventoVerLista({
  nomeDaLista,
  itens,
}: {
  nomeDaLista: string
  itens:       ItemGA[]
}) {
  /**
   * Uma vez por montagem. A `VitrineHome` é cliente e re-renderiza com os
   * efeitos de seção (framer-motion, IntersectionObserver); sem esta trava, cada
   * re-render republicaria a lista inteira.
   */
  const enviou = useRef(false)

  useEffect(() => {
    if (enviou.current) return
    enviou.current = true
    verLista(nomeDaLista, itens)
    // Deliberadamente sem deps: é "uma vez por montagem", e a trava é o ref.
    // O array vazio + ref é o que sobrevive ao StrictMode em desenvolvimento
    // (que monta duas vezes de propósito).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
