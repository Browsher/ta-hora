// CEP → UF, por faixa numérica. Sem rede, sem API de CEP, sem dependência.
//
// ─── 🔴 POR QUE FAIXA DE 8 DÍGITOS, E NUNCA PREFIXO DE 2 ──────────────────────
//
// O mapa "primeiros 2 dígitos → estado" é o que quase todo mundo escreve, e ele
// erra em QUATRO faixas — todas no meio do país, todas com tarifa diferente:
//
//   69 → Amazonas E Roraima E Acre     (três estados, duas regiões de frete)
//   72 → Distrito Federal E Goiás
//   73 → Distrito Federal E Goiás      (alternam DUAS vezes, não uma)
//   76 → Goiás até 76799, Rondônia de 76800  (Centro-Oeste vira Norte no meio)
//
// O `76` é o pior: erra a REGIÃO, não só a UF, e o cliente de Porto Velho veria
// o frete de Goiás. Por isso a comparação é sempre do CEP inteiro como número.
//
// Fonte: faixas por UF dos Correios
// (https://buscacepinter.correios.com.br/app/faixa_cep_uf_localidade/index.php).
//
// ⚠️ ARMADILHA JÁ ENCONTRADA: muita tabela publicada na web ainda dá Rondônia
// como 78900–78999, que é a faixa ANTERIOR à reforma. A correta é 76800–76999.
// Bati nessa divergência ao montar esta tabela — se for conferir contra alguma
// fonte de terceiro, é este o ponto onde ela provavelmente está velha.

/** As 27 unidades federativas. */
export type UF =
  | "AC" | "AL" | "AM" | "AP" | "BA" | "CE" | "DF" | "ES" | "GO"
  | "MA" | "MG" | "MS" | "MT" | "PA" | "PB" | "PE" | "PI" | "PR"
  | "RJ" | "RN" | "RO" | "RR" | "RS" | "SC" | "SE" | "SP" | "TO"

interface Faixa {
  /** CEP inicial, 8 dígitos como número (01000-000 → 1000000). */
  inicio: number
  /** CEP final, inclusive. */
  fim: number
  /**
   * `null` = VÃO CONHECIDO. A faixa existe na tabela de propósito, com UF nula,
   * para que a busca ENCONTRE e devolva "não sei", em vez de não encontrar nada
   * e alguém "consertar" isso esticando a faixa vizinha. Ver o bloco abaixo.
   */
  uf: UF | null
  /** Só nos vãos: por que este intervalo não tem dono. */
  nota?: string
}

// ─── 🕳️ OS DOIS VÃOS, EXPLÍCITOS ──────────────────────────────────────────────
//
// Eles estão na lista como entradas de verdade, e não como ausência, porque
// ausência é indistinguível de esquecimento. Quem abrir este arquivo daqui a um
// ano vendo `78000000–78899999 MT` seguido de `79000000–79999999 MS` conclui que
// faltou um pedaço e "arruma" — estica o MT até 78999999. Aí um CEP sem dono
// passa a receber, calado, o frete do Mato Grosso.
//
// 🔴 NÃO ESTIQUE A FAIXA VIZINHA PARA "FECHAR O BURACO". O comportamento certo
// para um CEP sem UF é dizer que não reconhece (a UI pede para conferir o número
// e oferece o WhatsApp), nunca chutar a região — chutar é o defeito que a
// calculadora inteira existe para não cometer.

