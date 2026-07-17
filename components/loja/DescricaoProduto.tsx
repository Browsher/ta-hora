import type { JSX } from "react"

// Renderiza a descrição rica do produto (descriptionHtml da Shopify) já
// SANITIZADA. NÃO sanitiza aqui — recebe a string pronta de `sanitizarDescricao`
// (server-only), chamada na page.tsx (Server Component).
//
// ⚠️ É Server Component de propósito — NUNCA adicione "use client". A garantia de
// segurança da feature é que o HTML chega limpo do servidor; um "use client"
// aqui arrastaria a fronteira (e potencialmente o sanitize-html) pro navegador.
// Sem onClick / sem hooks: as imagens da descrição são inertes (não-clicáveis,
// sem zoom — fora do escopo desta spec). O estilo (imagens contidas,
// anti-shift) vem da classe `.descricao-produto` em app/globals.css.

export function DescricaoProduto({ html }: { html: string }): JSX.Element | null {
  // Descrição vazia (ou vazia pós-sanitização) → sem coluna direita. A page.tsx
  // já decide o layout por isto; o guard aqui é a segunda trava.
  if (html === "") return null

  return (
    <div
      className="descricao-produto"
      // html já sanitizado por sanitizarDescricao() no servidor.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
