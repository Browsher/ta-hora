// A REGRA do código de afiliado — fonte única, compartilhada pelo `proxy.ts`
// (captura) e pelas Server Actions (injeção no carrinho).
//
// SEM `server-only`, de propósito: este módulo é importado pelo `proxy.ts`, que
// roda ANTES do roteamento, fora do contexto de Server Component. Ele não toca
// token, cookie nem rede — é regex e constantes. Nada aqui é segredo.
//
// ─── O CONTRATO COM O WEBHOOK DE AFILIADOS (externo, já em produção) ──────────
//
// O sistema de afiliados é um projeto SEPARADO. Ele lê o pedido da Shopify e
// credita a venda quando encontra o `note_attribute` `afiliado_ref`. Nada abaixo
// é escolha nossa — é o contrato dele, e cada detalhe já custou um bug:
//
//   1. CHAVE `afiliado_ref` LITERAL, SEM prefixo `__`. Atributos ocultos (com
//      `__`) têm histórico de NÃO chegar ao webhook de pedido. O nome é visível.
//
//   2. VALOR: 8 caracteres alfanuméricos MAIÚSCULOS — `^[A-Z0-9]{8}$`.
//
//   3. O webhook é CASE-SENSITIVE: `abcd1234` é IGNORADO, `ABCD1234` credita.
//      Por isso `normalizarRef` faz `toUpperCase()` ANTES de validar — o link
//      do afiliado pode chegar em minúsculo (e-mail, WhatsApp, cópia manual) e
//      ainda assim precisa creditar.
//
//   4. Ref inválido ou ausente → o webhook responde 200 e não gera atribuição.
//      Ou seja: o risco desta feature é "não creditar", nunca "quebrar a venda".
//
// `afiliado_ref_ts` (timestamp) é aceito pelo webhook mas IGNORADO por ele — e
// por decisão desta spec NÃO é enviado (menos ruído no pedido). Não adicione.

/** A chave do cart attribute. Literal do contrato — ver nota 1 acima. */
export const CHAVE_ATRIBUTO = "afiliado_ref"

/** Cookie que carrega o ref entre a captura (proxy) e a compra (actions). */
export const COOKIE_REF = "tahora_ref"

/** 30 dias — a janela de atribuição do programa de afiliados. */
export const VALIDADE_REF_EM_SEGUNDOS = 60 * 60 * 24 * 30

/** A regra do valor. Ancorada nas duas pontas: nada de match parcial. */
const FORMATO_DO_REF = /^[A-Z0-9]{8}$/

/**
 * Normaliza e valida um código de afiliado.
 *
 * `null` = não use. Vale para TODA origem de ref — query param (`proxy.ts`) e
 * cookie (`lerRefDeAfiliado`) —, e é de propósito: as duas são entrada do
 * cliente e nenhuma é confiável. Um cookie adulterado com
 * `"; DROP` ou 400 caracteres morre aqui, antes de virar attribute.
 *
 * A ORDEM importa: `toUpperCase()` vem ANTES do teste (nota 3 acima). Validar
 * primeiro e normalizar depois rejeitaria `abcd1234` — um link legítimo.
 */
export function normalizarRef(bruto: string | null | undefined): string | null {
  if (!bruto) return null

  const normalizado = bruto.trim().toUpperCase()

  return FORMATO_DO_REF.test(normalizado) ? normalizado : null
}
