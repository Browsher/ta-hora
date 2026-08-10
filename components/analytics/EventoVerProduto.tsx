"use client"

import { useEffect } from "react"
import { verProduto, type ItemGA } from "@/lib/analytics/gtag"

// `view_item` da PDP. Renderiza NADA — só dispara o evento na montagem.
//
// ─── POR QUE UM COMPONENTE, E POR QUE ELE RECEBE O ITEM PRONTO ───────────────
//
// A PDP é um Server Component sob ISR: não pode disparar evento nenhum (o HTML
// dela é cacheado por 5 min e servido a N pessoas — um evento no servidor sairia
// uma vez por revalidação, não uma por visita).
//
// Então o disparo é do cliente. Mas o `item` é montado no SERVIDOR e chega por
// prop, em vez de este componente receber o `Product` inteiro e derivar. Dois
// motivos:
//
//   1. É o padrão da casa. `ProductCard` já chega derivado do servidor
//      (`normalizeProductCard`), com a justificativa registrada lá: o valor que
//      a UI não deve usar nunca cruza a fronteira.
//   2. O `Product` inteiro são ~4 KB por PDP (descriptionHtml, images, specs)
//      que já atravessam para o HTML. Mandá-lo de novo como prop serializada de
//      componente cliente pagaria o payload duas vezes por um item de 4 campos.
//
// ⚠️ O ISR não é problema para a medição, e vale entender por quê: o `item` sai
// no HTML cacheado, mas o EVENTO acontece na montagem, no browser de cada
// visitante. Uma visita = um `view_item`. O que o cache pode causar é o evento
// carregar um PREÇO de até 5 min atrás — o mesmo preço que a página está
// mostrando, que é a resposta certa: o evento tem que refletir o que a pessoa
// viu, não o que o banco de dados diz agora.

export function EventoVerProduto({ item }: { item: ItemGA }) {
  useEffect(() => {
    verProduto(item)
    // Chaveado no `item_id`, não no objeto: a prop é um literal novo a cada
    // render do servidor, e um array de dependência com o objeto refaria o
    // disparo a cada re-render do pai — `view_item` duplicado na mesma visita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.item_id])

  return null
}
