import Link from "next/link"
import { ImageSlot } from "@/components/ui/ImageSlot"
import { Text } from "@/components/ui/Text"
import { PriceTag } from "@/components/ui/PriceTag"
import { ROTULO_MARCA } from "@/lib/shopify/tags"
// import type: só o TIPO (apagado na compilação) — nunca arrasta a camada de
// dados server-only para o bundle. `ROTULO_MARCA` é valor, mas `tags.ts` não tem
// `server-only` (atravessa a fronteira como `types.ts`).
import type { ProductCard } from "@/lib/shopify/types"

// Bloco largo horizontal de uma câmera (feature catalogo-consultivo).
// Apresentacional: sem hooks, sem estado. Ordem de leitura (Req 1.1): imagem →
// nome → selo de marca → resumo → preço → botão "ver detalhes".
export function CameraBloco({ produto }: { produto: ProductCard }) {
  const href = `/produtos/${produto.handle}`

  return (
    <article className="catalogo-bloco">
      {/* Imagem à esquerda (desktop) / topo (mobile). Fallback nativo do
          ImageSlot quando `image` é nulo (Req 1.6). */}
      <div className="catalogo-bloco__midia">
        <ImageSlot
          src={produto.image?.url || undefined}
          alt={produto.image?.altText ?? produto.title}
          borderRadius={0}
          objectFit="contain"
          style={{ aspectRatio: "1 / 1", width: "100%" }}
        />
      </div>

      <div className="catalogo-bloco__conteudo">
        {/* Selo de marca: SÓ quando há marca resolvida (Req 2.3). Rótulo de
            exibição via ROTULO_MARCA — nunca reescreve a grafia da tag (Req 2.2). */}
        {produto.marca && (
          <span className="catalogo-bloco__selo">{ROTULO_MARCA[produto.marca]}</span>
        )}

        {/* Nome como link para a página do produto (heading acessível — Req 4.4). */}
        <h2 className="catalogo-bloco__titulo">
          <Link href={href} className="catalogo-bloco__titulo-link">
            {produto.title}
          </Link>
        </h2>

        {/* Resumo consultivo: SÓ quando preenchido (Req 1.5) — sem linha órfã. */}
        {produto.resumo && (
          <Text
            size="medio"
            text={produto.resumo}
            color="var(--cor-texto-secundario)"
            className="catalogo-bloco__resumo"
          />
        )}

        {/* Preço formatado pela Shopify/formatMoney (Req 1.7) — UI não recalcula. */}
        <PriceTag price={produto.price.price} currency={produto.price.currency} size="medio" />

        {/* "Ver detalhes" → página do produto (Req 1.4). */}
        <Link href={href} className="catalogo-bloco__botao">
          Ver detalhes
        </Link>
      </div>
    </article>
  )
}
