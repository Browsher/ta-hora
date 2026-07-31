"use client"

import { motion, type MotionProps } from "framer-motion"
import type React from "react"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"

// ─── Content ──────────────────────────────────────────────────────────────────
//
// Seção de TEXTO CORRIDO — existe para as páginas legais (política de
// privacidade, termos, trocas e devoluções), que são o único conteúdo do site
// que não cabe em nenhum bloco de marketing.
//
// Diferença de forma em relação às outras seções: aqui o corpo vem em `blocos`,
// um ARRAY, em vez das chaves numeradas (item1Title, item2Title…) usadas no
// resto do projeto. Documento legal tem dezenas de cláusulas e número variável
// delas — numerar à mão até `bloco40Titulo` seria pior de editar e de revisar
// contra o texto publicado na Shopify, que é a fonte destes documentos.
//
// ─── Links no meio do texto ───────────────────────────────────────────────────
//
// Documento legal remete a outro documento ("de acordo com nossa política de
// reembolso") e essa remissão é justamente o que o cliente quer clicar naquele
// momento. Sintaxe: [rótulo](/caminho), igual a Markdown.
//
// Por que aqui e não no `Text`: o parser de %% do Text opera sobre string e
// devolve string/spans; link exige <a>, que não cabe nesse contrato. O projeto
// já duplica o parser de %% entre Heading e Text — cada componente cuida da
// própria marcação inline. TextoLegal é o único que precisa de link inline, e
// consome o escape hatch `children` do Text para não reimplementar tipografia.

export interface BlocoLegal {
  /** Título da cláusula. Vazio = parágrafos soltos, sem cabeçalho. */
  titulo?:     string
  /** Um item por parágrafo. */
  paragrafos?: string[]
  /** Itens de lista, renderizados como <ul> após os parágrafos. */
  lista?:      string[]
}

interface TextoLegalContent {
  rotulo?:       string
  titulo?:       string
  /** Texto livre: "Última atualização: 30 de julho de 2026". */
  atualizadoEm?: string
  /** Linha de abertura, antes das cláusulas. */
  introducao?:   string
  blocos?:       BlocoLegal[]
  /** Rodapé do documento — canal de contato para dúvidas sobre ele. */
  contatoTitulo?: string
  contatoTexto?:  string
}

const DEFAULT_CONTENT: Required<TextoLegalContent> = {
  rotulo:        "",
  titulo:        "Documento",
  atualizadoEm:  "",
  introducao:    "",
  blocos:        [],
  contatoTitulo: "",
  contatoTexto:  "",
}

// ─── Parser de links inline ───────────────────────────────────────────────────
// [rótulo](/caminho) → <a>. Aceita caminho interno (/x) e URL absoluta.
// Colchete/parêntese soltos no texto ficam intactos: sem par completo, não casa.

const LINK_RE = /\[([^\]\n]+)\]\((\/[^\s)]*|https?:\/\/[^\s)]+)\)/g

function temLink(texto: string): boolean {
  LINK_RE.lastIndex = 0
  return LINK_RE.test(texto)
}

function LinkLegal({ href, label }: { href: string; label: string }) {
  const externo = href.startsWith("http")
  return (
    <a
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={{
        // Link em TEXTO → tom forte, mesma regra do Footer/Heading.
        color:          "var(--cor-destaque-texto-forte, #D4A017)",
        textDecoration: "underline",
        // Documento legal é denso: sublinhado afastado da base melhora leitura.
        textUnderlineOffset: 2,
      }}
    >
      {label}
    </a>
  )
}

/**
 * Renderiza uma string com [rótulo](/caminho) como nós React.
 * Fora dos links o texto segue cru — o realce %% não é usado nos documentos
 * legais, e misturar os dois parsers aqui só criaria ambiguidade de escape.
 */
