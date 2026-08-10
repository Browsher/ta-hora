"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  buscarAcessorios,
} from "@/lib/carrinho/acoes"
import { TAG_CAMERA } from "@/lib/shopify/tags"
import { diffCarrinho } from "@/lib/analytics/diffCarrinho"
import { adicionarAoCarrinho, removerDoCarrinho, verCarrinho, itemDaLinha } from "@/lib/analytics/gtag"
import type { Carrinho, ResultadoCarrinho, ProductCard } from "@/lib/shopify/types"

// Estado único do carrinho. É a ÚNICA porta do cliente para as Server Actions.
//
// Importa: as 7 actions (valores), a constante de tag e os tipos via
// `import type` (apagados na compilação). NUNCA `lib/shopify/client|queries|
// carrinho|acessorios|products` como valor — isso arrastaria o token para o
// bundle e o `server-only` faria o build falhar. (`tags.ts` é seguro: só
// constantes, sem token e sem fetch.)
//
// ⚠️ ESTE COMPONENTE MANTÉM A HOME ESTÁTICA. Ele NÃO recebe dados do servidor
// por props e NÃO lê cookie no render — busca o carrinho num efeito, DEPOIS da
// montagem. Se algum dia alguém passar o carrinho por prop a partir de um Server
// Component, a Home vira `ƒ` (dynamic) e o Req 9.2 cai SEM ERRO VISÍVEL: só some
// o `○` da saída do build.

/**
 * De onde partiu a abertura do drawer. Existe por causa de UM evento de
 * analytics, e o parâmetro é OBRIGATÓRIO de propósito — ver `abrir`.
 */
export type OrigemAbertura = "icone" | "adicao"

interface ContextoDoCarrinho {
  carrinho:   Carrinho | null
  aviso:      string | null
  erro:       string | null
  carregando: boolean
  aberto:     boolean
  /**
   * ⚠️ O ARGUMENTO NÃO TEM DEFAULT, E ISSO É INTENCIONAL.
   *
   * `view_cart` só faz sentido quando a pessoa foi VER o carrinho. Mas o
   * `BotaoAdicionar` chama `abrir()` em toda adição (é a NFR de <100ms: o drawer
   * abre antes do `await`). Disparando em toda abertura, `view_cart` teria
   * exatamente a contagem de `add_to_cart` e não mediria nada.
   *
   * Sem default, o `tsc` obriga cada chamador a dizer de onde veio. Com default,
   * o modo de falha silencioso é o `onClick={ctx.abrir}` do `IconeCarrinho`:
   * o React passaria o `MouseEvent` como primeiro argumento, a comparação
   * `origem === "icone"` daria falso, e o `view_cart` simplesmente nunca sairia —
   * sem erro de tipo, sem erro em runtime, sem nada no console.
   */
  abrir:      (origem: OrigemAbertura) => void
  fechar:     () => void
  adicionar:         (handle: string) => Promise<void>
  alterarQuantidade: (lineId: string, quantidade: number) => Promise<void>
  remover:           (lineId: string) => Promise<void>
  aplicarCodigo:     (codigo: string) => Promise<void>
  removerCodigo:     (codigo: string) => Promise<void>
  /** Lista crua dos acessórios da loja — buscada no máximo 1x por carga. */
  acessorios: ProductCard[]
  /**
   * O que exibir: acessórios **menos** os já no carrinho, e **vazio quando não há
   * câmera**. Já vem pronto para o componente — ver §A armadilha do memo.
   */
  sugestoes:  ProductCard[]
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

  // Espelho de `carrinho` num ref, para o handler de `pageshow` ler o valor
  // ATUAL sem depender do closure (que congelaria no valor do 1º render). Ver o
  // uso na volta do bfcache, abaixo.
  const carrinhoRef = useRef<Carrinho | null>(null)
  carrinhoRef.current = carrinho

  // ─── Analytics do carrinho ──────────────────────────────────────────────────
  //
  // Os eventos `add_to_cart` / `remove_from_cart` nascem AQUI, no provider, e não
  // no `BotaoAdicionar`. O porquê completo está no topo de
  // `lib/analytics/diffCarrinho.ts`; o resumo é que o botão só conhece o `handle`
  // (decisão de segurança dele) e não sabe se a adição deu certo.

  /**
   * ÚLTIMO CARRINHO BOM CONHECIDO — não é espelho do estado.
   *
   * A diferença importa. Toda falha das actions devolve `{ carrinho: null }`, e o
   * `setCarrinho(null)` que vem depois zera a tela. Se este ref acompanhasse
   * isso, a sequência "falha de rede → cliente tenta de novo → sucesso" faria o
   * diff comparar `null` com o carrinho inteiro e reportar um `add_to_cart` de
   * TODOS os itens, dos quais o cliente adicionou um.
   *
   * Mantendo o último estado bom, a recuperação diffa `[3] → [4]` = 1 item. Certo.
   *
   * ⚠️ Não use o `carrinhoRef` acima para isto: ele é atribuído durante o RENDER,
   * e duas operações seguidas na `fila` não têm garantia de render entre elas —
   * a segunda leria o valor da primeira desatualizado.
   */
  const ultimoBom = useRef<Carrinho | null>(null)

