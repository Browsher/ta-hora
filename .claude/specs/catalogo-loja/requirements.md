# Requirements Document — Catálogo da Loja (catalogo-loja)

## Introduction

Esta feature transforma o site do **Ta Hora** (loja de **câmeras de segurança e
acessórios**) de um site puramente institucional em uma **vitrine de produtos
headless conectada à Shopify**. Os **dados** (produtos, imagens, preços,
descrições e especificações técnicas) vêm da **Shopify Storefront API (GraphQL)**;
o **design** é o do próprio site (paleta/tema e primitivos de UI existentes).

O escopo desta spec é **somente o catálogo** — uma página de vitrine (`/catalogo`)
e páginas individuais de produto (`/produtos/[handle]`). **Carrinho e checkout
ficam para uma spec seguinte**; onde eles entrariam, esta spec deixa um
placeholder.

Como a loja exige **preço/estoque atualizados**, as páginas de produto passam a
ser renderizadas em **runtime com ISR** (o site deixa de ser static export para
essas rotas). As páginas de conteúdo existentes (Home, Sobre Nós) **não podem
regredir**.

## Alignment with Product Vision

- Atende à **prioridade #1** do `product.md` ("Loja headless — catálogo, carrinho
  e checkout com dados da Shopify"), entregando a fatia de **catálogo**.
- Concretiza a decisão do `tech.md` ("Modelo de build — atual vs. loja"): migração
  de static export para **SSR/ISR na Vercel** para dados frescos da Shopify.
