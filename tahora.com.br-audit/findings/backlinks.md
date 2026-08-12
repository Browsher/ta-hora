# Backlinks — tahora.com.br

**Tier de acesso:** 0 (Common Crawl + crawler de verificação). Sem Moz, sem Bing Webmaster, sem DataForSEO.
**Confiança geral:** 0.50 (fonte única, nível de domínio, sem cross-validation)

## O que foi medido

| Fonte | Dado buscado | Resultado |
|---|---|---|
| Common Crawl Web Graph (`commoncrawl_graph.py tahora.com.br`) | PageRank, PageRank rank, harmonic centrality, presença em crawl/ranking | `in_crawl: false`, `in_rankings: false` — domínio **não encontrado** no grafo (release `cc-main-2026-jan-feb-mar`) |
| Crawler de verificação (`verify_backlinks.py`) | Confirmar backlinks conhecidos | Não executado — nenhuma lista de backlinks conhecidos foi fornecida nem encontrada nos artefatos do audit (`tahora.com.br-audit/tmp/`) |

**Importante sobre o resultado do Common Crawl:** `in_crawl: false` e `in_rankings: false` significam que o Common Crawl **ainda não rastreou** tahora.com.br — não significa "baixa autoridade" nem "zero backlinks". Common Crawl é um crawler amplo mas incompleto, com viés para domínios já estabelecidos e mais indexados; domínios .com.br novos e de nicho frequentemente ficam de fora por várias releases seguidas. Isso é consistente com o perfil do site (loja nova, doméstica) descrito na tarefa.

## O que NÃO foi medido (e por quê)

| Métrica | Motivo | O que destravaria |
|---|---|---|
| Domain Authority (DA) / Page Authority (PA) | Sem Moz API key | Chave gratuita Moz (2.500 linhas/mês) em https://moz.com/products/api |
| Contagem de domínios referentes / links | Sem Moz, sem DataForSEO | Moz API key (Tier 1) ou extensão DataForSEO (Tier 3) |
| Spam Score / toxicidade de links | Sem Moz | Moz API key |
| Texto âncora dos backlinks | Sem Moz/Bing/DataForSEO | Qualquer uma das três |
| Links inbound via Bing | Domínio não registrado na conta Bing Webmaster deste ambiente (e mesmo se estivesse, Bing Webmaster só deve ser usado para comparar propriedades da própria conta, não para prospecção geral) | Cadastrar tahora.com.br no Bing Webmaster Tools (gratuito) |
| Velocidade de aquisição de links / tendência temporal | Nenhuma fonte gratuita disponível oferece isso | Somente DataForSEO (pago) |
| Menções de marca não linkadas ("Tá Hora", tahora.com.br) na web aberta | Este ambiente não tem uma ferramenta de busca web funcional. Uma tentativa de consultar resultados do Bing via fetch direto (`render_page.py`) retornou uma página genérica sem relação com a consulta (evidência de bloqueio anti-bot/CAPTCHA na busca), então o resultado foi descartado por não ser confiável — não é reportado como dado | Busca manual do usuário por `"tahora.com.br"` e `"Tá Hora câmera"` no Google/Bing, ou uma chave de API de busca (Serper, DataForSEO SERP, Google Custom Search) |
| Backlinks conhecidos verificados | Nenhuma lista de backlinks foi fornecida à tarefa nem existe nos artefatos do audit atual | Fornecer lista de URLs de origem (parceiros, imprensa, marketplaces) para `verify_backlinks.py` |

## Findings

