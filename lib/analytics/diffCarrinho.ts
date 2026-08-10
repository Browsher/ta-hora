import { itemDaLinha, type ItemGA } from "./gtag"
import type { LinhaCarrinho } from "@/lib/shopify/types"

// Compara dois estados do carrinho e diz o que ENTROU e o que SAIU.
//
// ─── POR QUE O EVENTO NASCE DE UM DIFF, E NÃO DO CLIQUE DO BOTÃO ─────────────
//
// O `BotaoAdicionar` recebe SÓ o `handle` — decisão de segurança registrada no
// próprio arquivo ("o servidor resolve a variante, o cliente não pode injetar a
// variante de outro produto"). Ele não conhece preço, nem título, nem se a
// adição deu certo. Disparar `add_to_cart` lá dentro obrigaria a inventar o
// `value` e a contar adições que FALHARAM.
//
// O diff resolve os três de uma vez: preço e título saem da resposta da Shopify,
// e o evento só existe se o carrinho realmente mudou.
//
// Bônus não acidental: o `+`/`−` do drawer passam a contar também. GA4 modela
// "1 → 3" como `add_to_cart` de 2 e "3 → 1" como `remove_from_cart` de 2, que é
// exatamente o que um diff por quantidade produz. Um disparo no clique do botão
// de adicionar mediria só uma das quatro superfícies.
//
// ─── CHAVE: `handle` ─────────────────────────────────────────────────────────
//
// Não o `id` da linha (`gid://shopify/CartLine/...`): remover um item e
// readicioná-lo gera uma linha NOVA, com id novo, e o diff por id leria isso como
// "removeu 1, adicionou 1" de produtos distintos. O `handle` é estável e é o
// mesmo `item_id` que a PDP manda no `view_item`.
//
// Premissa: uma linha por handle. Vale porque o servidor resolve UMA variante por
// handle (`resolverVariante`) — a loja não vende duas variantes do mesmo produto.
// Se um dia vender, esta chave precisa virar `handle + variante`.

export interface DiffCarrinho {
  adicionados: ItemGA[]
  removidos:   ItemGA[]
}

const VAZIO: DiffCarrinho = { adicionados: [], removidos: [] }

/**
 * @param antes  Linhas antes da ação. `null` = não havia carrinho.
 * @param depois Linhas depois. `null` = **a ação falhou** — ver abaixo.
 */
export function diffCarrinho(
  antes:  LinhaCarrinho[] | null,
  depois: LinhaCarrinho[] | null,
): DiffCarrinho {
  /*
    🔴 A GUARDA MAIS IMPORTANTE DESTE ARQUIVO.

    Toda falha das actions devolve `{ carrinho: null }` (lib/carrinho/acoes.ts —
    o `CarrinhoProvider` documenta isso na justificativa do memo de sugestões).
    Então uma Shopify piscando durante um `adicionarItem` produz:

        antes  = [câmera, cartão, cabo]
        depois = null

    Sem este `return`, o diff leria isso como o cliente ter esvaziado o carrinho e
    mandaria um `remove_from_cart` de três produtos que ninguém removeu — com
    `value` cheio. O resultado é receita negativa fantasma no relatório de
    carrinho, aparecendo exatamente nos momentos de instabilidade da Shopify, que
    é quando ninguém está olhando o GA4.

    `depois === null` significa "não sei o estado", nunca "está vazio". Carrinho
    de fato esvaziado chega como `[]`.
  */
  if (depois === null) return VAZIO

  const mapa = (linhas: LinhaCarrinho[] | null) =>
    new Map((linhas ?? []).map((l) => [l.handle, l]))

  const mAntes  = mapa(antes)
  const mDepois = mapa(depois)

  const adicionados: ItemGA[] = []
  const removidos:   ItemGA[] = []

  for (const [handle, linha] of mDepois) {
    const delta = linha.quantidade - (mAntes.get(handle)?.quantidade ?? 0)
    if (delta > 0) adicionados.push(itemDaLinha(linha, delta))
  }

  for (const [handle, linha] of mAntes) {
    const depoisDela = mDepois.get(handle)
    // Linha que desapareceu → removeu tudo. Linha que encolheu → removeu o delta.
    const delta = linha.quantidade - (depoisDela?.quantidade ?? 0)
    // `itemDaLinha(linha, ...)`: os dados vêm do estado ANTERIOR, o único que
    // ainda tem título e preço do que saiu.
    if (delta > 0) removidos.push(itemDaLinha(linha, delta))
  }

  return { adicionados, removidos }
}
