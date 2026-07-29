# Dependência externa: o link gerado pelo dashboard de afiliados

**Status:** ABERTA — fora do escopo desta spec, precisa ser feita no **projeto
Afiliados** (repositório separado).

## O problema

Esta spec construiu, na loja headless, tudo o que é preciso para creditar um
afiliado: a captura do `?ref=`, o cookie de 30 dias e o carimbo `afiliado_ref`
no carrinho, que vira `note_attributes` no pedido.

**Mas a loja só é acionada se o cliente chegar por um link dela.** Hoje o
dashboard de afiliados gera links apontando para o **domínio da Shopify**. Um
cliente que clique num desses links não passa pelo `proxy.ts` da loja headless,
não recebe o cookie `tahora_ref` e **a venda não é atribuída** — por mais
correto que esteja o código deste repositório.

Ou seja: enquanto esta dependência estiver aberta, a feature funciona e não
credita ninguém, porque ninguém chega por ela.

## O que precisa mudar

O dashboard deve gerar o link apontando para a loja headless:

```
https://ta-hora-loja.vercel.app/?ref=<CODIGO>
```

E, quando o domínio próprio entrar no ar:

```
https://tahora.com.br/?ref=<CODIGO>
```

Qualquer rota funciona como ponto de entrada — `/`, `/catalogo`,
`/produtos/<handle>` —, então o dashboard pode gerar links de campanha para
páginas específicas. O que não pode faltar é o `?ref=`.

## O contrato do código (o que a loja aceita)

| Item | Regra |
|---|---|
| Formato | `^[A-Z0-9]{8}$` — 8 caracteres alfanuméricos |
| Caixa | O webhook é **case-sensitive** e só credita MAIÚSCULAS. A loja **normaliza** (`abcd1234` no link vira `ABCD1234` no carimbo), então minúsculo no link funciona — mas o dashboard deve gerar em maiúsculo mesmo assim, para o link ser autoexplicativo |
| Código inválido | A loja ignora silenciosamente: não grava cookie, não redireciona, não quebra a navegação. O cliente compra normalmente, sem atribuição |
| Last-touch | Um `?ref=` válido novo **sobrescreve** o anterior. O último afiliado a indicar leva o crédito |
| Janela | 30 dias (validade do cookie `tahora_ref`) |

## Como conferir que funcionou

1. Abrir o link gerado pelo dashboard.
2. A URL deve ficar **limpa** (sem `?ref=`) — sinal de que o `proxy.ts` capturou.
3. DevTools → Application → Cookies → deve existir `tahora_ref` com o código em
   MAIÚSCULAS.
4. Adicionar um item e rodar, com o valor do cookie `carrinho_id`:
   ```
   npm run verificar:afiliado -- "<valor do cookie carrinho_id>"
   ```
   Deve imprimir `✔ CARIMBADO: afiliado_ref = <CODIGO>`.

## Onde isto está implementado do lado da loja

- `proxy.ts` — captura o `?ref=`, grava o cookie, limpa a URL
- `lib/afiliados/ref.ts` — a regra do código (regex, normalização, constantes)
- `lib/afiliados/cookie.ts` — leitura validada do cookie no servidor
- `lib/carrinho/acoes.ts` — o carimbo no carrinho (`recarimbar`, `criarEGravar`)
- `scripts/verificar-afiliado.mjs` — inspeção do carimbo num carrinho
