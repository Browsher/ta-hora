# Chamadas para colar na descrição dos produtos (Shopify)

Duas por produto, para as imagens **01** e **02** de cada descrição — as que hoje trazem título e specs só como pixel.

## Como colar

No admin da Shopify, produto → **Descrição** → editor de código-fonte (`<>`), inserindo **acima** de cada `<img>`:

```html
<h3>Duas lentes, dois ângulos ao mesmo tempo</h3>
<p>A de cima fica fixa no que importa...</p>
<img src="...IC-A31H_01.png" alt="...">
```

`h3` e `p` já passam pelo sanitizador (`lib/shopify/sanitizarDescricao.ts` permite `p`, `br`, `strong`, `b`, `em`, `i`, `u`, `ul`, `ol`, `li`, `a`, `h2`, `h3`, `h4`). **Nenhuma mudança de código é necessária** — o texto aparece assim que você salvar, sem deploy.

Use `h3` e não `h2`: o `h2` está reservado às seções da PDP, e uma chamada de infográfico é subordinada a elas.

**Todas as specs citadas abaixo vêm dos metafields reais de cada produto** (resolução, graus de giro, app, zoom, alarme). Não inventei número nenhum. Se você editar uma spec no admin, revise a chamada correspondente.

---

## A31H — Full HD, dupla lente

**01**
> ### Duas lentes, dois ângulos ao mesmo tempo
> A de cima fica fixa no que importa. A de baixo gira sozinha e acompanha o movimento. Você vê a entrada inteira sem ter que escolher um canto só.

**02**
> ### Gira 355° pelo celular, de onde você estiver
> No app ICSee você arrasta o dedo e a câmera acompanha. Com zoom de 4x para enxergar o que está longe do portão.

---

## P9 — HD, interna e externa

**01**
> ### Feita para ficar do lado de fora
> Resistente à água e com visão noturna colorida. Chuva, sol forte ou três da manhã: a imagem continua lá.

**02**
> ### 330° na horizontal, 90° na vertical
> Pelo app EseeCloud você varre o quintal inteiro sem levantar do sofá — e ainda dá zoom de 4x no que chamou atenção.

---

## Q6 — Full HD, dupla lente

**01**
> ### Uma lente vigia, a outra persegue
> A superior fica fixa segurando o quadro todo. A inferior é motorizada e vai atrás do que se mexeu, sozinha.

**02**
> ### As duas imagens ao mesmo tempo, no mesmo app
> No EseeCloud você vê a lente fixa e a motorizada lado a lado, e alterna entre elas com um toque.

---

## Câmera Lâmpada — HD, bocal E27

**01**
> ### Rosqueia no bocal e pronto
> Sem furar parede, sem passar fio e sem chamar eletricista. Onde tem lâmpada, passa a ter câmera.

**02**
> ### Gira 355° e inclina 90° pelo celular
> Do bocal, o app ICSee alcança o cômodo inteiro — com zoom de 4x para aproximar o que interessa.

---

## A38 — 4K Ultra HD, dupla lente

**01**
> ### 4K de verdade: 3840×2160
> Quatro vezes mais detalhe que o Full HD. É a diferença entre ver que passou alguém e reconhecer quem passou.

**02**
> ### Gira 355°, inclina 90° e dá zoom de 4x
> Pelo app ICSee você acompanha o movimento pela casa toda sem sair do lugar.

---

## Q8 — Full HD, dupla lente com refletor

**01**
> ### Refletor em cima, alarme dentro
> Detectou movimento, acende o refletor e dispara o som. Quem chegou entende na hora que foi visto.

**02**
> ### Lente fixa em cima, motorizada embaixo
> A de cima segura o quadro inteiro; a de baixo gira 330° atrás do movimento. No EseeCloud, as duas ao mesmo tempo.

---

## S8 — 3K Vertical, tripla lente

**01**
> ### Três lentes e uma imagem em pé, de 3K
> Duas fixas em cima e uma motorizada embaixo cobrem do portão ao telhado. O corredor inteiro na vertical, sem cortar as pontas.

**02**
> ### As três visões no mesmo app
> No EseeCloud as três lentes aparecem lado a lado, e a motorizada obedece ao seu dedo.

---

## Achado extra, fora do pedido

A **imagem 01 da Câmera Lâmpada está com `alt` vazio** (`alt=""`). As outras 27 imagens de descrição do catálogo têm alt longo e descritivo — é a única fora do padrão.

Alt vazio significa "imagem decorativa, ignore": leitor de tela pula, e busca por imagem não indexa. Como é a primeira imagem da descrição do produto, quase certamente é esquecimento e não decisão.

Vale preencher no mesmo lugar, seguindo o padrão das irmãs — algo como: *"Câmera branca em formato de lâmpada rosqueada em um bocal externo, iluminando a entrada de uma casa, ao lado de uma mão segurando um celular com a imagem ao vivo"*. Confira contra a imagem real antes de colar; não a vi, deduzi pelo padrão das outras.
