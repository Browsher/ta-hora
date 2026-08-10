// A função pública da calculadora: texto digitado → resultado exibível.
//
// Sem `server-only` e sem `"use client"`: são funções puras sobre tabelas
// locais, importadas pelo componente cliente (`CalculadoraFrete`) e pelo script
// de verificação. Nenhuma rede, nenhum `window`, nenhum token.
//
// 🔴 O RESULTADO É UMA UNIÃO DISCRIMINADA, e isso é o ponto do arquivo.
// A alternativa preguiçosa seria devolver `OpcaoFrete[]` e deixar a UI tratar o
// array vazio como "deu ruim". Aí os quatro fins de linha abaixo — incompleto,
// CEP desconhecido, zona sem tarifa e sucesso — viram todos a mesma tela, e o
// cliente que digitou meio CEP recebe a mesma mensagem de erro de quem mora num
// vão da tabela dos Correios. O `switch` no componente é exaustivo por tipo:
// acrescentar um caso aqui QUEBRA O BUILD lá até ser tratado, que é exatamente
// o que se quer de um caminho de erro.

import { normalizarCep, ufDoCep, NOME_DA_UF, type UF } from "./faixas"
import { zonaDaUf, opcoesDaZona, type OpcaoFrete, type Zona } from "./tabela"

export type ResultadoFrete =
  /** Menos de 8 dígitos. NÃO é erro: é alguém ainda digitando. */
  | { tipo: "incompleto" }
  /**
   * 8 dígitos, mas fora de qualquer faixa com UF — inclui os vãos conhecidos
   * (o 789xx ex-Rondônia e o 00xxx anterior ao primeiro CEP do país).
   *
   * 🔴 NUNCA cair para uma região "padrão" aqui. Mostrar o frete errado é pior
   * que não mostrar frete: o cliente só descobre no checkout, depois de ter
   * decidido comprar com base no número que a gente deu.
   */
  | { tipo: "cep-desconhecido" }
  /** UF reconhecida, mas a zona ficou sem nenhuma tarifa ativa. */
  | { tipo: "sem-atendimento"; uf: UF; estado: string }
  | { tipo: "ok"; uf: UF; estado: string; zona: Zona; opcoes: readonly OpcaoFrete[] }

export function consultarFrete(cepDigitado: string): ResultadoFrete {
  const cep = normalizarCep(cepDigitado)
  if (cep === null) return { tipo: "incompleto" }

  const uf = ufDoCep(cep)
  if (uf === null) return { tipo: "cep-desconhecido" }

  const estado = NOME_DA_UF[uf]
  const zona   = zonaDaUf(uf)
  const opcoes = opcoesDaZona(zona)

  if (opcoes.length === 0) return { tipo: "sem-atendimento", uf, estado }

  return { tipo: "ok", uf, estado, zona, opcoes }
}
