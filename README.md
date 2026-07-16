# Ta Hora

Loja headless (câmeras de segurança e acessórios). Base do site gerada pelo
Builder; a loja (catálogo, páginas de produto e **carrinho**) puxa os dados da
**Shopify** (Storefront API **2026-01**) em **runtime com ISR**. O checkout é o
**hospedado da Shopify** (Mercado Pago como gateway) — o site nunca processa
pagamento.

## Como rodar

```bash
npm install
npm run dev     # desenvolvimento local
```

Para as rotas da loja (`/catalogo`, `/produtos/[handle]`) e para o carrinho, crie
um `.env.local` a partir do `.env.example` com o token da Storefront API da sua
loja Shopify.

## Build e deploy

```bash
npm run build   # build de runtime (SSR/ISR)
npm start       # roda o build de produção localmente
```

> O projeto **não** é static export (não gera `out/`): a loja precisa de
> preço/estoque frescos da Shopify, o que exige runtime. Deploy alvo: **Vercel**
> (SSR/ISR). As páginas de conteúdo (home, Sobre Nós) continuam pré-renderizadas
> (SSG) e não dependem da Shopify.

O build **passa sem `.env.local`**: as rotas da loja degradam para um estado de
erro amigável em runtime, e o carrinho fica sem contador — mas o site sobe.

## Verificar variantes (rodar antes de publicar mudanças de catálogo)

```bash
npm run verificar:variantes
```

Exit `0` = ok. Exit `1` = **a premissa caiu, resolva antes de publicar.**

O site **não tem seletor de variante**, porque hoje todo produto tem exatamente
1 variante. Se um produto ganhar uma segunda, o site passaria a adicionar sempre
a primeira disponível — ou seja, entregaria a **cor errada, em silêncio**. Este
check existe para essa premissa cair com barulho.

Ele **não** está no `npm run build` de propósito: o build precisa passar sem
`.env.local`, e este check precisa do token. Rode-o à mão ao mexer no catálogo.

## O carrinho

- **Drawer lateral** com itens, quantidade (`−`/`+`), cupom, subtotal, desconto e
  total. O ícone/contador fica na navbar, em todas as páginas.
- **Estado por visitante:** o ID do carrinho vive num cookie `httpOnly` de 7
  dias, legível só pelo servidor. O token da Storefront API **nunca** vai ao
  browser (`import "server-only"` na camada de dados; verificável com uma busca
  no `.next/static` após o build → 0 ocorrências).
- **A Shopify é a fonte da verdade:** preço, totais, estoque e validação de cupom
  vêm todos da API. O site não tem regra nem lista de cupons.
- **Cupons:** cadastre em Descontos, no admin da Shopify. Código inválido devolve
  "Cupom inválido" e é purgado do carrinho.

### Notas de comportamento (medidas na loja, não suposições)

- **O limite de estoque é silencioso, e o teto é 50 por linha.** Pedir uma
  quantidade acima do estoque **não** gera erro (`userErrors` vem vazio): a
  Shopify limita a quantidade e avisa só em `warnings`. Mesmo com
  `quantityAvailable: 999`, a linha corta em **50**. Por isso o drawer exibe
  *"Ajustamos a quantidade ao estoque disponível."* — é o aviso, não o
  `estoqueMaximo`, que segura o `+`.
- **Adicionar o mesmo produto 2× soma na mesma linha** (a Shopify mescla; não
  duplica).
- **`cart.cost.subtotalAmount` já vem com o desconto aplicado.** O "Subtotal" do
  drawer é o **bruto** (soma de `line.cost.subtotalAmount`), para a coluna
  fechar: `subtotal − desconto = total`. Se essa identidade não bater, o drawer
  esconde as linhas derivadas e mostra só o total da Shopify.

## Documentação de direção

`.claude/steering/` (product, tech, structure) e `.claude/specs/`. **Leia o
`tech.md` antes de planejar** — em especial "Modelo de build" e "Home estática: o
que é regra e o que NÃO é".
