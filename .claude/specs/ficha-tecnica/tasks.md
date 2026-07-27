# Implementation Plan — Ficha Técnica (Especificações do produto)

## Task Overview
Execução **server-first e aditiva**, na ordem: fundação de dados (mapa único →
tipo → normalização → query já pronta) → salvaguarda das 21 chaves na loja → UI
(ícones → seção → CSS) → fiação da página → auditoria de aceite (os 4 focos). Cada
tarefa toca 1–3 arquivos e tem um resultado verificável. Nada quebra a página de
produto: o `Spec.key` é aditivo, `normalizeProductCard` (catálogo/acessórios/
recomendados) fica **intocado**, e a **string da query não muda** (só cresce o
array de `identifiers`, que vai por variável).

## Steering Document Compliance
- **structure.md:** dados em `lib/shopify/` (fonte única em `specs.ts`), ícone
  (React) isolado na UI `components/loja/fichaTecnicaIcones.ts` (padrão `ROTULO_MARCA`),
  UI em `components/loja/`, CSS de layout em `app/globals.css` (precedente
  `.recomendados-*`), salvaguarda em `scripts/verificar-*.mjs`. pt-BR em nomes/comentários.
- **tech.md:** token `server-only` intocado; `FichaTecnica` é Server Component (sem
  `"use client"`); `/produtos/[handle]` segue ISR 300s; Home/`sobre-nos` seguem
  `○ Static`; valores das specs são texto cru da Shopify (UI não interpreta); check
  de dados **fora** do `npm run build` (que passa sem `.env.local`).

## Atomic Task Requirements
Cada tarefa: 1–3 arquivos, 15–30 min, um resultado testável, caminhos exatos,
referências a requisitos e a código a reusar.

---

## Bloco 1 — Fundação de dados (servidor, aditivo)

- [ ] 1. Corrigir e expandir o mapa de specs em `lib/shopify/specs.ts`
  - File: `lib/shopify/specs.ts` (reescrever o conteúdo de specs — substitui os 3 placeholders)
  - Adicionar `export type SpecTier = "principal" | "secundaria"` e estender
    `SpecMetafield` com `tier: SpecTier` (mantendo `namespace`, `key`, `label`)
  - Substituir `SPEC_METAFIELDS` (namespace `"specs"` → **`custom`**) pelas **21 specs
    reais**, NA ORDEM DE EXIBIÇÃO do design (9 principais primeiro, depois 12
    secundárias): `tipo_de_resolucao`, `visao_noturna`, `com_visao_noturna_colorida`,
    `resistente_a_agua`, `audio_bidirecional`, `com_sensor_de_movimento`,
    `conectividade`, `com_alarme`, `marca` (label "Aplicativo") → **principal**;
    `qualidade_de_resolucao` (label "Resolução detalhada"), `campo_visual`, `zoom`,
    `tipo_de_movimento`, `notorizada` (label "Motorizada"), `diametro_da_lente_da_camera`,
    `temperatura_maxima_suportada`, `temperatura_minima_suportada`, `lugares_de_montagem`
    (label "Locais de uso"), `modelo`, `linha`, `cor` → **secundaria**
  - Comentar: (i) a **chave reflete o nome ANTIGO** (rename preserva a key) —
    `custom.marca`→"Aplicativo", `custom.notorizada`→"Motorizada"; NUNCA "consertar"
    a key pelo rótulo (sumiria em silêncio); (ii) rótulo desacoplado da key; (iii)
    ordem do array = ordem de exibição; (iv) as 21 confirmadas 7/7 na loja
  - Purpose: fonte única dos DADOS (dirige query + normalização + ordem/tier da UI)
  - _Requirements: 5.4, 6.1, 6.3, 6.4, 6.5, 2.5, 3.4_
  - _Leverage: lib/shopify/specs.ts (SpecMetafield, SPEC_METAFIELDS), lib/shopify/tags.ts (ROTULO_MARCA — padrão rótulo≠key)_

