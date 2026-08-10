"use client"

import { tokens } from "@/lib/tokens"
import { useCarrinho } from "./CarrinhoProvider"

// Substitui o `AddToCartPlaceholder` inerte. Recebe o `handle` da rota — NUNCA
// um `merchandiseId`: o servidor resolve a variante (decisão de segurança), o
// cliente não pode injetar a variante de outro produto.

interface BotaoAdicionarProps {
  handle: string
  /**
   * `false` → botão desabilitado com "Esgotado". Default `true` para não mudar
   * nenhuma chamada existente. A palavra é "Esgotado", não "Indisponível":
   * indisponível lê como erro do site ou restrição de região; esgotado só tem uma
   * leitura, e é a que o cliente já conhece dos marketplaces.
   */
  disponivel?: boolean
  /** Rótulo do estado normal. Default: o texto completo. */
  label?: string
  /**
   * Variante da barra fixa de mobile: largura pelo conteúdo e padding menor, para
   * caber ao lado do preço em 320px. NÃO mexe em cor, raio nem peso — é o mesmo
   * botão, só mais estreito.
   */
  compacto?: boolean
}

export function BotaoAdicionar({
  handle,
  disponivel = true,
  label      = "Adicionar ao carrinho",
  compacto   = false,
}: BotaoAdicionarProps) {
  const ctx = useCarrinho()

  // Fora do provider (Navbar/rota montada isolada) → botão inerte, nunca crash.
  if (!ctx) return null

  const { adicionar, abrir, carregando } = ctx

  // Esgotado trava o botão ANTES da rede. O servidor continua sendo a autoridade
  // (`resolverVariante` relê o estoque na adição) — isto só evita que o cliente
  // clique para descobrir.
  const inerte = !disponivel || carregando

  async function aoClicar() {
    // Cinto de segurança: `disabled` já bloqueia o clique do mouse, mas não um
    // `.click()` programático nem um Enter em navegador antigo.
    if (!disponivel) return

    // ⚠️ A ORDEM IMPORTA: `abrir()` ANTES do `await`.
    // A NFR exige drawer em <100ms, sem esperar a rede — o drawer mostra
    // carregando e reconcilia quando a resposta chega. Inverter (await antes de
    // abrir) faria o cliente clicar e encarar uma página parada até a Shopify
    // responder.
    //
    // E é `abrir()` do PROVIDER, não estado local: o drawer é montado no root
    // layout, então só o contexto o alcança.
    // `"adicao"` → o provider NÃO manda `view_cart` aqui. Esta abertura é efeito
    // colateral do clique em "adicionar", não alguém indo ver o carrinho; contar
    // as duas faria `view_cart` empatar com `add_to_cart` e não medir nada.
    abrir("adicao")
    // O `add_to_cart` sai daqui de dentro, no provider, por diff da resposta da
    // Shopify — este componente não conhece preço nem título (só o `handle`) e
    // não saberia se a adição deu certo. Ver lib/analytics/diffCarrinho.ts.
    await adicionar(handle)
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={inerte}
      aria-busy={carregando}
      style={{
        // Compacto: largura pelo conteúdo (a barra fixa dá o preço ao lado);
        // normal: 100%, como sempre foi.
        width:        compacto ? "auto" : "100%",
        flexShrink:   0,
        whiteSpace:   "nowrap",
        // Esgotado sai da cor de destaque: um botão laranja apagado ainda lê como
        // "clique aqui". Cinza + not-allowed diz que não há ação, sem depender de
        // o cliente notar a opacidade.
        background:   disponivel ? "var(--cor-destaque)" : "var(--cor-borda)",
        color:        disponivel ? "var(--cor-destaque-texto)" : "var(--cor-texto-fraco)",
        border:       "none",
        borderRadius: tokens.radius.btn,
        padding:      compacto ? "12px 20px" : "14px 32px",
        fontSize:     14,
        fontWeight:   600,
        cursor:       !disponivel ? "not-allowed" : carregando ? "wait" : "pointer",
        opacity:      carregando ? 0.7 : 1,
        transition:   "opacity .15s",
      }}
    >
      {!disponivel ? "Esgotado" : carregando ? "Adicionando…" : label}
    </button>
  )
}
