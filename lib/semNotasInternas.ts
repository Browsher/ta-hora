import type { Layout } from "@/lib/types"

// ─── Notas internas fora do HTML ──────────────────────────────────────────────
//
// Os JSONs de layout carregam chaves com prefixo `_` que são anotação para quem
// edita o arquivo, não conteúdo de página (`_naoPublicarAssim`, `_nota`…). JSON
// não aceita comentário, então essa é a única forma de comentar ali dentro.
//
// O problema: `PreviewContent` é "use client" e recebe o layout INTEIRO como
// prop. Tudo que está no objeto — em qualquer nível de aninhamento — vai para o
// payload RSC e fica legível no código-fonte da página. Anotação interna em
// documento legal público não pode vazar.
//
// Daí este passo: remove toda chave `_*` antes do layout chegar ao componente.
// A varredura é recursiva de propósito — a nota de hoje mora em
// `sections[].content`, mas nada impede que a próxima nasça em outro nível.
//
// O grosso das pendências vive em docs/legal-pendencias.md; o que sobra no JSON
// é o `_naoPublicarAssim`, que precisa estar no arquivo que a pessoa abre.

function limpar<T>(valor: T): T {
  if (Array.isArray(valor)) return valor.map(limpar) as unknown as T

  if (valor !== null && typeof valor === "object") {
    const saida: Record<string, unknown> = {}
    for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
      if (chave.startsWith("_")) continue
      saida[chave] = limpar(v)
    }
    return saida as T
  }

  return valor
}

/**
 * Devolve uma cópia do layout sem nenhuma chave `_*`, em nenhum nível.
 * Use SEMPRE que um layout for entregue ao `PreviewContent`.
 */
export function semNotasInternas(layout: Layout): Layout {
  return limpar(layout)
}
