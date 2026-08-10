// Origem canônica do site — o ÚNICO lugar onde a URL de produção vive.
//
// ⚠️ AQUI VIVE O DOMÍNIO. `metadataBase` (app/layout.tsx), o `sitemap` do
// robots.txt (app/robots.ts) e todas as URLs do sitemap (app/sitemap.ts) derivam
// desta constante — trocar aqui é trocar em todos.
//
// ─── 🔴 É `www.`, E NÃO O APEX. NÃO REMOVA. ──────────────────────────────────
//
// Verificado ao vivo em 10/08/2026:
//
//     https://tahora.com.br      → 301 → https://www.tahora.com.br/
//     https://www.tahora.com.br  → 200 (Server: Vercel, x-vercel-cache: HIT)
//
// O apex REDIRECIONA. Um canonical que aponta para uma URL que responde 301 faz o
// Google descartá-lo e escolher o destino sozinho — o canonical existe mas para
// de significar algo. O valor tem que ser o host que serve 200 direto, e hoje é o
// `www`.
//
// Se um dia o redirecionamento for invertido (www → apex), esta constante muda
// junto, no mesmo commit.
//
// ─── HISTÓRICO: por que isto estava errado, e o que custou ───────────────────
//
// Até 10/08/2026 esta constante era `https://ta-hora-loja.vercel.app`, com um
// comentário dizendo que o domínio próprio "ainda NÃO está configurado". O DNS já
// tinha sido migrado; só o código não sabia. O que estava no ar:
//
//     www.tahora.com.br  →  <link rel="canonical" href="https://ta-hora-loja.vercel.app"/>
//                           <meta property="og:url" content="https://ta-hora-loja.vercel.app"/>
//                           og:image  → https://ta-hora-loja.vercel.app/uploads/og-image.webp
//                           robots.txt → Sitemap: https://ta-hora-loja.vercel.app/sitemap.xml
//                           sitemap.xml → todas as <loc> no domínio antigo
//
// E o domínio antigo continua respondendo 200. Ou seja: o domínio novo estava
// dizendo ao Google "a versão real desta página é a do vercel.app" — empurrando a
// indexação para o host que não é a marca, ativamente, em toda rota. Não era
// ausência de migração: era uma migração que apontava para o lado errado.
//
// Nada disso quebra build, `tsc` ou teste. Só aparece semanas depois, no Search
// Console, como o domínio novo não ranqueando.
//
// ⚠️ Pendência FORA do código: fazer `ta-hora-loja.vercel.app` redirecionar para
// `www.tahora.com.br` nas configurações de domínio do projeto na Vercel. Enquanto
// os dois servirem 200 com conteúdo idêntico, seguem sendo duas cópias do site
// aos olhos do Google — o canonical corrigido resolve o sinal, o redirecionamento
// resolve o fato.
//
// Por que uma constante e não a string repetida nos três arquivos: os canonicals
// e o sitemap PRECISAM concordar. Três cópias literais viram, na primeira
// migração de domínio, um sitemap apontando para o domínio novo e canonicals
// ainda no domínio velho — divergência que o build não acusa e que só aparece
// semanas depois no Search Console.
//
// Sem barra no fim: quem concatena usa `${SITE_URL}/rota`.
export const SITE_URL = "https://www.tahora.com.br"
