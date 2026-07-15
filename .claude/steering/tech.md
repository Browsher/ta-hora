# Tech — Ta Hora

## Stack

| Camada        | Escolha                                            |
|---------------|----------------------------------------------------|
| Framework     | **Next.js 16.2.9** (App Router)                    |
| Build (atual) | **Static export** — `output: "export"`, `images.unoptimized: true` → gera `out/` |
| Build (loja)  | **Runtime SSR/ISR** na Vercel — a feature de loja headless SAI do static export (ver "Modelo de build" abaixo) |
| Host          | **Vercel** (suporta o runtime/ISR que a loja precisa)  |
| UI            | **React 19.2**                                     |
| Linguagem     | **TypeScript 5** em `strict` mode (`noEmit`)       |
| Estilo        | **Tailwind CSS v4** (`@tailwindcss/postcss`) + `clsx` + `tailwind-merge` |
| Animação      | **Framer Motion 12**                               |
| Ícones        | **lucide-react**                                   |
| Alias         | `@/*` → raiz do projeto (`tsconfig.json`)          |

## Comandos

```bash
npm install
npm run dev     # desenvolvimento local
npm run build   # gera out/ (site estático) — deploy em qualquer host estático
```

## Modelo de build — atual vs. loja (LEIA ANTES DE PLANEJAR)

O modelo de build é **transitório**. Não trate "tudo estático" como restrição
global do projeto — ela vale para o CONTEÚDO ATUAL, não para a loja.

- **Estado ATUAL (estático):** Home + Sobre Nós são conteúdo dirigido por JSON,
  sem dados frescos nem interação de servidor. Roda como **static export**
  (`output: "export"`) e é deployável em qualquer host estático.
- **Feature de LOJA HEADLESS (runtime):** catálogo de produtos + carrinho +
  dados da **Shopify** exigem **RUNTIME** — o site **deixa de ser static export**.
  Motivo: carrinho e preço/estoque frescos da Shopify **não funcionam** em export
  estático (precisam de fetch server-side, revalidação e/ou rotas de API).
  - **Alvo:** **Next.js com SSR/ISR** (Server Components fazendo fetch da Shopify
    Storefront API, ISR para revalidar catálogo, Route Handlers/Server Actions
    para o carrinho), **hospedado na Vercel**.
  - **Implicação de migração:** ao implementar a loja, **remover
    `output: "export"`** de `next.config.ts` (e provavelmente reavaliar
    `images.unoptimized`). Isso é esperado — não é regressão.
- **Regra prática:** NÃO restrinja features de loja a "client-side/estático". Essa
  antiga restrição (abaixo) descreve só o pipeline do conteúdo atual.

## Restrições do CONTEÚDO ATUAL (não da loja)

- **Export estático (só enquanto o build for `output: "export"`):** sem código de
  servidor, sem Route Handlers, sem `next/image` otimizado em runtime (imagens
  `unoptimized`). Vale para Home/Sobre Nós hoje; **cai quando a loja migrar pra
  runtime**.
- **Imports estáticos obrigatórios:** o Turbopack exige caminhos de import
  analisáveis estaticamente. Ao aprovar um **novo componente de seção**, adicione
  o import estático E o registro no `componentMap` em
  `components/preview/PreviewContent.tsx` **manualmente** (não há import dinâmico).
- **`"use client"`** nos componentes que usam hooks/efeitos (seções, providers de
  efeito). As `page.tsx` em `app/` são Server Components que só importam o JSON e
  o `PreviewContent`.

## Sistema de tema (Paleta)

- Uma **`Paleta` de 9 cores** (`lib/paleta.ts`) é injetada como CSS custom
  properties `--cor-*` num **wrapper da página**, NUNCA no `:root`. O `:root`
  (`app/globals.css`) é o fallback de fábrica.
- Fonte da verdade: `globalSettings.paleta` (as 9 cores carimbadas no layout).
  Fallback: `globalSettings.estilo` (nome) → `getPaleta()` em `lib/estilos.ts` →
  `PALETA_ATIVA` (null = fábrica).
- Estilos nomeados disponíveis: elegante, minimalista, neon, retro, industrial,
  natural, moderno, maximalista.
- O `card` guarda a **cor base**; o gradiente é **derivado na renderização**
  (`cardGradient`), nunca salvo montado.

## Sistema de efeitos

- Efeitos por seção em `section.effects` (`SectionEffects`), globais em
  `globalSettings.effects` (`GlobalEffectsSettings`: parallax, cursor,
  smoothScroll). Contextos em `lib/*Context.ts`, helpers em
  `lib/sectionEffectHelpers.ts`.
- **Acessibilidade:** `MotionConfig reducedMotion="user"` envolve todo o site.
- **Primeira dobra:** as animações de *entrada* da primeira seção de conteúdo são
  desativadas (`disableEntry`) para evitar a race de hidratação SSR do Framer
  Motion (seção ficava invisível). Não remova essa lógica sem entender o motivo.

## Compatibilidade retroativa (não quebrar)

- Tipos `@deprecated` em `lib/types.ts` são **mantidos de propósito** para JSONs
  antigos. Não os remova.
- `migrateBackground()` normaliza formatos legados de background. Novos campos do
  `Layout` (multipágina: `kind`, `siteId`, `slug`, `isHome`, `order`) são todos
  **opcionais** — JSONs sem eles continuam válidos.

## Qualidade / Definition of Done

Combinado com o usuário: **Build + verificação manual**.

1. `npm run build` deve **passar sem erros de TypeScript** (build estático hoje;
   build de runtime/SSR/ISR quando a loja migrar).
2. Verificar visualmente em `npm run dev` antes de considerar a tarefa concluída.
3. **Sem suíte de testes formal** ainda — não adicionar infraestrutura de testes
   a menos que seja pedido. Manter simples.
