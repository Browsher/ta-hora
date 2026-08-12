import { SITE_URL } from "@/lib/site"
import { ZONAS, opcoesDaZona, ufsDaZona } from "@/lib/frete/tabela"

// `shippingDetails` e `hasMerchantReturnPolicy` do `Offer` das PDPs — os dois
// campos que fazem o Google exibir FRETE e DEVOLUÇÃO junto do preço, e que o
// Merchant Center exige para o produto não ser despriorizado no Shopping.
//
// Módulo PURO, mesmo padrão de `produtoSchema.ts` e `organizacaoSchema.ts`: sem
// React, sem fetch, sem `server-only`. Exercitável com `node -e`.
//
// ═══════════════════════════════════════════════════════════════════════════
// 🔴 NENHUM NÚMERO É ESCRITO AQUI. TODOS VÊM DE `lib/frete/tabela.ts`.
// ═══════════════════════════════════════════════════════════════════════════
//
// Isto é o ponto inteiro deste arquivo. Uma auditoria de SEO sugeriu preencher
// estes campos com valores de exemplo ("3-5 dias", "R$ 20") só para o validador
// parar de reclamar. Seria o pior dos dois mundos: um dado FALSO sobre frete,
// dito ao Google, numa loja cujo frete varia de R$ 14,90 a R$ 59,90 conforme a
// região — e frete divergente do cobrado é motivo de suspensão no Merchant
// Center, não só um warning.
//
// A tabela já é a fonte da calculadora da PDP. Ela passa a ser também a fonte
// do que o Google lê, então as duas nunca divergem: mudou lá, muda aqui junto.
//
// ⚠️ HERDA O RISCO DECLARADO DA TABELA: o VALOR tem trava automática
// (`npm run verificar:frete` sonda a Shopify), o PRAZO não tem. Se o prazo mudar
// no admin e ninguém editar `tabela.ts`, agora são DOIS lugares anunciando um
// prazo que a loja não cumpre — a calculadora e o resultado de busca. O aviso
// em caixa alta no topo da tabela vale em dobro depois deste arquivo existir.

/** ISO 3166-1 alpha-2. A loja só entrega no Brasil. */
const PAIS = "BR"

/**
 * Segunda a sexta.
 *
 * 🔴 NÃO É DECORAÇÃO, e omitir mudaria o significado do prazo. Os prazos de
 * `tabela.ts` estão em DIAS ÚTEIS ("1 a 3 dias úteis" é o que a calculadora
 * mostra). Sem `businessDays`, o Google lê `transitTime` como dias CORRIDOS e
 * passa a anunciar uma entrega mais rápida do que a loja pratica — 20 dias úteis
 * do Comum para o Norte viram 20 corridos, quase três semanas de diferença.
 */
const DIAS_UTEIS = {
  "@type": "OpeningHoursSpecification",
  dayOfWeek: [
    "https://schema.org/Monday",
    "https://schema.org/Tuesday",
    "https://schema.org/Wednesday",
    "https://schema.org/Thursday",
    "https://schema.org/Friday",
  ],
}

/**
 * Uma `OfferShippingDetails` por opção de frete de cada zona — 11 no total hoje
 * (SP tem uma opção, as outras cinco zonas têm duas).
 *
 * Um array, e não um objeto único: o Google casa a entrada pela UF do usuário
 * via `shippingDestination`, então declarar "um frete" para o Brasil inteiro
 * significaria escolher qual das 6 regiões receberia a informação correta e
 * qual receberia a errada.
 */
export function entregaSchema(): Record<string, unknown>[] {
  return ZONAS.flatMap((zona) =>
    opcoesDaZona(zona).map((opcao) => ({
      "@type": "OfferShippingDetails",

      shippingRate: {
        "@type": "MonetaryAmount",
        // `toFixed(2)` pelo mesmo motivo do `price` em produtoSchema.ts: o
        // schema.org quer decimal com ponto. `14.9` viraria "14.9" (válido, mas
        // ambíguo na leitura humana do JSON-LD); "14.90" é o que a loja cobra.
        value:    opcao.valor.toFixed(2),
        currency: "BRL",
      },

      shippingDestination: {
        "@type":        "DefinedRegion",
        addressCountry: PAIS,
        // As UFs da zona, derivadas do mapa da tabela — ver `ufsDaZona`.
        addressRegion:  ufsDaZona(zona),
      },

      deliveryTime: {
        "@type": "ShippingDeliveryTime",

        // 🔴 `handlingTime` OMITIDO DE PROPÓSITO, e a omissão é a leitura correta
        // do dado — não uma lacuna.
        //
        // O Google soma `handlingTime + transitTime` para chegar na data de
        // entrega. Os prazos de `tabela.ts` são o que a CALCULADORA DA PDP promete
        // ao cliente, ou seja, já são o prazo total de porta a porta. Declarar um
        // `handlingTime` além disso somaria dias que a loja não pediu, e inventar
        // "1 dia de preparo" seria exatamente o dado falso que este arquivo
        // existe para evitar.
        //
        // Se um dia a loja separar preparo de transporte, o campo entra aqui — e
        // aí `transitTime` precisa DIMINUIR na mesma medida.
        transitTime: {
          "@type":   "QuantitativeValue",
          minValue:  opcao.prazoMin,
          maxValue:  opcao.prazoMax,
          unitCode:  "DAY",
        },

        businessDays: DIAS_UTEIS,
      },
    })),
  )
}

/**
 * A política de devolução, transcrita de `layouts/trocas-e-devolucoes.json`.
 *
 * ⚠️ TERCEIRO ECO DOS MESMOS TRÊS FATOS. O JSON já avisa que os prazos dele são
 * ecoados em `components/loja/SelosConfianca.tsx`, abaixo do botão de comprar.
 * Agora são três: a política, o selo da PDP e este schema. Mudou prazo, cobertura
 * ou quem paga o frete? Os três mudam juntos — e este é o único dos três que fala
 * com o Google, então divergência aqui vira promessa pública errada.
 */
export function devolucaoSchema(): Record<string, unknown> {
  return {
    "@type":            "MerchantReturnPolicy",
    applicableCountry:  PAIS,

    // Janela finita com prazo declarado — o caso do arrependimento do CDC.
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",

    // 7 dias CORRIDOS a partir do recebimento (CDC art. 49), que é exatamente o
    // que `merchantReturnDays` significa: dias de calendário após a entrega.
    // Não confundir com os 3 dias para avisar avaria, que é outro prazo e não
    // limita este — a política é explícita sobre isso.
    merchantReturnDays: 7,

    // Devolução pelos Correios/transportadora, com o endereço informado pela loja
    // depois da solicitação aberta. Não há loja física para devolver no balcão —
    // mesmo motivo pelo qual a organização é `OnlineStore` e não `LocalBusiness`.
    returnMethod: "https://schema.org/ReturnByMail",

    // "O frete de devolução é sempre por nossa conta", tanto no arrependimento
    // quanto no defeito. `FreeReturn` é a afirmação exata disso.
    returnFees: "https://schema.org/FreeReturn",

    merchantReturnLink: `${SITE_URL}/trocas-e-devolucoes`,
  }
}
