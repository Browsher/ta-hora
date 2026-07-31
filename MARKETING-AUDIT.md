# Auditoria de Marketing: Ta Hora

**URL:** https://ta-hora-loja.vercel.app/
**Data:** 30 de julho de 2026
**Tipo de negócio:** E-commerce (varejo de câmeras de segurança Wi-Fi, checkout Shopify)
**Score geral de marketing: 38/100 (Nota: F)**

---

## Sumário executivo

O Ta Hora tira **38 de 100**, faixa F. Esse número precisa de uma leitura correta, porque ele não descreve um negócio ruim — descreve um **negócio real escondido atrás de um site que parece não terminado**. Existe operação de verdade por trás: quatro anos vendendo em marketplace, reputação construída, fornecedor testado, logística rodando, WhatsApp que responde. E existe engenharia de qualidade acima da média: o drawer de carrinho tem cupom, upsell, aviso de item indisponível antes do checkout e acessibilidade real; o rastreamento de afiliados está implementado ponta a ponta e provado. O que falta quase não é construção. É **ligar e assinar**.

A maior força é o histórico em marketplace — e ele está sendo desperdiçado de forma quase irônica. A página `/sobre-nos` faz a coisa certa ao linkar a loja do Mercado Livre para provar reputação. Só que **o link leva a uma marca diferente**: a loja se chama "CH CFTV & Eletrônicos", e o nome "Ta Hora" não aparece em lugar nenhum dela (verificado). O comprador cético que clica para confirmar a idoneidade encontra outro nome — o ato de verificação vira suspeita. Pior: a página do ML mostra 4,7/5 com 68 avaliações e +580 seguidores, enquanto o site alega "+10.000 clientes". A prova linkada **contradiz** o número alegado em vez de confirmá-lo.

A maior lacuna é de credibilidade verificável, e ela suprime tudo o mais. Um comprador brasileiro decide em dez segundos se digita o cartão, e o site falha em todos os checkpoints desse teste: sem CNPJ, sem razão social, sem endereço, com `/politica-de-privacidade` retornando 404 real, e-mail de contato em Gmail genérico, domínio `ta-hora-loja.vercel.app` e um rodapé que literalmente assinava **"© 2026 Marca. Todos os direitos reservados."** — a chave `copyright` nunca substituída, caindo no default do template em todas as páginas *(corrigido em 30/07/2026; os demais defaults de SaaS do mesmo bloco, como "Changelog" e links de GitHub, existiam no código mas não chegavam a renderizar)*. Isoladamente cada item é um alerta amarelo; juntos formam o perfil exato do golpe de e-commerce que o consumidor brasileiro foi treinado a reconhecer. Nenhuma otimização de copy compensa isso.

As três ações de maior retorno, nesta ordem: **(1)** assinar o site de verdade — rodapé com CNPJ e razão social, políticas de privacidade/termos/devolução publicadas, domínio próprio registrado; **(2)** publicar no site os acessórios e kits que a mesma operação **já vende no Mercado Livre** (cartões de memória e kits de 2 a 5 câmeras, até R$992) — ataca ticket médio, margem e o limiar de frete grátis de uma vez, sem fornecedor novo; **(3)** instalar analytics e pixel, hoje inexistentes, sem os quais nada aqui é mensurável e toda verba de mídia é gasta às cegas.

**Sobre impacto em receita:** este site não tem Google Analytics, Meta Pixel, GTM nem qualquer medição instalada — verificado por busca em todo o código-fonte. Portanto **não existe dado de tráfego, conversão ou faturamento**, nem meu nem de terceiros. A seção de impacto financeiro adiante é um **cenário modelado sobre premissas declaradas**, não uma projeção medida. Trate os números como ordem de grandeza para priorizar esforço, jamais como previsão.

---

## Score por categoria

| Categoria | Score | Peso | Ponderado | Achado principal |
|---|---|---|---|---|
| Conteúdo & Mensagem | 41/100 | 25% | 10,25 | Depoimentos falam de "fone bluetooth" e "acessórios"; a loja só vende câmeras |
| Otimização de Conversão | 52/100 | 20% | 10,40 | PDP sem parcelamento, sem frete, sem garantia; zero pixel no site inteiro |
| SEO & Descoberta | 27/100 | 20% | 5,40 | Zero JSON-LD, zero meta description, robots.txt e sitemap.xml em 404 |
| Posicionamento Competitivo | 42/100 | 15% | 6,30 | "Melhor preço" é refutável: Amazon vende equivalente a R$78,99 com Prime |
| Marca & Confiança | 31/100 | 10% | 3,10 | Sem CNPJ, sem políticas, rodapé "© 2026 Marca", link de prova aponta a outra marca |
| Crescimento & Estratégia | 29/100 | 10% | 2,90 | Nenhum motor de aquisição ligado; afiliados com infra pronta e porta trancada |
| **TOTAL** | | **100%** | **38,35 → 38/100** | **Nota F** |

