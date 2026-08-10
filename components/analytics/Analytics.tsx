"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { usePathname } from "next/navigation"
import { ATIVO, GA_ID, MODO_DEBUG, definirPagina, evento } from "@/lib/analytics/gtag"

// Carrega o gtag e mantém o `page_view`. Montado UMA vez, no `app/layout.tsx`.
//
// ─── ⚠️ ESTE COMPONENTE É CLIENTE, E ISSO É O QUE PROTEGE O REGIME DAS ROTAS ──
//
// O `app/layout.tsx` avisa em maiúsculas: nada de `cookies()` ou `headers()` ali.
// É o que mantém `/` e `/sobre-nos` estáticas. Um dia este componente vai
// precisar saber se houve consentimento — e a tentação vai ser ler um cookie no
// servidor, que tornaria TODA rota do site dinâmica sem erro nenhum: só sumiria o
// `○` da saída do build.
//
// Sendo cliente desde já, essa porta fica fechada: a decisão de consentimento vai
// vir do `localStorage`, depois da montagem. Mesmo padrão do `CarrinhoProvider`.
//
// ─── POR QUE NÃO GTM ─────────────────────────────────────────────────────────
//
// GTM são ~100 KB e uma segunda camada de configuração fora do git para
// gerenciar uma tag. Com o código versionado e deploy automático, ele só troca
// "editar arquivo" por "editar container" e perde o histórico.

export function Analytics() {
  const pathname = usePathname()

  /**
   * O `gtag('config')` do snippet abaixo JÁ conta a primeira página. Sem este
   * ref, o efeito de rota dispararia um SEGUNDO `page_view` no carregamento
   * inicial e toda métrica por página sairia com um a mais.
   *
   * (Não é `send_page_view: false` + disparo manual sempre, porque o `config`
   * precisa acontecer de qualquer forma e o page_view dele já vem com o
   * `client_id` recém-criado. Deixamos o primeiro para ele e assumimos só as
   * navegações.)
   */
  const primeira = useRef(true)

  useEffect(() => {
    if (!ATIVO) return

    if (primeira.current) {
      primeira.current = false
      return
    }

    // ⚠️ ISTO NÃO É AUTOMÁTICO NO APP ROUTER, e é o bug mais fácil de não notar.
    // O site navega por <Link> (pushState) — o `gtag('config')` roda uma vez, no
    // carregamento, e nunca mais. Sem este efeito, Home → PDP → /catalogo gera UM
    // page_view no total, e todo relatório por página fica errado para baixo.
    //
    // 🔴 CONTRAPARTE OBRIGATÓRIA NO PAINEL: no fluxo de dados, em Medição
    // otimizada → Visualizações de página, a opção "Alterações de página com base
    // em eventos do histórico do navegador" tem que estar DESLIGADA. Ela também
    // detecta `pushState` — ligada, cada navegação conta DUAS vezes, aqui e lá,
    // e o número resultante parece plausível.
    //
    // Só `usePathname()`, sem `useSearchParams()`: aquele hook força a rota para
    // dinâmica se não estiver dentro de um <Suspense>, e o preço (perder a query
    // no page_view) é baixo — o `?ref=` dos afiliados já vive em cookie httpOnly
    // e em cart attribute, que é onde a atribuição real vai ser feita.
    // ⚠️ A ORDEM IMPORTA, e o `set` NÃO é decorativo.
    // Ele fixa a página corrente para TODOS os eventos seguintes — sem ele, o
    // `view_item` da PDP alcançada por <Link> e o `add_to_cart` dela seriam
    // registrados na página de ENTRADA. O porquê completo está em
    // `definirPagina`, em lib/analytics/gtag.ts.
    definirPagina()
    evento("page_view")
  }, [pathname])

  // Sem ID (env ausente) ou fora de produção → não injeta script nenhum.
  // O site funciona idêntico; é o mesmo princípio do carrinho sem token da
  // Shopify: falta de env degrada a medição, nunca a página.
  if (!ATIVO || !GA_ID) return null

  return (
    <>
      {/*
        ─── 🔴 `<script>` CRU, E NÃO `next/script`. NÃO TROQUE. ───────────────

        Este bloco é o "stub" do gtag: cria o `dataLayer`, define `window.gtag`
        como um `push` nesse array, e enfileira consent/js/config. Ele NÃO baixa
        nada — são ~15 linhas inline, custo zero de rede.

        Por que ele não pode ser um `<Script>`: TODA estratégia do `next/script`
        (inclusive `afterInteractive`) injeta o script DEPOIS da hidratação —
        verificado no HTML gerado, onde nenhuma das duas tags aparece. E os
        eventos deste site disparam em `useEffect`, ou seja, DURANTE a hidratação.

        O que acontecia com `<Script>`: quem cai direto numa PDP (o destino de
        todo anúncio e todo link de afiliado) montava o `EventoVerProduto`, o
        `evento()` encontrava `window.gtag` ainda indefinido, e a guarda dele
        descartava o `view_item` em silêncio. O evento mais valioso do site,
        perdido exatamente no tráfego que mais importa, sem erro em lugar nenhum.

        Com o stub no HTML cru ele executa na PARSE, antes de qualquer efeito:
        `window.gtag` já existe, e todo evento anterior ao carregamento da
        biblioteca fica ENFILEIRADO no `dataLayer` — é para isso que o snippet
        oficial do Google é um array. A biblioteca processa a fila na ordem
        quando chega.

        E o `page_view` inicial passa a sair do `config` daqui, com a URL de
        entrada correta.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;

/* Consent Mode v2.

   🔴 O 'default' PRECISA vir antes do 'config'. Depois dele o primeiro page_view
   já saiu sob o regime errado — e é justamente o evento que cria o client_id.

   'analytics_storage' vai 'granted' EXPLÍCITO, sem banner: a base legal desta
   fase é legítimo interesse sobre analytics agregado. O valor declarado (em vez
   de omitido) é o que permite trocar UMA linha quando o banner entrar, em vez de
   reescrever a ordem de carregamento com tudo já em produção.

   Os três 'ad_*' vão 'denied' porque não há publicidade nenhuma no site e o
   Google Signals está desligado na propriedade. Quando o Meta Pixel e o
   remarketing entrarem, são ESTES que passam a exigir banner — o
   'analytics_storage' não. */
gtag('consent', 'default', {
  'analytics_storage':  'granted',
  'ad_storage':         'denied',
  'ad_user_data':       'denied',
  'ad_personalization': 'denied'
});

gtag('js', new Date());

gtag('config', '${GA_ID}', {
  /* Redundante com o painel, de propósito: se alguém religar o Google Signals na
     interface sem ler o histórico, estas duas linhas seguem barrando a coleta de
     publicidade do lado do site. */
  'allow_google_signals': false,
  'allow_ad_personalization_signals': false${MODO_DEBUG ? `,
  'debug_mode': true` : ""}
});
`,
        }}
      />

      {/*
        A BIBLIOTECA (~90 KB de terceiro) — esta sim via `next/script`, e
        `afterInteractive`.

        Nunca `beforeInteractive`: aquela estratégia injeta no HTML
        pré-renderizado e bloqueia a hidratação, o que na PDP aparece direto no
        INP. Aqui o atraso não custa evento nenhum — o stub acima já está
        enfileirando tudo.
      */}
      <Script
        id="ga4-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
    </>
  )
}
