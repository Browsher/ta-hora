import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProducts, getProductByHandle, handleTemPagina } from "@/lib/shopify/products"
import { sanitizarDescricao } from "@/lib/shopify/sanitizarDescricao"
import { StoreShell } from "@/components/loja/StoreShell"
import { ProductGallery } from "@/components/loja/ProductGallery"
import { DescricaoProduto } from "@/components/loja/DescricaoProduto"
import { ApresentacaoProduto } from "@/components/loja/ApresentacaoProduto"
import { BotaoAdicionar } from "@/components/loja/BotaoAdicionar"
import { EventoVerProduto } from "@/components/analytics/EventoVerProduto"
import { JsonLd } from "@/components/seo/JsonLd"
import { produtoSchema } from "@/lib/seo/produtoSchema"
import { tituloProduto } from "@/lib/seo/tituloProduto"
import { trilhaDoProduto, trilhaSchema } from "@/lib/seo/trilha"
import { Trilha } from "@/components/loja/Trilha"
import { BarraCompraMobile } from "@/components/loja/BarraCompraMobile"
import { FichaTecnica } from "@/components/loja/FichaTecnica"
import { RecomendadosRelacionados } from "@/components/loja/RecomendadosRelacionados"
import { SelosConfianca } from "@/components/loja/SelosConfianca"
import { CalculadoraFrete } from "@/components/loja/CalculadoraFrete"
import { Heading } from "@/components/ui/Heading"
import { PriceTag } from "@/components/ui/PriceTag"
import { marcaDoProduto } from "@/lib/shopify/tags"
import { parcelamento } from "@/lib/parcelamento"
import { buscarRecomendados } from "@/lib/shopify/recomendados"
import type { Product, ProductCard } from "@/lib/shopify/types"

// ISR + params dinâmicos: handles não pré-renderizados renderizam sob demanda.
export const revalidate = 300
export const dynamicParams = true

// C1 — tolerante: sem token/Shopify offline, retorna [] e deixa tudo pro ISR.
// O build NUNCA quebra por env ausente.
export async function generateStaticParams() {
  try {
    const produtos = await getProducts()
    return produtos.map((p) => ({ handle: p.handle }))
  } catch {
    return []
  }
}