---

## Quick Wins (esta semana)

**1. Assinar o rodapé. — ✅ FEITO em 30/07/2026.** O copyright passou a `© 2026 Ta Hora — CH CFTV & Eletrônicos — CNPJ 46.340.461/0001-04` em `components/sections/Footer/Footer.tsx`. *Por que importava:* aparecia em 100% das páginas, inclusive logo abaixo do botão de compra nas PDPs. *Precisão sobre o diagnóstico original:* dos defaults de template em `Footer.tsx:59-97`, **apenas o copyright chegava a renderizar**. "Changelog", "Roadmap", `#github`, `#linkedin` e a descrição de SaaS estavam dormentes — os layouts sobrescrevem a coluna 1, trazem `showSocial: false` e usam `type: "compacto"`, que não desenha a descrição. Foram limpos mesmo assim, por serem ativáveis por qualquer mudança de configuração.

**2. Publicar CNPJ, razão social e endereço.** No rodapé e em `/sobre-nos`. Se a operação é MEI, publicar assim mesmo — **um CNPJ de MEI vale infinitamente mais que nenhum**.

**3. Criar as páginas legais que hoje dão 404.** `/politica-de-privacidade`, `/termos-de-uso` e `/trocas-e-devolucoes`, com os links reais no rodapé. Hoje "Política de privacidade" aponta para `#blog` e "Termos de uso" para `#carreiras` — âncoras mortas herdadas do template. A política precisa mencionar o **cookie de afiliado de 30 dias** que o site já grava. Declarar explicitamente os **7 dias de arrependimento (CDC art. 49)** e o prazo de garantia em meses. *Além do risco LGPD/CDC:* Meta e Google Ads reprovam contas de e-commerce sem política publicada — isso bloqueia anúncio.

**4. Converter o hero de verdade.** `public/uploads/Promocao_placa.webp` tem extensão `.webp` e é servido como `image/webp`, **mas os bytes são PNG** (`PNG image data, 1200 x 1000` — confirmado nos magic bytes do arquivo local e do servido em produção). Alguém renomeou a extensão em vez de converter. São 1.058.351 bytes — 1,03 MB — para uma imagem que em WebP q80 ficaria em 80–140 KB. Como ela está em `<link rel="preload" as="image">`, é quase certamente o elemento LCP da home. `cwebp -q 80 Promocao_placa.webp -o hero.webp`, e confirmar com `file` que a saída diz `RIFF ... Web/P`. **É o maior ganho isolado de LCP disponível.**

**5. Colar o metadata raiz do Next.** Hoje `/`, `/catalogo` e `/sobre-nos` têm o mesmo `<title>Ta Hora</title>`, que não contém nenhuma palavra que alguém digite no Google. Nenhuma página tem meta description. Ver código pronto na seção de SEO.

**6. Criar `app/robots.ts` e `app/sitemap.ts`.** Ambas as rotas retornam 404 hoje. Código pronto na seção de SEO.

**7. Corrigir os depoimentos.** Rodrigo M. diz *"Comprei um fone bluetooth"*; Felipe S. fala em *"acessórios"*. A loja vende exclusivamente câmeras. Apenas 1 dos 5 menciona o produto real, e todos os cinco falam só de frete e prazo — nenhum diz se a câmera funciona ou se foi fácil instalar, que são as objeções reais. **A loja tem 4,7/5 com 68 avaliações reais no Mercado Livre**: puxar de lá, com atribuição.

**8. Unificar os números.** A home diz "+10000 clientes atendidos" no topo e "+20 mil clientes já compraram" no CTA final — o número dobra na mesma página. `/sobre-nos` diz "+10 mil vendas". O ML linkado mostra 68 avaliações e 580 seguidores. Escolher **um** número defensável e usá-lo em todo lugar. O "98% de satisfação" ou ganha fonte ("98% de avaliações positivas no Mercado Livre") ou sai.

