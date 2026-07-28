# Auditoria — tema claro

**Data:** 2026-07-28 · **Build:** `rm -rf .next && npm run build` limpo, env restaurada
**Veredito geral:** ✅ **aprovada, com exceções registradas**

Nenhuma reprovação **inesperada**. Todos os pontos abaixo de AA caem em uma de
duas categorias já conhecidas e documentadas: a **decisão do accent** (abaixo) ou
o **`--cor-texto-fraco`** (Req 6.1). Um item novo foi encontrado e está na seção
"Achado".

---

## ⚠️ Decisão do accent — leia antes de "consertar" qualquer coisa

O site usa **`#ff8903`** (laranja vibrante) como cor de texto/foco, por **decisão
explícita do dono do produto**, ciente de que reprova o WCAG AA. Ver
[`DECISAO-ACCENT-TEXTO.md`](./DECISAO-ACCENT-TEXTO.md).

Na tabela esses pontos aparecem como 🟠 **exceção aceita** — **não** são
reprovação a corrigir e **não** devem voltar para `#995202`. A auditoria confirma
que o estado do site **bate com a decisão tomada**; ela não reprova a spec.

O restante da meta AA continua valendo e **passa**: texto de corpo (16.65:1),
títulos, secundário (6.62:1) e todo texto sobre superfície accent (8.83:1).

---

## Tabela de contraste medida

Legenda: ✅ passa AA · 🟠 exceção aceita (decisão do accent) · ❌ reprova ·
⬜ separador decorativo (fora do WCAG 1.4.11)