- Mantém o **design consistente** reutilizando a paleta/tema e os primitivos de
  `components/ui/`, conforme `structure.md` ("usar primitivos de `components/ui/`
  em vez de recriar").
- Segmento correto: atributos de produto refletem **segurança/vigilância**
  (resolução, tipo de conexão, visão noturna…), não iluminação.

## Requirements

### Requirement 1 — Cliente da Shopify Storefront API

**User Story:** Como desenvolvedor da loja, quero um cliente da Storefront API
(GraphQL) configurado por variáveis de ambiente, para que o site consulte os
dados da Shopify com segurança e sem credenciais no código.

#### Acceptance Criteria

1. WHEN o app precisa de dados da Shopify THEN o sistema SHALL executar consultas
   GraphQL contra o endpoint da Storefront API da loja configurada.
2. IF o token da Storefront ou o domínio da loja não estiverem definidos em
   variáveis de ambiente THEN o sistema SHALL falhar de forma explícita (erro
   claro em build/log de servidor), NUNCA usar valor embutido no código.
3. WHEN o cliente monta a requisição THEN o sistema SHALL enviar o header
   `X-Shopify-Storefront-Access-Token` e usar uma versão de API fixada.
4. IF a Shopify responder com erros GraphQL ou status não-2xx THEN o sistema SHALL
   tratar o erro (lançar/registrar) sem vazar o token em mensagens ao cliente.
5. WHEN as consultas rodam THEN elas SHALL executar **apenas no servidor** (Server
   Components / código de servidor) — o token NUNCA é exposto ao browser.

### Requirement 2 — Página de vitrine `/catalogo`

**User Story:** Como cliente, quero ver a lista de produtos da loja em
`/catalogo`, para que eu possa navegar o portfólio e escolher um produto.

#### Acceptance Criteria

1. WHEN o cliente acessa `/catalogo` THEN o sistema SHALL buscar os produtos da
   Shopify dinamicamente e exibi-los na página.
2. WHEN um produto é exibido na vitrine THEN o card SHALL mostrar, no mínimo,
   **imagem principal, título e preço**.
3. WHEN o cliente clica em um card de produto THEN o sistema SHALL navegar para a
   página individual daquele produto (`/produtos/[handle]`).
4. IF um produto não tiver imagem THEN o sistema SHALL exibir um placeholder
   visual consistente com o tema (sem quebrar o layout).
5. IF a loja não retornar nenhum produto THEN a página SHALL exibir um estado
   vazio amigável (ex.: "Nenhum produto disponível") em vez de erro.
6. WHEN a vitrine é renderizada THEN ela SHALL usar a paleta/tema do site e os
   primitivos de UI existentes (aparência consistente com o restante do site).
7. WHEN o cliente navega pelo site THEN a **Navbar** e o **Footer** SHALL oferecer
   um link "Catálogo" apontando para `/catalogo` (hoje o rótulo existe nos layouts
   mas sem href). A alteração SHALL ser **aditiva** (apenas o href), sem regredir
   os demais itens de navegação.

### Requirement 3 — Página individual de produto `/produtos/[handle]`

**User Story:** Como cliente, quero abrir a página de um produto específico, para
ver fotos, descrição, preço e especificações técnicas antes de decidir comprar.

#### Acceptance Criteria

1. WHEN o cliente acessa `/produtos/[handle]` com um handle válido THEN o sistema
   SHALL buscar esse produto na Shopify pelo handle e renderizar seus dados.
2. WHEN a página do produto renderiza THEN ela SHALL exibir **título, galeria de
   fotos, descrição e preço**, e SHALL exibir as **especificações técnicas**
   disponibilizadas pela Shopify para aquele produto (ex.: resolução, tipo de
   conexão, visão noturna) — cada spec presente é renderizada como par
   rótulo/valor; specs ausentes são omitidas sem quebrar o layout.
3. IF o handle não corresponder a nenhum produto THEN o sistema SHALL retornar a
   página **404** padrão do Next (`not-found`), sem erro de servidor.
4. WHEN a galeria tem múltiplas imagens THEN o cliente SHALL conseguir visualizar
   as demais imagens (troca de imagem principal / thumbnails).
5. WHEN a página do produto renderiza THEN ela SHALL incluir uma **área/botão de
   ação placeholder** ("adicionar ao carrinho" no futuro); esse elemento SHALL
   estar visualmente presente mas **inerte** (não adiciona ao carrinho, não envia
   dados, não navega) — sem lógica de carrinho nesta spec.
6. WHEN a página do produto renderiza THEN ela SHALL usar a paleta/tema e os
   primitivos de UI existentes (`PriceTag`, `ImageSlot`, `Heading`, `Text`, etc.).

### Requirement 4 — Dados frescos (runtime/ISR) sem regredir o conteúdo atual

**User Story:** Como operador da loja, quero que preços e disponibilidade fiquem
atualizados sem rebuild manual, e que as páginas institucionais continuem
funcionando, para que a loja seja confiável e o site atual não quebre.

#### Acceptance Criteria

1. WHEN o catálogo e as páginas de produto são servidos THEN elas SHALL usar
   **runtime com revalidação (ISR)** — janela de revalidação padrão **≤ 5 minutos**
   (valor exato definido no design) — refletindo alterações de preço/estoque da
   Shopify sem novo deploy.
2. WHEN o build do projeto é ajustado para runtime THEN o `output: "export"` de
   `next.config.ts` SHALL ser removido/ajustado para permitir renderização de
   servidor (esperado — não é regressão).
3. WHEN a Home (`/`) e a página Sobre Nós (`/sobre-nos`) são acessadas após a
   mudança THEN elas SHALL continuar renderizando corretamente (conteúdo dirigido
   por JSON, sem dependência da Shopify).
4. IF a Shopify estiver indisponível ou a consulta falhar THEN as páginas de
   catálogo SHALL degradar de forma controlada (erro/estado amigável), e as
   páginas de conteúdo SHALL permanecer 100% funcionais (não dependem da Shopify).
5. WHEN o app é hospedado THEN ele SHALL ser compatível com deploy de **runtime na
   Vercel** (alvo de hospedagem definido no `tech.md`).
6. WHEN `npm run build` roda **sem `.env.local`** (sem credenciais Shopify) THEN o
   build SHALL concluir com sucesso (as páginas de catálogo caem no ISR
   on-demand), NUNCA quebrar por env ausente em tempo de build.
7. WHEN o modelo de build muda para runtime THEN a documentação (README e
   `tech.md` → Comandos) SHALL ser atualizada — o build não gera mais `out/`
   estático; o deploy passa a ser runtime na Vercel (`npm start` para produção
   local).

## Non-Functional Requirements

### Performance
- As páginas de catálogo e produto SHALL usar ISR (cache com revalidação) para
  evitar consultar a Shopify a cada request, mantendo tempo de resposta baixo.
- Imagens da Shopify SHALL ser exibidas de forma **responsiva e sem estourar o
  layout nem causar salto de layout (CLS)**; o mecanismo (manter `images.unoptimized`
  vs. reabilitar a otimização de imagem do Next) é decisão de design.

### Security
- O token da Storefront SHALL ficar **exclusivamente em variáveis de ambiente**
  (`.env`/`.env.local`, já ignorados pelo git) e nunca ser commitado nem exposto
  ao cliente.
- Consultas à Shopify SHALL rodar somente no servidor; nenhuma credencial no
  bundle do browser.
- Um arquivo `.env.example` (sem valores reais) SHALL documentar as variáveis
  necessárias.

### Reliability
- Falha na Shopify NÃO SHALL derrubar as páginas de conteúdo institucional.
- Handles inexistentes SHALL resultar em 404 controlado, não em exceção.

### Usability
- A aparência das páginas de catálogo/produto SHALL ser consistente com o tema do
  site (paleta `--cor-*`, tipografia e primitivos existentes).
- Layout SHALL ser responsivo (desktop e mobile), coerente com os componentes
  atuais (`useIsMobile`, grids `auto-fit`).
- Acessibilidade: imagens com `alt`, foco navegável nos cards/links, respeito a
  `prefers-reduced-motion` (herdado do `MotionConfig` do site).

## Premissas e decisões em aberto (confirmar na aprovação)

1. **Origem das specs técnicas: CONFIRMADO → metafields da Shopify.** Resolução,
   tipo de conexão, visão noturna, etc. vêm de **metafields** estruturados
   (namespace/chaves a definir). A query da Storefront API declara os metafields a
   buscar; a página de produto renderiza os presentes como pares rótulo/valor.
   → *Falta definir o namespace e a lista de chaves (ex.: `specs.resolucao`,
   `specs.conexao`, `specs.visao_noturna`).*
2. **Rota do produto:** adotado `/produtos/[handle]` (handle da Shopify). Ajustável
   se preferir `/produto/[handle]` ou outro.
3. **Vitrine em `/catalogo` = única fonte dinâmica (CONFIRMADO):** nova rota
   dedicada lista **todos** os produtos da Shopify. A seção `ProductGrid` existente
   (dirigida por JSON, no Builder/home) **NÃO é alterada nesta spec**.
   → *Frente FUTURA (fora desta spec, não construir agora):* o `ProductGrid` da
   home passará a puxar da Shopify filtrado por uma **tag de destaque** (produtos
   marcados com uma tag). Isso é uma spec/frente seguinte.
4. **Moeda:** preços formatados em BRL (R$) reutilizando `PriceTag`.
