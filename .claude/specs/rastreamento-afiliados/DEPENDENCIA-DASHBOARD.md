# Dependência externa: o link gerado pelo dashboard de afiliados

**Status:** ✅ **RESOLVIDA em 2026-08-04**, no **projeto Afiliados**
(repositório separado).

## O que era o problema

Esta spec construiu, na loja headless, tudo o que é preciso para creditar um
afiliado: a captura do `?ref=`, o cookie de 30 dias e o carimbo `afiliado_ref`
no carrinho, que vira `note_attributes` no pedido.

**Mas a loja só é acionada se o cliente chegar por um link dela.** O dashboard
de afiliados gerava links apontando para o **domínio da Shopify**. Um cliente
que clicasse num desses links não passava pelo `proxy.ts` da loja headless, não
recebia o cookie `tahora_ref` e **a venda não era atribuída** — por mais correto
que estivesse o código deste repositório.

Enquanto esta dependência esteve aberta, a feature funcionava e não creditava
ninguém, porque ninguém chegava por ela.

## Como foi resolvido

O dashboard passou a montar o link a partir de uma variável de ambiente
`STOREFRONT_URL`, apontando para a loja headless. O link gerado hoje é:

```
https://tahora.com.br/?ref=<CODIGO>
```

Deployado e validado ponta a ponta: link copiado do dashboard, aberto em aba
anônima → a URL limpou (o `proxy.ts` capturou) e o cookie `tahora_ref` apareceu.

Ter a URL em `STOREFRONT_URL` em vez de hardcoded é o que evita a repetição
desta dependência: uma troca futura de domínio é mudança de env var no projeto
Afiliados, sem redeploy de lógica.

## Qualquer rota serve como ponto de entrada — e isso tem valor comercial

O `matcher` do `proxy.ts` é amplo (todo o site, exceto API, estáticos e
caminhos com extensão) e o cookie é gravado com `path: "/"`. A consequência
prática: **o afiliado pode divulgar qualquer URL do site** — `/`, `/catalogo`,
`/produtos/<handle>` — e a captura funciona igual. Basta o `?ref=`.

Isso não é só conveniência. O modelo de recompensa exige **3 compras do MESMO
produto**. Divulgar o link de um **produto específico** concentra as compras
indicadas num único produto, enquanto divulgar a home espalha os visitantes pelo
catálogo e pode nunca fechar o trio. Ou seja: para o afiliado, o link de produto
fecha ciclo mais rápido.

```
https://tahora.com.br/produtos/<handle>?ref=<CODIGO>
```

Vale considerar, no dashboard, oferecer o link por produto além do link da home
— a mecânica da loja já suporta, sem nenhuma mudança deste lado.

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