**9. Parcelamento e PIX embaixo do preço na PDP.** Hoje a PDP mostra "R$185,00" e mais nada — grep por `frete|12x|parcel|garantia|devolu|estoque|avalia` no HTML servido retorna **zero**. A home promete "12x" em três lugares e a promessa some exatamente onde o preço é avaliado. No varejo brasileiro o cliente ancora na parcela: "R$185,00" lê como caro, "12x de R$15,42" lê como barato. Em `app/produtos/[handle]/page.tsx:112`, após `<PriceTag>`.

**10. Barra de confiança colada ao botão de compra.** Em `page.tsx:117`, abaixo de `<BotaoAdicionar>`: `🔒 Pagamento seguro · 🔄 7 dias para devolver (CDC) · 🛡️ Garantia · 🧾 Nota fiscal`. Todos esses ativos já existem no site — só estão longe do ponto de decisão.

**11. Consertar o CTA de afiliados.** `href="#"` na home. Ou aponta para um formulário, ou o CTA sai até existir a página. CTA morto contamina a credibilidade da página inteira.

**12. Corrigir erros expostos ao cliente.** Na A31H, *"Visão noturna: 3,6 mm"* (3,6 mm é o diâmetro da lente, e o valor correto já aparece duplicado abaixo). Na Camera Lampada, *"Alarme: Noticação"*, sem o "fi". No catálogo, a P9 (R$115) leva o selo **"Menor preço"** enquanto a Camera Lampada custa R$78 na mesma página.

---

## Recomendações estratégicas (este mês)

**1. Publicar os acessórios e kits que já existem no Mercado Livre.** A loja do ML vende cartões de memória e kits de 2 a 5 câmeras, até R$992. O site tem 7 SKUs, todos câmera avulsa, nenhum acessório. Isso resolve simultaneamente ticket médio, margem e o limiar de frete grátis — **sem fornecedor novo, sem produto novo, sem risco de estoque**. É o maior retorno por esforço de toda a auditoria.

**2. Barra de progresso de frete grátis no carrinho.** O limiar é R$199 e **4 dos 7 produtos ficam abaixo** (R$78, R$115, R$158, R$185). A A31H — a campeã declarada, "Mais vendida" — custa R$185, **R$14 abaixo do limiar**. É a maior oportunidade de upsell do site e está completamente inexplorada. `Faltam R$14,00 para o frete grátis 🚚` mais sugestão automática do cartão SD. O componente `AcessoriosSugeridos` **já existe e já renderiza** no lugar certo do drawer — falta só o gatilho e o sortimento.

**3. Instalar GA4 + Meta Pixel com eventos de e-commerce.** `view_item`, `add_to_cart`, `begin_checkout`. Sem isso não há remarketing para quem adicionou ao carrinho e não comprou — o público de maior taxa de retorno de qualquer conta de varejo —, o algoritmo de anúncio não recebe sinal de conversão para otimizar, e **nenhuma recomendação deste relatório pode ser medida**. É pré-requisito de tudo o que vem depois.

**4. Abrir a porta dos afiliados.** O rastreamento `?ref=` com cookie de 30 dias, last-touch e carimbo no pedido Shopify está implementado e provado. A home descreve os 5 passos. E o botão não leva a lugar nenhum. Na v1 nem precisa de painel: um Tally ou Google Form com aprovação manual e link gerado à mão já começa a recrutar. Publicar a comissão em % explícita e **remover a barreira das "3 compras"** antes do primeiro pagamento — é dura demais para recrutar iniciante. É o maior descompasso entre investimento feito e retorno colhido no negócio inteiro.

**5. Levar a placa de brinde para o catálogo e a PDP.** A promoção "placa de monitoramento 24h de brinde na compra de 1 câmera" existe só no banner da home. Ela **desaparece exatamente no momento da decisão**. É o único diferenciador não-preço que o negócio tem.

**6. JSON-LD de Product, Offer, FAQPage e BreadcrumbList.** Zero dados estruturados hoje, numa loja que renderiza preço no servidor e tem seção de FAQ pronta. Sem isso as PDPs **nunca** aparecerão com preço ou "Em estoque" no Google, competindo com um resultado azul cru contra concorrentes que exibem "R$ 185,00 ★★★★☆ Em estoque". **Não incluir `AggregateRating` enquanto não houver avaliação real coletada** — estrela falsa é violação de diretriz e rende penalidade manual.

**7. Descrição narrativa dos produtos.** O componente `DescricaoProduto` **já existe e já renderiza** `descriptionHtml` da Shopify sanitizado. A PDP está sem texto porque **o campo está vazio no admin da Shopify**. Não é trabalho de engenharia, é preenchimento de conteúdo. 13 linhas de especificação não vendem; "veja quem está na porta pelo celular, mesmo no escuro" vende.