// C1 — tolerante: erro → título genérico (não quebra o build).
//
// 🔴 O SUFIXO SAIU DAQUI. O `· Ta Hora` que este arquivo acrescentava à mão foi
// substituído pelo `template: "%s | Ta Hora"` do app/layout.tsx — mantê-lo
// produziria "Camera Q8 · Ta Hora | Ta Hora". O separador mudou de `·` para `|`
// junto com o resto do site, que agora é uniforme.
//
// O `canonical` é o item de maior consequência desta rota: os links de afiliado
// apontam para PDPs com `?ref=<código>`, e sem ele cada afiliado criava uma URL
// distinta da MESMA página aos olhos do Google. Relativo, resolvido contra o
// `metadataBase` — e sem a query, que é o ponto.
// ⚠️ ESTA FUNÇÃO NÃO CHECA `handleTemPagina`, E ISSO É DECISÃO REGISTRADA — não
// "conserte" sem ler o custo abaixo.
//
// Sintoma que parece bug: um handle fora da coleção `cameras` (cartão, cabo)
// 404-a na página, mas AINDA ASSIM sai com metadata completa — título, og:image,
// e um `canonical` apontando para a URL que não existe.
//
// Por que fica assim: o único jeito de saber se o handle tem página é consultar
// a coleção, e `getProducts()` NÃO é deduplicado — `storefrontFetch` faz POST
// sem `force-cache`, e desde o Next 15 o `fetch` não cacheia por default (ver o
// bloco de cache no topo de `lib/shopify/client.ts`). Medido em build limpo
// (31/07/2026), contando acessos reais à rede:
//
//     sem a guarda na página →  3 × PRODUCTS_QUERY
//     com a guarda na página → 10 × PRODUCTS_QUERY   (+1 por PDP)
//     + guarda aqui também   → 17 × PRODUCTS_QUERY   (+1 por PDP, de novo)
//
// Seria DOBRAR o custo em todas as 7 PDPs — que são as páginas que vendem — para
// limpar a metadata de duas URLs que não estão no sitemap, não são linkadas de
// lugar nenhum e ninguém acessa. Otimizar o caso raro pagando no caso comum.
//
// E o ganho seria nulo na prática: a resposta é 404, e o status HTTP é a
// instrução autoritativa para o crawler — ele descarta a página e a metadata
// junto, `index, follow` ou não.
export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> },
): Promise<Metadata> {
  const { handle } = await params
  const canonical = `/produtos/${handle}`
  try {
    const produto = await getProductByHandle(handle)
    if (produto) {
      // Parcelamento pela MESMA função que o `<PriceTag>` do corpo da página
      // chama (ver o render abaixo). É o ponto da existência de
      // `lib/parcelamento.ts`: a meta description é a fonte que ninguém vê na
      // tela, e por isso a primeira a apodrecer quando o plano do cartão muda.
      //
      // Consequência declarada: a description das 7 PDPs passa a conter o valor
      // da parcela de cada produto, então mudar o preço na Shopify muda a meta no
      // próximo ISR. É desejado — e é por isso que não há string fixa aqui.
      //
      // Sem parcelamento exibível (produto abaixo do piso do MP), a frase perde a
      // cláusula inteira em vez de exibir "0x" ou um texto pela metade.
      const parc = parcelamento(produto.precoNumerico)
      const descricao = parc
        // `textoProsa`, não `textoUI`: a variante de UI traz um `·` de lista, que
        // no meio desta oração lê como frase quebrada. Ver lib/parcelamento.ts.
        ? `${produto.title} — original, com nota fiscal e garantia. Entrega para todo o Brasil e ${parc.textoProsa} no Ta Hora.`
        : `${produto.title} — original, com nota fiscal e garantia. Entrega para todo o Brasil, no Ta Hora.`

      // 🔴 `openGraph` de uma rota SUBSTITUI o do layout raiz INTEIRO — não
      // mescla campo a campo. Enquanto este bloco declarava só `title` e `url`,
      // as 7 PDPs saíam sem `og:image`, `og:site_name`, `og:locale` e `og:type`:
      // link de produto no WhatsApp aparecia sem prévia nenhuma. Por isso tudo
      // que o raiz define e continua valendo aqui é REPETIDO abaixo. Ao mexer
      // no openGraph do app/layout.tsx, revisar este bloco junto.
      //
      // 🔴 `ogImage`, NÃO `images[0]`. As fotos da galeria vêm redimensionadas em
      // 800 px (o tamanho de exibição da PDP) e o Open Graph pede 1200. São duas
      // variantes da mesma foto, calculadas em `normalizeProduct` a partir do
      // ORIGINAL — cada uma com as dimensões que de fato tem. Voltar a usar
      // `images[0]` aqui declararia 800 px num contexto que pede 1200; "consertar"
      // reescrevendo a largura desta URL declararia 1200 para um arquivo de 800,
      // que é pior (o WhatsApp recorta errado ou descarta a prévia). Ver o
      // comentário de `ogImage` em lib/shopify/types.ts.
      const foto = produto.ogImage

      // Title DERIVADO das specs (feature title-por-spec) — ver lib/seo/tituloProduto.ts.
      //
      // Antes daqui saía `produto.title` puro: "Câmera Segurança A31H", 31
      // caracteres com o sufixo, competindo por um código de fábrica que ninguém
      // digita no Google. Agora sai "Câmera Segurança Wi-Fi Full HD Dupla Lente
      // A31H" (57 com o sufixo), com o código no FIM.
      //
      // 🔴 SEM o " | Ta Hora" — quem acrescenta é o `template` do app/layout.tsx.
      const titulo = tituloProduto(produto)

      return {
        title:       titulo,
        // 🔴 A DESCRIPTION CONTINUA COM `produto.title`, e isso é deliberado: ela
        // já tem 143 caracteres com o nome curto, e trocar por `titulo` (47 chars
        // em vez de 21) a empurraria para ~170 — truncada no Google. O nome curto
        // é o certo aqui; o longo é o certo no title. Não "uniformize".
        description: descricao,
        alternates:  { canonical },
        openGraph: {
          type:     "website",
          locale:   "pt_BR",
          siteName: "Ta Hora",
          // O MESMO title derivado. Aqui o argumento não é busca, é o WhatsApp:
          // este negócio vende por indicação e afiliado, e a prévia do link é o
          // que o destinatário lê antes de clicar. "Câmera Segurança Wi-Fi Full
          // HD Dupla Lente A31H" diz o que é o produto; "Câmera Segurança A31H"
          // exige já conhecer o modelo. Cabe folgado no limite do WhatsApp.
          //
          // Sem sufixo aqui de propósito: o `template` do layout NÃO se aplica ao
          // openGraph, e o `siteName` logo acima já diz "Ta Hora".
          title:    titulo,
          description: descricao,
          url:      canonical,
          images: [
            foto
              // `foto.url` já vem ABSOLUTA do CDN da Shopify — o `metadataBase`
              // não a toca. width/height só entram se a Shopify informou: OG
              // aceita a ausência, mas dimensão errada faz o WhatsApp recortar
              // mal ou descartar a prévia.
              ? {
                  url:    foto.url,
                  ...(foto.width  ? { width:  foto.width  } : {}),
                  ...(foto.height ? { height: foto.height } : {}),
                  alt:    foto.altText ?? produto.title,
                }
              // Produto sem foto cadastrada: cai na arte genérica do site, que
              // é melhor do que link sem prévia.
              : {
                  url:    "/uploads/og-image.webp",
                  width:  1200,
                  height: 630,
                  alt:    "Ta Hora — câmeras de segurança Wi-Fi originais",
                },
          ],
        },
      }
    }
  } catch {
    // ignora — cai no título genérico
  }
  return { title: "Produto", alternates: { canonical } }
}

