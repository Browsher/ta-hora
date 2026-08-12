// Guarda de Open Graph — confere o HTML JÁ CONSTRUÍDO das páginas estáticas.
//
// ═══ O DEFEITO QUE ESTE SCRIPT EXISTE PARA PEGAR ═══════════════════════════
//
// Até 12/08/2026, SEIS das 14 páginas emitiam `og:url = https://www.tahora.com.br`
// — a home — porque declaravam `title`/`description`/`alternates` e nenhum
// `openGraph`, e o Next herda o bloco INTEIRO do layout raiz quando o filho não o
// declara. Um link do /catalogo colado no WhatsApp mostrava a prévia da home.
//
// Ficou meses no ar. Não quebrou build, não quebrou `tsc`, não quebrou teste, e
// nenhuma ferramenta reclamou: metadata errada é HTML válido. Só apareceu quando
// alguém foi ler o `<head>` servido, de propósito, procurando outra coisa.
//
// É exatamente a categoria de defeito que este projeto resolve com script de
// verificação (ver verificar-schema.mjs, verificar-descricao.mjs): fato público,
// silencioso, e que reaparece na próxima página nova se ninguém estiver olhando.
//
// ═══ POR QUE LÊ O BUILD, E NÃO A REDE ══════════════════════════════════════
//
// As páginas estáticas ficam pré-renderizadas em `.next/server/app/*.html`. Ler
// dali significa: sem token, sem servidor de pé, sem rede, e — o que importa —
// conferindo o que ESTE commit produz, não o que está em produção (que é o
// commit anterior). Um check que passa porque produção está certa enquanto o
// código atual está errado seria pior que não ter check.
//
// ⚠️ RODA DEPOIS DO BUILD, e não pode entrar no `prebuild`: ele lê a saída do
// build. Sem `.next/server/app`, avisa e sai com sucesso — em máquina limpa a
// ausência de build não é falha de OG.
//
// ⚠️ AS 7 PDPs FICAM DE FORA. Elas usam `generateMetadata` e são geradas por
// `generateStaticParams`, com nome de arquivo por handle; o `openGraph` delas já
// era próprio e correto desde antes deste problema. Estão fora do ESCOPO, não
// isentas — se um dia migrarem para o helper, entram aqui junto.
//
// ⚠️ SEMPRE `process.exitCode = N`, NUNCA `process.exit(N)` — ver o comentário
// extenso em verificar-variantes.mjs (handles do libuv, exit 127 no Windows).

import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..")
const SAIDA = join(RAIZ, ".next", "server", "app")

// A origem canônica é a mesma de lib/site.ts. Duplicada aqui como LITERAL de
// propósito: o script é Node puro e não importa TypeScript (mesma razão da
// "camada 0" de verificar-schema.mjs). Se divergirem, este check falha — que é o
// comportamento certo, porque divergência de domínio é o defeito que lib/site.ts
// documenta ter custado a indexação do domínio novo.
const SITE_URL = "https://www.tahora.com.br"

/** Rota → arquivo pré-renderizado. A home é `index.html`. */
const PAGINAS = [
  { rota: "/",                       arquivo: "index.html" },
  { rota: "/catalogo",               arquivo: "catalogo.html" },
  { rota: "/sobre-nos",              arquivo: "sobre-nos.html" },
  { rota: "/suporte",                arquivo: "suporte.html" },
  { rota: "/politica-de-privacidade",arquivo: "politica-de-privacidade.html" },
  { rota: "/termos-de-uso",          arquivo: "termos-de-uso.html" },
  { rota: "/trocas-e-devolucoes",    arquivo: "trocas-e-devolucoes.html" },
]

let falhas = 0
const falhar = (msg) => { console.error(`  ✖ ${msg}`); falhas++ }

/** Valor de um <meta property="..."> ou <meta name="...">, ou null. */
function meta(html, chave) {
  const porProperty = new RegExp(`<meta[^>]+property="${chave}"[^>]+content="([^"]*)"`, "i")
  const porName     = new RegExp(`<meta[^>]+name="${chave}"[^>]+content="([^"]*)"`, "i")
  return (html.match(porProperty) ?? html.match(porName))?.[1] ?? null
}

/** href do <link rel="canonical">. */
function canonical(html) {
  return html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i)?.[1] ?? null
}

console.log("Guarda de Open Graph — HTML pré-renderizado em .next/server/app\n")

if (!existsSync(SAIDA)) {
  console.log("  ⚠ .next/server/app não existe — rode `npm run build` antes.")
  console.log("    Saindo com sucesso: build ausente não é falha de OG.")
} else {
  for (const { rota, arquivo } of PAGINAS) {
    const caminho = join(SAIDA, arquivo)
    if (!existsSync(caminho)) {
      falhar(`${rota}: ${arquivo} não existe no build — a rota saiu do pré-render?`)
      continue
    }
    const html = readFileSync(caminho, "utf8")
    const esperada = rota === "/" ? SITE_URL : `${SITE_URL}${rota}`
    // Falhas ANTES desta página — sem isso, um erro na primeira rota calaria o
    // "✓" de todas as seguintes e o relatório pareceria pior do que é.
    const falhasAntes = falhas

    // ── A REGRA. É o defeito descrito no topo, e é o único item aqui que já
    // esteve errado em produção.
    const ogUrl = meta(html, "og:url")
    if (ogUrl !== esperada) {
      falhar(
        `${rota}: og:url = ${JSON.stringify(ogUrl)}, esperado ${JSON.stringify(esperada)}.\n` +
        `     Causa provável: a página não declara \`openGraph\` e herdou o bloco INTEIRO\n` +
        `     do app/layout.tsx — inclusive a url da home. Use metadataPagina() de\n` +
        `     lib/seo/metadataPagina.ts; declarar só a \`url\` DESCARTA imagem, siteName,\n` +
        `     locale e type, e sai pior que herdar.`,
      )
    }

    // og:url e canonical afirmam a mesma coisa para públicos diferentes. Divergir
    // é sempre bug, e o helper deriva os dois do mesmo `path` justamente para
    // tornar isso impossível — este check cobre quem NÃO usar o helper.
    const canon = canonical(html)
    if (canon && ogUrl && canon !== ogUrl) {
      falhar(`${rota}: canonical (${canon}) ≠ og:url (${ogUrl})`)
    }

    // Campos sem os quais a prévia degrada. Preview sem miniatura é PIOR que
    // preview com a imagem errada — foi o argumento de emitir o bloco inteiro.
    for (const campo of ["og:title", "og:description", "og:image", "og:site_name"]) {
      if (!meta(html, campo)) falhar(`${rota}: sem ${campo}`)
    }

    // O sufixo do `template` NÃO se aplica ao Open Graph, e o og:site_name já diz
    // a marca. "Suporte | Ta Hora" no og:title vira "Suporte | Ta Hora · Ta Hora"
    // na prévia — ver o aviso em app/layout.tsx.
    const ogTitle = meta(html, "og:title")
    if (ogTitle?.includes("| Ta Hora")) {
      falhar(`${rota}: og:title carrega o sufixo "| Ta Hora" (${ogTitle}) — o og:site_name já diz a marca`)
    }

    if (falhas === falhasAntes) console.log(`  ✓ ${rota}`)
  }
}

if (falhas > 0) {
  console.error(`\n✖ ${falhas} problema(s) de Open Graph.`)
  process.exitCode = 1
} else {
  console.log("\n✓ Open Graph íntegro — cada página anuncia a si mesma.")
}