**8. Resolver a divergência de identidade com o marketplace.** Ou renomear a loja do ML para incluir "Ta Hora", ou assumir a ligação no site em uma frase: *"Somos a CH CFTV & Eletrônicos, loja oficial no Mercado Livre desde 2022 — agora também no nosso site."* A segunda opção custa uma linha e é mais honesta que deixar o comprador descobrir sozinho.

**9. Botão de compra fixo no mobile.** Em `app/produtos/[handle]/page.tsx:93-100` o bloco de compra é `sticky` no desktop, mas colapsa para 1 coluna no mobile — o sticky deixa de valer, e "Adicionar ao carrinho" aparece **uma única vez** no HTML. Quem rola as 13 especificações fica sem botão à vista.

---

## Iniciativas de longo prazo (este trimestre)

**1. Domínio próprio.** `tahora.com.br`, com 301 permanente do `vercel.app`. Resolve três problemas de uma vez: autoridade de SEO que hoje é construída num subdomínio alheio; confiança de um site que pede cartão num endereço que diz "vercel.app"; e viabilidade de e-mail transacional com SPF/DKIM em domínio próprio. **Fazer antes de submeter o sitemap ao Search Console**, para não indexar duas versões.

**2. Trocar o eixo de posicionamento.** "O melhor preço em eletrônicos originais" tem dois defeitos: 100% do catálogo é câmera, não "eletrônicos"; e o superlativo é refutável na primeira busca — a Amazon BR lista câmera iCSee equivalente a **R$78,99** com Prime e devolução. Em produto genérico importado sem exclusividade, preço não é fosso: qualquer concorrente iguala em 24h, e quem tem mais fôlego vence. Território alternativo, defensável e já parcialmente verdadeiro: **"segurança que você instala hoje — sem obra, sem técnico, sem mensalidade"**. A câmera-lâmpada de R$78, que rosqueia no bocal, é a prova viva dessa promessa e hoje está vendida apenas como "a mais barata".

**3. Captura de e-mail e fluxo pós-venda.** Não há newsletter ativa, pop-up nem qualquer captura antes do checkout — quem abandona antes de chegar lá é irrecuperável. Câmera é compra pontual (uma a cada 2–4 anos): **sem lista, cada venda queima o custo de aquisição numa única transação**. Fluxo de 4 e-mails: confirmação → guia de instalação → checagem em 7 dias com pedido de avaliação → oferta da 2ª câmera em 30 dias. Ataca retenção, prova social e AOV com um único ativo.

**4. Conteúdo de fundo de funil.** Nenhum blog hoje. A categoria tem busca informacional altíssima e barata: "como instalar câmera wifi sem furar parede", "câmera funciona sem internet?", "como configurar o app iCSee", "quantos dias o cartão grava". O negócio tem 4 anos de perguntas de clientes para virar conteúdo, e o artigo do iCSee ainda reduz volume de suporte no WhatsApp.

**5. Insert físico nos pedidos de ML e Shopee.** QR + cupom para a próxima compra no site. Custa centavos por pedido, converte clientes já satisfeitos e usa o **único ativo de tráfego que o negócio realmente tem hoje**. É a resposta correta ao conflito de canal: marketplace vira funil de aquisição, site vira margem e expansão — em vez de competirem por preço.

**6. Subir para a faixa de R$250–450.** O sweet spot do mercado brasileiro em 2026 (2K, IP66, detecção inteligente) está acima do catálogo atual, concentrado em R$78–263. Introduzir 2–3 SKUs nessa faixa e usar os baratos como isca de entrada.

---

## Análise detalhada por categoria

### Conteúdo & Mensagem — 41/100

**Forças.** A voz é genuinamente brasileira e não-corporativa — *"Chame que a gente responde no horário de atendimento"*, *"Fale com a gente sem intermediários"* —, o que é raro e difícil de comprar. `/sobre-nos` tem o melhor argumento do site inteiro (*"Sem o intermediário do marketplace, repassamos o desconto direto pra você"*), que responde à objeção real do comprador com uma razão-para-crer em vez de adjetivo. A FAQ da home traz números concretos e amparo no CDC.

