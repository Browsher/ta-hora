# Requirements Document

## Introduction

Sugestão de **acessórios** dentro do drawer do carrinho da loja **Ta Hora**.
Quando o carrinho contém uma **câmera de segurança**, o drawer passa a exibir uma
seção "Você também vai precisar" com os acessórios da loja (cabo extensor, cartão
de memória) e um botão para adicioná-los em um clique.

O objetivo é comercial: **aumentar o ticket médio** aproveitando o momento de
maior intenção de compra — o cliente já decidiu levar a câmera e está com o
carrinho aberto.

A identificação é por **tag da Shopify**: `camera` marca os gatilhos, `acessorio`
marca os sugeridos. Nenhuma relação produto-a-produto é necessária — qualquer
acessório serve para qualquer câmera.

Esta spec **reaproveita quase tudo** da spec `carrinho-loja`: o drawer, a Server
Action `adicionarItem(handle)`, a camada de dados `server-only`, o
`CarrinhoProvider` e os primitivos de UI. O que ela acrescenta é uma consulta por
tag e uma seção no drawer.

### PRÉ-CONDIÇÃO DE DADOS — atendida com dados de TESTE (medido)

Esta seção mudou duas vezes; o histórico importa porque explica o Req 7.

**Quando os requisitos foram escritos**, a loja tinha 4 produtos, **todos
câmeras, com `tags: []`** — zero. `tag:acessorio` devolvia **0**. A feature seria
**código morto**: sem gatilho e sem nada a sugerir, a seção nunca apareceria, e
isso é indistinguível de um bug. A spec foi escrita mesmo assim, por decisão
consciente do usuário, com a ausência declarada e o Req 7 como salvaguarda.

**Estado atual (medido contra a Storefront 2026-01 antes da fase de tarefas):**

| Fato | Realidade medida |
|---|---|
| Produtos publicados no canal Headless | **4** |
| `tag:camera` | **2** — `camera-seguranca-es-p9`, `camera-de-seguranca-q6` |
| `tag:acessorio` | **2** — `camera-seguranca-q8`, `camera-seguranca-s8` |
| Sugeríveis (tag `acessorio` **e** disponível) | **2** |
| Produtos com as duas tags | **0** |
| Produtos sem tag alguma | **0** |
| Variantes por produto | **1** (a premissa da `carrinho-loja` segue valendo) |

**A premissa agora é verdadeira e a busca é verificável contra dados reais.**

> ⚠️ **São dados de TESTE, não o catálogo final.** Os dois produtos etiquetados
> `acessorio` são **câmeras disfarçadas** (`camera-seguranca-q8`,
> `camera-seguranca-s8`) — existem para validar o **mecanismo**, não para vender.
> Consequências reais:
> - Na UI, as "sugestões" mostrarão **câmeras**. Isso é esperado durante a
>   validação e **não** é bug.
> - O cabo extensor e o cartão de memória **ainda não existem** como produto.
>   Quando existirem, o operador aplica `acessorio` neles e remove das câmeras
>   disfarçadas — **sem tocar em código**, que é exatamente o ponto do Req 2.1.
> - Tags em minúsculas e sem acento (`camera`, `acessorio`), conforme cadastrado.
>   O código usa as constantes do design; divergência de grafia faria a seção
>   sumir em silêncio — mais um motivo para o Req 7.

O Req 7 continua valendo **justamente porque** a pré-condição já foi quebrada uma
vez: ela é estado de catálogo, mutável pelo admin a qualquer momento, sem aviso
ao código.

### Fatos verificados ao vivo (estes, sim)

1. **A sintaxe de busca por tag FUNCIONA e está validada:**
   `products(first: N, query: "tag:acessorio")` — validado contra o schema
   2026-01 via Dev MCP **e** exercitado na loja real: `query: "title:Camera"`
   devolveu os 4 produtos, provando que o argumento `query` opera. `tag:camera`
   devolve 0 **por ausência de tags**, não por erro de sintaxe.
2. **Três abordagens validam no schema** (`products(query:)`,
   `collection(handle:){products}`, `collection.products(filters:[{tag:}])`).
   A escolha entre elas é design.
