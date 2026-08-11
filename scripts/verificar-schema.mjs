// Salvaguarda do JSON-LD `Product` das PDPs (feature product-schema).
//
// Uso:  npm run verificar:schema              → camadas 1 e 2 (precisa do token)
//       node scripts/verificar-schema.mjs --sem-rede  → só a camada 1
//
// (exit 0 = tudo certo; exit 1 = caiu)
//
// Verifica DUAS coisas, e a segunda é a razão de o arquivo existir:
//
//   1. ESTRUTURA — os campos obrigatórios estão lá, o preço está no formato que
//      o schema.org exige, a moeda é código ISO, a URL é canônica.
//   2. 🔴 AUSÊNCIA de `aggregateRating` e `review` — a regra que este script
//      trava em CÓDIGO, para não depender da memória de quem mexer depois.
//
// Por que a regra nº 2 importa mais que a nº 1: um campo obrigatório faltando
// custa um rich result. Um `aggregateRating` montado com os depoimentos de
// marketplace da home custa AÇÃO MANUAL do Google, que derruba os rich results do
// domínio inteiro por semanas. Ver o bloco no topo de lib/seo/produtoSchema.ts.
//
// ─── ACOPLAMENTO AO BUILD: A CAMADA 1 SIM, A CAMADA 2 NÃO ────────────────────
//
// Este é o ÚNICO `verificar:*` que roda dentro do `npm run build`, e roda só pela
// metade. A divisão não é meio-termo — é o que cada camada precisa:
//
//   CAMADA 0 (código-fonte) + CAMADA 1 (fixtures)
//                        → JS puro, sem rede, sem env. Acopladas ao build, porque
//                          é a camada 0 que carrega a regra do `aggregateRating`:
//                          a proteção tem que disparar no momento em que alguém
//                          adiciona o campo, não semanas depois.
//   CAMADA 2 (Storefront)→ precisa de token e de rede. FICA FORA do build por
//                          duas razões independentes: o Req 8.6 exige que o build
//                          passe SEM `.env.local`, e uma falha de rede da Shopify
//                          derrubaria um build que não tem nada de errado.
//
// 🔴 A FLAG `--sem-rede` É EXPLÍCITA DE PROPÓSITO. O build poderia simplesmente
// não passar `--env-file` e deixar a camada 2 se pular sozinha por falta de
// token — mas aí a garantia dependeria de o ambiente NÃO ter as variáveis. Numa
// máquina (ou num CI) com `SHOPIFY_STOREFRONT_TOKEN` exportado no shell, a camada
// 2 voltaria a rodar dentro do build em silêncio, e a Shopify fora do ar viraria
// build quebrado. A flag torna o comportamento uma decisão do chamador, não um
// acidente do ambiente.
//
// ⚠️ DUPLICAÇÃO DECLARADA (exceção do Req 10.4), igual aos irmãos: roda em Node
// puro, fora do Next — não pode importar `lib/` (é TypeScript). Por isso
// REIMPLEMENTA o formato esperado do objeto. É essa reimplementação independente
// que dá valor ao check: se ele importasse o módulo, concordaria com o bug.

const DEFAULT_API_VERSION = "2026-01"

const domain  = process.env.SHOPIFY_STORE_DOMAIN
const token   = process.env.SHOPIFY_STOREFRONT_TOKEN
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || DEFAULT_API_VERSION

const SITE_URL = "https://www.tahora.com.br"
const COLECAO  = "cameras"

/** `--sem-rede`: só a camada 1. É o modo que o `npm run build` usa — ver o topo. */
const SEM_REDE = process.argv.includes("--sem-rede")

// ⚠️ SEMPRE `process.exitCode = N`, NUNCA `process.exit(N)` — ver o comentário
// extenso em verificar-variantes.mjs (handles do libuv, exit 127 no Windows).

const PROIBIDOS = ["aggregateRating", "review", "reviews", "ratingValue", "reviewCount"]

let falhas = 0
const falhar = (msg) => { console.error(`  ✖ ${msg}`); falhas++ }