**Lacunas.** O H1 falha no teste dos 5 segundos: promete "eletrônicos" e entrega câmeras — o próprio `/catalogo` admite com "Encontre a câmera ideal para você". Nenhuma linha do site fala da dor: os 4 benefícios da home (entrega rápida, compra segura, parcelamento, produtos originais) são todos sobre a **transação**, nenhum sobre o produto ou o medo que ele resolve. A PDP lista "Áudio bidirecional: Sim" sem traduzir para "fale com o entregador sem abrir o portão". A categoria mais emocional do varejo está sendo vendida como carregador USB. Os depoimentos citam produtos inexistentes no catálogo. A seção "Como funciona" — slot onde o visitante espera "como eu compro e recebo" — foi sequestrada para recrutar afiliados no meio do funil.

*Ressalva do subagente:* copy de PDP verificada em 3 dos 7 produtos (A31H, A38, Camera Lampada), todos sem prosa; padrão presumido nos outros 4, não confirmado individualmente.

### Otimização de Conversão — 52/100

**Forças.** O drawer de carrinho é a melhor peça de CRO do site e está acima da média do mercado brasileiro: cupom, linha de desconto com "você economizou", e o aviso crítico *"Um item do seu carrinho ficou indisponível. Remova-o para concluir a compra."* — que evita a pior frustração possível, descobrir o esgotado depois de preencher o checkout. O `BotaoAdicionar` chama `abrir()` **antes** do `await` da rede, com `aria-busy`, então o cliente vê resposta imediata. Funil curto: 4 cliques até o checkout, sem cadastro obrigatório. Catálogo com badges diferenciadores e filtros, reduzindo paralisia numa linha quase idêntica.

**Atritos.** A PDP é onde a venda acontece e está nua: sem parcelamento, sem frete, sem prazo, sem estoque, sem avaliação, sem garantia. Três histórias de pagamento conflitantes — a home diz "processado pela Shopify", o drawer diz "Pagamento seguro via Mercado Pago", a FAQ fala em boleto, e a PDP não diz nada. Zero captura de e-mail antes do checkout. Zero pixel, o que torna todo o tráfego pago não-mensurável e não-recuperável. No mobile o botão de compra some durante a rolagem da ficha técnica. O CTA secundário do hero ("Saber mais" → `/sobre-nos`) desvia o tráfego mais quente para uma página sem produto e sem preço, e "Começar agora" é copy de SaaS, não de varejo.

### SEO & Descoberta — 27/100

**Medido em produção.** `robots.txt` → **404**. `sitemap.xml` → **404** (ambos devolvendo a página 404 do Next, 9.271 bytes). Zero `application/ld+json` na home e na PDP. Meta description ausente em 100% das páginas — as únicas `<meta>` no `<head>` são `charSet` e `viewport`. Zero Open Graph e Twitter Card: **todo link do site colado no WhatsApp ou Instagram aparece como texto cru, sem imagem, sem título, sem preço** — o que é crítico para um negócio que vende por indicação e tem programa de afiliados, porque os afiliados estão compartilhando links feios que ninguém clica. Sem canonical e sem `metadataBase`, num site cujo próprio sistema de afiliados gera URLs com `?ref=` — **cada link de afiliado é uma URL nova aos olhos do Google**, diluindo sinais entre duplicatas da mesma PDP.

**A base é boa e barata de aproveitar:** HTML renderizado no servidor, TTFB de 0,07–0,19s via CDN, `lang="pt-BR"`, URLs limpas em português com palavra-chave, um H1 por página, alts descritivos na home. O score é baixo por **ausência de superfície**, não por defeito de engenharia — e é por isso que quase tudo se resolve em 4 arquivos.

**Outros achados.** ~446 KB de JavaScript comprimido na home (13 chunks, 1,59 MB descomprimidos), majoritariamente framer-motion, que envolve cada imagem em dois `motion.div`. As seções chegam com `opacity:0` e só são reveladas por JS: o Googlebot renderiza e indexa, mas crawlers sem JS — incluindo muitos bots de IA e prévias de link — veem página em branco. `<img>` puro sem `width`/`height`, sem `srcset` e sem `loading`, com risco de CLS; **as dimensões já trafegam no payload RSC** (`"width":3543,"height":3543`), estão a uma prop de distância. Na PDP, 8 imagens com `alt=""`. Na PDP o H1 é visualmente *menor* que os H2 abaixo dele. Um H2 vazio no rodapé. Apenas 1 `aria-label` na home e **zero elementos `<label>`**.

