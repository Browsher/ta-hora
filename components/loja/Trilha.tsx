import Link from "next/link"
import type { ItemTrilha } from "@/lib/seo/trilha"

// Trilha de navegação visível (breadcrumb).
//
// Server Component sem estado: recebe o array pronto de `lib/seo/trilha.ts` — o
// MESMO que alimenta o `BreadcrumbList` do JSON-LD. Ver o bloco no topo daquele
// arquivo para o porquê de a fonte ser única.
//
// ═══ ONDE ESTE COMPONENTE ENTRA, E POR QUE FORA DO GRID ════════════════════
//
// Na PDP ele é IRMÃO do `<article className="produto-grid">`, acima dele — nunca
// dentro de `.produto-coluna-esquerda`.
//
// 🔴 Isso não é preferência de layout, é o orçamento do sticky. Aquela coluna
// mede 724px com a calculadora de frete aberta, contra 736px úteis no limiar de
// `min-height: 760px` — 12px de folga (medido em 12/08/2026, ver o bloco do
// sticky em globals.css). Uma trilha DENTRO da coluna comeria esses 12px e
// destravaria o sticky em notebooks baixos. Fora do grid, ela custa ZERO daquele
// orçamento, porque o que conta lá é a altura da própria coluna.
//
// O `padding-top` do `<article>` foi de 40px para 12px no mesmo commit: a trilha
// ocupa espaço que já existia, e a página não ficou mais alta. Ao mexer em um,
// conferir o outro.
//
// ═══ ACESSIBILIDADE ════════════════════════════════════════════════════════
//
// `<nav aria-label>` porque a página tem mais de uma navegação (navbar, rodapé,
// esta) — sem rótulo, um leitor de tela anuncia três "navegação" indistinguíveis.
// `<ol>` porque a ordem dos degraus É a informação. O separador é `aria-hidden`:
// é desenho, e lido em voz alta ("maior que") só polui.
//
// O último item NÃO é link e leva `aria-current="page"`: é a página onde a pessoa
// já está. Um link para si mesmo é um destino falso na navegação — e é também o
// item que o schema emite sem `item`, pelo mesmo motivo.

export function Trilha({ itens }: { itens: ItemTrilha[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="trilha">
      <ol className="trilha-lista">
        {itens.map((item, i) => {
          const ultimo = i === itens.length - 1
          return (
            <li key={item.href} className="trilha-item">
              {ultimo ? (
                <span aria-current="page" className="trilha-atual">{item.nome}</span>
              ) : (
                <Link href={item.href} className="trilha-link">{item.nome}</Link>
              )}
              {/* Desenho, não conteúdo — fora da árvore de acessibilidade. */}
              {!ultimo && <span aria-hidden="true" className="trilha-separador">›</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
