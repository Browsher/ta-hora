// Mapa de metafields que representam "especificações técnicas" do produto e seus
// rótulos legíveis. Fonte da verdade dos rótulos e de QUAIS metafields buscar.
//
// A query da Storefront API (queries.ts) monta os `identifiers` a partir daqui, e
// normalize.ts converte cada metafield presente em um par rótulo/valor (`Spec`),
// omitindo os ausentes/nulos.

export interface SpecMetafield {
  namespace: string
  key:       string
  label:     string
}

// TODO: confirmar namespace/keys REAIS na Shopify
// (Configurações → Dados personalizados/Metafields → Produtos). Os valores abaixo
// são placeholders; ajustar quando os metafields da loja estiverem definidos.
export const SPEC_METAFIELDS: SpecMetafield[] = [
  { namespace: "specs", key: "resolucao",     label: "Resolução" },
  { namespace: "specs", key: "conexao",       label: "Conexão" },
  { namespace: "specs", key: "visao_noturna", label: "Visão noturna" },
]