- [ ] 2. Estender o contrato `Spec` em `lib/shopify/types.ts`
  - File: `lib/shopify/types.ts` (modificar a interface `Spec`)
  - Adicionar `key: string` a `Spec` (fica `{ key, label, value }`)
  - Comentar: `key` permite a UI juntar cada spec ao mapa (tier/ícone/ordem);
    aditivo — `ProductSpecs` (órfão) e demais consumidores seguem compilando
  - Purpose: contrato que a UI usa para agrupar por tier e anexar ícone
  - _Requirements: 5.5, 6.4_
  - _Leverage: lib/shopify/types.ts (Spec, Product.specs)_

- [ ] 3. Incluir `key` na normalização em `lib/shopify/normalize.ts`
  - File: `lib/shopify/normalize.ts` (modificar SÓ o `.map` de `specs` em `normalizeProduct`)
  - No objeto retornado por spec presente, adicionar `key: def.key` (fica
    `{ key: def.key, label: def.label, value: mf.value }`)
  - **Preservar** a omissão de ausentes (`if (!mf || !mf.value) return null`) — é o
    "some se vazio" por spec (Req 4.1)
  - Comentar: mudança mínima; a lógica de omissão já existia
  - Purpose: entregar `Spec` com `key` sem tocar no resto
  - _Requirements: 4.1, 5.5_
  - _Leverage: lib/shopify/normalize.ts (normalizeProduct, SPEC_METAFIELDS)_

- [ ] 4. Confirmar a query no Dev MCP (sem mudança de string)
  - File: `lib/shopify/queries.ts` (SEM edição — só verificação)
  - Confirmar que `PRODUCT_BY_HANDLE_QUERY` já usa `metafields(identifiers: $identifiers)`
    e que `SPEC_METAFIELD_IDENTIFIERS = SPEC_METAFIELDS.map(({namespace,key})=>({namespace,key}))`
    passa automaticamente as 21 (nenhuma edição de query necessária)
  - **Validar a query via Dev MCP `validate_graphql_codeblocks` (storefront-graphql,
    2026-01)** e confirmar que 21 identifiers < 250 (teto da API)
  - Comentar (se necessário, 1 linha em specs.ts/queries.ts): 21 identifiers, 1
    requisição, sem N+1
  - Purpose: garantir que a expansão de dados não estoura limite nem muda a query
  - _Requirements: 5.1, 5.2, 5.3_
  - _Leverage: lib/shopify/queries.ts (PRODUCT_BY_HANDLE_QUERY, SPEC_METAFIELD_IDENTIFIERS)_

---

## Bloco 2 — Salvaguarda dos dados na loja (item (a) da auditoria)

- [ ] 5. Criar `scripts/verificar-especificacoes.mjs` + npm script `verificar:especificacoes`
  - Files: `scripts/verificar-especificacoes.mjs` (novo), `package.json` (adicionar script)
  - Modelar LINHA A LINHA em `scripts/verificar-resumo.mjs`: Node puro (não importa
    `lib/shopify/`), lê `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_STOREFRONT_TOKEN`, versão
    default `2026-01` duplicada com comentário "mude nos dois lugares", pagina
    `products`, mensagem de erro SEM token, `process.exitCode` (NUNCA `process.exit()`)
  - As **21 chaves** vivem no script (duplicadas de `specs.ts`, com comentário
    "mude nos dois lugares"); query pede `metafields(identifiers:[...21...]){ key value }`
  - Saída: por câmera, quantas das 21 têm valor; agregado por chave (quantas das 7
    câmeras têm cada spec); **exit 1 se ALGUMA chave der 0/7 em TODAS as câmeras**
    (chave divergente — a lição do rename), exit 0 caso contrário
  - `package.json`: `"verificar:especificacoes": "node --env-file=.env.local scripts/verificar-especificacoes.mjs"`
  - Purpose: travar as 21 chaves nos DADOS reais (rename preserva key — divergência silenciosa)
  - _Requirements: 5.4, NFR Reliability_
  - _Leverage: scripts/verificar-resumo.mjs (padrão completo), package.json (scripts verificar:*)_

---

## Bloco 3 — UI da ficha

