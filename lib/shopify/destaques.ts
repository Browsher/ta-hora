// Regras dos DESTAQUES do bloco do catálogo (feature catalogo-destaques).
//
// Duas perguntas, uma resposta booleana cada: "esta câmera tem lente múltipla?" e
// "esta câmera tem alarme sonoro?". Vivem aqui, isoladas, porque são O CORAÇÃO da
// feature — o que decide se um ícone aparece ou não. Espalhá-las como `&&` dentro
// do JSX tornaria impossível conferi-las sem ler o componente inteiro.
//
// Módulo PURO de propósito — mesmo padrão de `ordenarCatalogo.ts`: sem React, sem
// `server-only`, sem `process.env`, sem import de VALOR da camada Shopify. Assim
// pode ser exercitado isoladamente (`node -e`) e atravessa qualquer fronteira sem
// arrastar nada.
//
// 🔴 QUEM CHAMA ISTO É O SERVIDOR (`normalizeProductCard`), NÃO A UI. O objetivo é
// que os valores que NÃO devem aparecer — "Lente única", "Aplicativo", "Notificação"
// — morram no servidor e nunca cheguem ao cliente. A UI recebe `lentes: null` e
// `alarmeSonoro: false`, sem ter como renderizar o que não deve.
//
// ⚠️ COMPARAÇÃO INSENSÍVEL A MAIÚSCULAS/MINÚSCULAS, e o motivo é concreto: estes
// metafields são texto livre digitado no admin, e esta loja JÁ ERROU grafia —
// `custom.com_alarme` ficou gravado como "Noticação" (sem o segundo "fi") até
// 31/07/2026, quando foi corrigido para "Notificação". Se alguém digitar
// "alarme sonoro" em minúsculas, uma comparação sensível a caixa desligaria a
// sirene em SILÊNCIO. `npm run verificar:destaques` é quem pega o resto.
//
// ⚠️ SEM `normalize("NFD")` (remoção de acento) DE PROPÓSITO: as três palavras-
// gatilho — "dupla", "tripla", "alarme sonoro" — são todas ASCII, então remover
// acento não ajudaria nada. Quem TEM acento é justamente `única`, e ela é o valor
// que NÃO deve casar. Normalizar acento só criaria risco sem benefício.
//
// Valores REAIS confirmados na loja (7/7 câmeras, coleção `cameras`):
//   custom.numero_de_lentes → "Lente única" | "Lente dupla" | "Lente tripla"
//   custom.com_alarme       → "Alarme sonoro" | "Notificação" | "Aplicativo"

/** Normaliza para comparação: trata ausente/nulo e apara/abaixa a caixa. */
function paraComparar(valor: string | null | undefined): string {
  return (valor ?? "").trim().toLowerCase()
}

/**
 * A câmera tem lente MÚLTIPLA (dupla ou tripla) — o diferencial que vale um ícone?
 *
 * `includes` é o certo AQUI: o valor é uma frase ("Lente dupla"), e o que importa
 * é a palavra dentro dela. Cobre variações de redação ("Duas lentes" não casaria,
 * mas "lente dupla frontal" sim).
 *
 * 🔴 "Lente única" NÃO dispara — e note que isso sai de graça: "única" não contém
 * "dupla" nem "tripla". NÃO adicione uma exclusão explícita de "única"; ela daria
 * a falsa impressão de que sem ela o valor passaria.
 *
 * Fail-closed: ausente, vazio ou valor desconhecido → `false`. Um valor que não
 * reconhecemos não vira destaque (Req 3.3).
 */
export function temLenteMultipla(valor: string | null | undefined): boolean {
  const v = paraComparar(valor)
  return v.includes("dupla") || v.includes("tripla")
}

/**
 * A câmera tem ALARME SONORO de verdade (não só notificação no celular)?
 *
 * 🔴 IGUALDADE, NÃO `includes` — ao contrário da regra das lentes acima, e a
 * diferença é deliberada. Com `includes`, um valor como "Sem alarme sonoro"
 * acenderia a sirene, dizendo ao cliente o OPOSTO do que o dado diz. Aqui o
 * metafield é um enum de fato (3 valores conhecidos), então igualdade é a
 * comparação honesta.
 *
 * Fail-closed: "Notificação", "Aplicativo", qualquer outro valor, ausente ou vazio
 * → `false`. Em particular a A31H tem "Aplicativo" e NÃO pode mostrar a sirene —
 * é o falso positivo que esta regra existe para evitar (Req 4.2).
 */
export function temAlarmeSonoro(valor: string | null | undefined): boolean {
  return paraComparar(valor) === "alarme sonoro"
}
