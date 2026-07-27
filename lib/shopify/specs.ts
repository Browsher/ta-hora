// Mapa de metafields que representam "especificações técnicas" do produto e seus
// rótulos legíveis. Fonte da verdade dos rótulos, do TIER e de QUAIS metafields
// buscar.
//
// A query da Storefront API (queries.ts) monta os `identifiers` a partir daqui
// (SPEC_METAFIELD_IDENTIFIERS), normalize.ts converte cada metafield presente em um
// par `Spec` (omitindo os ausentes/nulos), e a UI (FichaTecnica) agrupa por `tier`
// e ordem — TUDO derivado deste array. A ordem do array É a ordem de exibição.
//
// ⚠️ SEM `lucide-react` AQUI DE PROPÓSITO: o ícone (componente React) vive na UI
// (`components/loja/fichaTecnicaIcones.ts`), unido a este mapa por `key`. Assim a
// camada de dados (importada por queries.ts/normalize.ts, server-only) fica
// React-free. Mesma disciplina de `tags.ts` (dado) vs `ROTULO_MARCA` (exibição).
//
// 🔴 A CHAVE (`key`) REFLETE O NOME ORIGINAL DO METAFIELD, NÃO O RÓTULO ATUAL.
// Ao renomear um metafield no admin, a Shopify PRESERVA a `custom.<key>` original —
// então a key carrega o nome ANTIGO. Dois casos reais nesta loja:
//   • `custom.marca`      foi renomeado para "Aplicativo" (o valor é o app: EseeCloud/ICSee)
//   • `custom.notorizada` foi renomeado para "Motorizada"
// NUNCA "conserte" a key para casar com o rótulo (ex.: `marca`→`aplicativo`): isso
// zera a spec em SILÊNCIO (a query pede uma key que não existe → null → some).
// Mesma lição de `eseecloud`/`custom.resumo`. `npm run verificar:especificacoes`
// é quem trava esta premissa nos DADOS reais.
//
// As 21 chaves abaixo foram descobertas e CONFIRMADAS ao vivo (7/7 câmeras) por
// sondagem contra a loja (a Storefront API não enumera metafields — exige
// identifiers; a loja só expõe token Storefront, sem Admin).

export type SpecTier = "principal" | "secundaria"

export interface SpecMetafield {
  namespace: string
  key:       string
  label:     string
  tier:      SpecTier
}

// Ordem do array = ordem de exibição (Req 2.5/3.4): 9 principais, depois 12 secundárias.
export const SPEC_METAFIELDS: SpecMetafield[] = [
  // ── Principais (cards com ícone) ─────────────────────────────────────────────
  { namespace: "custom", key: "tipo_de_resolucao",          label: "Resolução",              tier: "principal" },
  { namespace: "custom", key: "visao_noturna",              label: "Visão noturna",          tier: "principal" },
  { namespace: "custom", key: "com_visao_noturna_colorida", label: "Visão noturna colorida", tier: "principal" },
  { namespace: "custom", key: "resistente_a_agua",          label: "Resistência à água",     tier: "principal" },
  { namespace: "custom", key: "audio_bidirecional",         label: "Áudio bidirecional",     tier: "principal" },
  { namespace: "custom", key: "com_sensor_de_movimento",    label: "Sensor de movimento",    tier: "principal" },
  { namespace: "custom", key: "conectividade",              label: "Conectividade",          tier: "principal" },
  { namespace: "custom", key: "com_alarme",                 label: "Alarme",                 tier: "principal" },
  // 🔴 key `marca` (nome antigo) → rótulo "Aplicativo" (valor é o app: EseeCloud/ICSee).
  { namespace: "custom", key: "marca",                      label: "Aplicativo",             tier: "principal" },

  // ── Secundárias (lista "Mais detalhes", sem ícone) ───────────────────────────
  { namespace: "custom", key: "qualidade_de_resolucao",     label: "Resolução detalhada",    tier: "secundaria" },
  { namespace: "custom", key: "campo_visual",               label: "Campo de visão",         tier: "secundaria" },
  { namespace: "custom", key: "zoom",                       label: "Zoom",                   tier: "secundaria" },
  { namespace: "custom", key: "tipo_de_movimento",          label: "Tipo de movimento",      tier: "secundaria" },
  // 🔴 key `notorizada` (nome antigo) → rótulo "Motorizada".
  { namespace: "custom", key: "notorizada",                 label: "Motorizada",             tier: "secundaria" },
  { namespace: "custom", key: "diametro_da_lente_da_camera",label: "Diâmetro da lente",      tier: "secundaria" },
  { namespace: "custom", key: "temperatura_maxima_suportada", label: "Temperatura máxima",   tier: "secundaria" },
  { namespace: "custom", key: "temperatura_minima_suportada", label: "Temperatura mínima",   tier: "secundaria" },
  { namespace: "custom", key: "lugares_de_montagem",        label: "Locais de uso",          tier: "secundaria" },
  { namespace: "custom", key: "modelo",                     label: "Modelo",                 tier: "secundaria" },
  { namespace: "custom", key: "linha",                      label: "Linha",                  tier: "secundaria" },
  { namespace: "custom", key: "cor",                        label: "Cor",                    tier: "secundaria" },
]