  const reportarDiff = useCallback((r: ResultadoCarrinho) => {
    const { adicionados, removidos } = diffCarrinho(
      ultimoBom.current?.linhas ?? null,
      r.carrinho?.linhas ?? null,
    )

    if (adicionados.length > 0) adicionarAoCarrinho(adicionados)
    if (removidos.length   > 0) removerDoCarrinho(removidos)

    // Só avança a referência em resultado BOM. Ver o bloco acima.
    if (r.carrinho) ultimoBom.current = r.carrinho
  }, [])

  /**
   * Aplica um resultado ao estado.
   *
   * A política do aviso importa (Req 5.4): `aviso` e `erro` são substituídos a
   * cada ação INICIADA PELO USUÁRIO. Nenhuma ação interna limpa um aviso que o
   * cliente ainda não leu — é por isso que a purga do cupom devolve o aviso da
   * primeira resposta, e não o `null` da segunda.
   */
  const aplicar = useCallback((r: ResultadoCarrinho) => {
    // Analytics ANTES do setState: o diff precisa do estado anterior, e depois
    // deste ponto ele já foi substituído. Não bloqueia nada (o gtag é `push` num
    // array) e não pode lançar — `evento()` é silencioso sem `window.gtag`.
    reportarDiff(r)

    setCarrinho(r.carrinho)
    setAviso(r.aviso)
    setErro(r.erro)
    // `reportarDiff` é `useCallback([])` logo acima — estável, não precisa entrar
    // nas deps. (E este arquivo não tem lint: ver o aviso sobre `exhaustive-deps`
    // mais abaixo. É revisão humana.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      .then((r) => {
        setCarrinho(r.carrinho)
        /*
          🔴 ALIMENTA A LINHA DE BASE DO DIFF — e é obrigatório.

          Cenário sem esta linha: a pessoa volta ao site com 2 itens no carrinho
          (cookie vivo). O `sincronizar` do mount traz os 2, mas o `ultimoBom`
          segue `null`. No primeiro `+` que ela der, o diff compara `null` com
          `[3 itens]` e reporta `add_to_cart` de TRÊS produtos.

          O efeito no relatório é traiçoeiro: infla `add_to_cart` exatamente para
          os clientes que RETORNAM — o segmento cuja taxa de conversão você mais
          quer acreditar.

          Sem `reportarDiff` aqui, note: isto é leitura de fundo, não ação do
          cliente. Ninguém adicionou nada; só estabelecemos o ponto de partida.
        */
        if (r.carrinho) ultimoBom.current = r.carrinho
      })
      .catch(() => { /* silêncio: navbar sem contador, sem erro */ })
  }, [])

  useEffect(() => {
    sincronizar()

    // ⚠️ O mount NÃO cobre a volta do checkout.
    // Voltar do checkout é tipicamente o botão Back, e o bfcache restaura a
    // página SEM re-executar efeitos — exatamente o cenário do carrinho fantasma
    // (Req 2.5/2.6). `pageshow` com `persisted` é o único sinal desse caminho.
    //
    // ⚠️ NÃO basta `sincronizar()` aqui. A página volta congelada do bfcache e a
    // Server Action que a `sincronizar` dispara não settla nessa página
    // descongelada — fica PENDENTE, e como tudo passa pela mesma `fila` serial,
    // planta um elo eterno que TRAVA os botões (+/−/remover/finalizar) sem erro
    // no console. F5 cura porque é um mount limpo. Então, quando há carrinho em
    // memória, fazemos o equivalente ao F5: um reload. Escopado por
    // `carrinhoRef.current` para NÃO recarregar a Home estática (nem qualquer
    // página sem carrinho) numa volta comum — ali `sincronizar()` basta e é
    // inócuo.
    const aoRestaurar = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      if (carrinhoRef.current) window.location.reload()
      else sincronizar()
    }
    window.addEventListener("pageshow", aoRestaurar)
    return () => window.removeEventListener("pageshow", aoRestaurar)
  }, [sincronizar])

  // ─── Acessórios sugeridos ───────────────────────────────────────────────────
  //
  // ⚠️ AS DEPENDÊNCIAS ABAIXO NÃO SÃO VALIDADAS POR FERRAMENTA NENHUMA.
  // O projeto não tem config de ESLint, então o `next build` não roda lint e a
  // regra `exhaustive-deps` não existe aqui. Errar um array não gera erro, aviso
  // nem falha de build — só comportamento errado, em silêncio. É revisão humana.

  const [acessorios, setAcessorios] = useState<ProductCard[]>([])

  /** Já disparamos a busca nesta carga de página? */
  const buscou = useRef(false)

  const linhas = carrinho?.linhas ?? []

  // O GATILHO, e ele custa ZERO REDE: o fragmento do carrinho traz `tags` na
  // linha, então saber se há uma câmera é uma leitura local. É isso que permite
  // não chamar a Shopify quando não há gatilho — a alternativa (buscar as
  // câmeras para comparar) precisaria da rede só para decidir se usa a rede.
  const temCamera = linhas.some((l) => l.tags.includes(TAG_CAMERA))

  useEffect(() => {
    if (!temCamera || buscou.current) return

    // `buscou.current = true` SÍNCRONO, ANTES do await.
    // Se só virasse após sucesso, uma Shopify degradada + um carrinho
    // conversador refariam a busca a CADA mudança do carrinho — martelando uma
    // API que já está caindo, exatamente quando ela menos aguenta.
    //
    // Consequência honesta e aceita: uma busca que falha NÃO é repetida até a
    // próxima carga de página. É o preço do Req 6.2 (o extra nunca atrapalha) —
    // o cliente perde a sugestão, não a compra.
    buscou.current = true

    // Fora da `fila`: a fila serializa MUTAÇÕES do carrinho, e isto é leitura de
    // catálogo — não disputa nada com elas.
    buscarAcessorios().then(setAcessorios)
    // `buscarAcessorios` e `setAcessorios` são estáveis (import de módulo e
    // setter do useState). `temCamera` é a única dependência real: é o gatilho.
  }, [temCamera])

  /**
   * ⚠️⚠️ O GATILHO ESTÁ AQUI, NA DERIVAÇÃO — NÃO NO RENDER. Não mova.
   *
   * `acessorios` SOBREVIVE ao gatilho: é o memo, e é o ponto dele. Se o
   * `if (!temCamera)` ficasse só na hora de renderizar, a sequência real seria:
   *
   *   1. cliente adiciona uma câmera  → gatilho dispara → acessorios = [a, b]
   *   2. cliente REMOVE a câmera      → temCamera = false
   *   3. sugestoes = [a, b] − [] = [a, b]  → NÃO VAZIO
   *   4. a guarda `sugestoes.length === 0` do componente PASSA
   *   5. → a seção renderiza **sem nenhuma câmera no carrinho** (Req 1.2),
   *        ou embaixo de "Seu carrinho está vazio" (Req 1.3)
   *
   * Pior ainda: qualquer falha do `adicionarItem` devolve `{carrinho: null}`
   * (`acoes.ts`), o que zera `linhas` — e um erro transitório faria a lista
   * inteira de sugestões brotar ao lado do banner de erro.
   *
   * Estado que sobrevive ao gatilho não pode ser validado por um `length`.
   * NADA disto aparece em `tsc` ou `build`: só na sequência
   * adicionar-câmera → remover-câmera.
   */
  const sugestoes = useMemo(() => {
    if (!temCamera) return []
    const noCarrinho = new Set(linhas.map((l) => l.handle))
    return acessorios.filter((a) => !noCarrinho.has(a.handle))
    // Chaveado em `carrinho?.linhas`, NÃO em `linhas`: esta última é
    // `carrinho?.linhas ?? []`, um array NOVO a cada render — memoizar nela
    // recomputaria sempre e o "memo" viraria decoração. O filtro é barato e a
    // corretude não mudaria, mas o memo precisa memoizar de fato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temCamera, acessorios, carrinho?.linhas])

  const valor: ContextoDoCarrinho = {
    carrinho,
    aviso,
    erro,
    carregando,
    aberto,
    /*
      `view_cart` SÓ na abertura pelo ícone. Ver a justificativa no tipo, acima.

      Lê `carrinhoRef.current` e não `carrinho`: este `useCallback` tem deps `[]`
      (precisa ser estável — ele é `onClick` do ícone da navbar, que vive dentro
      de seções memoizadas), então o `carrinho` do closure congelaria no valor do
      primeiro render, que é sempre `null`. O `view_cart` nunca sairia.

      Sem itens → sem evento. Abrir um carrinho vazio não é ver um carrinho.
    */
    abrir: useCallback((origem: OrigemAbertura) => {
      setAberto(true)
      if (origem !== "icone") return
      const c = carrinhoRef.current
      if (c && c.linhas.length > 0) {
        verCarrinho(c.total, c.linhas.map((l) => itemDaLinha(l)))
      }
    }, []),
    fechar: useCallback(() => setAberto(false), []),
    adicionar:         useCallback((handle: string) => enfileirar(() => adicionarItem(handle)), [enfileirar]),
    alterarQuantidade: useCallback((lineId: string, q: number) => enfileirar(() => atualizarQuantidade(lineId, q)), [enfileirar]),
    remover:           useCallback((lineId: string) => enfileirar(() => removerLinha(lineId)), [enfileirar]),
    aplicarCodigo:     useCallback((codigo: string) => enfileirar(() => aplicarCupom(codigo)), [enfileirar]),
    removerCodigo:     useCallback((codigo: string) => enfileirar(() => removerCupom(codigo)), [enfileirar]),
    acessorios,
    sugestoes,
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