#### Metadata raiz — `app/layout.tsx`

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://ta-hora-loja.vercel.app"), // trocar pelo domínio próprio
  title: {
    default: "Ta Hora — Câmeras de Segurança Wi-Fi Originais",
    template: "%s | Ta Hora",
  },
  description:
    "Câmeras de segurança Wi-Fi originais com nota fiscal. Entrega para todo o Brasil, até 12x sem juros e suporte por WhatsApp.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Ta Hora",
    title: "Ta Hora — Câmeras de Segurança Wi-Fi Originais",
    description: "Câmeras Wi-Fi originais, entrega para todo o Brasil e até 12x.",
    images: [{ url: "/uploads/hero.webp", width: 1200, height: 1000, alt: "Ta Hora" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
}
```

O `template: "%s | Ta Hora"` faz cada página filha precisar só do próprio nome — e a PDP pode largar o sufixo manual `· Ta Hora`. Depois, `metadata` próprio em `app/catalogo/page.tsx` e `app/sobre-nos/page.tsx` com `title`, `description` e `alternates.canonical`.

#### `app/robots.ts` (criar)

```ts
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/carrinho"] },
    sitemap: "https://ta-hora-loja.vercel.app/sitemap.xml",
  }
}
```

#### `app/sitemap.ts` (criar) — usa o `getProducts` que já existe

```ts
import type { MetadataRoute } from "next"
import { getProducts } from "@/lib/shopify/products"

