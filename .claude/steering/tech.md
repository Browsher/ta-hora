# Tech — Ta Hora

## Stack

| Camada        | Escolha                                            |
|---------------|----------------------------------------------------|
| Framework     | **Next.js 16.2.9** (App Router)                    |
| Build         | **Runtime SSR/ISR** — `next build` (NÃO gera `out/`) |
| Host          | **Vercel** (runtime/ISR)                            |
| Dados da loja | **Shopify Storefront API (GraphQL)**, versão **2026-01** (`DEFAULT_API_VERSION` em `lib/shopify/client.ts`; sobrescrevível por `SHOPIFY_STOREFRONT_API_VERSION`) |
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
npm run build   # build de runtime (SSR/ISR) — não gera out/
npm start       # roda o build de produção localmente
```

## Modelo de build (LEIA ANTES DE PLANEJAR)

**O projeto NÃO é static export.** `output: "export"` foi removido de
`next.config.ts` pela spec `catalogo-loja` — a loja precisa de dados frescos da
Shopify, o que exige runtime. Não re-adicione: isso quebraria catálogo e
carrinho.

O build de runtime **não** significa "tudo dinâmico". Hoje convivem três regimes,
e a distinção importa:

| Rota | Regime | Origem do regime |
|---|---|---|
| `/` (Home), `/sobre-nos` | **`○` Static (SSG)** — pré-renderizadas, sem Shopify | conteúdo dirigido por JSON, sem API dinâmica de servidor |
| `/catalogo` | **ISR 300s** | `export const revalidate = 300` em `app/catalogo/page.tsx` |
| `/produtos/[handle]` | **ISR 300s** + `dynamicParams` | `export const revalidate = 300` em `app/produtos/[handle]/page.tsx` |

> **O ISR vem do route segment, não do `fetch`.** `storefrontFetch`
> (`lib/shopify/client.ts`) passa `next: { revalidate }`, mas **isso é inerte**:
> a partir do Next 15 o `fetch` **não é mais cacheado por default** — é preciso
> `cache: "force-cache"` para optar. Como `storefrontFetch` faz POST e nunca
> passa `force-cache`, nada ali é cacheado. Quem produz o ISR do catálogo é o
> `export const revalidate = 300` das páginas. Não remova esses exports
> acreditando que o `client.ts` cobre.
>
> **Nunca adicione `export const fetchCache = "default-cache"`** (nem
> `cache: "force-cache"` em chamadas de carrinho): a doc do Next é explícita que
> `force-cache` cacheia **inclusive POST e requests com `cookie`/`authorization`**
> — o carrinho de um visitante poderia ser servido a outro.

### Home estática: o que é regra e o que NÃO é

A regra é **não mudar de regime por acidente**, não "a Home é estática para
sempre".

- **Proibido — mudança acidental:** basta qualquer coisa em `app/layout.tsx` ou
  nas `page.tsx` da Home/Sobre Nós ler `cookies()` / `headers()` para elas
  virarem `ƒ` (dynamic) — **sem erro visível**, só some o `○` da saída do build.
  Por isso estado **por-visitante** (ex.: contador do carrinho) é obtido **após a
  montagem no cliente**, nunca no render do servidor. Uma feature que não é sobre
  dados frescos não tem motivo para mudar o regime da Home; se mudar, é vazamento.
- **Permitido — mudança deliberada:** uma feature que **precisa** de dados
  frescos da Shopify na Home pode movê-la de SSG para **ISR**, de propósito,
  declarando `export const revalidate` na rota. Isso é uma decisão de spec, não
  um bug.

> **Já planejado:** a frente do **`ProductGrid` da Home por tag** (produtos em
> destaque vindos da Shopify) **vai** tirar a Home de SSG puro e colocá-la em
> **ISR**. É intencional e esperado. Quando isso acontecer, a tabela acima muda —
> e a verificação "`/` é `○ (Static)`" da spec `carrinho-loja` deixa de valer,
> substituída por "`/` é ISR". **Não trate essa verificação como proibição
> permanente**: ela existe para pegar o carrinho tornando a Home dinâmica sem
> querer.

Regra prática ao ler um `○` que virou `ƒ`/ISR: pergunte **qual spec mudou isso e
se ela quis**. Carrinho mexendo no regime da Home = bug. `ProductGrid` por tag
mexendo = a feature.

## Restrições do conteúdo dirigido por JSON

Valem para as seções/páginas do Builder (Home, Sobre Nós) — **não** para a loja:

- **Imports estáticos obrigatórios:** o Turbopack exige caminhos de import
  analisáveis estaticamente. Ao aprovar um **novo componente de seção**, adicione
  o import estático E o registro no `componentMap` em
  `components/preview/PreviewContent.tsx` **manualmente** (não há import dinâmico).
- **`"use client"`** nos componentes que usam hooks/efeitos (seções, providers de
  efeito). As `page.tsx` da Home e do Sobre Nós são Server Components que só
  importam o JSON e o `PreviewContent`.

> **Histórico:** até a spec `catalogo-loja` o projeto era static export
> (`output: "export"`), e daí vinha a restrição "sem código de servidor, sem
> Route Handlers". **Essa restrição caiu.** Server Components com fetch, Route
> Handlers e Server Actions são permitidos e já são usados pela loja.

## Segurança do token da Shopify

- O token vive **só** em `process.env` (`SHOPIFY_STOREFRONT_TOKEN`), lido
  **apenas no servidor**. **Nunca** com prefixo `NEXT_PUBLIC_`.
- Os módulos que tocam o token têm `import "server-only"` (`lib/shopify/client.ts`,
  `queries.ts`, `products.ts`) — o build **falha** se um componente de cliente os
  importar. Componentes de cliente importam apenas **tipos** (`import type`).
- Nenhuma mensagem de erro interpola o token.
- Critério provado em `catalogo-loja`: após o build, buscar o token e o domínio
  em `.next/static` → **0 ocorrências**.
- O build **deve passar sem `.env.local`** (as rotas da loja degradam para estado
  de erro amigável em runtime; o build nunca quebra por env ausente).

## Sistema de tema (Paleta)

- Uma **`Paleta` de 9 cores** (`lib/paleta.ts`) é injetada como CSS custom
  properties `--cor-*` num **wrapper da página**, NUNCA no `:root`. O `:root`
  (`app/globals.css`) é o fallback de fábrica.
- **Só existem dois wrappers:** `components/preview/PreviewContent.tsx` (Home,
  Sobre Nós) e `components/loja/StoreShell.tsx` (rotas da loja). **Componente
  montado fora dos dois — ex.: em `app/layout.tsx` — herda a paleta de FÁBRICA**
  (`--cor-destaque` dourado `#D4A017`), não a do site (laranja `#ff8903`), e
  precisa aplicar `paletaWrapperStyle()` por conta própria.
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
- **Acessibilidade — `MotionConfig reducedMotion="user"` NÃO envolve o site
  inteiro.** Ele existe em **um único lugar**: `components/preview/PreviewContent.tsx`
  (envolve Home e Sobre Nós). **`app/layout.tsx` e `StoreShell` NÃO são cobertos.**
  Todo componente com Framer Motion montado fora do `PreviewContent` precisa do
  **seu próprio** `MotionConfig reducedMotion="user"` (ou `useReducedMotion()`),
  senão ignora `prefers-reduced-motion`.
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

1. `npm run build` deve **passar sem erros de TypeScript**, e `npx tsc --noEmit`
   ficar limpo.
2. Conferir na **saída do build** que `/` e `/sobre-nos` seguem `○ (Static)` e
   que `/catalogo` e `/produtos/[handle]` seguem com ISR — regressão aqui é
   silenciosa.
3. `npm run build` **sem `.env.local`** deve continuar passando.
4. Verificar visualmente em `npm run dev` antes de considerar a tarefa concluída.
5. **Sem suíte de testes formal** ainda — não adicionar infraestrutura de testes
   a menos que seja pedido. Manter simples. A rede de segurança é **estrutural**:
   tipos, `server-only` e checks dedicados.
