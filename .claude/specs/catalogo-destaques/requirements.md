# Requirements Document

## Introduction

Os blocos do `/catalogo` (feature `catalogo-consultivo`) hoje mostram **imagem →
selo de marca → nome → resumo → preço → "Ver detalhes"**. O cliente lê o resumo
consultivo, mas **não consegue comparar** duas câmeras de relance: qual é a mais
barata, qual grava em 4K, qual tem alarme sonoro. Ele precisa abrir cada página
de produto para descobrir.

Esta feature adiciona ao bloco duas coisas, ambas **decididas no servidor** e
presentes no HTML do ISR (portanto indexáveis):

1. **Tarja de posicionamento** — o texto de `custom.selo` ("Menor preço", "Mais
   completa", "Visão mais ampla"…), a recomendação editorial do lojista. Só
   texto, sem ícone.
2. **Linha de destaques de spec** — ícone + valor, **condicional**: a resolução
   aparece sempre que houver dado; lentes e alarme só aparecem quando são um
   **diferencial** (lente dupla/tripla, alarme sonoro). Câmera sem diferencial
   mostra só a resolução — nunca um ícone vazio ou um "não tem".

O princípio é o mesmo do resumo consultivo: **o bloco responde antes do clique**.
A diferença é que aqui a resposta é comparável de relance entre blocos vizinhos.

### Dados confirmados na loja (sondagem ao vivo, coleção `cameras`, 7/7 câmeras)

Feito antes de escrever esta spec, contra a Storefront API 2026-01 — a lição do
`eseecloud`/`custom.resumo`: o Dev MCP valida o **schema**, só a loja diz o
**valor**. Todos os 4 metafields são `single_line_text_field`, 7/7 preenchidos:

| Chave | Valores reais distintos |
|---|---|
| `custom.selo` | "Mais vendida", "Menor preço", "Mais custo-benefício", "Maior praticidade", "Mais completa", "Melhor para área externa", "Visão mais ampla" — 7 valores distintos, 1 por câmera |
| `custom.numero_de_lentes` | "Lente única" (P9, Lâmpada), "Lente dupla" (A31H, Q6, A38, Q8), "Lente tripla" (S8) |
| `custom.tipo_de_resolucao` | "HD" (P9, Lâmpada), "Full HD" (A31H, Q6, Q8), "4K Ultra HD" (A38), "3K Vertical" (S8) |
| `custom.com_alarme` | "Alarme sonoro" (A38, Q8), "Noticação" (P9, Q6, Lâmpada, S8), "Aplicativo" (A31H) |

**Três correções ao briefing, medidas nos dados** (não são objeções, são o que a
regra tem de casar):

- **Não existe o valor "2K"** citado no briefing. As resoluções reais são "HD",
  "Full HD", "4K Ultra HD" e "3K Vertical" — algumas com **11 caracteres**, o que
  a linha de ícones precisa comportar sem estourar o bloco (Req 6.4).
- **`custom.com_alarme` tem TRÊS valores, não dois.** Além de "Alarme sonoro" e
  "Noticação", a A31H tem **"Aplicativo"**. A regra de igualdade exata a "Alarme
  sonoro" cobre os três corretamente — mas uma regra do tipo "≠ Notificação"
  teria dado falso positivo na A31H.
- **A loja grava "Noticação"** (sem o segundo "fi") — grafia real, provavelmente
  um erro de digitação do admin. **Não é problema desta feature**, porque a regra
  do alarme é comparação com "Alarme sonoro"; esse valor nunca é lido nem exibido
  aqui. Mas é a prova de que **o admin erra grafia**, e é por isso que as
  comparações dos Reqs 3 e 4 são case-insensitive e o Req 7.3 lista os valores
  distintos. Fica registrado para quem for exibir esse valor em outro lugar.

### Onde este bloco roda (importa para as NFRs)

`CameraBloco` **não é um Server Component**. Ele não tem `"use client"` próprio,
mas `CatalogoConsultivo` — que tem — o importa **como valor**, o que arrasta o
bloco inteiro para o bundle do cliente. Isso é da feature `catalogo-consultivo`,
não desta spec, e **não vai mudar aqui**: o HTML do ISR continua saindo completo
(client components também são renderizados no servidor), então o SEO está
preservado. O que muda é o custo: **os ícones novos entram no bundle do
`/catalogo`**. Ver a NFR de Performance — a comparação com a `FichaTecnica`
(essa sim Server Component pura) **não vale** para este bloco.

## Alignment with Product Vision

- **"Loja headless (e-commerce)" é a prioridade 1** de `product.md`. Esta feature
  ataca a etapa de **decisão** do funil: o cliente compara e escolhe dentro do
  catálogo, sem precisar abrir 7 abas.
- **"A Shopify é a fonte da verdade comercial"** — o selo e as specs são
  **metafields editados no admin**, não texto no código. O lojista muda o
  posicionamento de uma câmera sem deploy.
- **Atributos do segmento certo** — `product.md` exige que os atributos reflitam
  segurança/vigilância ("resolução, visão noturna, tipo de conexão"), não
  iluminação. Resolução, número de lentes e alarme são exatamente isso.
- **Acessibilidade por padrão** — o ícone é decorativo; quem carrega o
  significado é o texto ao lado (Req 5).

## Requirements

### Requirement 1 — Tarja de posicionamento no bloco

**User Story:** Como cliente comparando câmeras no catálogo, quero ver de relance
a recomendação da loja para cada câmera ("Menor preço", "Mais completa"), para
identificar rapidamente qual delas se encaixa no meu caso.

#### Acceptance Criteria

1. WHEN um produto do catálogo tem `custom.selo` preenchido THEN o bloco SHALL
   exibir uma tarja com **exatamente o texto do metafield**, sem reescrever,
   traduzir, abreviar ou capitalizar de forma diferente.
2. WHEN a tarja é exibida THEN ela SHALL aparecer no **topo do conteúdo do
   bloco**, junto do selo de marca e acima do nome do produto.
3. IF `custom.selo` está ausente, nulo ou vazio após `trim()` THEN o bloco SHALL
   renderizar **sem nenhuma tarja** — sem caixa vazia, sem espaço reservado,
   sem texto de fallback.
4. WHEN a tarja é exibida THEN ela SHALL usar a paleta do tema via variáveis
   `--cor-*`, sem hex hard-coded (o `#D4A017` do briefing é a cor de **fábrica**
   do `--cor-destaque`; o site usa laranja `#ff8903` — ver `tech.md` → Sistema de
   tema).
5. WHEN a tarja é exibida THEN ela SHALL conter **somente texto**, sem ícone
   (decisão de escopo: ícone no selo está fora desta spec).
6. WHEN a tarja e o selo de marca coexistem no mesmo bloco THEN os dois SHALL ser
   **visualmente distinguíveis** um do outro (não podem parecer o mesmo dado).
7. WHEN `custom.selo` traz um texto mais longo que o maior valor medido hoje
   ("Melhor para área externa", 24 caracteres) THEN a tarja SHALL **quebrar em
   mais de uma linha** dentro do bloco, sem truncar o texto, sem estourar a
   largura e sem gerar rolagem horizontal. (`custom.selo` é
   `single_line_text_field` **livre** — o admin pode escrever qualquer coisa; é
   o único gatilho desta feature cujo conteúdo não é um conjunto enumerado.)

### Requirement 2 — Destaque de resolução (sempre que houver dado)

**User Story:** Como cliente, quero ver a resolução de cada câmera direto no
bloco, para comparar qualidade de imagem sem abrir a página de cada produto.

#### Acceptance Criteria

1. WHEN um produto tem `custom.tipo_de_resolucao` preenchido THEN a linha de
   destaques SHALL exibir um item com o ícone `Video` e o **valor literal** do
   metafield (ex.: "Full HD", "4K Ultra HD", "3K Vertical").
2. IF `custom.tipo_de_resolucao` está ausente/vazio THEN o item de resolução
   SHALL ser omitido — e a linha SHALL continuar renderizando normalmente os
   demais itens que dispararem.
3. WHEN a resolução é exibida THEN o valor SHALL ser mostrado **sem o rótulo
   "Resolução"** (o ícone `Video` já situa; o bloco é vitrine, não ficha técnica).

### Requirement 3 — Destaque de lentes (só quando é diferencial)

**User Story:** Como cliente, quero saber quando uma câmera tem mais de uma
lente, porque é um diferencial que justifica o preço — e não quero ruído nas
câmeras que têm o padrão de uma lente só.

#### Acceptance Criteria

1. WHEN `custom.numero_de_lentes` contém "dupla" ou "tripla" (comparação
   **insensível a maiúsculas/minúsculas**, sobre o valor já com `trim()`) THEN a
   linha SHALL exibir um item com o ícone de lentes e o **valor literal** do
   metafield (ex.: "Lente dupla", "Lente tripla").
2. IF `custom.numero_de_lentes` vale "Lente única" THEN o item de lentes SHALL
   ser omitido — **"única" nunca dispara**.
3. IF `custom.numero_de_lentes` está ausente, vazio, ou tem um valor que não
   contém "dupla" nem "tripla" THEN o item de lentes SHALL ser omitido
   (**fail-closed**: valor desconhecido não vira destaque).
4. WHEN o item de lentes é exibido THEN o ícone SHALL ser `Aperture` do
   `lucide-react` — **confirmado presente na versão instalada (1.24.0)**, junto
   com as alternativas do briefing (`Camera`, `Focus`, `ScanLine`), todas
   disponíveis. Não é preciso trocar nem atualizar a dependência.

### Requirement 4 — Destaque de alarme sonoro (só quando é diferencial)

**User Story:** Como cliente preocupado com dissuasão, quero identificar quais
câmeras têm alarme sonoro de verdade (não só notificação no celular), para
escolher a que afasta o invasor.

#### Acceptance Criteria

1. WHEN `custom.com_alarme`, após `trim()`, é igual a "Alarme sonoro" numa
   comparação **insensível a maiúsculas/minúsculas** THEN a linha SHALL exibir um
   item com o ícone `Siren` e o rótulo fixo **"Alarme sonoro"**. (Igualdade de
   conteúdo, não `includes` — só este valor dispara. O case-insensitive alinha
   com o Req 3.1 e cobre o admin digitando "alarme sonoro"; a grafia "Noticação"
   já registrada prova que o risco é concreto.)
2. IF `custom.com_alarme` vale "Noticação" (grafia real da loja), "Aplicativo",
   qualquer outro valor, ou está ausente/vazio THEN o item de alarme SHALL ser
   omitido — **fail-closed**, e **sem** exibir o valor não-disparador.
3. WHEN o item de alarme é exibido THEN o texto exibido SHALL ser o rótulo fixo
   "Alarme sonoro" — que coincide com o valor do metafield; a igualdade é
   proposital e não deve ser interpretada como "exibe o valor cru" (Req 4.2 já
   proíbe exibir os outros valores).

### Requirement 5 — Linha de destaques: composição e acessibilidade

**User Story:** Como cliente (inclusive usando leitor de tela), quero que os
destaques sejam legíveis e não confundam o resto do bloco.

#### Acceptance Criteria

1. WHEN pelo menos um item dispara THEN a linha de destaques SHALL ser
   renderizada **entre o resumo e o preço** do bloco.
2. IF **nenhum** item dispara (nem resolução, nem lentes, nem alarme) THEN o
   bloco SHALL renderizar **sem a linha inteira** — sem container vazio, sem
   borda órfã, sem gap extra (mesma disciplina do `resumo` no Req 1.5 do
   `catalogo-consultivo` e da `FichaTecnica` no Req 4.2).
3. WHEN mais de um item dispara THEN a ordem SHALL ser fixa: **resolução →
   lentes → alarme**, independentemente dos dados.
4. WHEN um ícone é renderizado THEN ele SHALL ser **decorativo** (`aria-hidden`),
   com o texto ao lado carregando todo o significado — mesmo padrão já aplicado
   em `FichaTecnica` (`ficha-card__icone`).
5. WHEN a linha é renderizada THEN ela SHALL ser **puramente apresentacional**:
   **sem hook, sem estado, sem efeito, sem `"use client"` próprio** — a decisão
   de o que mostrar é tomada no **servidor**, dentro de `normalizeProductCard`,
   nunca no cliente a partir de um valor cru.
6. WHEN a página `/catalogo` é servida THEN a tarja e a linha de destaques SHALL
   estar **presentes no HTML inicial** (verificável com `view-source` /
   `curl`), para permanecerem indexáveis — como já ocorre hoje com o resumo e o
   selo de marca, que atravessam o `CatalogoConsultivo` (`"use client"`) e mesmo
   assim são SSR'd.

### Requirement 6 — Não quebrar o catálogo existente

**User Story:** Como dono da loja, quero adicionar destaques sem arriscar o
catálogo, o filtro, a ordem manual da coleção ou o SEO que já funcionam.

#### Acceptance Criteria

1. WHEN a `PRODUCTS_QUERY` é estendida THEN ela SHALL selecionar **exatamente
   estas 4 chaves**, todas no namespace `custom`, confirmadas ao vivo na loja
   (mesma disciplina do Req 5.3 de `catalogo-consultivo` — a key é a **literal
   da loja**, não o rótulo; a lição de `custom.marca` → "Aplicativo"):

   | Metafield | Campo resultante no `ProductCard` |
   |---|---|
   | `custom.selo` | `selo: string \| null` |
   | `custom.tipo_de_resolucao` | `resolucao: string \| null` |
   | `custom.numero_de_lentes` | `lentes: string \| null` |
   | `custom.com_alarme` | `alarmeSonoro: boolean` (gatilho já avaliado no servidor — Req 4.1) |

2. WHEN a query do catálogo é alterada THEN a mudança SHALL ser **aditiva**: os
   campos `id`, `handle`, `title`, `tags`, `featuredImage`, `priceRange` e
   `resumo` SHALL continuar sendo pedidos, e `sortKey: MANUAL` na `collection`
   SHALL ser preservado (é a ordem manual do lojista).
3. WHEN os novos metafields são buscados THEN eles SHALL vir na **mesma
   requisição** da `PRODUCTS_QUERY` (sem N+1, sem segunda chamada por produto).
4. WHEN o bloco cresce com tarja e linha de destaques THEN o layout SHALL
   continuar íntegro em **mobile (coluna) e ≥768px (linha, imagem 40%)**, sem
   estouro horizontal — inclusive com o valor mais longo medido ("4K Ultra HD",
   "3K Vertical", "Melhor para área externa").
5. WHEN `ordenarCatalogo` e `CatalogoConsultivo` são considerados THEN eles
   SHALL permanecer **inalterados** — o filtro segue reordenando (nunca
   escondendo) e o invariante de comprimento do array continua valendo.
6. WHEN o cliente troca de filtro e a lista é reordenada THEN a tarja e a linha
   de destaques de cada bloco SHALL **acompanhar o produto**, nunca a posição —
   consequência de os campos viverem no `ProductCard` e de o `key={p.id}` já
   fazer o React reordenar os nós existentes.
7. WHEN `ProductCard` ganha os campos novos THEN os produtores que **não** os
   selecionam (acessórios, recomendados) SHALL continuar compilando e
   funcionando, com os campos chegando `null` e sendo ignorados por esses
   consumidores — mesmo contrato já documentado em `types.ts`.
8. WHEN a `FichaTecnica` e `lib/shopify/specs.ts` são considerados THEN eles
   SHALL permanecer **funcionalmente inalterados**: a página de produto continua
   mostrando as 21 specs, com resolução e alarme nos cards principais.

### Requirement 7 — Salvaguarda de dados (a premissa cai com barulho)

**User Story:** Como desenvolvedor, quero que uma mudança de chave ou de valor no
admin **falhe visivelmente**, em vez de apagar a tarja e os ícones em silêncio.

#### Acceptance Criteria

1. WHEN um check de verificação é executado THEN ele SHALL reportar, para as 4
   chaves (`selo`, `numero_de_lentes`, `tipo_de_resolucao`, `com_alarme`),
   quantas câmeras da coleção têm valor preenchido.
2. IF alguma das 4 chaves tem **0 câmeras** com valor THEN o check SHALL sair com
   **exit code 1** e uma mensagem apontando a divergência provável de grafia da
   chave.
3. WHEN o check reporta os valores THEN ele SHALL listar os **valores distintos**
   encontrados de `numero_de_lentes` e `com_alarme`, para que uma mudança de
   redação no admin (que **não** zera a chave, mas **desliga o gatilho**) seja
   visível — o modo de falha específico desta feature.
4. IF **nenhuma** câmera dispara o gatilho de lentes, ou **nenhuma** dispara o de
   alarme THEN o check SHALL sair com **exit code 1**, e a mensagem SHALL
   declarar a premissa que caiu.

   > **Premissa registrada (não é lei da natureza):** hoje 5/7 câmeras têm lente
   > dupla/tripla e 2/7 têm alarme sonoro, então "zero disparos" quase certamente
   > significa **gatilho quebrado**, não catálogo homogêneo. Se um dia a loja
   > passar a vender só lente única, este check falha legitimamente e vira ruído
   > permanente — o pior destino de um alarme. **Nesse caso, a ação correta é
   > remover o destaque de lentes da feature, não silenciar o check.** A mensagem
   > de erro deve dizer isso.
5. WHEN o check é escrito THEN ele SHALL seguir as convenções dos scripts
   existentes: `process.exitCode` (nunca `process.exit()`), mensagem de erro
   **sem interpolar o token**, e `--env-file=.env.local` via script npm.
6. WHEN o check é adicionado THEN ele **NÃO** SHALL ser acoplado ao `npm run
   build` — o build precisa passar sem `.env.local` (`tech.md` → DoD item 3).

## Non-Functional Requirements

### Performance
- **Zero requisições adicionais.** Os 4 metafields entram na `PRODUCTS_QUERY`
  existente como campos aliasados; o catálogo continua sendo **1 chamada** à
  Storefront API por revalidação de ISR.
- **Zero JavaScript INTERATIVO adicional** — nenhum hook, estado, efeito ou
  listener novo. **Não é "zero JS":** `CameraBloco` está no bundle do cliente
  (arrastado pelo `"use client"` do `CatalogoConsultivo`), então os 3 ícones do
  `lucide-react` **entram no bundle** do `/catalogo`. É um custo real, pequeno e
  aceito — cada ícone lucide é um componente SVG de poucas centenas de bytes, e
  2 dos 3 (`Video`, `Siren`) **já estão no grafo do projeto** via
  `fichaTecnicaIcones.ts`. **Importar sempre nominalmente**
  (`import { Video } from "lucide-react"`), nunca o pacote inteiro nem
  `lucide-react/dist/esm/icons/*` dinâmico — é o que mantém o tree-shaking.
  Se um dia zero-JS virar requisito, o caminho é renderizar os blocos no servidor
  e passá-los como `children` ao componente de cliente — **fora desta spec**.
- O ISR de 300s do `/catalogo` (`export const revalidate = 300`) permanece.

### Security
- O token da Shopify continua **server-only**: `queries.ts`/`products.ts` mantêm
  `import "server-only"`; `CameraBloco` e `CatalogoConsultivo` seguem importando
  da camada de dados **apenas tipos** (`import type`).
- Critério herdado de `catalogo-loja`: após o build, buscar token e domínio em
  `.next/static` → **0 ocorrências**.
- Os valores dos metafields são **texto puro renderizado como texto** pelo JSX
  (escapado por padrão) — nada de `dangerouslySetInnerHTML`.

### Reliability
- **Fail-closed em todo gatilho:** metafield ausente, nulo, vazio ou com valor
  inesperado → o item simplesmente não aparece. Nenhum caminho renderiza tarja
  vazia, ícone órfão ou texto de fallback.
- O catálogo **não pode quebrar por dado ruim**: a Shopify fora do ar já cai no
  `try/catch` da rota; um metafield estranho degrada para "sem destaque".
- O build **continua passando sem `.env.local`**.

### Usability
- **pt-BR** em toda a interface e em todo o código de domínio (`structure.md`).
- Contraste da tarja e do texto dos destaques adequado sobre `--cor-card`, usando
  os pares de cor do tema.
- Alvos de leitura confortáveis em mobile: a linha de destaques **quebra em
  várias linhas** quando não cabe, em vez de gerar rolagem horizontal.

### Definition of Done (`tech.md`)
1. `npm run build` passa sem erro de TypeScript; `npx tsc --noEmit` limpo.
2. Saída do build: `/` e `/sobre-nos` seguem `○ (Static)`; `/catalogo` e
   `/produtos/[handle]` seguem com ISR.
3. `npm run build` **sem `.env.local`** continua passando.
4. Verificação visual em `npm run dev`: as 7 câmeras com tarja; A38 mostrando
   "4K Ultra HD" + "Lente dupla" + "Alarme sonoro"; P9 e Lâmpada mostrando
   **só** a resolução (lente única, sem alarme sonoro); S8 com "3K Vertical" +
   "Lente tripla" e **sem** alarme.
5. Sem suíte de testes formal — a rede de segurança é estrutural (tipos,
   `server-only`, o check de dados do Req 7).
