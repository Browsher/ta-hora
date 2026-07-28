import { SetasCarrossel } from "@/components/ui/SetasCarrossel"

// A faixa do carrossel de mobile, compartilhada pela vitrine da Home e por
// "Você também pode gostar" (feature home-produtos-carrossel).
//
// 🔴 SEM "use client": nenhum hook aqui dentro. É isso que permite a faixa ser
// servidor DE VERDADE dentro do `RecomendadosRelacionados` (Server Component) —
// a única coisa nova que vai para o bundle da página de produto são os dois
// botões das setas. Dentro da `VitrineHome` ela vira cliente por contágio, e
// tudo bem.
//
// 🔴 O carrossel é APRESENTAÇÃO, não filtro. Nenhum produto é removido do DOM,
// escondido com `display:none`/`hidden`/`aria-hidden` nem adiado para depois da
// hidratação: todos os itens saem no HTML do servidor, e o CSS só muda como o
// MOBILE os exibe. É por isso que a decisão mobile/desktop é `@media` pura e não
// `useIsMobile` — aquele hook devolve `false` no primeiro render, então o HTML
// sairia sempre no ramo de desktop e o Google nunca veria o outro.
export function CarrosselMobile({
  id,
  rotulo,
  quantidade,
  classeFaixa,
  children,
}: {
  /** id ÚNICO da faixa — as setas a acham por ele no DOM. */
  id:          string
  /** nome acessível da região rolável. */
  rotulo:      string
  /** quantos itens — decide NO SERVIDOR se o carrossel liga. */
  quantidade:  number
  /** a classe de grade de DESKTOP do consumidor, preservada intacta. */
  classeFaixa: string
  children:    React.ReactNode
}) {
  // Com um único produto não há "próximo": sem setas e, via `data-ativo`, sem
  // nenhum sinal de carrossel — nem a espiada na borda. Decidido no SERVIDOR, o
  // que significa que as setas nem existem no HTML nesse caso.
  const ativo = quantidade > 1

  return (
    <div className="carrossel">
      <div
        id={id}
        role="group"
        aria-label={rotulo}
        // O INTERRUPTOR do CSS. Toda regra de carrossel é escopada a
        // [data-ativo="true"] dentro da media query de mobile.
        data-ativo={ativo}
        // Duas classes: a do consumidor governa o DESKTOP (e continua sendo a
        // única coisa que vale lá); `.carrossel__faixa` só é lida dentro da
        // media query de mobile.
        className={`${classeFaixa} carrossel__faixa`}
      >
        {children}
      </div>
      {/* 🔴 SEM `tabindex` na faixa, deliberadamente. A faixa contém APENAS os
          `<a>` dos cards: Tab já percorre todos, e o navegador rola o item
          focado para dentro da vista (a isenção conhecida da WCAG 2.1.1 —
          região rolável só precisa de `tabindex` quando NÃO tem conteúdo focável
          dentro). Um `tabindex` aqui seria redundante no mobile e, no desktop,
          uma parada de Tab que não faz nada, em toda visita. */}
      {ativo && <SetasCarrossel alvo={id} />}
    </div>
  )
}
