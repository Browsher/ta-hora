# DECISÃO: accent vibrante como texto no tema claro

**Status:** vigente · decidida pelo dono do produto · **não reverter sem consultá-lo**

## O que foi decidido

No tema claro, `--cor-destaque-texto-forte` vale **`#ff8903`** (o laranja vibrante
da marca), e **não** o tom fechado `#995202` que a spec projetou.

Isso significa que os ~46 pontos onde o accent é **texto, ícone, glifo ou anel de
foco** renderizam em laranja vibrante sobre fundo claro.

## O trade-off, aceito conscientemente

`#ff8903` sobre `#FAFAF8` dá **2.28:1** — **reprova** o WCAG AA, que pede 4.5:1
para texto normal e 3:1 para indicador de foco. O tom `#995202` dava 5.64:1.

O dono do produto foi informado dos números **antes** de decidir e escolheu a
**identidade visual da marca** em vez da conformidade AA nesses pontos. É uma
decisão de produto legítima e explícita, não um descuido.

## Consequência para a auditoria (Bloco 7)

**A auditoria NÃO deve tratar estes pontos como reprovação a corrigir.** Ela deve:

1. **Registrar** os valores medidos, como exceção aceita — o registro é o que
   torna a decisão auditável depois.
2. **NÃO** reverter para `#995202`, nem "consertar" ponto a ponto.
3. Continuar cobrando AA de **todo o resto** — o texto de corpo (`#1A1A1A`,
   16.65:1), o secundário (`#5A5A57`, 6.62:1) e o texto sobre superfície accent
   (`#000000` sobre `#ff8903`, 8.83:1) seguem passando e **não** estão cobertos
   por esta exceção.

## Medições dos pontos afetados

| Contexto | Fundo | Contraste |
|---|---|---|
| Texto sobre o fundo da página | `#FAFAF8` | **2.28:1** |
| Texto sobre card | `#FFFFFF` | **2.38:1** |
| Texto sobre superfície (navbar) | `#F0EFEB` | **2.07:1** |
| Contador do CTAFinal — creme (topo) | `#FFF8EF` | **2.26:1** |
| Contador do CTAFinal — creme (base) | `#FBE8D2` | **1.99:1** |
| Anéis de foco (carrossel, filtro) | `#FAFAF8` | **2.28:1** |
| Bordas-contorno de botão (cupom, acessório) | `#FFFFFF` | **2.38:1** |

## Pontos em estado GRAVE (não só lavados) — sugeridos para revisão caso a caso

Estes cruzaram de "lavado" para **praticamente invisível**, e são de natureza
diferente do resto: não são texto que ficou fraco, são elementos que **somem**.

1. **Borda do botão hambúrguer** (`Navbar.tsx:218`) — `color-mix(#ff8903 20.78%)`
   sobre `#F0EFEB` resulta em `#f3dabb`, **1.17:1** contra o fundo. O botão fica
   **sem contorno visível** no mobile. Era o motivo de ele ser classificado TC.
   *Correção pontual possível sem mexer na variável: subir a porcentagem do
   `color-mix` (ex.: 20.78% → 60%), o que mantém o laranja vibrante e devolve o
   contorno.*
2. **Contador do CTAFinal sobre a base do creme** — **1.99:1**, o pior número do
   site, e fica na seção de fechamento de venda.

O restante da lista é **legível-porém-lavado**: baixo contraste, mas o elemento
continua perceptível.

## O que NÃO mudou

A estrutura T/TC/S/P dos Blocos 3–5 permanece **intacta**. Só o **valor** da
variável central mudou. Isso significa que voltar atrás é uma edição de **um
valor em quatro lugares** (os 3 JSONs + o `:root`), a qualquer momento, sem
tocar em nenhum dos 46 pontos.

Os pontos de **superfície** nunca dependeram desta variável e seguem corretos:
botões sólidos, badges sólidos, faixas, o pill do WhatsApp (accent vibrante sobre
pill escuro, **8.83:1**) e todo texto sobre accent (`#000000`, **8.83:1**).