### 1. [Informativo] Domínio ainda fora do grafo do Common Crawl
- **Evidência:** `commoncrawl_graph.py tahora.com.br` → `in_crawl: false`, `in_rankings: false`, `pagerank: null`, release `cc-main-2026-jan-feb-mar`. Fonte: Common Crawl (nível de domínio, confiança: 0.50).
- **Interpretação correta:** não é "autoridade zero" comprovada — é ausência de dado. Esperado para domínio novo/pequeno. Não deve ser usado como score negativo.
- **Recomendação:** reavaliar em 2-3 releases do Common Crawl (releases são trimestrais, ver https://commoncrawl.org/web-graphs) depois que o site acumular alguma indexação e primeiros links externos.

### 2. [Alta] Perfil de backlinks estruturalmente não mensurável neste tier — score numérico não pode ser produzido
- **Evidência:** apenas 1 de 7 fatores de scoring (contagem de domínios referentes, distribuição de qualidade, naturalidade de âncoras, taxa de links tóxicos, velocidade, follow/nofollow, relevância geográfica) tem alguma fonte de dado disponível neste Tier — e mesmo esse fator (via Common Crawl) retornou vazio.
- **Recomendação:** reportar como **DADOS INSUFICIENTES**, não atribuir XX/100. Priorizar a obtenção da chave gratuita da Moz API (maior custo-benefício: destrava DA/PA, spam score, contagem de domínios referentes e âncoras em uma única integração já suportada pelo `claude-seo`).

### 3. [Média] Nenhuma menção de marca (linkada ou não) foi confirmada — mas também não foi refutada
- **Evidência:** ausência de ferramenta de busca web funcional neste ambiente impediu a checagem de citações não linkadas de "Tá Hora"/tahora.com.br, que para uma marca nova costuma ser a oportunidade mais concreta de link building (converter menção → link).
- **Recomendação:** o usuário deve rodar manualmente, no Google e Bing:
  - `"tahora.com.br"` (menções ao domínio, linkadas ou não)
  - `"Tá Hora" câmera segurança -site:tahora.com.br` (menções à marca)
  - `intitle:"tá hora"` -site:tahora.com.br
  Qualquer menção sem link encontrada é candidata a um pedido educado de link (unlinked mention outreach), a tática de menor esforço e mais realista neste estágio.

## Recomendação de aquisição de links (realista, sem esquemas)

Para um e-commerce brasileiro de nicho (câmeras Wi-Fi de segurança), em estágio inicial, sem qualquer sinal de link no Common Crawl ainda:

1. **Estruturado / baixo esforço, alto retorno:**
   - Cadastro em marketplaces e comparadores de preço relevantes no Brasil (Buscapé, Zoom, Google Merchant Center/Shopping, Mercado Livre se aplicável) — geram links institucionais legítimos e trazem tráfego direto.
   - Cadastro em diretórios setoriais e de segurança eletrônica no Brasil (associações do setor, se existirem) e diretórios locais de e-commerce (ex.: Google Business Profile, se houver operação física/CNPJ visível).
   - Página de imprensa/mídia kit própria (`/imprensa`), citando CNPJ, contatos e ativos de marca — facilita menções de veículos e blogs.

2. **Conteúdo como isca de links (linkbait natural):**
   - Guias comparativos e de instalação (ex.: "como escolher câmera Wi-Fi para casa", "câmera com ou sem fio: o que muda") tendem a atrair links orgânicos de blogs de tecnologia e domótica brasileiros — mas isso é trabalho de conteúdo, não de outreach direto; recomendar avaliação conjunta com `/seo content`.

3. **Parcerias e prova social genuínas:**
   - Unboxing/review por microinfluenciadores de tecnologia/casa inteligente em troca de produto (prática comum e legítima no nicho), com link de volta ao produto — desde que os links sejam `rel="sponsored"` para conformidade com diretrizes do Google.
   - Depoimentos de clientes B2B (se houver revenda/instalação) em troca de link em "quem confia".

4. **Higiene básica antes de investir em outreach:**
   - Garantir que os perfis sociais (Instagram, Facebook) e o Google Business Profile apontem consistentemente para tahora.com.br — não são backlinks de peso para ranking orgânico tradicional, mas sustentam sinais de marca e ajudam a popular o Common Crawl/índices mais rápido.

**Não recomendado:** compra de links, redes de blogs próprios (PBN), troca massiva de links, diretórios genéricos sem curadoria — risco desproporcional para um domínio novo que ainda está construindo histórico de confiança.

## Revisão pré-entrega

- Validador automático (`validate_backlink_report.py`) executado sobre os dados coletados: **status PASS**, 1 info (interpretação correta do "domínio ausente no CC" já aplicada acima), 0 erros, 0 warnings.
- Toda métrica acima tem rótulo de fonte e confiança explícitos.
- Nenhum score numérico de 0-100 foi produzido (dados insuficientes, conforme regra de Tier 0).
- Nenhuma inferência foi apresentada como fato: a tentativa de busca de menções via Bing foi descartada e reportada como não confiável, em vez de usada como "zero menções encontradas".
