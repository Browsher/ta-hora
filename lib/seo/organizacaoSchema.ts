import { SITE_URL } from "@/lib/site"

// JSON-LD `OnlineStore` da Home — a identidade da empresa para o Google.
//
// Módulo PURO, mesmo padrão de `produtoSchema.ts` e `tituloProduto.ts`: sem
// React, sem fetch, sem `server-only`. Exercitável com `node -e`.
//
// ═══ O QUE ISTO PRODUZ (e o que NÃO produz) ═══════════════════════════════
//
// 🔴 NÃO É RICH RESULT. A documentação do Google diz que o Organization "ajuda o
// Google a entender os detalhes administrativos da organização e a desambiguá-la
// nos resultados de busca" — alimenta knowledge panel, perfil de comerciante e
// desambiguação de entidade, não enfeite no resultado.
//
// Isso NÃO o torna o caso do FAQPage (ver seção 8 do SEO-AUDIT.md): aquele é um
// recurso EXTINTO, com suporte removido das ferramentas do Google. Este é ativo,
// documentado e mantido — só não é visível como estrela ou preço. É investimento
// de identidade de marca, não de CTR.
//
// ═══ POR QUE `OnlineStore` E NÃO `LocalBusiness` ══════════════════════════
//
// 🔴 DECISÃO REGISTRADA (11/08/2026) — NÃO "promova" para LocalBusiness.
//
// O endereço do Brás é onde a empresa está REGISTRADA, não uma loja física: não
// há atendimento presencial. `LocalBusiness` habilita Google Maps e pacote local,
// ou seja, faria cliente aparecer na porta esperando ser atendido. `OnlineStore`
// é subtipo de `Organization` desenhado para varejo online — descreve o que a
// empresa é sem prometer o que ela não faz.
//
// ═══ SÓ NA HOME ═══════════════════════════════════════════════════════════
//
// Consumido por `app/page.tsx`, NÃO pelo `app/layout.tsx`. A orientação do Google
// é explícita: "You don't need to include it on every page of your site". No
// layout raiz, a mesma entidade seria declarada 14 vezes — 14 cópias para manter
// em sincronia, nenhuma acrescentando sinal.

/**
 * Logo da marca (`public/uploads/logo-tahora.png`, 512×512).
 *
 * É a propriedade MAIS VISÍVEL deste schema: é ela que o Google usa para o
 * logotipo no knowledge panel. O mínimo documentado é 112×112; 512 dá folga.
 *
 * ⚠️ Trocar o arquivo exige conferir as dimensões de novo. Um logo abaixo de
 * 112px é ignorado em silêncio — nada quebra, o logotipo só não aparece.
 */
const LOGO = `${SITE_URL}/uploads/logo-tahora.png`

/**
 * Perfis oficiais, para o Google ligar esta entidade às contas de marketplace e
 * de rede social.
 *
 * As URLs de marketplace são as MESMAS que `layouts/sobre-nos.json` publica, e a
 * do Instagram é a mesma que o `/suporte` (`CanaisSuporte`) e o `social1Href` do
 * rodapé já usam — `sameAs` deve refletir o que o site afirma, não virar uma
 * segunda lista que diverge com o tempo.
 *
 * ⚠️ Só entra aqui perfil ATIVO E COM CONTEÚDO. `sameAs` para perfil vazio é pior
 * que a ausência: o Google pode exibi-lo no knowledge panel e o visitante cai no
 * nada. O Instagram foi confirmado pelo dono em 11/08/2026 (a leitura automática
 * não serve para isso — o Instagram devolve muro de login, e "perfil vazio" fica
 * indistinguível de "não consegui ler").
 *
 * TikTok fora por decisão de negócio: não há intenção de manter loja lá.
 */
const PERFIS = [
  "https://www.mercadolivre.com.br/pagina/cftv_ch",
  "https://shopee.com.br/shop/1139914848",
  "https://instagram.com/tahora.com.br",
]

/**
 * Monta o JSON-LD da organização.
 *
 * Sem parâmetros e sem I/O: estes dados são cadastrais e não vêm da Shopify.
 * Mudam quando a empresa muda — e aí mudam AQUI, num lugar só.
 *
 * ⚠️ O RODAPÉ É A OUTRA FONTE DOS MESMOS FATOS. `components/sections/Footer/
 * Footer.tsx` exibe razão social, CNPJ e endereço no `copyright`, em todas as 14
 * páginas. Mudou um destes campos? Mude nos DOIS lugares — divergência entre o
 * que o schema afirma e o que a página mostra é exatamente o que o Google trata
 * como sinal de baixa confiança.
 */
export function organizacaoSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    // Subtipo de Organization para varejo online — ver a decisão no topo.
    "@type": "OnlineStore",

    // Nome fantasia e razão social são campos DISTINTOS por desenho: `name` é
    // como a marca é conhecida, `legalName` é o registro na Receita.
    name:      "Ta Hora",
    legalName: "CH CFTV & Eletrônicos",

    // CNPJ. `taxID` é o campo do schema.org para identificação fiscal (o
    // equivalente ao TIN americano ou ao CIF espanhol) — não use `identifier`
    // genérico, que perde o significado do número.
    taxID: "46.340.461/0001-04",

    url:  SITE_URL,
    logo: LOGO,

    telephone: "+55 11 98418-8541",
    email:     "icamera6688@gmail.com",

    address: {
      "@type": "PostalAddress",
      // `PostalAddress` não tem campo de bairro — "Brás" vive dentro do
      // logradouro, que é onde ele cabe sem inventar propriedade.
      streetAddress:   "Rua André de Leão, 78 — Brás",
      addressLocality: "São Paulo",
      addressRegion:   "SP",
      postalCode:      "03101-010",
      addressCountry:  "BR",
    },

    sameAs: PERFIS,
  }
}