- [ ] 6. Criar o mapa de ícones em `components/loja/fichaTecnicaIcones.ts`
  - File: `components/loja/fichaTecnicaIcones.ts` (novo)
  - `import type { LucideIcon }` + named imports dos 9 ícones: `Video, Moon, MoonStar,
    Droplets, Mic, PersonStanding, Wifi, Siren, Smartphone` e `Info` (fallback)
  - `export const ICONE_FALLBACK: LucideIcon = Info`
  - `export const ICONES_SPEC: Record<string, LucideIcon>` mapeando as **9 chaves
    principais** → ícone (ver mapa do design; `marca → Smartphone` com comentário do rename)
  - Comentar: lucide vive AQUI (UI), fora de `specs.ts` (data layer React-free),
    unido por `key` — padrão `ROTULO_MARCA`
  - Purpose: fonte única do ícone por spec, isolada da camada de dados
  - _Requirements: 2.2, 6.1 (intenção), 6.2, 7.2, 7.3_
  - _Leverage: lucide-react (^1.21.0; named imports como em AcessoriosSugeridos/CarrinhoDrawer)_

- [ ] 7. Criar `FichaTecnica` (Server Component) em `components/loja/FichaTecnica.tsx`
  - File: `components/loja/FichaTecnica.tsx` (novo — SEM `"use client"`)
  - Props `{ specs: Spec[] }` (`import type { Spec }`); importar `SPEC_METAFIELDS` de
    `@/lib/shopify/specs` e `ICONES_SPEC`/`ICONE_FALLBACK` de `./fichaTecnicaIcones`
  - `specs.length === 0` → `return null` (Req 4.2). Montar `valor = new Map(key→value)`;
    `presentes = SPEC_METAFIELDS.filter(d => valor.has(d.key))` (ORDEM e TIER do mapa);
    separar `principais`/`secundarias` por `tier`; guarda defensiva final `return null`
  - Render: `<section className="ficha-tecnica" aria-label="Especificações técnicas">`
    + `<Heading as="h2" size="grande" text="Especificações técnicas" color="var(--cor-texto)"
    accentColor="var(--cor-destaque)" />`; **grade só se principais.length>0** (cards:
    `<Icone aria-hidden size={28} className="ficha-card__icone"/>` + label + valor);
    **"Mais detalhes" só se secundarias.length>0** (`<dl>` com `dt`/`dd`, `Fragment key`)
  - Comentar: guardas de subseção (Req 2.6/3.5); ícones decorativos (`aria-hidden`)
  - Purpose: a seção de dois níveis, server-side, com todas as regras de omissão
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.4, 2.6, 3.1, 3.2, 3.3, 3.5, 4.2, 4.3, 5.6, 7.1, 7.4_
  - _Leverage: components/loja/RecomendadosRelacionados.tsx (padrão seção-irmã), components/ui/Heading; specs.ts (Tarefa 1), fichaTecnicaIcones.ts (Tarefa 6)_

- [ ] 8. Adicionar as classes de layout da ficha em `app/globals.css`
  - File: `app/globals.css` (modificar — adicionar junto às classes da loja)
  - `.ficha-tecnica` (largura total centralizada, `max-width:1200px`, `margin-inline:auto`,
    padding lateral responsivo — espelha `.recomendados-secao`; `> h2` centralizado)
  - `.ficha-cards` (grid `repeat(auto-fit, minmax(200px,1fr))` → ~3 col desktop, 1–2
    mobile; gap; **sem scroll horizontal**); `.ficha-card` (coluna ícone→label→valor;
    `background:var(--cor-card)`; borda `color-mix(in srgb, var(--cor-destaque) 14%,
    transparent)`; radius 16; padding); `.ficha-card__icone` (`color:var(--cor-destaque)`);
    `.ficha-card__label` (`--cor-texto-secundario`, menor); `.ficha-card__valor`
    (`--cor-texto`, peso maior)
  - `.ficha-detalhes` + `__titulo` ("Mais detalhes") + `__lista` (`<dl>` 2 col desktop /
    1 mobile; texto menor/apagado `--cor-texto-fraco`; `dt` peso 600, `dd` normal)
  - Purpose: cards e lista na paleta do site, responsivos, sem scroll horizontal
  - _Requirements: 1.2, 2.1, 2.3, 3.1_
  - _Leverage: app/globals.css (.recomendados-secao/.recomendados-grade — precedente), lib/paleta (--cor-*)_

---

## Bloco 4 — Fiação da página