// ─── Camada 0: o MÓDULO REAL, inspecionado no código-fonte ───────────────────
//
// 🔴 SEM ESTA CAMADA O SCRIPT SERIA DECORATIVO NA REGRA QUE MAIS IMPORTA, e vale
// registrar por quê — o erro é sutil e eu o cometi ao escrever este arquivo.
//
// As camadas 1 e 2 montam o objeto com o `montar()` daqui de baixo, que é uma
// REIMPLEMENTAÇÃO do contrato. Isso é proposital (um check que importa o módulo
// concorda com o bug do módulo) e funciona bem para formato de preço, moeda e
// URL canônica — coisas que o contrato define.
//
// Mas não funciona para a regra do `aggregateRating`: se alguém adicionar o campo
// em `lib/seo/produtoSchema.ts`, o `montar()` daqui continua sem ele, os dois
// níveis passam verdes, e o campo proibido vai para produção com o check dizendo
// "íntegro". A reimplementação que dá independência ao teste é a mesma coisa que
// o cega para uma edição no arquivo real.
//
// Esta camada fecha isso pelo lado do CÓDIGO-FONTE: lê o módulo como texto,
// remove os comentários (o arquivo MENCIONA `aggregateRating` várias vezes, de
// propósito, no bloco de aviso) e falha se qualquer campo proibido sobrar no
// código executável.
//
// Por que fonte e não import: o módulo é TypeScript e usa o alias `@/`. Rodá-lo
// em Node puro exigiria type-stripping (Node ≥ 22.18) e resolução de alias — duas
// premissas sobre a versão do Node do build da Vercel que este check não pode ter,
// porque quebrar o build por causa do próprio guarda seria pior que o bug.

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..")
const MODULO = "lib/seo/produtoSchema.ts"

/** Remove comentários de bloco e de linha, preservando `https://` em strings. */
function semComentarios(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
}

console.log(`Camada 0 — código-fonte de ${MODULO}\n`)

try {
  const fonte = semComentarios(readFileSync(join(RAIZ, MODULO), "utf8"))
  const achados = PROIBIDOS.filter((c) => fonte.includes(c))
  if (achados.length > 0) {
    falhar(
      `${MODULO} contém ${achados.map((c) => `"${c}"`).join(", ")} no código executável.\n` +
      `     Os depoimentos da loja são transcrições de Mercado Livre/Shopee — marcá-los\n` +
      `     como avaliação própria é AÇÃO MANUAL do Google, que derruba os rich results\n` +
      `     do domínio INTEIRO por semanas, não só a estrela desta PDP.\n` +
      `     O caminho legítimo (avaliação de primeira parte) está no item 18 do SEO-AUDIT.md.`,
    )
  } else {
    console.log("  ✓ módulo real sem aggregateRating/review fora dos comentários")
  }
} catch (e) {
  falhar(`não consegui ler ${MODULO}: ${e.message}`)
}

// ─── Camada 1: regras puras, SEM rede ────────────────────────────────────────
//
// Roda sempre, com ou sem token. Exercita o formato com dados fabricados,
// incluindo os casos de borda que os dados reais hoje NÃO cobrem (produto
// esgotado, produto sem SKU, produto sem resumo).

