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

## Checks de catálogo (rodar antes de publicar mudanças de produto)

Nenhum dos dois está no `npm run build` de propósito: o build precisa passar sem
`.env.local`, e ambos precisam do token. São checagens de **dados**, não de
código — rode-as à mão ao mexer no catálogo.

### Variantes

```bash
npm run verificar:variantes
```

Exit `0` = ok. Exit `1` = **a premissa caiu, resolva antes de publicar.**

Exit `0` = ok. Exit `1` = **a premissa caiu, resolva antes de publicar.**

O site **não tem seletor de variante**, porque hoje todo produto tem exatamente
1 variante. Se um produto ganhar uma segunda, o site passaria a adicionar sempre
a primeira disponível — ou seja, entregaria a **cor errada, em silêncio**. Este
check existe para essa premissa cair com barulho.

### Tags (a sugestão de acessórios)

```bash
npm run verificar:tags
```

Exit `0` = há gatilho e há o que sugerir. Exit `1` = **a seção nunca vai
aparecer.** Ele também **avisa** (sem falhar) sobre produtos publicados **sem tag
alguma** — quase sempre um cadastro novo em que a etiqueta foi esquecida.

Por que existe: sem as tags, a seção de acessórios simplesmente não renderiza —
sem erro, sem log. Para quem olha a tela, é **indistinguível de um bug**.

O check conta acessórios **sugeríveis** (com a tag **e** disponíveis), não apenas
etiquetados: com os acessórios todos esgotados, a seção também some, e um check
que só olhasse a etiqueta ficaria verde no exato estado que ele existe para
impedir.

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

## Acessórios sugeridos (no drawer)

Quando o carrinho tem uma **câmera**, o drawer mostra a seção **"Você também vai
precisar"** com os acessórios da loja e um botão para adicioná-los em um clique.

**Tudo é decidido por tag na Shopify — nunca no código:**

| Tag | Papel |
|---|---|
| `camera` | **Gatilho** — um destes no carrinho faz a seção aparecer |
| `acessorio` | **Sugerido** — estes são listados na seção |

Tags em **minúsculas, sem acento** (as constantes vivem em `lib/shopify/tags.ts`;
divergência de grafia faz a seção sumir em silêncio). Para mudar o que é sugerido,
aplique ou remova a tag no admin — **sem deploy**.

A seção some sozinha quando não há câmera no carrinho, quando todos os acessórios
já foram adicionados, ou quando a busca falha: ela é um extra comercial e **nunca**
atrapalha a compra.

> ⚠️ **Estado do catálogo (medido em 2026-07-17):** os produtos etiquetados
> `acessorio` hoje são `camera-seguranca-q8` e `camera-seguranca-s8` — que são
> **câmeras**, usadas como **dados de teste** para validar o mecanismo. **As
> sugestões vão mostrar câmeras; isso é esperado, não bug.** Quando o cabo
> extensor e o cartão de memória existirem, aplique `acessorio` neles e remova
> destes — sem tocar em código.
>
> Câmeras com a tag `camera` (as que disparam a seção): `camera-seguranca-es-p9`
> e `camera-de-seguranca-q6`. As demais estão **sem tag** e não disparam nada —
> `npm run verificar:tags` reporta quais.

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
