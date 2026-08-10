import { ShieldCheck, Receipt, RotateCcw, Truck } from "lucide-react"

// Bloco de confiança da página de produto — as 4 razões para não fechar a aba,
// logo abaixo do botão de comprar.
//
// Server Component (SEM "use client"), no padrão de `SeloPagamento`,
// `ApresentacaoProduto` e `FichaTecnica`: sem estado, sem efeito, sai completo no
// HTML do ISR.
//
// 🔴 E É O PONTO DESTE COMPONENTE. Medição da auditoria de 31/07 na PDP da A31H:
// "garantia" aparecia 6× e "nota fiscal" 6× no HTML — TODAS dentro de `<meta>`,
// `og:` e `twitter:`. O corpo visível do bloco de compra era, na íntegra, "Camera
// Segurança A31H · R$ 185,00 · Adicionar ao carrinho". O Google lia os sinais de
// confiança; o comprador, não. Sendo server component, este bloco põe os mesmos
// fatos no corpo da página.
//
// ─── Copy fixa no código ──────────────────────────────────────────────────────
//
// Exceção consciente ao princípio "mudar conteúdo = editar JSON", pela MESMA
// razão já declarada em `SeloPagamento.tsx` e `ApresentacaoProduto.tsx`: este
// bloco não é seção de layout, não existe em `layouts/*.json` e não passa pelo
// `PreviewContent`.
//
// 🔴 A AUTORIDADE DE CADA LINHA NÃO É ESTE ARQUIVO. Os quatro fatos são a
// política publicada da loja e vivem em `layouts/trocas-e-devolucoes.json`; aqui
// são o RESUMO exibido na vitrine. Cada item abaixo aponta a linha de origem.
//
// Por que resumo e não import: o texto de origem são parágrafos jurídicos de 40+
// palavras e este bloco precisa de rótulos de 5. Puxar via `blocos[2]
// .paragrafos[0]` acoplaria a página de produto a índices de array de um
// documento legal — reordenar uma seção da política quebraria a PDP em silêncio.
//
// O ponteiro de VOLTA existe: `_nota` em `layouts/trocas-e-devolucoes.json`
// avisa quem editar a política de que estes números são ecoados aqui.
//
// ⚠️ Só entra o que é VERDADE CONFIRMADA. Ficaram DE FORA, e cada ausência é
// deliberada:
//   - frete grátis      → não há limiar configurado na loja
//   - prazo de entrega  → ainda não configurado na Shopify; prazo errado é pior
//                         que prazo ausente
//   - estrelas/avaliação→ não existe review no site (as avaliações são do Mercado
//                         Livre e da Shopee); estrela sem review por trás é o
//                         mesmo defeito que o "12x" que acabou de sair do ar
//   - parcelamento      → já está no `<PriceTag>` logo acima, via
//                         `lib/parcelamento.ts`. Repetir aqui seria dizer o mesmo
//                         número duas vezes na mesma coluna.

/** O `/trocas-e-devolucoes` é onde as CONDIÇÕES completas vivem (sem uso,
 *  embalagem original, e os dois prazos que não se confundem). Afirmar "7 dias
 *  para devolver" na página que vende e esconder a regra que a limita seria o
 *  mesmo padrão que estamos removendo do site. */
const HREF_DEVOLUCAO = "/trocas-e-devolucoes"

const ITENS = [
  {
    Icone: ShieldCheck,
    // trocas-e-devolucoes.json:82 ("3 meses, dada pela nossa loja, diretamente")
    // + :83 ("não existe assistência técnica no meio do caminho").
    texto: "3 meses de garantia direto com a loja",
  },
  {
    Icone: Receipt,
    // _home.json:94 e Footer.tsx:66 ("originais, lacrados e com nota fiscal").
    texto: "Nota fiscal em todo pedido",
  },
  {
    Icone: RotateCcw,
    // trocas-e-devolucoes.json:74 (7 dias corridos, CDC art. 49) + :118 ("o
    // frete de devolução é por nossa conta... você não paga nada para devolver").
    //
    // A citação da lei fica FORA daqui de propósito: em 13px numa coluna de
    // 240px, "(CDC art. 49)" gasta uma linha inteira para dizer ao comprador
    // comum algo que ele não decodifica — e o texto integral da lei está no
    // destino do link, a um clique.
    texto: "7 dias para devolver sem custo",
    href:  HREF_DEVOLUCAO,
  },
  {
    Icone: Truck,
    // Footer.tsx:66 ("entrega para todo o Brasil").
    //
    // Afirma ALCANCE, nunca PRAZO. O prazo não está configurado na Shopify e
    // dizer "3 a 10 dias úteis" aqui seria inventar compromisso na página que
    // fecha a venda.
    texto: "Entrega para todo o Brasil",
  },
] as const

export function SelosConfianca() {
  return (
    <ul className="selos-confianca" aria-label="Garantias da loja">
      {ITENS.map(({ Icone, texto, ...resto }) => {
        const href = "href" in resto ? resto.href : undefined
        return (
          <li key={texto} className="selos-confianca-item">
            <Icone className="selos-confianca-icone" size={16} aria-hidden="true" />
            <span>
              {texto}
              {href && (
                <>
                  {/* O separador é do CÓDIGO, não da copy. Sem ele a linha lê
                      como frase contínua — "devolver sem custo Como funciona" —
                      em vez de afirmação + link (visto na tela, não no código: a
                      string do item termina sem pontuação e o link encosta
                      nela). */}
                  {" · "}
                  <a href={href} className="selos-confianca-link">
                    Como funciona
                  </a>
                </>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