const BASE = "https://ta-hora-loja.vercel.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: BASE,                lastModified: new Date(), changeFrequency: "daily",   priority: 1 },
    { url: `${BASE}/catalogo`,  lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/sobre-nos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/suporte`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]
  try {
    const produtos = await getProducts()
    return [
      ...estaticas,
      ...produtos.map((p) => ({
        url: `${BASE}/produtos/${p.handle}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ]
  } catch {
    return estaticas // mesma tolerância a Shopify offline do resto do projeto
  }
}
```

#### JSON-LD de Product na PDP

Atenção ao formato do preço: o schema exige ponto decimal e nenhum separador de milhar (`"185.00"`, não `"185,00"`). Validar no Rich Results Test após publicar.

```tsx
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "Product",
  name: produto.title,
  image: produto.images?.map((i) => i.url) ?? [],
  sku: produto.handle,
  brand: { "@type": "Brand", name: "Ta Hora" },
  offers: {
    "@type": "Offer",
    url: `https://ta-hora-loja.vercel.app/produtos/${produto.handle}`,
    priceCurrency: "BRL",
    price: produto.price.price.replace(".", "").replace(",", "."),
    availability: produto.disponivel
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    seller: { "@type": "Organization", name: "Ta Hora" },
  },
}} />
```

### Posicionamento Competitivo — 42/100

**Posicionamento atual:** *"Somos a loja que vende câmeras Wi-Fi originais mais barato — e você já nos conhece dos marketplaces."* Duas promessas, nenhuma sustentável como está.

"Menor preço" não se sustenta no piso da categoria: a Amazon BR lista câmera iCSee externa 1080p a **R$78,99** com frete grátis, Prime e devolução — mesmo patamar da Camera Lampada (R$78), mas sem limiar de frete. A Tudo Forte tem câmeras Wi-Fi a partir de R$110–122. E preço em produto genérico não tem fosso: as mesmas câmeras iCSee/EseeCloud vêm dos mesmos fornecedores e são revendidas por centenas de sellers, sem marca, patente ou exclusividade.

"Você já nos conhece" é o ativo bom — e está subutilizado (só em `/sobre-nos`) **e quebrado** (o link leva a "CH CFTV & Eletrônicos").

**Concorrentes reais identificados:**

| Concorrente | Posicionamento | Faixa observada |
|---|---|---|
| [Tudo Forte](https://www.tudoforte.com.br) | Autoridade e especialização — 8 anos, +300 mil clientes, selos Site Blindado e Opiniões Verificadas | R$110–122 entrada; R$293–512 premium |
| [Loja Oficial Intelbras](https://loja.intelbras.com.br) | Marca nacional, garantia e suporte — disputa risco percebido, não preço | iM4 a R$269,90–419,90 |
| [Amazon BR (iCSee)](https://www.amazon.com.br/camera-wifi-icsee/s?k=camera+wifi+icsee) | Não se posiciona — é infraestrutura. Entrega rápida, devolução sem atrito, milhares de reviews | a partir de R$78,89 |

| Fator | **Ta Hora** | Tudo Forte | Intelbras | Amazon BR |
|---|---|---|---|---|
| Clareza do headline | 6/10 | 8/10 | 9/10 | 5/10 |
| Força da proposta de valor | 3/10 | 8/10 | 9/10 | 8/10 |
| Sinais de confiança | 3/10 | 9/10 | 10/10 | 10/10 |
| Eficácia do CTA | 4/10 | 7/10 | 8/10 | 9/10 |
| Clareza de preço | 7/10 | 8/10 | 8/10 | 9/10 |
| Profundidade de conteúdo | 2/10 | 8/10 | 9/10 | 7/10 |
| **Média** | **4,2** | **8,0** | **8,8** | **8,0** |

**A diferenciação existe e não é comunicada.** Cada SKU tem um papel de uso claro — Camera Lampada (R$78) rosqueia no bocal, zero instalação; Q8 (R$227) tem holofote para área externa; A38 (R$263) é 4K com alarme. Essas distinções vivem numa frase curta no card. Não há tabela comparativa, não há "qual é a sua?", não há specs completas (alcance IR em metros, IP66, se grava sem internet). **A Camera Lampada é o produto mais diferenciado do catálogo e está tratada como o mais barato da lista.**

**Categoria não ocupada:** ninguém no Brasil ocupa claramente *"segurança sem obra, sem técnico, sem mensalidade"*. A Intelbras fala com o instalador profissional, a Tudo Forte com o integrador de CFTV, a Amazon com ninguém. O comprador de câmera de R$78–263 é o dono da loja de bairro, o inquilino, a mãe que quer ver a babá — e o medo real dele não é preço, é **"vou conseguir instalar e configurar isso?"**.

### Marca & Confiança — 31/100

Confiança em e-commerce não se mede pelo que é verdade, e sim pelo que é **verificável em 10 segundos**. Existe negócio real por trás — 4 anos, marketplaces ativos, WhatsApp que responde, checkout Shopify que terceiriza a confiança do momento mais crítico, promessa explícita de nota fiscal e produto lacrado (que endereça a objeção central da categoria: "é paralelo?"). Mas nenhum dos checkpoints que o brasileiro usa antes de digitar o cartão é atendido.

O agravante decisivo é a **divergência de identidade**: a única prova externa forte do site aponta para outra marca. Somado ao nome oscilando entre "Ta Hora", "TAHora" e "Marca" no próprio site, e a quatro grandezas numéricas incompatíveis (10 mil / 20 mil / 10 mil vendas / 68 avaliações), o comprador atento conclui que **nenhum número do site é confiável** — inclusive os verdadeiros.

### Crescimento & Estratégia — 29/100

O negócio tem os dois ingredientes mais difíceis: **demanda comprovada** (segurança residencial em alta no Brasil, com o varejo especializado reportando crescimento de 40% em 12 meses) e **operação validada** (4 anos, catálogo testado, fornecedor conhecido, logística rodando — normalmente dois anos e muito capital). A infra técnica está à frente do marketing: carrinho próprio, rastreamento de afiliados completo e provado, cross-sell já renderizando.

**E nenhum motor está ligado.** Afiliados com infra pronta e `href="#"` na porta. Nenhuma captura de e-mail. Nenhum blog. Nenhum programa de indicação. Nenhum acessório no site, apesar de a mesma operação já vender cartão SD e kits de até R$992 no ML. O cross-sell da PDP sugere **outras câmeras mais caras** em vez de acessórios ou o kit da mesma câmera — e câmera é produto multi-unidade por natureza (frente, quintal, garagem).

O site só sabe converter tráfego que já chegou pronto — e, como o negócio nasceu em marketplace, **esse tráfego não existe fora do marketplace**. É um carro com motor bom, tanque cheio e o câmbio em ponto morto.

*Premissas declaradas pelo subagente, não medidas:* frete de R$25–45 por envio interestadual; comissão de marketplace de 12–20%. Devem ser substituídas por números reais antes de qualquer decisão de precificação.

---

## Impacto em receita — cenário modelado

**Leia esta ressalva antes da tabela.** Não há analytics instalado neste site. Não existe número real de sessões, conversão, ticket médio ou faturamento. A tabela abaixo é um **exercício de priorização** construído sobre premissas explícitas e arbitrárias, escolhidas apenas para tornar os itens comparáveis entre si. **Os valores absolutos não têm validade preditiva.** O que tem validade é a *ordem relativa*.

**Premissas:** 1.000 sessões/mês · conversão base 1% · ticket médio R$180 · faixas de melhoria vindas de benchmarks gerais de e-commerce, não deste site.

| Recomendação | Mecanismo | Impacto modelado/mês | Confiança | Prazo |
|---|---|---|---|---|
| Acessórios e kits no site | +R$40 no ticket de 30% dos pedidos | ~R$1.200 | Média | 2 sem |
| Parcelamento + confiança na PDP | +0,3 p.p. de conversão | ~R$540 | Média | 2 dias |
| CNPJ, políticas, rodapé assinado | +0,3 p.p. (remoção de suspeita) | ~R$540 | Baixa | 3 dias |
| Barra de frete grátis no carrinho | +R$25 em 25% dos pedidos | ~R$450 | Média | 1 sem |
| Domínio próprio | +0,2 p.p. | ~R$360 | Baixa | 2 sem |
| Descrição narrativa nas PDPs | +0,2 p.p. | ~R$360 | Média | 1 sem |
| Depoimentos e números corrigidos | +0,15 p.p. | ~R$270 | Baixa | 1 dia |
| Programa de afiliados aberto | novo canal de aquisição | não modelável | — | 3 sem |
| SEO técnico (schema, sitemap, meta) | tráfego orgânico novo | não modelável | — | 1 sem |
| Captura de e-mail + pós-venda | recompra e recuperação | não modelável | — | 1 mês |
| **Soma dos itens modeláveis** | | **~R$3.700/mês** | | |

Os quatro itens "não modeláveis" são justamente os de **maior potencial de longo prazo** — criam tráfego e recompra em vez de otimizar o que já existe. Não recebem número porque qualquer valor seria invenção.

**Nada disso será verificável enquanto não houver analytics.** Instalar medição é a recomendação que destrava a avaliação de todas as outras.

---

## Próximos passos

1. **Assinar o site.** Rodapé com CNPJ e razão social, `/politica-de-privacidade`, `/termos-de-uso` e `/trocas-e-devolucoes` publicadas, domínio `tahora.com.br` registrado. Sem isso, todo esforço de tráfego é despejado num site que o comprador brasileiro lê como golpe — e sem as páginas legais nem é possível aprovar conta de anúncio.
2. **Converter o hero de 1 MB e colar os 4 arquivos de SEO** (`layout.tsx`, `catalogo/page.tsx`, `sobre-nos/page.tsx`, `robots.ts` + `sitemap.ts`). Menos de uma hora de trabalho, resolve quatro dos seis problemas críticos de descoberta.
3. **Publicar acessórios e kits, ligar a barra de frete grátis e instalar GA4 + Pixel.** O sortimento já existe no ML, o componente de upsell já existe no drawer, e a medição é o que torna tudo o mais avaliável.

---

## Notas de método e limitações

- Auditoria conduzida por 5 análises paralelas (conteúdo, conversão, competitivo, técnico, estratégia) sobre a URL de produção em 30/07/2026, complementadas por leitura do repositório local.
- **Verificado diretamente por mim:** o arquivo do hero é PNG com extensão `.webp` (magic bytes `\211 P N G`, `1200 x 1000`, idêntico em produção e local); a loja linkada no Mercado Livre se chama "CH CFTV & Eletrônicos" e não contém a expressão "Ta Hora"; `robots.txt` e `sitemap.xml` retornam 404; os títulos duplicados; a ausência de JSON-LD e meta description.
- **Um alerta de subagente foi descartado após verificação:** o relato de que `/produtos/camera-seguranca-q6` estaria quebrado partiu de um slug deduzido incorretamente. A URL real é `/produtos/camera-de-seguranca-q6`, que responde 200.
- **Outro foi reenquadrado:** a divergência do badge do hero entre deploy e repositório decorre de uma edição local não commitada feita durante esta sessão, não de uma falha de governança de conteúdo. Permanece real, porém, o inverso — o site em produção serve `imageSrc`/`imageAlt` do hero que não existiam no repositório, indicando que o deploy não corresponde ao `main`.
- Sem acesso a analytics, Search Console, admin da Shopify ou dados financeiros. Nenhum número de tráfego, conversão, CAC, margem ou faturamento foi medido — nem estimado como se fosse medido.
- Nenhum Lighthouse/PageSpeed foi executado; os riscos de LCP e CLS estão descritos qualitativamente, a partir do peso de arquivo medido e do código inspecionado.
- Cobertura de PDP: 3 dos 7 produtos lidos em profundidade.
- Nenhuma alteração de código foi feita por esta auditoria.

*Gerado pela AI Marketing Suite — `/market audit`*
