// Emite um bloco JSON-LD (`<script type="application/ld+json">`).
//
// Server Component sem estado: o objeto chega pronto de `lib/seo/*`, que são
// módulos PUROS. A separação existe para o construtor do schema continuar
// exercitável com `node -e` (é o que `npm run verificar:schema` faz) — este
// arquivo é só a fronteira com o DOM.
//
// JSON-LD é o formato PREFERIDO do Google (contra microdata/RDFa): não se mistura
// ao HTML visível, então mexer no layout não quebra os dados estruturados.

/**
 * Escapa o que poderia ESCAPAR DA TAG. Não é zelo: é o vetor conhecido deste
 * padrão, e aqui ele é alcançável.
 *
 * O conteúdo do schema vem da Shopify — `title` e `custom.resumo` são texto que o
 * lojista digita no admin. Um `</script>` dentro de qualquer campo encerraria a
 * tag no meio do JSON, e o resto do objeto passaria a ser interpretado como HTML
 * pelo navegador. `JSON.stringify` NÃO protege disso: `<` é caractere válido em
 * string JSON e sai literal.
 *
 * `<` é a mesma string para o parser de JSON e inofensiva para o de HTML.
 * Escapar só o `<` basta — sem ele não há como abrir nem fechar tag.
 */
function serializar(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

/**
 * `dangerouslySetInnerHTML` é OBRIGATÓRIO aqui, não é atalho: o React escaparia
 * as aspas do JSON se o objeto fosse passado como filho de texto, e o resultado
 * seria um bloco que nenhum crawler consegue parsear (`&quot;@type&quot;`).
 * Quem torna isso seguro é o `serializar` acima.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializar(data) }}
    />
  )
}