| Tela | Elemento | Par | Razão | Meta | Veredito |
|---|---|---|---|---|---|
| Home | titulo/corpo (fundo) | `#1A1A1A` / `#FAFAF8` | **16.65:1** | 4.5 | ✅ passa |
| Home | secundario (fundo) | `#5A5A57` / `#FAFAF8` | **6.62:1** | 4.5 | ✅ passa |
| Home | fraco (fundo) *(placeholder/legenda)* | `#8E8B85` / `#FAFAF8` | **3.25:1** | 4.5 | ❌ REPROVA |
| Home | ACCENT como texto (fundo) | `#ff8903` / `#FAFAF8` | **2.28:1** | 4.5 | 🟠 exceção aceita |
| Home | titulo/corpo (card) | `#1A1A1A` / `#FFFFFF` | **17.40:1** | 4.5 | ✅ passa |
| Home | secundario (card) | `#5A5A57` / `#FFFFFF` | **6.92:1** | 4.5 | ✅ passa |
| Home | fraco (card) *(placeholder/legenda)* | `#8E8B85` / `#FFFFFF` | **3.40:1** | 4.5 | ❌ REPROVA |
| Home | ACCENT como texto (card) | `#ff8903` / `#FFFFFF` | **2.38:1** | 4.5 | 🟠 exceção aceita |
| Home | titulo/corpo (creme topo) | `#1A1A1A` / `#FFF8EF` | **16.51:1** | 4.5 | ✅ passa |
| Home | secundario (creme topo) | `#5A5A57` / `#FFF8EF` | **6.57:1** | 4.5 | ✅ passa |
| Home | fraco (creme topo) *(placeholder/legenda)* | `#8E8B85` / `#FFF8EF` | **3.22:1** | 4.5 | ❌ REPROVA |
| Home | ACCENT como texto (creme topo) | `#ff8903` / `#FFF8EF` | **2.26:1** | 4.5 | 🟠 exceção aceita |
| Home | titulo/corpo (creme base) | `#1A1A1A` / `#FBE8D2` | **14.57:1** | 4.5 | ✅ passa |
| Home | secundario (creme base) | `#5A5A57` / `#FBE8D2` | **5.79:1** | 4.5 | ✅ passa |
| Home | fraco (creme base) *(placeholder/legenda)* | `#8E8B85` / `#FBE8D2` | **2.84:1** | 4.5 | ❌ REPROVA |
| Home | ACCENT como texto (creme base) | `#ff8903` / `#FBE8D2` | **1.99:1** | 4.5 | 🟠 exceção aceita |
| Catalogo | titulo/corpo (fundo) | `#1A1A1A` / `#FAFAF8` | **16.65:1** | 4.5 | ✅ passa |
| Catalogo | secundario (fundo) | `#5A5A57` / `#FAFAF8` | **6.62:1** | 4.5 | ✅ passa |
| Catalogo | fraco (fundo) *(placeholder/legenda)* | `#8E8B85` / `#FAFAF8` | **3.25:1** | 4.5 | ❌ REPROVA |
| Catalogo | ACCENT como texto (fundo) | `#ff8903` / `#FAFAF8` | **2.28:1** | 4.5 | 🟠 exceção aceita |
| Catalogo | titulo/corpo (card) | `#1A1A1A` / `#FFFFFF` | **17.40:1** | 4.5 | ✅ passa |
| Catalogo | secundario (card) | `#5A5A57` / `#FFFFFF` | **6.92:1** | 4.5 | ✅ passa |
| Catalogo | fraco (card) *(placeholder/legenda)* | `#8E8B85` / `#FFFFFF` | **3.40:1** | 4.5 | ❌ REPROVA |
| Catalogo | ACCENT como texto (card) | `#ff8903` / `#FFFFFF` | **2.38:1** | 4.5 | 🟠 exceção aceita |
| Catalogo | titulo/corpo (superficie) | `#1A1A1A` / `#F0EFEB` | **15.13:1** | 4.5 | ✅ passa |
| Catalogo | secundario (superficie) | `#5A5A57` / `#F0EFEB` | **6.01:1** | 4.5 | ✅ passa |
| Catalogo | fraco (superficie) *(placeholder/legenda)* | `#8E8B85` / `#F0EFEB` | **2.95:1** | 4.5 | ❌ REPROVA |
| Catalogo | ACCENT como texto (superficie) | `#ff8903` / `#F0EFEB` | **2.07:1** | 4.5 | 🟠 exceção aceita |
| Produto | titulo/corpo (fundo) | `#1A1A1A` / `#FAFAF8` | **16.65:1** | 4.5 | ✅ passa |
| Produto | secundario (fundo) | `#5A5A57` / `#FAFAF8` | **6.62:1** | 4.5 | ✅ passa |
| Produto | fraco (fundo) *(placeholder/legenda)* | `#8E8B85` / `#FAFAF8` | **3.25:1** | 4.5 | ❌ REPROVA |
| Produto | ACCENT como texto (fundo) | `#ff8903` / `#FAFAF8` | **2.28:1** | 4.5 | 🟠 exceção aceita |
| Produto | titulo/corpo (card) | `#1A1A1A` / `#FFFFFF` | **17.40:1** | 4.5 | ✅ passa |
| Produto | secundario (card) | `#5A5A57` / `#FFFFFF` | **6.92:1** | 4.5 | ✅ passa |
| Produto | fraco (card) *(placeholder/legenda)* | `#8E8B85` / `#FFFFFF` | **3.40:1** | 4.5 | ❌ REPROVA |
| Produto | ACCENT como texto (card) | `#ff8903` / `#FFFFFF` | **2.38:1** | 4.5 | 🟠 exceção aceita |
| Carrinho | titulo/corpo (card) | `#1A1A1A` / `#FFFFFF` | **17.40:1** | 4.5 | ✅ passa |
| Carrinho | secundario (card) | `#5A5A57` / `#FFFFFF` | **6.92:1** | 4.5 | ✅ passa |
| Carrinho | fraco (card) *(placeholder/legenda)* | `#8E8B85` / `#FFFFFF` | **3.40:1** | 4.5 | ❌ REPROVA |
| Carrinho | ACCENT como texto (card) | `#ff8903` / `#FFFFFF` | **2.38:1** | 4.5 | 🟠 exceção aceita |
| Carrinho | titulo/corpo (superficie) | `#1A1A1A` / `#F0EFEB` | **15.13:1** | 4.5 | ✅ passa |
| Carrinho | secundario (superficie) | `#5A5A57` / `#F0EFEB` | **6.01:1** | 4.5 | ✅ passa |
| Carrinho | fraco (superficie) *(placeholder/legenda)* | `#8E8B85` / `#F0EFEB` | **2.95:1** | 4.5 | ❌ REPROVA |
| Carrinho | ACCENT como texto (superficie) | `#ff8903` / `#F0EFEB` | **2.07:1** | 4.5 | 🟠 exceção aceita |
| Sobre | titulo/corpo (fundo) | `#1A1A1A` / `#FAFAF8` | **16.65:1** | 4.5 | ✅ passa |
| Sobre | secundario (fundo) | `#5A5A57` / `#FAFAF8` | **6.62:1** | 4.5 | ✅ passa |
| Sobre | fraco (fundo) *(placeholder/legenda)* | `#8E8B85` / `#FAFAF8` | **3.25:1** | 4.5 | ❌ REPROVA |
| Sobre | ACCENT como texto (fundo) | `#ff8903` / `#FAFAF8` | **2.28:1** | 4.5 | 🟠 exceção aceita |
| Sobre | titulo/corpo (card) | `#1A1A1A` / `#FFFFFF` | **17.40:1** | 4.5 | ✅ passa |
| Sobre | secundario (card) | `#5A5A57` / `#FFFFFF` | **6.92:1** | 4.5 | ✅ passa |
| Sobre | fraco (card) *(placeholder/legenda)* | `#8E8B85` / `#FFFFFF` | **3.40:1** | 4.5 | ❌ REPROVA |
| Sobre | ACCENT como texto (card) | `#ff8903` / `#FFFFFF` | **2.38:1** | 4.5 | 🟠 exceção aceita |
| Suporte | titulo/corpo (fundo) | `#1A1A1A` / `#FAFAF8` | **16.65:1** | 4.5 | ✅ passa |
| Suporte | secundario (fundo) | `#5A5A57` / `#FAFAF8` | **6.62:1** | 4.5 | ✅ passa |
| Suporte | fraco (fundo) *(placeholder/legenda)* | `#8E8B85` / `#FAFAF8` | **3.25:1** | 4.5 | ❌ REPROVA |
| Suporte | ACCENT como texto (fundo) | `#ff8903` / `#FAFAF8` | **2.28:1** | 4.5 | 🟠 exceção aceita |
| Suporte | titulo/corpo (card) | `#1A1A1A` / `#FFFFFF` | **17.40:1** | 4.5 | ✅ passa |
| Suporte | secundario (card) | `#5A5A57` / `#FFFFFF` | **6.92:1** | 4.5 | ✅ passa |
| Suporte | fraco (card) *(placeholder/legenda)* | `#8E8B85` / `#FFFFFF` | **3.40:1** | 4.5 | ❌ REPROVA |
| Suporte | ACCENT como texto (card) | `#ff8903` / `#FFFFFF` | **2.38:1** | 4.5 | 🟠 exceção aceita |
| Suporte | texto sobre accent | `#000000` / `#ff8903` | **8.83:1** | 4.5 | ✅ passa |
| Suporte | pill: rotulo accent s/ pill escuro | `#ff8903` / `#000000` | **8.83:1** | 4.5 | ✅ passa |
| Todas | anel de foco (carrossel/filtro) | `#ff8903` / `#FAFAF8` | **2.28:1** | 3.0 | 🟠 exceção aceita |
| Todas | borda-contorno botao (cupom/acessorio) | `#ff8903` / `#FFFFFF` | **2.38:1** | 3.0 | 🟠 exceção aceita |
| Todas | borda hamburguer color-mix 20.78% | `#f3dabb` / `#F0EFEB` | **1.17:1** | 3.0 | 🟠 exceção aceita |
| Todas | borda de card (decorativo) *(separador)* | `#E2E0DA` / `#FFFFFF` | **1.32:1** | — | ⬜ n/a |
| Todas | card sobre fundo (decorativo) *(separador)* | `#FFFFFF` / `#FAFAF8` | **1.05:1** | — | ⬜ n/a |
| Home | faixa creme sobre fundo (decorativo) *(separador)* | `#FDF1E3` / `#FAFAF8` | **1.07:1** | — | ⬜ n/a |

