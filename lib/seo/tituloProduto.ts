import type { Product } from "@/lib/shopify/types"

// Title da PDP, DERIVADO das specs reais do produto.
//
// Módulo PURO, mesmo padrão de `produtoSchema.ts` e `parcelamento.ts`: sem React,
// sem fetch, sem `server-only`. Exercitável com `node -e`.
//
// ═══ POR QUE ESTE ARQUIVO EXISTE ═══════════════════════════════════════════
//
// Até 11/08/2026 as 7 PDPs se chamavam "Câmera Segurança A31H", "…Q6", "…S8" —
// código de FÁBRICA, com duas consequências medidas:
//
//   1. Ninguém busca "A31H" no Google. As páginas que VENDEM competiam por um
//      termo sem demanda; só chegava quem já conhecia o modelo do Mercado Livre.
//   2. Gastavam 24-31 dos ~60 caracteres úteis do title. Metade do espaço vazio,
//      e a metade preenchida sem demanda.
//
// ═══ POR QUE DERIVADO, E NÃO UM CAMPO `seo_title` NO ADMIN ═════════════════
//
// Um campo novo é uma segunda fonte para um fato que já existe: a resolução e o
// número de lentes já estão cadastrados e já aparecem na tela. Duas fontes para o
// mesmo fato divergem — e a que ninguém vê (o title) apodrece primeiro. É o mesmo
// argumento de `lib/parcelamento.ts`, e o motivo de a meta description já derivar
// o valor da parcela em vez de repetir uma string fixa.
//
// Consequência declarada: mudar a resolução no admin muda o title no próximo ISR.
// É desejado.
//
// ═══ O QUE ESTE ARQUIVO NÃO FAZ, E POR QUÊ ═════════════════════════════════
//
// Sondagem dos 21 metafields nos 7 produtos (11/08/2026): 11 têm valor IDÊNTICO
// nos 7 — poder de diferenciação zero. Só resolução, lentes, campo visual,
// diâmetro, cor, alarme e modelo variam.
//
// 🔴 NÃO use "360°". `campo_visual` é 355° ou 330°, NUNCA 360°. Uma auditoria
//    anterior propôs "360°" por chute; o dado desmente por 5 graus, e title é
//    alegação pública.
// 🔴 NÃO segmente em "interna" vs "externa". `lugares_de_montagem` é
//    "Interna, Externa" nos 7 — não existe câmera só-interna nesta loja.
// 🔴 NÃO use `selo` ("Mais vendida", "Melhor para área externa"). É linguagem de
//    marketing do lojista, não de busca, e "melhor para área externa" é frase de
//    venda, não característica física confirmada.
// 🔴 NÃO afirme "à prova d'água" nem "PTZ". `resistente_a_agua` e
//    `tipo_de_movimento` vêm "Sim"/"PTZ" nos 7, INCLUSIVE na Câmera Lâmpada — o
//    padrão de preenchimento em lote. Enquanto não for confirmado produto a
//    produto, não vira alegação pública.

/** Prefixo comum a todos: a categoria + a palavra-chave central da loja. */
const PREFIXO = "Câmera Segurança Wi-Fi"

/**
 * Encurtamentos de `custom.tipo_de_resolucao`. Valor não mapeado passa INTACTO —
 * uma resolução nova ("2K") entra no title sozinha, sem edição de código.
 */
const RESOLUCAO_CURTA: Record<string, string> = {
  "4K Ultra HD": "4K",
}

/**
 * `custom.numero_de_lentes` → descritor de title.
 *
 * "Lente única" mapeia para string VAZIA de propósito: lente única não é
 * diferencial e não tem demanda de busca. Nesses casos o espaço é aproveitado
 * pelos locais de uso (ver `localDeUso`), que é fato igualmente verdadeiro e
 * tem busca real ("câmera interna e externa").
 */
const DESCRITOR_LENTE: Record<string, string> = {
  "Lente única":  "",
  "Lente dupla":  "Dupla Lente",
  "Lente tripla": "Tripla Lente",
}

