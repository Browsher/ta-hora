# Ta Hora

Loja headless (câmeras de segurança e acessórios). Base do site gerada pelo
Builder; a loja (catálogo + páginas de produto) puxa os dados da **Shopify**
(Storefront API) em **runtime com ISR**.

## Como rodar

```bash
npm install
npm run dev     # desenvolvimento local
```

Para as rotas da loja (`/catalogo`, `/produtos/[handle]`), crie um `.env.local`
a partir do `.env.example` com o token da Storefront API da sua loja Shopify.

## Build e deploy

```bash
npm run build   # build de runtime (SSR/ISR)
npm start       # roda o build de produção localmente
```

> O projeto **não** é mais static export (não gera `out/`): a loja precisa de
> preço/estoque frescos da Shopify, o que exige runtime. Deploy alvo: **Vercel**
> (SSR/ISR). As páginas de conteúdo (home, Sobre Nós) continuam pré-renderizadas
> (SSG) e não dependem da Shopify.