---

## 🔎 Achado da auditoria — `--cor-texto-fraco` em texto de corpo

**Este achado NÃO é coberto pela decisão do accent.** É um item separado, que a
Req 6.1 já previa e mandava tratar.

`--cor-texto-fraco` (`#8E8B85`) dá **3.25:1** sobre o fundo, **3.40:1** sobre
card, **2.95:1** sobre superfície e **2.84:1** sobre a base do creme. A Req 6.1
aceita esse valor **apenas para placeholder e legenda decorativa**, e determina:
*"IF ele for encontrado em texto informativo de corpo THEN aquele ponto SHALL
migrar para `--cor-texto-secundario`"* (6.62:1, passa AA).

A varredura encontrou **3 pontos que são texto informativo**, não legenda:

| Ponto | O que é | Contraste | Por que não é legenda |
|---|---|---|---|
| `components/sections/Footer/Footer.tsx:309` | `c.description` — descrição da marca no rodapé | 3.25:1 | parágrafo de conteúdo |
| `components/ui/PriceTag.tsx:120` | `installments` — "12x de R$ 9,70 sem juros" | 3.40:1 | **informação de compra** |
| `components/ui/PriceTag.tsx:123` | `cashNote` — "ou R$ 97 à vista" | 3.40:1 | **informação de compra** |