/**
 * A Câmera Lâmpada é a ÚNICA fora do template, e a exceção é deliberada:
 * "rosqueia no bocal" é a busca de MENOR CONCORRÊNCIA do catálogo inteiro, e vale
 * mais que qualquer combinação de specs. O formato é o diferencial; a resolução é
 * detalhe.
 *
 * Casado por handle. Se o handle mudar, o produto cai no template genérico — que
 * continua CORRETO, só menos otimizado. Degradação aceitável, não bug.
 */
const HANDLE_LAMPADA = "camera-lampada"
const PREFIXO_LAMPADA = "Câmera Lâmpada Wi-Fi que Rosqueia no Bocal"

/** Valor de uma spec pela `key`, ou `null` quando ausente/vazia. */
function spec(produto: Product, key: string): string | null {
  return produto.specs.find((s) => s.key === key)?.value?.trim() || null
}

/**
 * "Interna e Externa" — DERIVADO de `custom.lugares_de_montagem`, nunca fixo.
 *
 * Hoje os 7 produtos trazem "Interna, Externa" e a função sempre devolve os dois.
 * Mas cadastrar uma câmera só-interna amanhã é plausível, e um literal aqui faria
 * o title dela mentir em silêncio. Derivar custa nada: a chave já está em
 * SPEC_METAFIELDS, então já chega em `produto.specs`.
 */
function localDeUso(produto: Product): string | null {
  const bruto = spec(produto, "lugares_de_montagem")
  if (!bruto) return null
  const temInterna = /interna/i.test(bruto)
  const temExterna = /externa/i.test(bruto)
  if (temInterna && temExterna) return "Interna e Externa"
  if (temExterna) return "Externa"
  if (temInterna) return "Interna"
  return null
}

/**
 * Código do modelo para o FIM do title, sem o prefixo de fabricante.
 *
 * `custom.modelo` traz "IC-A31H" / "ES-P9" — o `IC`/`ES` é o app (ICSee /
 * EseeCloud), que não é a marca do produto (ver a decisão de omitir `brand` em
 * produtoSchema.ts) e não é como o modelo aparece no H1 da página. Removido, o
 * title fica "A31H", igual ao que o cliente vê na tela e ao que quem vem do
 * Mercado Livre digita.
 *
 * O código fica no FIM — posição de menor peso — e não no começo, como antes.
 */
function modelo(produto: Product): string | null {
  const bruto = spec(produto, "modelo")
  if (!bruto) return null
  return bruto.replace(/^[A-Za-z]{2}-/, "").trim() || null
}

/**
 * Monta o title da PDP.
 *
 * 🔴 DEVOLVE O TITLE **SEM** O SUFIXO " | Ta Hora". Quem acrescenta é o
 * `template: "%s | Ta Hora"` de `app/layout.tsx`. Somar o sufixo aqui produziria
 * "… | Ta Hora | Ta Hora" — que não quebra o build, só sai errado na aba e no
 * Google. Ver o aviso no topo daquele arquivo.
 *
 * Comprimentos medidos com o sufixo somado (11/08/2026): 51 a 60 caracteres nos
 * 7 produtos, todos dentro do limite de exibição do Google.
 *
 * Degrada por partes: cada componente ausente some, e o resto continua. Sem spec
 * nenhuma, cai em `produto.title` — o comportamento de antes desta feature, nunca
 * uma string vazia.
 */
export function tituloProduto(produto: Product): string {
  const resolucaoBruta = spec(produto, "tipo_de_resolucao")
  const resolucao = resolucaoBruta
    ? RESOLUCAO_CURTA[resolucaoBruta] ?? resolucaoBruta
    : null

  if (produto.handle === HANDLE_LAMPADA) {
    return [PREFIXO_LAMPADA, resolucao].filter(Boolean).join(" ")
  }

  // Lente múltipla é o diferencial quando existe; quando não existe, o espaço vai
  // para os locais de uso. Nunca os dois — o title não comporta.
  const lente = produto.lentes ? DESCRITOR_LENTE[produto.lentes] : undefined
  const meio = lente || localDeUso(produto)

  const partes = [PREFIXO, resolucao, meio, modelo(produto)].filter(Boolean)
  // Só o prefixo significa que nenhuma spec chegou — melhor o nome do produto.
  return partes.length > 1 ? partes.join(" ") : produto.title
}
