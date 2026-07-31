// Interpreta o texto de `custom.apresentacao` (metafield multi_line_text_field)
// na convenção acordada com o lojista.
//
// Módulo PURO, mesmo padrão de `lib/shopify/destaques.ts`: sem React, sem
// `server-only`, sem import da camada Shopify. Dá para exercitar com `node -e` e
// é o que o `npm run verificar:apresentacao` reimplementa para conferir os dados
// reais antes de a UI depender deles.
//
// ─── A CONVENÇÃO ──────────────────────────────────────────────────────────────
//
//   linha em branco          → separa BLOCO
//   linhas seguidas com "- " → viram UMA lista
//   " — " ou " – " no item   → corta rótulo (peso maior) do detalhe
//   último bloco             → vira a ressalva (caixa cinza), com ressalvas
//
// ⚠️ O CORTE DO ITEM É SÓ EM TRAVESSÃO CERCADO DE ESPAÇOS, nunca em hífen. Se
// fosse hífen, "Wi-Fi", "grande-angular" e "custo-benefício" partiriam no meio —
// e os dados reais têm "Wi-Fi 2.4 GHz" dentro de um item. Sem travessão, o item
// inteiro sai em peso normal (não é erro: é o padrão para item curto).
//
// ⚠️ A RESSALVA É POSICIONAL E NÃO TEM ESCAPE. O último bloco vira caixa cinza
// sob o título fixo "Vale saber antes de comprar:". Não há como escrever um
// parágrafo final que NÃO seja ressalva — se um dia o texto terminar com uma
// linha de venda ("Peça hoje e receba em 3 dias"), ela vai sair lá dentro.
// Decisão registrada do lojista (31/07/2026): vale a pena para não obrigar
// ninguém a digitar marcação. Se incomodar, trocar por marcador explícito (uma
// linha começando com "! ") é mudança local, aqui nesta função.
//
// Duas bordas que o formato exige:
//   BLOCO ÚNICO       → não vira caixa. Texto de uma linha só é apresentação,
//                       não ressalva.
//   ÚLTIMO É LISTA    → não vira caixa. Terminar em lista significa "sem
//                       ressalva", e transformar a lista em caixa cinza
//                       destruiria os marcadores.

/** Um item de lista, já partido em rótulo (peso maior) e detalhe. */
export interface ItemLista {
  /** Antes do travessão. Sem travessão, carrega o item inteiro. */
  rotulo:   string
  /** Depois do travessão. `null` quando não há travessão. */
  detalhe:  string | null
}

export type BlocoApresentacao =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista";     itens: ItemLista[] }

export interface Apresentacao {
  /** Blocos do corpo, JÁ SEM a ressalva. */
  blocos:   BlocoApresentacao[]
  /** Texto da caixa cinza, ou `null` quando a regra não se aplica. */
  ressalva: string | null
}

/** Travessão (— em dash, – en dash) cercado de espaço. Hífen NÃO entra. */
const TRAVESSAO = /^(.*?)\s+[—–]\s+(.*)$/

const ehItem = (linha: string): boolean => linha.startsWith("- ")

function partirItem(linha: string): ItemLista {
  const texto = linha.slice(2).trim()
  const m = texto.match(TRAVESSAO)
  // `m[1]`/`m[2]` vazios (ex.: "-  — detalhe") caem no ramo sem travessão pelo
  // `|| null` / fallback: nunca renderiza rótulo vazio em negrito.
  if (!m || !m[1].trim()) return { rotulo: texto, detalhe: null }
  return { rotulo: m[1].trim(), detalhe: m[2].trim() || null }
}

/**
 * Um bloco cru vira 1..n blocos tipados: linhas seguidas com "- " agrupam numa
 * lista, as demais viram parágrafos.
 *
 * Agrupar DENTRO do bloco (em vez de exigir que o bloco inteiro seja lista) é o
 * que faz esquecer a linha em branco antes da lista não quebrar nada — o caso
 * mais provável de erro de digitação no admin.
 */
function tiparBloco(bruto: string): BlocoApresentacao[] {
  const saida: BlocoApresentacao[] = []
  let acumulandoItens: string[] = []
  let acumulandoTexto: string[] = []

  const fecharLista = () => {
    if (acumulandoItens.length) {
      saida.push({ tipo: "lista", itens: acumulandoItens.map(partirItem) })
      acumulandoItens = []
    }
  }
  const fecharTexto = () => {
    if (acumulandoTexto.length) {
      saida.push({ tipo: "paragrafo", texto: acumulandoTexto.join(" ") })
      acumulandoTexto = []
    }
  }

  for (const linha of bruto.split("\n")) {
    const l = linha.trim()
    if (!l) continue
    if (ehItem(l)) { fecharTexto(); acumulandoItens.push(l) }
    else           { fecharLista(); acumulandoTexto.push(l) }
  }
  fecharTexto()
  fecharLista()

  return saida
}

/**
 * Texto cru do metafield → estrutura pronta para render.
 *
 * `null`/vazio devolve `blocos: []`, e é isso que o componente lê para não
 * renderizar nada (mesmo padrão de `FichaTecnica` com `specs.length === 0`).
 */
export function interpretarApresentacao(cru: string | null | undefined): Apresentacao {
  // \r\n → \n ANTES de tudo. Medido em 31/07/2026: a Shopify devolveu só \n
  // neste campo, mas quem digita no admin pode colar de um editor Windows, e um
  // \r sobrevivente viraria espaço órfão no fim de cada linha.
  const texto = (cru ?? "").replace(/\r\n/g, "\n").trim()
  if (!texto) return { blocos: [], ressalva: null }

  const brutos = texto.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  const blocos = brutos.flatMap(tiparBloco)
  if (blocos.length === 0) return { blocos: [], ressalva: null }

  const ultimo = blocos[blocos.length - 1]
  // As duas bordas do topo do arquivo, na mesma linha: mais de um bloco E o
  // último ser parágrafo.
  const viraRessalva = blocos.length > 1 && ultimo.tipo === "paragrafo"

  return viraRessalva
    ? { blocos: blocos.slice(0, -1), ressalva: ultimo.texto }
    : { blocos, ressalva: null }
}

/** Há alguma lista no corpo? Decide o subtítulo fixo (sem lista, ele é órfão). */
export function temLista(blocos: BlocoApresentacao[]): boolean {
  return blocos.some((b) => b.tipo === "lista")
}
