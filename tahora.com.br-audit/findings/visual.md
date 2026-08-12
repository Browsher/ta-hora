# Análise Visual e Mobile — tahora.com.br

Páginas analisadas: Home (`/`), Catálogo (`/catalogo`), PDP (`/produtos/camera-seguranca-a31h`).
Viewports: Desktop 1920x1080, Mobile 375x812 (presets do script `capture_screenshot.py`; a ferramenta bundled não aceita larguras customizadas como 1440/390 — usei os presets padrão, mais próximos de breakpoints reais).

## O que funciona

- **Home mobile**: H1 ("Saiba quem está na sua porta..."), subcopy e os dois CTAs ("Começar agora" / "Saber mais") aparecem 100% acima da dobra, sem precisar de scroll. Prova social (+10 mil vendas, 4,7 de nota) também visível.
- **Home desktop**: hero completo acima da dobra, incluindo imagem do produto/placa promocional e CTA de navbar ("Quero Comprar").
- **PDP desktop**: nome do produto, preço, parcelamento e CTA "Adicionar ao carrinho" todos visíveis acima da dobra, junto com selos de confiança (garantia, nota fiscal, devolução).
- **Catálogo desktop**: título, filtros por categoria/marca e o primeiro produto (imagem, preço, "Ver detalhes") aparecem sem scroll.
- Hierarquia visual consistente entre páginas (mesma paleta laranja/preto, mesmos componentes de botão, cards com sombra leve).
- Nenhum overflow horizontal visível em nenhuma das 6 capturas (desktop/mobile x 3 páginas).
- Fonte de corpo em tamanho legível (não há texto minúsculo perceptível nas capturas).
- Breadcrumbs (BreadcrumbList) visíveis e consistentes em Catálogo e PDP, reforçando a orientação de navegação.

## Findings

### 1. PDP mobile: CTA principal cortado na dobra
**Severidade:** Média
**Evidência:** `screenshots/pdp_mobile_fold.png` — nome do produto, preço (R$185,00) e parcelamento aparecem, mas o botão "Adicionar ao carrinho" (laranja) só é visível como uma faixa cortada de ~10px na base da viewport de 812px de altura.
**Recomendação:** Reduzir a altura do bloco de imagem/thumbnails ou aproximar preço e CTA no mobile, para que o botão principal de conversão fique inteiramente visível sem scroll — ou fixar o CTA como barra sticky no rodapé da tela em mobile (padrão comum de e-commerce).

### 2. Catálogo mobile: preço e "Ver detalhes" do primeiro produto ficam fora da dobra
**Severidade:** Baixa
**Evidência:** `screenshots/catalogo_mobile_fold.png` — os chips de filtro ("Todas", "Melhor preço", "Mais recursos", "EseeCloud", "iCSee") ocupam duas linhas inteiras antes do primeiro card de produto; título do produto ("Câmera Segurança A31H") aparece na última linha visível, mas preço e botão ficam abaixo da dobra.
**Recomendação:** Não é crítico (página de listagem, não uma única CTA), mas considerar compactar os filtros em um único carrossel horizontal roxo/scroll para ganhar espaço vertical e mostrar preço+CTA do primeiro produto sem scroll.

### 3. Home mobile: hero sem imagem de produto acima da dobra
**Severidade:** Baixa
**Evidência:** `screenshots/home_mobile_fold.png` — a imagem da placa de aviso promocional só aparece parcialmente no rodapé da viewport; diferente do desktop, não há foto do produto (câmera) visível acima da dobra no mobile, só texto e CTAs.
**Recomendação:** Avaliar se vale a pena inserir uma imagem pequena do produto ao lado/abaixo do H1 no mobile para reforçar reconhecimento visual do que está sendo vendido, sem empurrar os CTAs para baixo.

