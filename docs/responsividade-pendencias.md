# Responsividade — pendências

**Regra do projeto:** a decisão mobile/desktop é `@media` pura, nunca JavaScript.
Está registrada em `app/globals.css` (bloco do carrossel) e no cabeçalho de
`components/ui/CarrosselMobile.tsx`. Este arquivo existe porque **a regra ainda não
vale em toda parte** — e para que quem for consertar saiba o que já foi decidido.

---

## ✅ Passo 1 — feito em 11/08/2026 (paliativo)

`lib/useIsMobile.ts` passou a ter padrão de SSR **mobile-first** (`padraoSSR = true`).

O hook não mede nada no servidor: a medição só acontece no `useEffect`, depois da
hidratação. O chute anterior era `false` (desktop), e no celular isso dava um flash
de ~1s da versão desktop antes da troca. Invertido porque isto é uma loja e o
tráfego é majoritariamente mobile.

**Isso não conserta o flash — move ele para o desktop**, onde é menor. É troca
consciente, e o conserto de verdade é o passo 2 abaixo.

**Exceção: a Navbar.** Continua em `useIsMobile(768, false)`. É a única seção cujos
dois ramos renderizam elementos diferentes (links de navegação vs. hambúrguer), então
o padrão de SSR ali tem consequência de SEO, não só de aparência. O motivo completo
está no cabeçalho de `lib/useIsMobile.ts` — ler antes de "uniformizar".

---

## ✅ Passo 2a — Hero convertido em 11/08/2026

O Hero saiu inteiro do JavaScript: os **10 valores** que dependiam de `isMobile`
viraram `@media` pura nas classes `.hero-*` de `app/globals.css`, e
`components/sections/Hero/Hero.tsx` **não importa mais `useIsMobile`**.

**Só o Hero.** As outras seis seções continuam no hook de propósito: estão abaixo da
dobra, e quando o visitante rola até lá o JS já carregou. O Hero era o único onde o
flash aparece antes de qualquer outra coisa.

**Custom property não foi necessária** — ao contrário do que esta pendência previa
para Footer e Testimonials, os dez valores do Hero eram literais estáticos. O único
com uma perna vinda do JSON é o `aspect-ratio` do carrossel, e lá o `heroWidth`
escolhe a **classe** (`.hero-palco--total`), não o valor.

**Provado pelo teste (a)**: compilando com `padraoSSR = true` e `padraoSSR = false`,
o bloco do Hero sai **byte a byte idêntico** na home e em `/sobre-nos`, enquanto
Features, HowItWorks, Testimonials, CTAFinal e Footer continuam mudando. O Hero
deixou de ter estado de hidratação capaz de alterar seu layout.

### ⚠️ O que NÃO foi resolvido — a animação de entrada

O Hero tem `"sectionEntry": "subir"` no `_home.json`, que é `staggerContainer` +
`itemVariants` (`hidden: { opacity: 0, y: 28 }`).

Medido no HTML gerado: **`opacity:0` aparece 0 vezes** no bloco do Hero — o
`staggerContainer.hidden` é `{}` e os filhos herdam o estado por propagação de
variante, sem estilo no SSR. O HTML pinta o Hero **visível**, e só depois da
hidratação o framer-motion aplica `hidden` e reproduz a entrada.

Ou seja, na home existem **três** eventos pós-hidratação sobrepostos no Hero:

1. ~~a troca de layout (`isMobile`)~~ — **eliminada pelo passo 2a**
2. o conteúdo sumindo e re-animando em cascata (`sectionEntry: "subir"`) — **continua**
3. o `<canvas>` do fundo `beam` começando a pintar — **continua**

Os três são mecanismos diferentes e foram deliberadamente **não** misturados nesta
rodada: com o layout fora da equação, dá para saber o que cada um custa. Se o que
sobrar ainda incomodar, o (2) se desliga trocando `sectionEntry` para `"nenhum"` no
Hero do `_home.json` — decisão do lojista, ainda em aberto.

---

## 🔧 Passo 2b — converter as seis seções restantes (pendente)

Aproximadamente **85% dos ~60 usos de `isMobile`** são puro estilo e não precisam de
JavaScript nenhum: `flexDirection`, `gap`, `padding`, `gridTemplateColumns`,
`minHeight`, `width`, `aspectRatio` e os `minmax()` das grades.

### O obstáculo

Tudo isso está em `style={{}}` **inline**, e **estilo inline não aceita `@media`**.
Não existe conversão local — tirar o `isMobile` de uma dessas linhas obriga a mover a
regra para CSS. É por isso que a pendência não é um `sed`.

Dois caminhos, os dois já em uso no projeto:

- **Classes em `app/globals.css`** — é o que a PDP e o catálogo já fazem
  (`.produto-grid`, `.catalogo-bloco`, `.ficha-cards`, `.barra-compra-mobile`), todas
  mobile-first com `@media (min-width: 768px)`.
- **Variantes responsivas do Tailwind** — funcionam aqui: `components/loja/CatalogGrid.tsx:25`
  usa `sm:grid-cols-3 lg:grid-cols-4` e gera certo. (A nota em `globals.css` sobre o
  Tailwind falhar é específica do `mx-auto`, não das variantes responsivas.)

**Complicação:** parte dos valores é interpolada a partir do JSON — o
`repeat(${columnCount}, 1fr)` do Footer, o `minmax(${isMobile ? "260px" : "280px"})`
do Testimonials. Esses não viram classe estática; precisam de custom property
(`style={{ "--cols": n }}` + a classe lendo `var(--cols)`), que é o padrão que o
`PreviewContent` já usa para `--cor-destaque`.

### Ordem sugerida — as duas de maior retorno primeiro

Medido no HTML gerado pelo build, contando marcadores do ramo desktop por seção:

| Prioridade | Seção | Marcadores desktop no HTML | Onde |
|---|---|---|---|
| **1º** | **Footer** | `flex-direction:row`, `gap:48`, `grid-template-columns:auto repeat(…)` | `Footer.tsx:269-270, 314-318, 377-382, 420-444` |
| **2º** | **HowItWorks** | `flex-direction:row` ×5, `gap:48` | `HowItWorks.tsx:170-172, 218, 299` |
| ~~3º~~ | ~~Hero~~ | ✅ **feito** — ver passo 2a | — |
| 4º | CTAFinal | `flex-direction:row` | `CTAFinal.tsx:173-175, 271-272, 325-329` |
| 5º | Features | `flex-direction:row` | `Features.tsx:280, 301, 333` |
| 6º | Testimonials | `gap:40` | `Testimonials.tsx:261-262, 305-315, 469-470` |

**Modelo a seguir:** a conversão do Hero (passo 2a) é o precedente — classes
`.hero-*` em `globals.css`, mobile-first com `@media (min-width: 768px)`, cada classe
carregando **só** as propriedades que eram responsivas e o resto seguindo inline.
Ver o bloco de comentário de `.hero-form` em `app/globals.css`.

**O Footer vem primeiro por dois motivos:** tem a maior concentração de ramos
desktop, e `components/loja/StoreShell.tsx:56` o renderiza também em `/catalogo` e na
PDP — então ele é a única seção desta lista que pisca em **todas** as páginas do
site, não só nas montadas por layout JSON.

**Seções já corretas, use como modelo:** `VitrineHome` e `FAQ` têm **zero**
ocorrências de `isMobile`. A VitrineHome faz o carrossel de mobile inteiro por
`@media` (`.carrossel__faixa` em `globals.css`).

### O que NÃO converter — precisa mesmo de JS

- `Navbar.tsx:87` — `if (!isMobile) setMenuOpen(false)`, limpeza de estado no resize.
  Comportamento puro, não afeta a primeira pintura, **não causa flash**. Deixar.
- `Testimonials.tsx:370` — `VISIBLE = Math.min(isMobile ? 1 : 2, …)` alimenta
  aritmética de índice e autoplay. CSS não calcula janela de carrossel.
- `CTAFinal.tsx:81` — `digitSize = isMobile ? 40 : 56`, que vira
  `paddingBottom: digitSize * 0.28`. Dá para fazer com custom property + `calc()`,
  mas é o mais chato dos três e o de menor retorno.

### Categoria B — renderização condicional (conversível, trabalho diferente)

Não é troca de estilo, é troca de elemento. O padrão já existe no projeto: renderizar
os dois no HTML e deixar o `@media` revelar um — é o que `.barra-compra-mobile` e
`.carrossel__setas` fazem em `globals.css`.

- `Navbar.tsx:173/200/209/235` — links de desktop, hambúrguer, dropdown.
  **É isto que destrava a Navbar para entrar na inversão do passo 1.**
- `HowItWorks.tsx:218` — linha conectora entre passos.
- `HowItWorks.tsx:299` — `isReversed` (alternância), que é `row-reverse` em CSS.

---

## ⚠️ Ao mexer no `useIsMobile`

O estado inicial tem de ser o **mesmo** no servidor e no primeiro render do cliente.
Hoje é uma constante (`padraoSSR`), e por isso o código é **livre de erro de
hidratação por construção** — o flash é só um re-render, não um mismatch.

Quem "consertar" lendo `window.innerWidth` no inicializador do `useState` troca o
flash por um mismatch de hidratação de verdade. Não fazer isso.