- [ ] 9. Fiar `FichaTecnica` na rota `app/produtos/[handle]/page.tsx`
  - File: `app/produtos/[handle]/page.tsx` (modificar — 1 import + 1 linha de render)
  - `import { FichaTecnica } from "@/components/loja/FichaTecnica"`
  - Renderizar `<FichaTecnica specs={produto.specs} />` **entre** o `</article>` e
    `<RecomendadosRelacionados produtos={recomendados} />` (irmã de ambos — Req 1.1/1.4)
  - Manter intactos: `revalidate=300`, `dynamicParams`, `try/catch`, `notFound()`,
    galeria, `PriceTag`, `BotaoAdicionar`, sticky, descrição, recomendados
  - Purpose: publicar a ficha sem tocar no layout/regime/erro da rota
  - _Requirements: 1.1, 1.4, 8.1, 8.2, 8.5_
  - _Leverage: app/produtos/[handle]/page.tsx (estrutura atual), components/loja/FichaTecnica.tsx (Tarefa 7)_

---

## Bloco 5 — Auditoria de aceite (os 4 focos) + Definition of Done

> Gate de "pronto", não etapa opcional. Executar após o Bloco 4. (a) usa o script
> novo; (b)/(c)/(d) são build + verificação manual. Nada disto entra no
> `npm run build` (que passa sem `.env.local`).

- [ ] 10. Auditoria (a) — as 21 chaves confirmadas na loja real
  - Rodar `npm run verificar:especificacoes` e conferir: nenhuma chave 0/7 (esperado
    7/7 hoje); zero em alguma → investigar rename/grafia antes de seguir
  - Purpose: garantir que nenhuma spec some em silêncio por chave divergente
  - _Requirements: 5.4_
  - _Leverage: scripts/verificar-especificacoes.mjs (Tarefa 5)_

- [ ] 11. Auditoria (b) — "some se vazio" e guardas de subseção
  - Em `npm run dev`, abrir uma página de produto: cards principais (ícone dourado) +
    "Mais detalhes"; NENHUM card/linha vazio ou "—"; ordem = ordem do mapa
  - Exercitar as guardas (mentalmente/à mão sobre `FichaTecnica`): 0 specs → seção some;
    só principais → sem "Mais detalhes"; só secundárias → sem grade
  - Purpose: regras de omissão previsíveis, sem resíduo visual
  - _Requirements: 4.1, 4.2, 2.6, 3.2, 3.5_
  - _Leverage: components/loja/FichaTecnica.tsx_

- [ ] 12. Auditoria (c) — SEO/server-side (ficha no HTML bruto, sem "use client")
  - `npm run build && npm start`; `curl -s .../produtos/<handle>` (ou View Source):
    os rótulos + valores das specs aparecem no HTML BRUTO, antes de qualquer JS
  - Confirmar que `FichaTecnica.tsx` e `fichaTecnicaIcones.ts` **não** têm `"use client"`
    (grep) — Server Component; ícones lucide como SVG server-rendered
  - Purpose: ficha indexável, renderizada no servidor
  - _Requirements: 7.1, 7.2, 7.4_
  - _Leverage: app/produtos/[handle]/page.tsx, FichaTecnica.tsx_

- [ ] 13. Auditoria (d) + DoD — não-regressão e regime de render
  - `npx tsc --noEmit` limpo; `npm run build` OK e a saída mostra `/` e `/sobre-nos`
    `○ (Static)`, `/catalogo` e `/produtos/[handle]` ISR (regime intacto)
  - `npm run build` **sem `.env.local`** conclui; grep do token/domínio em
    `.next/static` → 0 ocorrências
  - Na página de produto: sticky da coluna esquerda, `BotaoAdicionar` + acessórios,
    descrição e `RecomendadosRelacionados` **abaixo** da ficha — todos intactos;
    abrir `/catalogo` e um relacionado → catálogo/recomendados/acessórios OK
  - Purpose: nenhuma regressão silenciosa (build, regime, downstream, segredo)
  - _Requirements: 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, NFR Security_
  - _Leverage: lib/shopify/normalize.ts (normalizeProductCard intocado), app/produtos/[handle]/page.tsx, tech.md (DoD)_