### 4. Home: grandes seções em branco entre o hero e o rodapé nas capturas full-page
**Severidade:** Baixa/Informativo (possível artefato de captura, mas vale investigar)
**Evidência:** `screenshots/home_desktop_full.png` e `screenshots/home_mobile_full.png` — depois do hero, há um vão em branco enorme (aprox. 2/3 da altura total da página) antes do rodapé aparecer. Catálogo e PDP (`catalogo_desktop_full.png`, `pdp_desktop_full.png`, `pdp_mobile_full.png`) não têm esse problema — o conteúdo aparece normalmente do topo ao rodapé.
**Análise:** Como o comportamento é específico da Home e não ocorre nas outras páginas, é provável que a Home tenha seções com animação de entrada disparada por scroll real (IntersectionObserver / "reveal on scroll") que ficam com `opacity:0` até serem roladas para dentro da viewport por um evento de scroll genuíno — o que a captura full-page (que redimensiona a viewport em vez de rolar) não dispara.
**Recomendação:**
  - Confirmar manualmente (scroll real no navegador) se essas seções realmente aparecem para o usuário.
  - Se confirmado que é só artefato de captura, nenhuma ação necessária no produto, mas vale registrar para times de SEO/crawlers: se o mesmo padrão afetar o rendering do Googlebot (que também precisa dos eventos de scroll/IntersectionObserver disparados), o conteúdo dessas seções pode não ser indexado ou pode gerar CLS perceptível em conexões lentas onde o JS demora a rodar.
  - Se for causado por lazy-loading condicionado a JS, considerar fallback com `opacity` inicial não-zero ou animação via CSS `@media (prefers-reduced-motion)` visível por padrão, garantindo que o conteúdo nunca fique invisível caso o JS falhe.

### 5. Texto essencial embutido em imagem na PDP (infográficos laterais)
**Severidade:** Baixa
**Evidência:** `screenshots/pdp_desktop_fold.png` e `pdp_desktop_full.png` — os blocos "01 DUAS LENTES, MAIS SEGURANÇA" e "02 MAIS COBERTURA, MAIS CONTROLE" (com bullets como "FULL HD — Imagens nítidas e coloridas", "MOVIMENTO PTZ MOTORIZADO", "ZOOM DIGITAL DE ATÉ 4X") são renderizados como imagem, não como texto real da página.
**Recomendação:** Esse texto contém benefícios e especificações técnicas relevantes para SEO e para usuários de leitor de tela. Migrar para HTML real com a imagem apenas de fundo/ilustração (ou usar `alt` completo e replicar o texto abaixo em HTML) melhora acessibilidade e indexação, sem prejuízo visual — o restante da PDP (título, preço, especificações técnicas, "O que esse produto resolve") já está em texto real, o que é bom.

## Placa de aviso (imagem promocional) — observação transversal
A imagem "ATENÇÃO — O AMBIENTE ESTÁ SENDO FILMADO..." usada como brinde promocional na Home aparece com texto embutido na imagem, mas nesse caso é aceitável: é uma foto do produto-brinde em si (a placa física), não um substituto de copy da página.

## Mobile — alvos de toque e legibilidade
- Botões principais (CTA laranja, "Saber mais", chips de filtro) parecem ter altura suficiente (~48px) nas capturas mobile — sem evidência de alvos pequenos demais.
- Menu mobile usa ícone de hambúrguer no header (não expandido nas capturas, comportamento padrão esperado).
- Nenhum texto cortado/overflow detectado nas três páginas em mobile.

## Screenshots gerados
Diretório: `C:/Users/ADM/projetos/ta hora/site-ta-hora/tahora.com.br-audit/screenshots/`

- `home_desktop_fold.png`, `home_desktop_full.png`
- `home_mobile_fold.png`, `home_mobile_full.png`
- `catalogo_desktop_fold.png`, `catalogo_desktop_full.png`
- `catalogo_mobile_fold.png`, `catalogo_mobile_full.png`
- `pdp_desktop_fold.png`, `pdp_desktop_full.png`
- `pdp_mobile_fold.png`, `pdp_mobile_full.png`
