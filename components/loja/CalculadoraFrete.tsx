"use client"

import { useEffect, useState } from "react"
// Ícones do `lucide-react`, que JÁ é dependência do projeto (SelosConfianca,
// BarraCompraMobile e o Footer usam) — nenhuma biblioteca nova foi instalada
// para isto. SVG inline à mão funcionaria igual, mas duplicaria à mão o que o
// pacote já entrega com tamanho, `stroke-width` e alinhamento consistentes com
// os outros ícones da mesma coluna.
import { Rocket, Truck } from "lucide-react"
import { consultarFrete, type ResultadoFrete } from "@/lib/frete/consultar"
import { formatarCep, normalizarCep } from "@/lib/frete/faixas"
import { formatarValor, textoDoPrazo } from "@/lib/frete/tabela"
import { consultarFrete as eventoConsultarFrete } from "@/lib/analytics/gtag"

// Calculadora de frete da PDP: o cliente digita o CEP e vê prazo e valor da
// região dele, sem sair da página.
//
// ─── SEM REDE, E ISSO É DECISÃO DE PRODUTO ────────────────────────────────────
//
// Todo o cálculo sai de tabela local (`lib/frete/`), então o resultado é
// instantâneo e não há estado de carregando, timeout, retry nem erro de rede
// para desenhar. A alternativa — consultar a Shopify ao vivo — foi medida e
// recusada: exigiria criar um carrinho-sonda por visitante que digita CEP, numa
// das páginas mais quentes do site. O preço dessa escolha é a cópia de dados, e
// ele está pago no `verificar:frete` (valor) e declarado como risco aberto
// (prazo). Ver o cabeçalho de `lib/frete/tabela.ts` antes de mexer aqui.
//
// ─── ⚠️ ESTE BLOCO ACRESCENTA ALTURA À COLUNA DE COMPRA ───────────────────────
//
// MEDIDO no navegador em 10/08/2026 (PDP da A31H, viewport 1920×855, CEP do
// Norte — o caso mais alto, com 2 opções):
//
//   .frete-calc            fechado  90px   →  aberto 254px  (+164)
//   .produto-coluna-esquerda  551px  →  716px
//   botão "Adicionar"      ocupa 231–280px a partir do topo da coluna
//
// A coluna é o alvo do sticky condicional (`min-width: 768px` e
// `min-height: 760px`, em globals.css), que pina com `top: 24px` — ou seja, o
// que aparece é `viewport − 24`.
//
//   ✅ O botão "Adicionar" continua visível a partir de 304px de viewport.
//      Ele está no TERÇO DE CIMA da coluna; crescer no rodapé não o empurra.
//   ✅ A coluna INTEIRA exige 740px de viewport, e o limiar do sticky subiu de
//      640 para 760px em 11/08/2026 por causa deste bloco — antes disso, entre
//      640 e 740 o sticky pinava uma coluna mais alta que a tela e comia o
//      resultado do frete. Ver o bloco do sticky em globals.css: crescer aqui
//      dentro pode exigir subir o limiar de novo.
//
// 🔴 A ESTIMATIVA ANTERIOR DESTE COMENTÁRIO ESTAVA ERRADA e ficou aqui como
// aviso: eu havia calculado ~620px a partir do CSS, e o valor real é 716px. A
// conta partia dos "~470px" citados no comentário do sticky, que já estavam
// velhos antes desta feature — a coluna media 551px só com os selos. Não
// estime altura a partir de CSS neste layout; abra o navegador e meça.

/** Chave do último CEP consultado — quem navega entre PDPs não redigita. */
const CHAVE_LOCAL = "ta-hora:ultimo-cep"