3. **O cliente NÃO consegue identificar uma câmera hoje** — verificado no código:
   `LinhaCarrinho` (`lib/shopify/types.ts`) não tem `tags`, e o fragmento do
   carrinho (`queriesCarrinho.ts:78`) traz apenas `product { title handle }`.
   Fechar essa lacuna é pré-requisito do Req 1 e a decisão de **como** é design.
4. **`ProductCard` e `normalizeProductCard` servem ao card do acessório sem
   mudança** — `{ id, handle, title, image, price }` é exatamente o necessário.
5. **A loja MUDOU desde a spec `carrinho-loja`:** os handles que aquela spec
   verificou (`camera-lampada-copia`, `camera-seguranca-mini-copia`) não existem
   mais; hoje são `camera-seguranca-es-p9`, `camera-de-seguranca-q6`,
   `camera-seguranca-q8`, `camera-seguranca-s8`. **Nada a fazer:** o carrinho
   resolve o produto pelo handle da rota, então não quebra; o `README.md` **não
   cita handle algum** (verificado); e as duas menções que restam
   (`carrinho-loja/requirements.md:28-29`) são o **registro datado** do que foi
   apurado naquela spec — reescrevê-lo falsificaria o histórico.

   > *Correção da auditoria:* uma versão anterior deste fato afirmava que os
   > handles mortos "invalidam exemplos no README — ver Req 9.5". **As duas
   > metades eram falsas**: o README não tem exemplo de handle, e o Req 9.5 trata
   > de revalidar o fragmento GraphQL. A frase foi escrita sem verificar — dentro
   > da seção "Fatos verificados". Fica registrada porque é exatamente o defeito
   > que esta spec e a `carrinho-loja` existem para não repetir.

## Alignment with Product Vision

- **Objetivo #1 do `product.md`** ("Loja headless — catálogo, carrinho e
  checkout"): o catálogo e o carrinho existem; esta spec **monetiza** o carrinho,
  sem alterar o funil.
- **"O site passa a vender direto"**: aumentar o ticket do canal próprio é
  exatamente o retorno que justificou o checkout próprio.
- **"A Shopify é a fonte da verdade comercial"** (`product.md`): quais produtos
  são acessórios é decisão **de catálogo**, tomada na Shopify por tag — não uma
  lista no código.
- **Compatibilidade retroativa**: o carrinho hoje funciona ponta a ponta e as
  páginas dirigidas por JSON não podem regredir (Req 9).

## Requirements

### Requirement 1 — Gatilho: câmera no carrinho

**User Story:** Como cliente que colocou uma câmera no carrinho, quero ver os
acessórios que vou precisar, para não descobrir depois que faltou o cabo.

#### Acceptance Criteria

1. IF o carrinho contém **pelo menos um** produto com a tag `camera` THEN o
   sistema SHALL exibir a seção de acessórios sugeridos no drawer.
2. IF o carrinho **não** contém nenhum produto com a tag `camera` THEN o sistema
   SHALL NOT exibir a seção.
3. IF o carrinho está vazio THEN o sistema SHALL NOT exibir a seção.
4. THE identificação de câmera SHALL usar a **tag `camera`**, e SHALL NOT usar
   título, handle, `productType` ou coleção como proxy. *A loja tem uma coleção
   `cameras`; usá-la misturaria dois mecanismos. E adivinhar por título
   ("Camera…") quebraria no primeiro produto renomeado.*
5. WHEN o conteúdo do carrinho muda **por qualquer motivo** THEN a avaliação do
   gatilho SHALL refletir o novo conteúdo sem recarregar a página. *Inclui:
   adicionar, remover pela lixeira, quantidade chegando a 0 pelo `−`
   (`carrinho-loja` Req 3.5), releitura após cupom, e carrinho restaurado da
   persistência (Req 2.2 de lá). A versão anterior deste AC enumerava só
   "adicionado ou removido" — enumeração convida leitura estreita.*

### Requirement 2 — Buscar acessórios por tag

**User Story:** Como dono da loja, quero definir o que é acessório marcando uma
tag na Shopify, para mudar as sugestões sem tocar no código.

#### Acceptance Criteria

