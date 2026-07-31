// Origem canônica do site — o ÚNICO lugar onde a URL de produção vive.
//
// ⚠️ TROCAR AQUI QUANDO O DOMÍNIO PRÓPRIO ENTRAR.
// Hoje o site responde em `ta-hora-loja.vercel.app`; o `tahora.com.br` ainda NÃO
// está configurado. Quando estiver, esta constante muda para
// `https://tahora.com.br` e mais nada precisa mudar — `metadataBase`
// (app/layout.tsx), o `sitemap` do robots.txt (app/robots.ts) e todas as URLs do
// sitemap (app/sitemap.ts) derivam daqui.
//
// Por que uma constante e não a string repetida nos três arquivos: os canonicals
// e o sitemap PRECISAM concordar. Três cópias literais viram, na primeira
// migração de domínio, um sitemap apontando para o domínio novo e canonicals
// ainda no domínio velho — divergência que o build não acusa e que só aparece
// semanas depois no Search Console.
//
// Sem barra no fim: quem concatena usa `${SITE_URL}/rota`.
export const SITE_URL = "https://ta-hora-loja.vercel.app"
