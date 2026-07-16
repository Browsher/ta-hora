"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  lerCarrinho,
  adicionarItem,
  atualizarQuantidade,
  removerLinha,
  aplicarCupom,
  removerCupom,
} from "@/lib/carrinho/acoes"
import type { Carrinho, ResultadoCarrinho } from "@/lib/shopify/types"

// Estado único do carrinho. É a ÚNICA porta do cliente para as Server Actions.
//
// Importa: as 6 actions (valores) + os tipos via `import type` (apagados na
// compilação). NUNCA `lib/shopify/*` como valor — isso arrastaria o token para o
// bundle e o `server-only` faria o build falhar.
//
// ⚠️ ESTE COMPONENTE MANTÉM A HOME ESTÁTICA. Ele NÃO recebe dados do servidor
// por props e NÃO lê cookie no render — busca o carrinho num efeito, DEPOIS da
// montagem. Se algum dia alguém passar o carrinho por prop a partir de um Server
// Component, a Home vira `ƒ` (dynamic) e o Req 9.2 cai SEM ERRO VISÍVEL: só some
// o `○` da saída do build.

interface ContextoDoCarrinho {
  carrinho:   Carrinho | null
  aviso:      string | null
  erro:       string | null
  carregando: boolean
  aberto:     boolean
  abrir:      () => void
  fechar:     () => void
  adicionar:         (handle: string) => Promise<void>
  alterarQuantidade: (lineId: string, quantidade: number) => Promise<void>
  remover:           (lineId: string) => Promise<void>
  aplicarCodigo:     (codigo: string) => Promise<void>
  removerCodigo:     (codigo: string) => Promise<void>
}

const Contexto = createContext<ContextoDoCarrinho | null>(null)

/**
 * `null` fora do provider — de propósito, não por descuido.
 * A `Navbar` é uma seção dirigida por JSON e precisa continuar montável isolada;
 * o `IconeCarrinho` usa isto para renderizar nada em vez de explodir.
 */
export function useCarrinho(): ContextoDoCarrinho | null {
  return useContext(Contexto)
}

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [carrinho, setCarrinho]     = useState<Carrinho | null>(null)
  const [aviso, setAviso]           = useState<string | null>(null)
  const [erro, setErro]             = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto]         = useState(false)

  // Fila serial: uma operação por vez, encadeada numa Promise.
  //
  // O Next JÁ serializa o dispatch de Server Actions por cliente. Então por que
  // esta fila? Porque no `app-router-instance.js` o `runRemainingActions()` roda
  // ANTES do `resolve/reject` — a fila do Next avança antes de o nosso `await`
  // retornar. Depender só dela para ordenar o NOSSO estado é frágil, sobretudo
  // no caminho de erro. Esta fila garante a ordem do que o cliente VÊ.
  //
  // Limite honesto: resolve corrida DESTA aba. Entre abas continua possível —
  // declarado fora de escopo (Req 4.4).
  const fila = useRef<Promise<unknown>>(Promise.resolve())

  /**
   * Aplica um resultado ao estado.
   *
   * A política do aviso importa (Req 5.4): `aviso` e `erro` são substituídos a
   * cada ação INICIADA PELO USUÁRIO. Nenhuma ação interna limpa um aviso que o
   * cliente ainda não leu — é por isso que a purga do cupom devolve o aviso da
   * primeira resposta, e não o `null` da segunda.
   */
  const aplicar = useCallback((r: ResultadoCarrinho) => {
    setCarrinho(r.carrinho)
    setAviso(r.aviso)
    setErro(r.erro)
  }, [])

  /** Enfileira uma operação do usuário, serializando estado e carregamento. */
  const enfileirar = useCallback(
    (operacao: () => Promise<ResultadoCarrinho>): Promise<void> => {
      const proxima = fila.current.then(async () => {
        setCarregando(true)
        try {
          aplicar(await operacao())
        } catch {
          // As actions não lançam (elas capturam e devolvem `erro`). Se algo
          // escapar — rede caindo no meio do dispatch —, o carrinho anterior
          // fica intacto e o cliente vê uma mensagem, nunca uma tela quebrada.
          setErro("Não foi possível atualizar seu carrinho. Tente novamente.")
        } finally {
          setCarregando(false)
        }
      })
      // A fila nunca "trava" num rejeitado: cada elo segue para o próximo.
      fila.current = proxima.catch(() => {})
      return proxima
    },
    [aplicar],
  )

  /**
   * Sincroniza sem mexer em `carregando` nem em `erro`: é leitura de fundo, não
   * ação do usuário. Uma falha aqui NÃO pode virar erro na tela — toda página
   * com navbar chama isto, inclusive a Home (Req 4.7).
   */
  const sincronizar = useCallback(() => {
    fila.current = fila.current
      .then(() => lerCarrinho())
      .then((r) => { setCarrinho(r.carrinho) })
      .catch(() => { /* silêncio: navbar sem contador, sem erro */ })
  }, [])

  useEffect(() => {
    sincronizar()

    // ⚠️ O mount NÃO cobre a volta do checkout.
    // Voltar do checkout é tipicamente o botão Back, e o bfcache restaura a
    // página SEM re-executar efeitos — exatamente o cenário do carrinho fantasma
    // (Req 2.5/2.6). `pageshow` com `persisted` é o único sinal desse caminho.
    const aoRestaurar = (e: PageTransitionEvent) => {
      if (e.persisted) sincronizar()
    }
    window.addEventListener("pageshow", aoRestaurar)
    return () => window.removeEventListener("pageshow", aoRestaurar)
  }, [sincronizar])

  const valor: ContextoDoCarrinho = {
    carrinho,
    aviso,
    erro,
    carregando,
    aberto,
    abrir:  useCallback(() => setAberto(true), []),
    fechar: useCallback(() => setAberto(false), []),
    adicionar:         useCallback((handle: string) => enfileirar(() => adicionarItem(handle)), [enfileirar]),
    alterarQuantidade: useCallback((lineId: string, q: number) => enfileirar(() => atualizarQuantidade(lineId, q)), [enfileirar]),
    remover:           useCallback((lineId: string) => enfileirar(() => removerLinha(lineId)), [enfileirar]),
    aplicarCodigo:     useCallback((codigo: string) => enfileirar(() => aplicarCupom(codigo)), [enfileirar]),
    removerCodigo:     useCallback((codigo: string) => enfileirar(() => removerCupom(codigo)), [enfileirar]),
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
