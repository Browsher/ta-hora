"use client"

// As setas ‹ › do carrossel de mobile (feature home-produtos-carrossel).
//
// 🔴 ESTE ARQUIVO É TODO O JAVASCRIPT NOVO DA FEATURE. O carrossel em si — o
// arrasto e o encaixe — é CSS puro (`overflow-x` + `scroll-snap`) em
// globals.css. As setas são COMODIDADE, para quem não percebeu que dá para
// arrastar: com o JS quebrado ou desligado, a faixa continua funcionando.
//
// PROIBIDO AQUI, POR CONTRATO: `useState`, `useEffect`, `useRef`,
// `addEventListener`, autoplay, bolinhas, estado de índice. É o oposto do
// `useCarousel` do template (que mede em efeito e guarda em estado) — e é
// deliberado: ler uma dimensão DENTRO do handler de clique é permitido e
// suficiente; medir fora dele exigiria efeito, estado e listener de `resize`.
//
// 🔴 NÃO reusa a `NavArrow` do template, embora ela tenha os glifos certos: ela
// é `motion.button` do Framer Motion, e o `MotionConfig reducedMotion="user"`
// existe SÓ no `PreviewContent`. Na Home ela estaria coberta; em "Você também
// pode gostar" (que roda sob o `StoreShell`) NÃO estaria — o mesmo componente
// com garantia de acessibilidade numa seção e sem ela na outra é a pior espécie
// de inconsistência, porque é invisível. Estes são `<button>` puros, e tratam o
// `prefers-reduced-motion` explicitamente abaixo, valendo nos dois lugares.

/**
 * @param alvo `id` da faixa a rolar. As setas a acham por `getElementById` no
 *   clique, e não por `ref`: um `ref` obrigaria a faixa a ser componente de
 *   CLIENTE para compartilhar o objeto, e é justamente ser Server Component que
 *   permite ao `CarrosselMobile` não mandar nada além destes dois botões para o
 *   bundle da página de produto.
 */
export function SetasCarrossel({ alvo }: { alvo: string }) {
  function rolar(direcao: 1 | -1) {
    const faixa = document.getElementById(alvo)
    if (!faixa) return

    // Um card por clique, no mínimo — um deslocamento menor faria a seta parecer
    // quebrada, e o `scroll-snap` do CSS alinha o resultado de qualquer jeito.
    const primeiro = faixa.firstElementChild
    const larguraCard = primeiro
      ? primeiro.getBoundingClientRect().width
      : faixa.clientWidth * 0.8

    // 🔴 O `parseFloat(...) || 0` NÃO é decoração: `columnGap` devolve STRING
    // ("12px") e devolve "normal" quando não há gap definido. Somar a string
    // concatenaria; `parseFloat("normal")` é NaN, e um `scrollBy` com NaN
    // simplesmente NÃO FAZ NADA — sem erro no console, com a seta parecendo
    // quebrada.
    const gap = parseFloat(getComputedStyle(faixa).columnGap) || 0

    // O par em JS do `scroll-behavior: auto` que o CSS aplica sob a mesma
    // media feature. Os dois são necessários: cada um cobre um caminho.
    const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches

    // Nos extremos isto é NO-OP do próprio navegador — que é exatamente o
    // comportamento pedido (setas sempre habilitadas), de graça. Desabilitá-las
    // nas pontas exigiria estado de índice e listener de scroll.
    faixa.scrollBy({
      left: direcao * (larguraCard + gap),
      behavior: suave ? "smooth" : "auto",
    })
  }

  return (
    <div className="carrossel__setas">
      <button
        type="button"
        aria-label="Anterior"
        aria-controls={alvo}
        onClick={() => rolar(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Próximo"
        aria-controls={alvo}
        onClick={() => rolar(1)}
      >
        ›
      </button>
    </div>
  )
}