1. THE sistema SHALL obter os acessórios consultando a Storefront API pela tag
   **`acessorio`**, e SHALL NOT manter lista de handles, IDs ou nomes no código.
2. THE consulta SHALL retornar **todos** os produtos com a tag, sem assumir uma
   quantidade fixa. *Hoje serão 2; se amanhã forem 5, a seção mostra 5 sem
   mudança de código.*
3. IF um produto tem as tags `camera` **e** `acessorio` THEN o sistema SHALL
   tratá-lo como acessório sugerível E como gatilho. *Não é o caso hoje; a regra
   existe para o comportamento ser definido em vez de acidental.*

   > **O caso interessante, resolvido:** esse produto **sozinho** no carrinho
   > dispara o gatilho (Req 1.1), é acessório (este AC) e é excluído por já estar
   > no carrinho (Req 3.1) → a seção dispara com **zero sugestões** → o Req 6.1 a
   > esconde. A cadeia fecha consistente e o cliente vê o carrinho normal. Fica
   > escrito porque "definido" tem que incluir este caso, senão o AC só promete
   > definição.
4. THE sistema SHALL NOT sugerir produto indisponível (`availableForSale: false`)
   **no momento da busca**. *Sugerir o que não se pode comprar gasta a atenção do
   cliente no único momento em que ela vale dinheiro.*

   > **Escopo temporal — resolve a contradição com a NFR de Performance.** A
   > lista é buscada uma vez por carga de página (NFR). Se um acessório esgotar
   > **no meio da sessão**, ele continua sugerido até a próxima carga. Isso é
   > **aceito e declarado**, não um descuido.
   >
   > *Por que aqui é aceitável e no `adicionarItem` não foi:* a `carrinho-loja`
   > recusou cachear a resolução de variante com a mesma premissa ("é dado de
   > catálogo") — mas lá o dado velho está no **caminho de escrita**, e o preço
   > do erro é **vender item esgotado**. Aqui o dado velho está no **caminho de
   > exibição**: o `adicionarItem` re-resolve a variante no servidor a cada
   > clique, e o Req 1.6 da `carrinho-loja` bloqueia a adição com "Produto
   > indisponível no momento.". O prejuízo máximo é **um clique perdido**, não
   > uma venda ruim. A distinção é exibição × escrita, não catálogo × carrinho.
5. THE consulta SHALL ser executada **no servidor**, com o token (Req 8).
6. THE consulta SHALL usar `first: 250` — o **máximo** da Storefront API — e
   **NÃO** SHALL paginar. THE "todos" do AC 2 SHALL valer **até 250 acessórios**.

   > *A auditoria apontou que "todos" era inimplementável sem paginação (a API
   > exige `first:`). A resolução é assumir o teto em voz alta, não paginar: uma
   > tag `acessorio` com mais de 250 produtos não é catálogo crescendo, é a tag
   > virando categoria — e aí a feature precisa ser repensada, porque ninguém lê
   > 250 sugestões num drawer. Paginar fingiria suportar um cenário que a UI não
   > suporta.*

### Requirement 3 — Esconder o que já está no carrinho

**User Story:** Como cliente, não quero ver sugestão de algo que já coloquei no
carrinho, para não me confundir nem comprar duplicado.

#### Acceptance Criteria

1. THE sistema SHALL excluir das sugestões todo acessório **já presente** no
   carrinho.
2. IF **todos** os acessórios já estão no carrinho THEN o sistema SHALL NOT
   exibir a seção.
3. WHEN o cliente adiciona um acessório sugerido THEN ele SHALL desaparecer da
   lista de sugestões, sem recarregar a página.
4. WHEN o cliente remove um acessório do carrinho THEN ele SHALL voltar a ser
   sugerido (se o gatilho do Req 1 ainda valer).
5. THE comparação SHALL usar o **handle** do produto. *É o identificador estável
   que a linha do carrinho já carrega (`LinhaCarrinho.handle`) e o mesmo que a
   action `adicionarItem(handle)` recebe.*

### Requirement 4 — A seção no drawer

**User Story:** Como cliente revisando o carrinho, quero ver os acessórios num
lugar óbvio, para decidir sem procurar.

#### Acceptance Criteria

1. WHERE a seção é exibida, ela SHALL aparecer **depois** da lista de itens do
   carrinho e **antes** do bloco de subtotal/desconto/total.
2. THE seção SHALL ter o título **"Você também vai precisar"**.
3. WHILE a seção é exibida, cada acessório SHALL mostrar **foto, nome, preço** e
   um botão de adicionar.
4. THE preço exibido SHALL vir da Shopify já formatado em pt-BR (o
   `formatMoney()` existente), e SHALL NOT ser calculado, somado ou convertido
   localmente.
5. THE seção SHALL usar as cores da paleta via as CSS custom properties
   `--cor-*`, e SHALL NOT introduzir cor fixa fora da paleta.
6. THE seção SHALL reutilizar o `CarrinhoDrawer` existente, e a mudança SHALL ser
   **aditiva** — sem alterar o comportamento do drawer quando a seção não
   aparece.
7. **(Exceção consciente ao "conteúdo em JSON")** WHERE a copy da seção
   ("Você também vai precisar") é fixa no código, isso SHALL ser uma exceção
   declarada ao princípio "mudar conteúdo = editar JSON" do `product.md` — o
   drawer não é seção de layout e não passa pelo `PreviewContent`. *Precedente
   idêntico: `carrinho-loja` Req 6.5, para a copy do selo de pagamento.*
8. THE bloco de subtotal/desconto/total e o botão "Finalizar compra" SHALL
   permanecer visíveis **independentemente de quantos acessórios sejam
   renderizados**.

   > **Correção da auditoria — o "risco de dobra" que este AC declarava NÃO
   > EXISTE.** Uma versão anterior afirmava que muitos acessórios empurrariam os
   > totais "para baixo da dobra, degradando o caminho da receita", e declarava
   > isso como risco aceito. **Verificado no layout real e é falso:** o painel é
   > `position: fixed; top:0; bottom:0` em coluna flex, o corpo rolável é
   > `flex:1; overflowY:auto` (`CarrinhoDrawer.tsx:138`) e o rodapé é
   > `flexShrink:0` (`:187`) — **irmão** do corpo, **fora** do container de
   > scroll. Os totais são fixos por construção; só as linhas rolam.
   >
   > A frase foi escrita a partir de uma preocupação plausível, sem olhar o DOM
   > que a desmente — o mesmo defeito do fato 5. O AC agora exige a **propriedade
   > que o layout já garante**, e o design registra que ela é load-bearing (quem
   > mover a seção para dentro do rodapé, ou trocar o `flex`, a quebra em
   > silêncio).
   >
   > *Resta um efeito real, mas menor:* com muitos acessórios, a seção fica longe
   > no scroll. É descoberta, não receita.

### Requirement 5 — Adicionar em um clique

**User Story:** Como cliente, quero adicionar o acessório sem sair do carrinho,
para não perder o que já montei.

#### Acceptance Criteria

1. WHEN o cliente clica no botão de adicionar de um acessório THEN o sistema
   SHALL adicionar 1 unidade dele ao carrinho e SHALL manter o drawer **aberto**.
2. THE adição SHALL reutilizar a Server Action **`adicionarItem(handle)`**
   existente, e SHALL NOT criar um segundo caminho de escrita no carrinho.
   *Reusá-la herda de graça: resolução de variante no servidor, criação do
   carrinho, cookie, tratamento de `warnings` e a serialização da fila.*
3. WHILE a adição está em andamento THE sistema SHALL indicar carregamento e
   SHALL impedir cliques duplicados.
4. WHEN a adição falha THEN o sistema SHALL exibir a mensagem de erro do carrinho
   e SHALL manter o carrinho anterior intacto.
5. IF a Shopify limitar a quantidade (`warnings`) THEN o aviso SHALL aparecer como
   já aparece hoje no drawer — sem tratamento próprio desta spec.

### Requirement 6 — Nunca uma seção vazia

**User Story:** Como cliente, não quero ver um espaço vazio ou um título sem
conteúdo, para o carrinho não parecer quebrado.

#### Acceptance Criteria

1. IF não há acessório a sugerir — por qualquer motivo: sem gatilho, todos já no
   carrinho, nenhum publicado com a tag, ou falha na busca — THEN o sistema SHALL
   NOT renderizar o título nem o contêiner da seção.
2. IF a busca dos acessórios falhar (rede, Shopify fora, env ausente) THEN o
   drawer SHALL continuar **plenamente funcional** e a seção SHALL simplesmente
   não aparecer, **sem erro visível**. *Mesmo princípio do Req 4.7 da
   `carrinho-loja`: um extra comercial não pode derrubar a compra.*
3. WHILE a busca está em andamento THE bloco de subtotal/desconto/total SHALL NOT
   se deslocar por causa da seção. *A propriedade observável é "os totais não
   pulam embaixo do cursor do cliente". A versão anterior deste AC proibia uma
   técnica específica (esqueleto), o que é decisão de design vazando para
   requisito — como conseguir isso é escolha de quem desenha.*

### Requirement 7 — Salvaguarda da pré-condição de dados

**User Story:** Como mantenedor, quero que a ausência das tags falhe com barulho,
para não descobrir semanas depois que a seção nunca apareceu.

#### Acceptance Criteria

1. THE sistema SHALL prover um check dedicado, executável por comando npm, que
   **falha (exit ≠ 0)** se não houver nenhum produto **sugerível** com a tag
   `acessorio` OU nenhum produto com a tag `camera`.

   > **"Sugerível" = com a tag E `availableForSale: true`** — e essa palavra é o
   > requisito inteiro. *A auditoria achou o buraco: um check que só conta
   > "produtos com a tag" fica **verde** quando o operador cadastra e etiqueta os
   > dois acessórios mas ambos estão **esgotados** — e aí o Req 2.4 os remove das
   > sugestões, a seção nunca aparece, e o resultado é literalmente
   > "indistinguível de um bug", que é o desfecho que este requisito existe para
   > impedir. Contar o que é **sugerível**, não o que é **etiquetado**.*
2. THE check SHALL nomear qual condição falhou e quantos produtos encontrou de
   cada tag, distinguindo **etiquetados** de **sugeríveis**. *"2 acessórios
   etiquetados, 0 disponíveis" e "0 acessórios etiquetados" são problemas
   diferentes, com soluções diferentes no admin.*
3. THE check SHALL **avisar (sem falhar)** se houver produto publicado **sem tag
   alguma**, nomeando os handles.

   > **Correção — a versão anterior deste AC era inimplementável.** Ela pedia
   > avisar "se nem todas as câmeras estiverem etiquetadas", o que é circular: o
   > check só conhece **tags**, e sem a tag `camera` ele não tem como saber que
   > um produto *é* uma câmera. Precisaria de uma verdade que só existe na cabeça
   > do operador.
   >
   > O que **é** verificável e serve ao mesmo propósito: produto **sem nenhuma
   > tag** não é gatilho nem sugestão — quase sempre é cadastro novo em que
   > alguém esqueceu de etiquetar. Aviso, não bloqueio: pode ser um produto que
   > deliberadamente não participa da feature. *(Hoje: 0 sem tag — medido.)*
4. THE check SHALL NOT ser acoplado ao `npm run build`. *Mesma razão do
   `verificar:variantes`: o Req 8.6 da `carrinho-loja` exige que o build passe sem
   `.env.local`, e este check precisa do token.*
5. THE check SHALL usar `process.exitCode`, e SHALL NOT usar `process.exit()`.
   *Verificado na spec anterior: `process.exit()` após `fetch` derruba handles do
   libuv no Windows e o exit code sai **127 em qualquer caso** — sucesso e falha
   indistinguíveis. Um check assim parece funcionar e não funciona.*
6. THE check SHALL ser incluído na verificação final desta spec e documentado no
   README. *Uma salvaguarda que ninguém roda não é salvaguarda — foi o achado da
   auditoria da `carrinho-loja`.*

### Requirement 8 — Fronteira cliente/servidor

**User Story:** Como dono da loja, quero que a busca dos acessórios não exponha o
token, para não abrir uma brecha por causa de um extra comercial.

#### Acceptance Criteria

1. THE consulta por tag SHALL ser executada apenas no servidor, e o token SHALL
   NOT aparecer no bundle do cliente — verificável por busca no `.next/static`
   após o build (0 ocorrências), o mesmo critério já provado nas duas specs
   anteriores.
2. THE módulos que tocam o token SHALL manter `import "server-only"`, e os
   componentes de cliente SHALL importar apenas **tipos** (`import type`) da
   camada de dados.
3. THE cliente SHALL NOT poder escolher a tag, a query, o endpoint ou a versão da
   API — a superfície exposta SHALL ser fechada em forma, como as 6 actions do
   carrinho.
4. THE mensagens de erro SHALL NOT interpolar token nem endpoint.
5. **THE consulta de acessórios SHALL NOT usar `cache: "force-cache"` nem
   `export const fetchCache = "default-cache"`** — mesmo sendo dado de catálogo e
   não de carrinho. *O Req 8.4a da `carrinho-loja` proíbe isso no projeto inteiro,
   e a consulta roda dentro do contexto do carrinho: a exceção "só aqui" é
   exatamente como a proibição morre.*

### Requirement 9 — Não-regressão

**User Story:** Como dono do site, quero que o carrinho que acabou de funcionar
ponta a ponta continue funcionando, para não trocar receita por receita.

#### Acceptance Criteria

1. WHEN a feature é introduzida THEN o carrinho SHALL continuar funcionando em
   todos os fluxos já validados: adicionar, drawer, quantidade, cupom, remover,
   contador, checkout.
2. THE Home (`/`), Sobre Nós (`/sobre-nos`), `/catalogo` e `/produtos/[handle]`
   SHALL continuar funcionando.
3. **THE Home e Sobre Nós SHALL continuar `○ (Static)` na saída do build.** *A
   busca de acessórios acontece no contexto do carrinho, nunca no render da Home.
   Escopo: é não-regressão **desta** spec — o `ProductGrid` da Home por tag
   moverá a Home para ISR de propósito, e isso não é violação (ver `tech.md` →
   "Home estática: o que é regra e o que NÃO é").*
4. THE `/catalogo` e `/produtos/[handle]` SHALL manter o ISR de 300s.
5. **WHEN** a alteração tocar o fragmento GraphQL do carrinho THEN as **6**
   operações existentes SHALL ser revalidadas via Dev MCP e o fluxo do carrinho
   SHALL ser reverificado. *`WHEN`, não `IF`: o fato verificado 3 estabelece que
   o gatilho precisa de `tags` na linha, e o fragmento é compartilhado pela query
   e pelas 5 mutations — mexer nele mexe em tudo. Se o design achar um caminho
   que não toque o fragmento, este AC simplesmente não dispara.*
6. THE `npm run build` SHALL passar com e **sem** `.env.local`, e `npx tsc
   --noEmit` SHALL ficar limpo.

### Requirement 10 — Definition of Done técnico das operações GraphQL

**User Story:** Como desenvolvedor, quero a busca por tag validada contra o schema
2026-01 **e exercitada na loja**, para não descobrir em produção que a query era
válida mas não fazia o que eu achava.

> Checklist de DoD (critérios de conclusão), não comportamento de produto.

#### Acceptance Criteria

1. THE query de acessórios SHALL ser validada contra o schema **2026-01** via Dev
   MCP (`validate_graphql_codeblocks`) antes de a spec ser considerada concluída.
2. THE validação SHALL tratar **aviso de depreciação como falha**, não só erro de
   schema. *`productByHandle` valida com `⚠️ INFORM`, não com `❌` — foi assim que
   um campo depreciado quase entrou na spec anterior.*
3. THE versão da API SHALL vir de `SHOPIFY_STOREFRONT_API_VERSION` (default
   `2026-01`) via `storefrontFetch`, e SHALL NOT ser hardcoded numa nova camada.
   **Exceção declarada:** o check do Req 7 roda fora do Next e necessariamente
   duplica a leitura de env e o default — SHALL comentar a duplicação, como faz o
   `verificar-variantes.mjs`.
4. IF a query for validada apenas contra o schema THEN isso SHALL NOT ser
   confundido com prova de funcionamento — a sintaxe de busca SHALL ser
   exercitada contra a loja real. *`tag:camera` valida no schema e devolve 0 na
   loja; só a execução distingue "sintaxe errada" de "não há dados".*

## Non-Functional Requirements

### Performance

- A busca dos acessórios SHALL NOT bloquear a abertura do drawer. O drawer abre
  em <100ms (NFR da `carrinho-loja`); a seção aparece quando os dados chegarem.
- **A busca acontece NO MÁXIMO UMA VEZ POR CARGA DE PÁGINA**, na primeira vez que
  o gatilho fica verdadeiro. Abrir e fechar o drawer, ou mudar o carrinho, SHALL
  NOT refazê-la. Recarregar a página (ou navegação que remonte o provider)
  refaz — e isso é aceitável: é 1 chamada por carga, só quando há câmera.
  *"Uma vez por carga de página" substitui o vago "dentro da mesma navegação" da
  versão anterior, que era inverificável: ninguém sabia se cobria soft nav,
  reload ou `/catalogo` → `/produtos/[handle]`.*
- **Consequência declarada:** a lista pode ficar velha durante a sessão — ver a
  nota de escopo temporal do Req 2.4. O prejuízo máximo é um clique perdido,
  porque a escrita re-resolve a variante no servidor.
- A busca SHALL NOT acontecer quando não há gatilho. *Carrinho sem câmera não
  deve gerar chamada à Shopify.*
- A adição de um acessório SHALL custar o mesmo que a adição normal (1 lookup de
  variante + 1 mutation) — sem releitura extra.

### Security

- Token da Storefront API **exclusivamente server-side** (Req 8) — sem
  `NEXT_PUBLIC_`, sem exposição em bundle, log ou mensagem de erro.
- O cliente não escolhe tag nem query: a operação exposta é fechada em forma.
- Nada nesta spec altera a fronteira do carrinho: o ID segue em cookie
  `httpOnly`, e o `Carrinho` segue sem `id`.

### Reliability

- Falha na busca de acessórios **degrada para "sem seção"**, nunca para erro — o
  carrinho é o caminho da receita e a sugestão é um extra (Req 6.2).
- A ausência das tags na Shopify é um estado **esperado e tratado** (seção não
  aparece), sinalizado pelo check do Req 7 — não por erro ao cliente.
- A Shopify é a fonte da verdade de quais produtos são acessórios, do preço e da
  disponibilidade.

### Usability

- Idioma **pt-BR** na UI e no código de domínio (`acessorios`, `sugestoes`,
  `gatilho`) — padrão do `structure.md`.
- Reúso dos primitivos existentes (`PriceTag`, `CtaButton`, `ImageSlot`/`<img>`);
  paleta e chrome preservados.
- A seção SHALL ser navegável por teclado e os botões SHALL ter rótulo acessível
  que identifique **qual** acessório está sendo adicionado.
- A seção SHALL respeitar `prefers-reduced-motion` se tiver animação. *O
  `MotionConfig` do drawer já cobre o subtree — ver `tech.md`.*

## Out of Scope

Explicitamente **fora** desta spec (combinado com o usuário):

- Barra de progresso de frete grátis.
- Produtos sugeridos genéricos (não-acessórios).
- Sugestão por câmera específica — todos os acessórios servem para qualquer
  câmera; não há relação produto-a-produto.
- Sugestão de acessórios **fora** do drawer (página de produto, catálogo).
- Ordenação, curadoria ou **limite de quantidade exibida** — a seção mostra todos
  os acessórios sugeríveis. *Isto é sobre **exibição**; o teto de busca é
  `first: 250` (Req 2.6). Os totais e o "Finalizar compra" ficam visíveis de
  qualquer forma — o rodapé está fora do container de scroll (Req 4.8).*
- **Suportar mais de 250 acessórios.** Ver Req 2.6: nesse cenário a feature
  precisa ser repensada, não paginada.
- **Ajustar a quantidade pela seção.** O botão adiciona 1 unidade (Req 5.1) e o
  acessório some das sugestões (Req 3.1); para levar um segundo cabo, o cliente
  usa o `+` da linha no carrinho. É decisão, não esquecimento.
- Cadastro dos produtos e das tags na Shopify — é trabalho do operador no admin
  (ver "Pré-condição de dados"), sinalizado pelo Req 7.