function renderComLinks(texto: string): React.ReactNode {
  const partes: React.ReactNode[] = []
  let ultimoFim = 0
  let m: RegExpExecArray | null

  LINK_RE.lastIndex = 0
  while ((m = LINK_RE.exec(texto)) !== null) {
    if (m.index > ultimoFim) partes.push(texto.slice(ultimoFim, m.index))
    partes.push(<LinkLegal key={m.index} href={m[2]} label={m[1]} />)
    ultimoFim = m.index + m[0].length
  }
  if (ultimoFim < texto.length) partes.push(texto.slice(ultimoFim))

  return <>{partes}</>
}

/**
 * Parágrafo do documento. Só entra no caminho de children quando há link —
 * sem link, `Text` recebe a string e segue o caminho rápido de sempre.
 */
function ParagrafoLegal({
  texto, size = "medio", color = "var(--cor-texto-secundario)",
}: { texto: string; size?: "grande" | "medio" | "pequeno"; color?: string }) {
  if (!temLink(texto)) return <Text text={texto} size={size} color={color} />
  return <Text size={size} color={color}>{renderComLinks(texto)}</Text>
}

// ─── Sub-blocos ───────────────────────────────────────────────────────────────

function Bloco({ bloco, itemProps }: { bloco: BlocoLegal; itemProps: MotionProps }) {
  const { titulo, paragrafos = [], lista = [] } = bloco
  if (!titulo && paragrafos.length === 0 && lista.length === 0) return null

  return (
    <motion.div {...itemProps} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {titulo && (
        <Heading
          as="h2"
          size="pequeno"
          text={titulo}
          color="var(--cor-texto)"
        />
      )}

      {paragrafos.map((p, i) => (
        <ParagrafoLegal key={i} texto={p} />
      ))}

      {lista.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 8 }}>
          {lista.map((item, i) => (
            <li key={i} style={{ color: "var(--cor-texto-secundario)", lineHeight: 1.7 }}>
              <ParagrafoLegal texto={item} />
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface TextoLegalProps {
  accentColor?: string
  content?:     TextoLegalContent
  [key: string]: unknown
}

export function TextoLegal({ accentColor = "#D4A017", content = {} }: TextoLegalProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  return (
    <section style={{ padding: "clamp(48px, 7vw, 88px) 0" }}>
      {/* 760px: medida de leitura confortável para texto corrido longo — o
          resto do site usa 1200px, que aqui daria linhas longas demais. */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div
          {...containerProps}
          style={{ display: "flex", flexDirection: "column", gap: 32 }}
        >
          {/* Cabeçalho do documento */}
          <motion.div {...itemProps} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {c.rotulo && (
              <p style={{
                fontSize:      11,
                fontWeight:    700,
                color:         "var(--cor-texto-fraco)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                margin:        0,
              }}>
                {c.rotulo}
              </p>
            )}

            {/* Único h1 da página — as páginas legais não têm Hero. */}
            <Heading as="h1" size="grande" text={c.titulo} accentColor={accentColor} color="var(--cor-texto)" />

            {c.atualizadoEm && (
              <Text text={c.atualizadoEm} size="pequeno" color="var(--cor-texto-fraco)" />
            )}

            {c.introducao && <ParagrafoLegal texto={c.introducao} />}
          </motion.div>

          {/* Cláusulas */}
          {c.blocos.map((bloco, i) => (
            <Bloco key={i} bloco={bloco} itemProps={itemProps} />
          ))}

          {/* Contato sobre este documento */}
          {(c.contatoTitulo || c.contatoTexto) && (
            <motion.div
              {...itemProps}
              style={{
                display:       "flex",
                flexDirection: "column",
                gap:           10,
                padding:       "20px 24px",
                borderRadius:  16,
                background:    "var(--cor-card)",
                border:        "1px solid var(--cor-borda)",
              }}
            >
              {c.contatoTitulo && (
                <Heading as="h2" size="pequeno" text={c.contatoTitulo} color="var(--cor-texto)" />
              )}
              {c.contatoTexto && <ParagrafoLegal texto={c.contatoTexto} />}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
