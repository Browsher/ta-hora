import { Check } from "lucide-react"
import { interpretarApresentacao, temLista } from "@/lib/apresentacao"

// Seção "Sobre este produto" da página de produto (feature apresentacao-produto).
//
// Server Component (SEM "use client"), no padrão de `FichaTecnica` e
// `RecomendadosRelacionados`: monta no servidor, sai completa no HTML do ISR
// (indexável), sem estado/efeito/hook.
//
// 🔴 TEXTO PURO, NUNCA `dangerouslySetInnerHTML`. O conteúdo vem de um
// `multi_line_text_field` — string crua, não HTML — e cada pedaço vira nó React.
// Por isso esta seção NÃO passa pelo `sanitizarDescricao` e não tem superfície
// de injeção: mesmo que alguém digite "<script>" no admin, ele sai como texto
// literal na tela. É a diferença deliberada em relação ao `DescricaoProduto`,
// que renderiza o `descriptionHtml` do lojista e precisa do sanitizador.
//
// IRMÃ do <article>, entre ele e a <FichaTecnica> — nunca um terceiro filho do
// grid de 2 colunas (o mesmo alerta que está em `RecomendadosRelacionados`:
// terceiro filho quebra o layout 60/40).

/** Copy fixa no código — exceção declarada ao "conteúdo em JSON", igual à dos
 *  Recomendados. São RÓTULOS ESTRUTURAIS, não conteúdo do produto: se fossem
 *  digitados no metafield, virariam parágrafos comuns e exigiriam mais uma
 *  convenção de marcação para o lojista decorar. */
const ROTULO_SECAO   = "SOBRE ESTE PRODUTO"
const SUBTITULO_LISTA = "O que este produto resolve por você"
const TITULO_RESSALVA = "Vale saber antes de comprar:"

export function ApresentacaoProduto({ texto }: { texto: string | null }) {
  const { blocos, ressalva } = interpretarApresentacao(texto)

  // Metafield ausente/vazio → nada. Sem título órfão, sem contêiner vazio, sem
  // resíduo visual. Como é seção-IRMÃ (e não filha do grid), a ausência não
  // deixa buraco: a ficha técnica simplesmente sobe.
  if (blocos.length === 0 && !ressalva) return null

  // Subtítulo só existe para anunciar a lista. Sem lista, ele seria um título
  // sobre parágrafo — some junto (mesma regra da grade de cards da ficha).
  const mostrarSubtitulo = temLista(blocos)
  let listaJaVista = false

  return (
    <section className="apresentacao" aria-label="Sobre este produto">
      <div className="apresentacao-coluna">
        <h2 className="apresentacao-rotulo">{ROTULO_SECAO}</h2>

        {blocos.map((bloco, i) => {
          if (bloco.tipo === "paragrafo") {
            return <p key={i} className="apresentacao-paragrafo">{bloco.texto}</p>
          }

          // O subtítulo entra UMA vez, antes da primeira lista — se o lojista
          // escrever duas listas, a segunda não repete o cabeçalho.
          const primeira = !listaJaVista
          listaJaVista = true

          return (
            <div key={i}>
              {primeira && mostrarSubtitulo && (
                <h3 className="apresentacao-subtitulo">{SUBTITULO_LISTA}</h3>
              )}
              <ul className="apresentacao-lista">
                {bloco.itens.map((item, j) => (
                  <li key={j} className="apresentacao-item">
                    <Check className="apresentacao-check" size={20} aria-hidden />
                    <span>
                      <strong className="apresentacao-item-rotulo">{item.rotulo}</strong>
                      {/* O travessão é do CÓDIGO, não do texto: o parser o
                          consumiu ao partir o item. Só aparece quando há
                          detalhe — item sem travessão não ganha um. */}
                      {item.detalhe && (
                        <span className="apresentacao-item-detalhe"> — {item.detalhe}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

        {ressalva && (
          <aside className="apresentacao-ressalva">
            <strong className="apresentacao-ressalva-titulo">{TITULO_RESSALVA}</strong>{" "}
            {ressalva}
          </aside>
        )}
      </div>
    </section>
  )
}