Há ainda o **link do rodapé em repouso** (`Footer.tsx:171`), que usa
`--cor-texto-fraco` como cor default: link é texto interativo e pede 4.5:1.

**Correção prevista pela Req 6.1:** trocar `var(--cor-texto-fraco)` por
`var(--cor-texto-secundario)` nesses pontos — 4 linhas, sobe para 6.62:1, e
**não toca no accent** (independente da decisão do dono do produto).

**Status: PENDENTE DE APROVAÇÃO.** Não aplicado, por alterar aparência num
momento em que o visual já foi validado. Os usos legítimos de
`--cor-texto-fraco` (rótulos de unidade do contador, placeholders, `oldPrice`
riscado) permanecem como estão.

---

## Estados não-felizes

| Estado | Como foi testado | Resultado |
|---|---|---|
| **Shopify fora** | token invalidado em `.env.local`, `rm -rf .next && npm run build` | ✅ build **não quebrou**; `/catalogo` serve o estado de erro amigável ("Não foi possível carregar os produtos.") **dentro do wrapper de paleta** — `--cor-fundo:#FAFAF8`, `--cor-texto:#1A1A1A` presentes. Texto em `--cor-texto`/`--cor-texto-secundario`, legível. |
| **Env restaurada** | `mv .env.local.bak .env.local` + rebuild | ✅ catálogo voltou a carregar, 7 produtos pré-renderizados. **Ambiente íntegro, sem resíduo de backup.** |
| **Catálogo vazio / filtro sem resultado** | build com Shopify fora (`generateStaticParams` → 0 paths) | ✅ herda a paleta; sem cor chumbada |
| **Carrinho vazio** | `CarrinhoDrawer` | ✅ usa `var(--cor-texto-secundario)` (6.92:1 sobre card) |
| **Esqueletos de carregamento** | inspeção do markup | ✅ derivados de `color-mix(var(--cor-texto) …)` — acompanham o tema |
| **`not-found`** | `/produtos/nao-existe-mesmo` → HTTP 404 | ⚠️ ver observação abaixo |

### Observação: o `not-found` não segue o tema (pré-existente)

O projeto **não tem `app/not-found.tsx`**, então o 404 cai no template padrão do
Next: sem navbar, sem rodapé e **sem o wrapper de paleta** (o HTML gerado não
contém nenhuma `--cor-*`). Ele traz o próprio CSS (`color:#000;background:#fff`)
mais um `@media (prefers-color-scheme: dark)` que o inverte conforme o SO.

**Não é regressão desta spec** — era igual no tema escuro. É legível nos dois
casos. Fica registrado como *follow-up opcional*: criar um `not-found.tsx` que
renderize dentro do `StoreShell` daria consistência visual ao 404.

---

## Exceções pré-registradas — confirmadas, não reabrir

| Item | Medido | Decisão |
|---|---|---|
| Accent como texto/foco (`#ff8903`) | 1.99–2.38:1 | decisão do dono do produto ([doc](./DECISAO-ACCENT-TEXTO.md)) |
| Borda de card sobre card | 1.32:1 | separador decorativo (Req 6.2) |
| Card sobre fundo | 1.05:1 | separador decorativo (Req 6.2) |
| Faixa creme sobre fundo | 1.07:1 | separa por **temperatura**, não luminância (Req 6.2) |
| `NavArrow` `textShadow rgba(0,0,0,.45)` | — | cosmético (Req 6.3), não bloqueante |
| `cardHoverGlass rgba(255,255,255,.06)` | — | efeito opcional (Req 6.4), degrada silencioso |
| Overlay de modal `rgba(0,0,0,.6)` | — | backdrop **deve** escurecer (Req 6.7) — verificado intacto |

### Ponto grave dentro da exceção do accent

A **borda do botão hambúrguer** (`Navbar.tsx:218`) é `color-mix(#ff8903 20.78%)`
sobre `#F0EFEB` → `#f3dabb`, **1.17:1**: o botão fica praticamente **sem contorno
visível** no mobile. É consequência da decisão do accent, mas tem conserto que a
**preserva**: subir a porcentagem do `color-mix` (20.78% → ~60%) devolve o
contorno mantendo o laranja vibrante. **Pendente de decisão.**