const FAIXAS: readonly Faixa[] = [
  { inicio:        0, fim:   999999, uf: null,
    nota: "Abaixo do primeiro CEP do país (01000-000). Nunca foi atribuído." },
  { inicio:  1000000, fim: 19999999, uf: "SP" },
  { inicio: 20000000, fim: 28999999, uf: "RJ" },
  { inicio: 29000000, fim: 29999999, uf: "ES" },
  { inicio: 30000000, fim: 39999999, uf: "MG" },
  { inicio: 40000000, fim: 48999999, uf: "BA" },
  { inicio: 49000000, fim: 49999999, uf: "SE" },
  { inicio: 50000000, fim: 56999999, uf: "PE" },
  { inicio: 57000000, fim: 57999999, uf: "AL" },
  { inicio: 58000000, fim: 58999999, uf: "PB" },
  { inicio: 59000000, fim: 59999999, uf: "RN" },
  { inicio: 60000000, fim: 63999999, uf: "CE" },
  { inicio: 64000000, fim: 64999999, uf: "PI" },
  { inicio: 65000000, fim: 65999999, uf: "MA" },
  { inicio: 66000000, fim: 68899999, uf: "PA" },
  { inicio: 68900000, fim: 68999999, uf: "AP" },
  // As três faixas do "69" — o motivo nº 1 de este arquivo não usar prefixo.
  { inicio: 69000000, fim: 69299999, uf: "AM" },
  { inicio: 69300000, fim: 69399999, uf: "RR" },
  { inicio: 69400000, fim: 69899999, uf: "AM" },
  { inicio: 69900000, fim: 69999999, uf: "AC" },
  // DF e GO alternam duas vezes.
  { inicio: 70000000, fim: 72799999, uf: "DF" },
  { inicio: 72800000, fim: 72999999, uf: "GO" },
  { inicio: 73000000, fim: 73699999, uf: "DF" },
  { inicio: 73700000, fim: 76799999, uf: "GO" },
  // Aqui o Centro-Oeste vira Norte no meio do "76".
  { inicio: 76800000, fim: 76999999, uf: "RO" },
  { inicio: 77000000, fim: 77999999, uf: "TO" },
  { inicio: 78000000, fim: 78899999, uf: "MT" },
  { inicio: 78900000, fim: 78999999, uf: null,
    nota: "Ex-Rondônia, antes da reforma que moveu RO para 76800–76999. Hoje sem UF." },
  { inicio: 79000000, fim: 79999999, uf: "MS" },
  { inicio: 80000000, fim: 87999999, uf: "PR" },
  { inicio: 88000000, fim: 89999999, uf: "SC" },
  { inicio: 90000000, fim: 99999999, uf: "RS" },
]

/** Nome por extenso, para a UI dizer "Bahia" e não "BA". */
export const NOME_DA_UF: Record<UF, string> = {
  AC: "Acre",           AL: "Alagoas",        AM: "Amazonas",
  AP: "Amapá",          BA: "Bahia",          CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão",       MG: "Minas Gerais",   MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",    PA: "Pará",           PB: "Paraíba",
  PE: "Pernambuco",     PI: "Piauí",          PR: "Paraná",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RO: "Rondônia",
  RR: "Roraima",        RS: "Rio Grande do Sul",   SC: "Santa Catarina",
  SE: "Sergipe",        SP: "São Paulo",      TO: "Tocantins",
}

/**
 * Texto digitado → CEP como número de 8 dígitos, ou `null` se não houver 8.
 *
 * Aceita "01310-100", "01310100" e "01310 100": tira tudo que não é dígito e
 * exige exatamente 8. **Não** completa com zero à esquerda — "1310100" tem 7
 * dígitos e é um CEP incompleto, não o CEP 01310-100; adivinhar aqui produziria
 * um resultado plausível e errado.
 */
export function normalizarCep(bruto: string): number | null {
  const digitos = bruto.replace(/\D/g, "")
  if (digitos.length !== 8) return null
  return Number(digitos)
}

/** Aplica a máscara visual "00000-000" ao que o cliente vai digitando. */
export function formatarCep(bruto: string): string {
  const d = bruto.replace(/\D/g, "").slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

/**
 * CEP numérico → UF.
 *
 * `null` tanto para vão conhecido quanto para fora de tudo — a UI trata os dois
 * do mesmo jeito ("não reconhecemos esse CEP"), porque para o cliente não há
 * diferença. A distinção existe para quem lê o código, não para quem compra.
 */
export function ufDoCep(cep: number): UF | null {
  const faixa = FAIXAS.find(f => cep >= f.inicio && cep <= f.fim)
  return faixa?.uf ?? null
}

/** Só para o script de verificação: permite varrer as faixas sem reexportar tudo. */
export const FAIXAS_PARA_TESTE: readonly Faixa[] = FAIXAS