export function CalculadoraFrete() {
  const [cep, setCep] = useState("")
  const [resultado, setResultado] = useState<ResultadoFrete | null>(null)

  // localStorage SÓ no efeito, nunca no initializer do useState: o HTML do
  // servidor não conhece o storage, e semear o estado inicial com ele faria o
  // primeiro render do cliente divergir do servidor (erro de hidratação).
  //
  // Restaura o CEP mas NÃO o resultado: quem volta ao site vê o campo
  // preenchido e decide se ainda quer aquele endereço. Mostrar prazo e valor de
  // uma consulta antiga sem a pessoa pedir é afirmar, sem ser perguntado, um
  // compromisso que pode ter mudado.
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_LOCAL)
      if (salvo) setCep(formatarCep(salvo))
    } catch {
      // Storage bloqueado (modo privado, cookies de terceiros barrados) não é
      // motivo para a calculadora não funcionar — ela só esquece o CEP.
    }
  }, [])

  const completo = normalizarCep(cep) !== null

  function aoDigitar(valor: string) {
    setCep(formatarCep(valor))
    // 🔴 Limpa o resultado a CADA tecla. Sem isto, quem consulta 01310-100, vê
    // "São Paulo · 1 a 3 dias" e depois começa a digitar outro CEP fica olhando
    // o resultado velho embaixo do campo novo — o erro mais fácil de cometer
    // aqui e o mais difícil de perceber, porque a tela parece certa.
    setResultado(null)
  }

  function calcular() {
    const r = consultarFrete(cep)
    setResultado(r)

    if (r.tipo === "incompleto") return

    try {
      localStorage.setItem(CHAVE_LOCAL, cep)
    } catch {
      // idem: sem storage, só não lembra.
    }

    eventoConsultarFrete(
      r.tipo === "ok" ? "ok" : r.tipo,
      r.tipo === "ok"
        ? { uf: r.uf, regiao: r.zona }
        : r.tipo === "sem-atendimento"
          ? { uf: r.uf }
          : {},
    )
  }

  return (
    <div className="frete-calc">
      <div className="frete-calc__titulo">
        <Truck className="frete-calc__icone" size={16} aria-hidden="true" />
        <span>Calcular frete e prazo</span>
      </div>

      {/* <form> e não dois handlers soltos: dá Enter de graça no teclado do
          mobile e o `type="submit"` faz o botão participar do formulário. */}
      <form
        className="frete-calc__linha"
        onSubmit={e => { e.preventDefault(); calcular() }}
      >
        <input
          className="frete-calc__campo"
          value={cep}
          onChange={e => aoDigitar(e.target.value)}
          // `inputMode` (teclado numérico no mobile) + `autoComplete` (o
          // navegador oferece o CEP salvo). `type="text"`, NÃO `number`: number
          // aceita "e", "+" e "-", perde o zero à esquerda de "01310-100" e
          // ganha setinhas de incremento que não fazem sentido num CEP.
          inputMode="numeric"
          autoComplete="postal-code"
          // 9 = 8 dígitos + o hífen da máscara.
          maxLength={9}
          placeholder="00000-000"
          aria-label="Digite seu CEP"
        />
        <button
          className="frete-calc__botao"
          type="submit"
          disabled={!completo}
        >
          Calcular
        </button>
      </form>

      {/* `aria-live="polite"`: o resultado aparece sem mudar o foco, então quem
          usa leitor de tela não ficaria sabendo. `polite` espera a pessoa parar
          de digitar, ao contrário de `assertive`, que interromperia. */}
      <div className="frete-calc__resultado" aria-live="polite">
        <Resultado resultado={resultado} />
      </div>
    </div>
  )
}

/**
 * O `switch` é EXAUSTIVO por tipo — o `never` no default é o que garante isso.
 * Um caso novo em `ResultadoFrete` quebra o build aqui até ganhar tela própria,
 * em vez de cair silenciosamente num "nada aconteceu".
 */
function Resultado({ resultado }: { resultado: ResultadoFrete | null }) {
  if (resultado === null) return null

  switch (resultado.tipo) {
    // Alguém apertou Enter com o CEP pela metade. Sem drama e sem vermelho: o
    // botão já está desabilitado, então isto é caminho de teclado, não erro.
    case "incompleto":
      return null

    case "cep-desconhecido":
      return (
        <p className="frete-calc__aviso">
          Não reconhecemos esse CEP. Confere o número?{" "}
          <a href="/suporte" className="frete-calc__link">Falar com a gente</a>
        </p>
      )

    case "sem-atendimento":
      return (
        <p className="frete-calc__aviso">
          Ainda não temos frete calculado para {resultado.estado}.{" "}
          <a href="/suporte" className="frete-calc__link">Consulte pelo WhatsApp</a>
        </p>
      )

    case "ok":
      return (
        <>
          <p className="frete-calc__estado">Entrega para {resultado.estado}</p>
          <ul className="frete-calc__opcoes">
            {resultado.opcoes.map(o => {
              const Icone = o.nome === "Expresso" ? Rocket : Truck
              return (
                <li key={o.nome} className="frete-calc__opcao">
                  {/* Ícone decorativo: o nome logo ao lado já diz o que ele
                      significa, então `aria-hidden` evita o leitor de tela
                      anunciar "foguete Expresso". A cor NÃO é a única portadora
                      da distinção — foguete/caminhão e os nomes carregam a
                      informação para quem não separa laranja de cinza. */}
                  <Icone
                    className={`frete-calc__opcao-icone frete-calc__opcao-icone--${o.nome === "Expresso" ? "expresso" : "comum"}`}
                    size={18}
                    aria-hidden="true"
                  />
                  <span className="frete-calc__opcao-texto">
                    <span className="frete-calc__nome">{o.nome}</span>
                    <span className="frete-calc__prazo">{textoDoPrazo(o)}</span>
                  </span>
                  <span className="frete-calc__valor">R$ {formatarValor(o.valor)}</span>
                </li>
              )
            })}
          </ul>
          {/* O prazo conta a partir do DESPACHO, não do clique em comprar — e
              essa distinção é a origem clássica de "meu pedido está atrasado"
              quando não está. Cabe numa linha, então cabe. */}
          <p className="frete-calc__nota">
            Prazo em dias úteis após a confirmação do pagamento.
          </p>
        </>
      )

    default: {
      const impossivel: never = resultado
      return impossivel
    }
  }
}