/** Reimplementação do contrato — de propósito NÃO importa lib/seo/produtoSchema.ts. */
function conferirFormato(obj, rotulo) {
  if (obj["@context"] !== "https://schema.org") falhar(`${rotulo}: @context errado`)
  if (obj["@type"] !== "Product")                falhar(`${rotulo}: @type errado`)
  if (!obj.name)                                 falhar(`${rotulo}: sem name`)

  // 🔴 A REGRA. Varre o objeto INTEIRO, em qualquer profundidade — um
  // `aggregateRating` aninhado dentro de `offers` contaria igual.
  const cru = JSON.stringify(obj)
  for (const campo of PROIBIDOS) {
    if (cru.includes(`"${campo}"`)) {
      falhar(
        `${rotulo}: campo PROIBIDO "${campo}" presente no schema.\n` +
        `     Os depoimentos da loja são transcrições de Mercado Livre/Shopee —\n` +
        `     marcá-los como avaliação própria é ação manual do Google, que derruba\n` +
        `     os rich results do domínio inteiro. Ver lib/seo/produtoSchema.ts.`,
      )
    }
  }

  const o = obj.offers
  if (!o || o["@type"] !== "Offer") { falhar(`${rotulo}: sem offers`); return }

  // Formato do preço: "185.00". O erro que este teste existe para pegar é o
  // `price.price` pt-BR ("1.799,90"), que o Google leria como 1.79.
  if (!/^\d+\.\d{2}$/.test(String(o.price))) {
    falhar(`${rotulo}: price ${JSON.stringify(o.price)} fora do formato "0.00"`)
  }
  if (!/^[A-Z]{3}$/.test(String(o.priceCurrency))) {
    falhar(`${rotulo}: priceCurrency ${JSON.stringify(o.priceCurrency)} não é código ISO (é o símbolo "R$"?)`)
  }
  if (!["https://schema.org/InStock", "https://schema.org/OutOfStock"].includes(o.availability)) {
    falhar(`${rotulo}: availability inválida: ${JSON.stringify(o.availability)}`)
  }
  if (!String(o.url).startsWith(`${SITE_URL}/produtos/`)) {
    falhar(`${rotulo}: offers.url não é canônica: ${JSON.stringify(o.url)}`)
  }
  if (String(o.url).includes("?")) {
    falhar(`${rotulo}: offers.url carrega query (o ?ref= dos afiliados não pode entrar)`)
  }
  // Campos opcionais: quando presentes, não podem estar vazios.
  for (const campo of ["sku", "description"]) {
    if (campo in obj && !String(obj[campo]).trim()) {
      falhar(`${rotulo}: "${campo}" presente mas vazio — deveria ser OMITIDO`)
    }
  }
}

