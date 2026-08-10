// Gerador dos exports legais para colar na Shopify.
// Uso: node exportar-legal.mjs <layout.json> <saida-sem-extensao>
// Produz <saida>.html (modo código-fonte do editor da Shopify) e <saida>.md.
//
// Regras deduzidas dos arquivos de 31/07/2026 e validadas por diff byte a byte:
//   - Só a seção TextoLegal entra. Navbar e Footer são ignorados.
//   - Chaves começando com "_" são anotações internas: NUNCA saem.
//   - `titulo` -> <h1> / linha solta ;  `atualizadoEm` -> <p> / linha solta
//   - `introducao` só sai se não for vazia
//   - bloco.titulo -> <h2> ; bloco.paragrafos -> <p> ; bloco.lista -> <ul><li>
//   - `contatoTitulo` -> <h2> ; `contatoTexto` -> <p>
//   - link `[rotulo](url)` -> HTML: <a href="url">rotulo</a>
//                          -> MD:   rotulo (url)
//   - CAMINHO INTERNO ("/rota") é reescrito para a rota equivalente de política da
//     Shopify (ver ROTAS_SHOPIFY). O export é para colar NA Shopify: "/suporte"
//     lá dentro aponta para uma página que não existe.
//   - No MD, link INTERNO perde a URL (só o rótulo). Um "/policies/..." solto em
//     texto corrido não serve para nada. Link EXTERNO mantém "(url)".
//     ⚠️ As duas regras acima NÃO aparecem em politica-de-privacidade.json, que só
//     tem um link externo. Foram descobertas validando contra termos-de-uso.json —
//     por isso a validação roda nos DOIS arquivos.
//   - MD: blocos separados por linha em branco; itens de lista prefixados "— "
//   - Ambos terminam com um \n final.

import { readFileSync, writeFileSync } from "node:fs"

const [entrada, saida] = process.argv.slice(2)
if (!entrada || !saida) {
  console.error("uso: node exportar-legal.mjs <layout.json> <saida-sem-extensao>")
  process.exit(1)
}

const layout = JSON.parse(readFileSync(entrada, "utf8"))
const legal = layout.sections.find((s) => s.component === "TextoLegal")
if (!legal) throw new Error("nenhuma seção TextoLegal em " + entrada)
const c = legal.content

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g

/** Rota do site -> rota de política da Shopify. */
const ROTAS_SHOPIFY = {
  "/politica-de-privacidade": "/policies/privacy-policy",
  "/termos-de-uso":           "/policies/terms-of-service",
  "/trocas-e-devolucoes":     "/policies/refund-policy",
}

const interno = (url) => url.startsWith("/")

function destino(url) {
  if (!interno(url)) return url
  const mapeado = ROTAS_SHOPIFY[url]
  if (!mapeado) throw new Error(
    `caminho interno sem equivalente na Shopify: ${url}\n` +
    "Acrescente em ROTAS_SHOPIFY ou troque o link no JSON. Deixar passar geraria " +
    "um link quebrado dentro da política publicada.",
  )
  return mapeado
}

const paraHtml = (t) =>
  t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // O link é reintroduzido DEPOIS do escape, senão as aspas do href viram
    // entidades. A ordem importa.
    .replace(LINK, (_, rotulo, url) => `<a href="${destino(url)}">${rotulo}</a>`)

const paraMd = (t) =>
  // Link interno: só o rótulo. Externo: rótulo + URL entre parênteses.
  t.replace(LINK, (_, rotulo, url) => (interno(url) ? rotulo : `${rotulo} (${url})`))

const html = []
const md = []

html.push(`<h1>${paraHtml(c.titulo)}</h1>`)
md.push(paraMd(c.titulo))

if (c.atualizadoEm) {
  html.push(`<p>${paraHtml(c.atualizadoEm)}</p>`)
  md.push(paraMd(c.atualizadoEm))
}

if (c.introducao) {
  html.push(`<p>${paraHtml(c.introducao)}</p>`)
  md.push(paraMd(c.introducao))
}

for (const b of c.blocos ?? []) {
  if (b.titulo) {
    html.push(`<h2>${paraHtml(b.titulo)}</h2>`)
    md.push(paraMd(b.titulo))
  }
  for (const p of b.paragrafos ?? []) {
    html.push(`<p>${paraHtml(p)}</p>`)
    md.push(paraMd(p))
  }
  if (b.lista?.length) {
    html.push("<ul>")
    for (const item of b.lista) html.push(`  <li>${paraHtml(item)}</li>`)
    html.push("</ul>")
    for (const item of b.lista) md.push(`— ${paraMd(item)}`)
  }
}

if (c.contatoTitulo) {
  html.push(`<h2>${paraHtml(c.contatoTitulo)}</h2>`)
  md.push(paraMd(c.contatoTitulo))
}
if (c.contatoTexto) {
  html.push(`<p>${paraHtml(c.contatoTexto)}</p>`)
  md.push(paraMd(c.contatoTexto))
}

writeFileSync(`${saida}.html`, html.join("\n") + "\n", "utf8")
writeFileSync(`${saida}.md`, md.join("\n\n") + "\n", "utf8")
console.log(`ok: ${saida}.html (${html.length} linhas) e ${saida}.md (${md.length} blocos)`)
