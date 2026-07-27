import { Video, Aperture, Siren } from "lucide-react"

// Linha de DESTAQUES do bloco do catálogo (feature catalogo-destaques).
//
// Apresentacional: sem hooks, sem estado, sem efeito, sem `"use client"` próprio
// (herda o contexto de cliente do `CatalogoConsultivo`, igual ao `CameraBloco`).
//
// 🔴 ESTE COMPONENTE NÃO DECIDE REGRA DE NEGÓCIO — só PRESENÇA. Quando ele recebe
// `lentes`, o valor JÁ passou pelo gatilho no servidor: "Lente única" virou `null`
// lá em `normalizeProductCard`, e nunca chega aqui. Idem `alarmeSonoro`, que é um
// booleano justamente para que o valor cru ("Aplicativo" na A31H, "Noticação" nas
// demais) não tenha como ser exibido por engano. Ver `lib/shopify/destaques.ts`.
//
// Props explícitas em vez de `produto: ProductCard` de propósito: o componente
// fica legível sem conhecer o card inteiro, e o compilador impede que ele alcance
// preço/tags por descuido.
//
// ⚠️ NÃO importa `fichaTecnicaIcones.ts`. Aquele mapa existe para lookup DINÂMICO
// por `key` sobre as 21 specs da ficha, e `numero_de_lentes` NÃO é uma delas —
// pôr `Aperture` lá criaria uma entrada morta, que mentiria sobre o que a ficha
// exibe. Aqui são 3 itens FIXOS, conhecidos em tempo de escrita: um `Record` seria
// indireção sem lookup. Imports NOMINAIS preservam o tree-shaking.
export function DestaquesCamera({
  resolucao,
  lentes,
  alarmeSonoro,
}: {
  resolucao:    string | null
  lentes:       string | null
  alarmeSonoro: boolean
}) {
  // Ordem FIXA (Req 5.3): resolução → lentes → alarme, independentemente dos
  // dados. A resolução aparece sempre que houver dado; lentes e alarme só quando
  // são diferencial — é por isso que dois blocos vizinhos são comparáveis.
  const itens: { chave: string; Icone: typeof Video; texto: string }[] = []

  if (resolucao) {
    itens.push({ chave: "resolucao", Icone: Video, texto: resolucao })
  }
  if (lentes) {
    itens.push({ chave: "lentes", Icone: Aperture, texto: lentes })
  }
  if (alarmeSonoro) {
    // Rótulo FIXO, nunca um valor vindo de prop — a prop é `boolean` por isso.
    itens.push({ chave: "alarme", Icone: Siren, texto: "Alarme sonoro" })
  }

  // Nenhum destaque → a linha inteira some (Req 5.2): sem container vazio, sem
  // borda órfã, sem gap extra. Mesma disciplina do `specs.length === 0` da
  // `FichaTecnica` e do `resumo` do próprio `CameraBloco`.
  if (itens.length === 0) return null

  return (
    <div className="catalogo-destaques">
      {itens.map(({ chave, Icone, texto }) => (
        <span key={chave} className="catalogo-destaque">
          {/* Ícone DECORATIVO: quem carrega o significado é o texto ao lado —
              mesmo padrão dos cards da ficha técnica. Menor que lá (28px): aqui
              é vitrine, não ficha. */}
          <Icone className="catalogo-destaque__icone" size={16} aria-hidden />
          {texto}
        </span>
      ))}
    </div>
  )
}