/** Monta o objeto do mesmo jeito que o módulo TS — reimplementado de propósito. */
function montar({ title, handle, preco, moeda, disponivel, sku, resumo, imagem }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    ...(imagem ? { image: [imagem] } : {}),
    ...(resumo ? { description: resumo } : {}),
    ...(sku ? { sku } : {}),
    offers: {
      "@type": "Offer",
      price: preco.toFixed(2),
      priceCurrency: moeda,
      availability: disponivel ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${SITE_URL}/produtos/${handle}`,
      seller: { "@type": "Organization", name: "Ta Hora" },
    },
  }
}

console.log("\nCamada 1 — formato do contrato, em fixtures (sem rede)\n")

const FIXTURES = [
  { rotulo: "completo",     p: { title: "Câmera X", handle: "camera-x", preco: 185, moeda: "BRL", disponivel: true,  sku: "ES-X", resumo: "Resumo.", imagem: "https://cdn/x.png?width=1200" } },
  { rotulo: "sem sku",      p: { title: "Câmera Y", handle: "camera-y", preco: 78,  moeda: "BRL", disponivel: true,  sku: null,   resumo: "Resumo.", imagem: "https://cdn/y.png?width=1200" } },
  { rotulo: "esgotado",     p: { title: "Câmera Z", handle: "camera-z", preco: 263, moeda: "BRL", disponivel: false, sku: "ES-Z", resumo: "Resumo.", imagem: "https://cdn/z.png?width=1200" } },
  { rotulo: "sem resumo",   p: { title: "Câmera W", handle: "camera-w", preco: 115, moeda: "BRL", disponivel: true,  sku: "ES-W", resumo: null,      imagem: "https://cdn/w.png?width=1200" } },
  { rotulo: "sem imagem",   p: { title: "Câmera V", handle: "camera-v", preco: 158, moeda: "BRL", disponivel: true,  sku: "ES-V", resumo: "Resumo.", imagem: null } },
]

for (const { rotulo, p } of FIXTURES) conferirFormato(montar(p), `fixture[${rotulo}]`)

// Contraprova: o detector precisa DETECTAR. Se este bloco não acusar falha, o
// check inteiro é decorativo — e um check decorativo é pior que nenhum.
{
  const antes = falhas
  const envenenado = montar(FIXTURES[0].p)
  envenenado.aggregateRating = { "@type": "AggregateRating", ratingValue: "4.7", reviewCount: "10000" }

  // Silencia o `console.error` DURANTE a contraprova: as falhas aqui são o
  // resultado ESPERADO, e imprimi-las faria um check que passa parecer um check
  // que falhou — a saída mais perigosa que um script de salvaguarda pode ter.
  const erroReal = console.error
  console.error = () => {}
  conferirFormato(envenenado, "contraprova")
  console.error = erroReal

  if (falhas === antes) {
    console.error("  ✖ FALHA GRAVE: a contraprova passou — o detector de aggregateRating NÃO funciona.")
    falhas++
  } else {
    falhas = antes // as falhas da contraprova eram esperadas
    console.log("  ✓ contraprova: aggregateRating injetado FOI detectado")
  }
}

if (falhas === 0) console.log("  ✓ 5 fixtures no formato correto, sem campos proibidos")

// ─── Camada 2: os 7 produtos REAIS ───────────────────────────────────────────

if (SEM_REDE) {
  // Modo do build. Silencioso de propósito: uma linha no log, e o build segue.
  console.log("\nCamada 2 — pulada (--sem-rede). Rode `npm run verificar:schema` antes de publicar.")
} else if (!domain || !token) {
  console.log(
    "\nCamada 2 — PULADA: SHOPIFY_STORE_DOMAIN/SHOPIFY_STOREFRONT_TOKEN ausentes.\n" +
    "  Rode via `npm run verificar:schema` (passa --env-file=.env.local) para\n" +
    "  conferir os produtos reais.",
  )
} else {
  console.log("\nCamada 2 — produtos reais da Storefront API\n")

  const Q = `
    query VerificarSchema($handle: String!) {
      collection(handle: $handle) {
        products(first: 50, sortKey: MANUAL) {
          nodes {
            handle
            title
            availableForSale
            priceRange { minVariantPrice { amount currencyCode } }
            images(first: 1) { nodes { url } }
            resumo: metafield(namespace: "custom", key: "resumo") { value }
            variants(first: 1) { nodes { sku } }
          }
        }
      }
    }
  `

  try {
    const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query: Q, variables: { handle: COLECAO } }),
    })
    const json = await res.json()
    if (json.errors) {
      falhar(`Storefront devolveu erros: ${JSON.stringify(json.errors)}`)
    }

    const nodes = json.data?.collection?.products?.nodes ?? []
    if (nodes.length === 0) {
      falhar(`coleção "${COLECAO}" vazia ou não publicada no canal Storefront`)
    }

    const semSku = []
    for (const p of nodes) {
      const obj = montar({
        title:      p.title,
        handle:     p.handle,
        preco:      Number(p.priceRange.minVariantPrice.amount),
        moeda:      p.priceRange.minVariantPrice.currencyCode,
        disponivel: p.availableForSale,
        sku:        p.variants.nodes[0]?.sku?.trim() || null,
        resumo:     p.resumo?.value?.trim() || null,
        imagem:     p.images.nodes[0]?.url ?? null,
      })
      conferirFormato(obj, p.handle)
      if (!obj.sku) semSku.push(p.handle)
      if (!obj.description) falhar(`${p.handle}: sem custom.resumo — o schema sairia sem description`)
      if (!obj.image) falhar(`${p.handle}: sem imagem`)
    }

    console.log(`  ✓ ${nodes.length} produtos conferidos`)

    // AVISO, não falha: o schema omite `sku` corretamente quando ausente. Isto é
    // pendência de cadastro no admin, não bug de código.
    if (semSku.length > 0) {
      console.log(
        `\n  ⚠ ${semSku.length} sem SKU cadastrado na Shopify: ${semSku.join(", ")}\n` +
        `    O schema OMITE o campo (correto), mas cadastrar completa o dado.`,
      )
    }
  } catch (e) {
    falhar(`falha ao consultar a Storefront: ${e.message}`)
  }
}

// ─── Resultado ───────────────────────────────────────────────────────────────

if (falhas > 0) {
  console.error(
    `\n✖ ${falhas} problema(s) no JSON-LD.` +
    (SEM_REDE ? "\n  (rodando dentro do build — o build para aqui, e é para isso que ele existe)" : ""),
  )
  process.exitCode = 1
} else {
  console.log("\n✓ JSON-LD Product íntegro — sem aggregateRating, sem review.")
  process.exitCode = 0
}