export default async function ProdutoPage(
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params

  // S1 — dois modos de falha DISTINTOS:
  //   Shopify offline → exceção → UI de erro amigável (dentro do try/catch).
  //   Produto inexistente → null → notFound() FORA do try (senão o catch
  //   engoliria o NEXT_NOT_FOUND lançado por notFound()).
  let produto: Product | null
  try {
    produto = await getProductByHandle(handle)
  } catch {
    return (
      <StoreShell>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px clamp(20px, 5vw, 64px)", color: "var(--cor-texto-secundario)", textAlign: "center" }}>
          Não foi possível carregar o produto. Tente novamente em instantes.
        </div>
      </StoreShell>
    )
  }
  if (!produto) notFound()

  // O produto EXISTE na Shopify, mas tem página no site? A coleção `cameras`
  // decide — a mesma regra do /catalogo, do generateStaticParams e do sitemap.
  // Acessórios (cartão, cabo) existem na loja e são sugeridos no drawer por tag,
  // mas não têm PDP; sem esta linha, `dynamicParams = true` os renderizava para
  // quem digitasse a URL.
  //
  // FORA do try acima pelo mesmo motivo do `notFound()` de cima: o catch
  // engoliria o NEXT_NOT_FOUND. `handleTemPagina` já trata a própria falha e
  // devolve `true` (deixa passar) quando a Shopify não responde.
  if (!(await handleTemPagina(handle))) notFound()

  // Sanitiza no SERVIDOR (fronteira única). "" quando não há conteúdo visível —
  // é isso que decide o layout: 2 colunas (com descrição) x 1 coluna centrada.
  const descricaoLimpa = sanitizarDescricao(produto.descriptionHtml)
  const temDescricao = descricaoLimpa !== ""

  // Recomendados da MESMA marca (seção "Você também pode gostar"). Só busca se o
  // produto tem marca conhecida; a busca roda NO SERVIDOR, no ISR desta página.
  // Falha → [] → a seção não aparece: um extra não pode derrubar a página que
  // vende. Sem console.error (a mensagem de storefrontFetch conteria o endpoint).
  const marca = marcaDoProduto(produto.tags)
  let recomendados: ProductCard[] = []
  if (marca) {
    try {
      recomendados = await buscarRecomendados(marca, produto.handle)
    } catch {
      recomendados = []
    }
  }

  // Parcelamento calculado UMA vez: alimenta o PriceTag da página e a barra fixa
  // de mobile. Duas chamadas dariam o mesmo resultado (a função é pura), mas a
  // segunda seria uma oportunidade de as duas divergirem no futuro.
  const parc = parcelamento(produto.precoNumerico)

  // Item do `view_item`, montado AQUI (servidor) e passado pronto — ver o topo de
  // EventoVerProduto.tsx.
  //
  // `item_id` é o HANDLE, não `produto.id`. Não é escolha de estilo: a linha do
  // carrinho não carrega o gid do produto (`LinhaCarrinho.id` é o `CartLine`), e
  // o handle é o único identificador idêntico na PDP, no card e no carrinho. Sem
  // isso o funil view_item → add_to_cart → begin_checkout do GA4 vê três
  // produtos diferentes e nunca fecha.
  const itemGA = {
    item_id:    handle,
    item_name:  produto.title,
    item_brand: marcaDoProduto(produto.tags) ?? undefined,
    price:      produto.precoNumerico,
    quantity:   1,
  }

  // Calculada UMA vez e passada aos dois consumidores — o `<Trilha>` visível e o
  // `trilhaSchema`. É o que torna a divergência entre tela e schema impossível em
  // vez de improvável; ver o bloco no topo de lib/seo/trilha.ts.
  const trilha = trilhaDoProduto(produto.title, handle)

  return (
    // `compensarBarraFixa`: o padding que impede a barra de tapar o rodapé mora
    // no div raiz do StoreShell, não aqui — o rodapé é irmão do <main> e um
    // wrapper nesta página não o alcança. Ver o comentário na prop.
    <StoreShell compensarBarraFixa>
      {/* Não renderiza nada — dispara `view_item` na montagem, no browser de
          cada visitante (o HTML desta rota é ISR, cacheado por 5 min). */}
      <EventoVerProduto item={itemGA} />

      {/* JSON-LD `Product` — é o que habilita PREÇO e DISPONIBILIDADE no
          resultado de busca. Sai no HTML do ISR (Server Component), então
          acompanha mudança de preço na Shopify pelo mesmo ciclo que já mantém a
          meta description viva.

          🔴 O objeto NÃO tem `aggregateRating` nem `review`, e isso é decisão
          registrada — ver o bloco no topo de lib/seo/produtoSchema.ts antes de
          cogitar adicionar. `npm run verificar:schema` falha se aparecerem. */}
      <JsonLd data={produtoSchema(produto)} />

      {/* Trilha: `Início > Catálogo > Câmera Segurança A31H`.
          O MESMO array alimenta o `<nav>` visível e o `BreadcrumbList` abaixo —
          espelhar não depende de ninguém lembrar. Ver lib/seo/trilha.ts.

          🔴 Nome CURTO no último degrau (`produto.title`), não o descritor de
          `tituloProduto`: breadcrumb é navegação, e o Google monta o caminho da
          SERP a partir dos ancestrais — o último item nem chega a ser exibido.

          🔴 IRMÃ do <article>, FORA de `.produto-coluna-esquerda`. A coluna do
          sticky tem 12px de folga; aqui a trilha custa zero dela. */}
      <Trilha itens={trilha} />
      {/* Dois blocos JSON-LD nesta página (Product + BreadcrumbList), de
          propósito: é válido, o Google lê os dois, e mantém cada módulo de
          `lib/seo/` testável isoladamente — a premissa do verificar:schema. */}
      <JsonLd data={trilhaSchema(trilha)} />

      <article
        // Layout em globals.css (classes explícitas — o mx-auto do Tailwind não
        // é gerado neste projeto): `produto-grid` = 60/40 centrado com esquerda
        // sticky; `produto-unico` = 1 coluna estreita centrada (sem descrição).
        className={temDescricao ? "produto-grid" : "produto-unico"}
        // `padding-top` 40 → 12 em 12/08/2026, quando a `<Trilha>` entrou acima.
        // Ela ocupa o espaço que já existia, então a página NÃO ficou mais alta e
        // a galeria não desceu na dobra do mobile. Ao remover a trilha, devolver
        // os 40px — senão o topo fica apertado.
        style={{ padding: "12px clamp(20px, 5vw, 64px) 72px" }}
      >
        {/* Coluna esquerda — bloco de compra. É o alvo do sticky (globals.css).
            No DESKTOP, um sub-grid lado a lado [galeria | info] baixa a altura da
            coluna (galeria e info dividem a altura em vez de somar) — é o que
            permite o sticky congelar em telas normais. No MOBILE colapsa para 1
            coluna: galeria → nome → preço → botão (a ordem do DOM). */}
        <div className="produto-coluna-esquerda">
          <div className="produto-esquerda-inner">
            <div className="produto-galeria">
              <ProductGallery images={produto.images} title={produto.title} />
            </div>

            {/* Info empilhada. Há espaço para crescer abaixo do botão (specs, etc.).
                O `id` é o ALVO do IntersectionObserver da barra fixa de mobile:
                quando este bloco sai da tela por cima, a barra entra. Renomear o
                id exige acertar a prop `alvoId` lá embaixo. */}
            <div className="produto-info" id="produto-compra">
              {/* H1 com o MESMO descritor do title (feature title-por-spec) — a
                  função é a de `generateMetadata`, não uma segunda string.
                  Antes daqui saía `produto.title`: o title dizia "Câmera
                  Segurança Wi-Fi Full HD Dupla Lente A31H" e o H1 dizia "Câmera
                  Segurança A31H" — keyword na tag que o Google EXIBE e keyword
                  vazia no elemento que ele usa para entender o tema da página.

                  🔴 O `fontSize` inline SOBRESCREVE o `size="pequeno"` do Heading,
                  e é escopado a esta página de propósito — `SIZE_STYLE.pequeno` é
                  compartilhado com os H3 do site inteiro. Só o `style` funciona
                  aqui: o Heading aplica a escala INLINE, então uma classe de CSS
                  perderia a disputa de especificidade (ver components/ui/Heading.tsx).

                  Por que 22px e não 30px: esta coluna é `minmax(240px, 1fr)` e o
                  `1fr` calculado dá 232px a 1920 — ou seja, ela TRAVA em 240px em
                  todo o desktop, enquanto `clamp(18px, 2.4vw, 30px)` crescia até
                  30px. A 30px cabiam ~13 caracteres por linha, e o nome curto de
                  21 caracteres já ocupava 2 linhas. O descritor completo levaria a
                  4 linhas e +78px na coluna — altura que o sticky não tem
                  sobrando (ver o bloco do sticky em globals.css: a calculadora de
                  frete aberta já leva a coluna a 716px, contra 736px úteis no
                  limiar de 760px de altura de viewport).

                  ⚠️ O PIOR CASO É A TELA MAIS LARGA, não a mais estreita — o
                  inverso do que o comentário do sticky em globals.css supõe. A
                  coluna é fixa em 240px e é a FONTE que cresce com a viewport. Ao
                  mexer nesta escala, meça a 1920 antes de 768. */}
              <Heading as="h1" size="pequeno" style={{ fontSize: "clamp(18px, 1.6vw, 22px)" }} text={tituloProduto(produto)} color="var(--cor-texto)" accentColor="var(--cor-destaque)" />

              {/* `installments` pela MESMA função da meta description (ver
                  generateMetadata). `?.texto` → `undefined` quando não há
                  parcelamento exibível, e o PriceTag simplesmente não renderiza
                  a linha — prop opcional, sem texto quebrado. */}
              <PriceTag
                price={produto.price.price}
                currency={produto.price.currency}
                installments={parc?.textoUI}
                size="grande"
              />

              {/* O handle da rota — nunca um merchandiseId: o servidor resolve a
                  variante (o cliente não escolhe o que vai pro carrinho). Abre o
                  drawer e dispara os acessórios sugeridos — intocado. */}
              <BotaoAdicionar handle={handle} disponivel={produto.disponivel} />

              {/* Garantia / NF / devolução / alcance de entrega. Server
                  component: sai no HTML do ISR, que é o ponto — esses fatos
                  existiam só dentro de <meta> e og:. Só o que é verdade
                  confirmada; o que ficou de fora está justificado no arquivo. */}
              <SelosConfianca />

              {/* Calculadora de frete — DEPOIS dos selos de propósito: frete é
                  a objeção "quanto sai no total", que só aparece depois de
                  "eu quero e confio". Client component (tem input e estado),
                  mas sem rede: calcula de tabela local, ver lib/frete/. */}
              <CalculadoraFrete />
            </div>
          </div>
        </div>

        {/* Coluna direita — descrição rica, só quando há conteúdo. */}
        {temDescricao && <DescricaoProduto html={descricaoLimpa} />}
      </article>

      {/* Apresentação — IRMÃ do <article> (largura total, coluna de texto a
          680px), entre a compra/descrição e a ficha técnica: narrativa antes de
          tabela. Some sozinha quando `custom.apresentacao` está vazio.
          NUNCA um 3º filho do grid — quebraria as 2 colunas. */}
      <ApresentacaoProduto texto={produto.apresentacao} />

      {/* Ficha técnica — IRMÃ do <article> (largura total, centralizada), entre a
          compra/descrição e os recomendados. Some sozinha quando o produto não tem
          nenhuma spec preenchida (mesmo padrão dos recomendados). */}
      <FichaTecnica specs={produto.specs} />

      {/* Seção "Você também pode gostar" — IRMÃ do <article> (largura total,
          centralizada), NUNCA um 3º filho do grid de 2 colunas. Some sozinha
          quando `recomendados` é []. */}
      <RecomendadosRelacionados produtos={recomendados} />

      {/* Barra de compra fixa — SÓ no mobile, e só depois que o bloco de compra
          (#produto-compra) sai da tela. É `position: fixed`, então não participa
          do fluxo: fica aqui no fim por legibilidade, não por layout. */}
      <BarraCompraMobile
        handle={handle}
        preco={produto.price.price}
        moeda={produto.price.currency}
        // `texto` CURTO de propósito (sem os 12x): a barra já prefixa com "ou", e
        // o texto completo daria "ou … sem juros · ou em até 12x" — dois "ou" na
        // mesma linha, e trunca em 320px. A condição completa está no PriceTag,
        // a um scroll. Ver a doc do campo em lib/parcelamento.ts.
        parcela={parc?.texto}
        disponivel={produto.disponivel}
        alvoId="produto-compra"
      />
    </StoreShell>
  )
}
