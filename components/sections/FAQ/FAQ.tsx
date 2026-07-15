"use client"

import { useState } from "react"
import { motion, AnimatePresence, type MotionProps } from "framer-motion"
import { buildSectionContainerProps, buildSectionItemProps } from "@/lib/sectionEffectHelpers"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { useEffectsMode } from "@/lib/EffectsModeContext"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import type { SectionEffects } from "@/lib/types"

// ─── Content ──────────────────────────────────────────────────────────────────

interface FAQContent {
  sectionLabel?:  string
  headline?:      string
  faq1Question?:  string; faq1Answer?:  string; faq1Category?:  string
  faq2Question?:  string; faq2Answer?:  string; faq2Category?:  string
  faq3Question?:  string; faq3Answer?:  string; faq3Category?:  string
  faq4Question?:  string; faq4Answer?:  string; faq4Category?:  string
  faq5Question?:  string; faq5Answer?:  string; faq5Category?:  string
  faq6Question?:  string; faq6Answer?:  string; faq6Category?:  string
  faq7Question?:  string; faq7Answer?:  string; faq7Category?:  string
  faq8Question?:  string; faq8Answer?:  string; faq8Category?:  string
  faq9Question?:  string; faq9Answer?:  string; faq9Category?:  string
  faq10Question?: string; faq10Answer?: string; faq10Category?: string
}

const DEFAULT_CONTENT: Required<FAQContent> = {
  sectionLabel:  "Perguntas frequentes",
  headline:      "%%Tudo que você%% precisa saber",
  faq1Question:  "Como funciona o processo de adesão?",
  faq1Answer:    "O processo é simples: basta criar sua conta, escolher o plano e começar a usar em menos de 5 minutos.",
  faq1Category:  "Início",
  faq2Question:  "Existe algum período de teste gratuito?",
  faq2Answer:    "Sim, oferecemos 14 dias gratuitos sem necessidade de cartão de crédito.",
  faq2Category:  "Início",
  faq3Question:  "Quais formas de pagamento são aceitas?",
  faq3Answer:    "Aceitamos cartão de crédito, boleto bancário e PIX.",
  faq3Category:  "Pagamento",
  faq4Question:  "Posso cancelar a qualquer momento?",
  faq4Answer:    "Sim, sem multas ou taxas. O cancelamento pode ser feito com um clique no painel.",
  faq4Category:  "Pagamento",
  faq5Question:  "O suporte está incluído em todos os planos?",
  faq5Answer:    "Sim, todos os planos incluem suporte via chat. Planos avançados incluem suporte prioritário.",
  faq5Category:  "Suporte",
  faq6Question:  "Em quanto tempo recebo retorno do suporte?",
  faq6Answer:    "O tempo médio de resposta é de até 2 horas em dias úteis.",
  faq6Category:  "Suporte",
  faq7Question:  "Meus dados estão seguros?",
  faq7Answer:    "Utilizamos criptografia de ponta e infraestrutura certificada para proteger seus dados.",
  faq7Category:  "Segurança",
  faq8Question:  "Existe limite de usuários por conta?",
  faq8Answer:    "Depende do plano. O plano básico permite até 3 usuários; os demais são ilimitados.",
  faq8Category:  "Segurança",
  faq9Question:  "Posso integrar com outras ferramentas?",
  faq9Answer:    "Sim, integramos com mais de 50 ferramentas populares como Slack, Zapier e Google Workspace.",
  faq9Category:  "Recursos",
  faq10Question: "O plano pode ser atualizado a qualquer momento?",
  faq10Answer:   "Sim, você pode fazer upgrade ou downgrade do plano a qualquer momento pelo painel.",
  faq10Category: "Recursos",
}

// ─── FAQ item type ────────────────────────────────────────────────────────────

interface FAQItem {
  question: string
  answer:   string
  category: string
}

// ─── Accordion item (shared by accordion and por-categoria) ──────────────────

function AccordionItem({
  item,
  itemKey,
  isOpen,
  onToggle,
  accentColor,
  isLast,
}: {
  item:        FAQItem
  itemKey:     string | number
  isOpen:      boolean
  onToggle:    () => void
  accentColor: string
  isLast:      boolean
}) {
  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid color-mix(in srgb, ${accentColor} 9.41%, transparent)` }}>
      <button
        onClick={onToggle}
        style={{
          width:          "100%",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            16,
          padding:        "18px 0",
          background:     "none",
          border:         "none",
          cursor:         "pointer",
          textAlign:      "left",
        }}
      >
        <span style={{
          fontWeight: 600,
          color:      "var(--cor-texto)",
          fontSize:   "clamp(14px, 1.8vw, 16px)",
          lineHeight: 1.5,
          flex:       1,
        }}>
          {item.question}
        </span>
        {/* Chevron: CSS rotate on <span>, not on motion element (armadilha #4) */}
        <span style={{
          color:        accentColor,
          fontSize:     18,
          flexShrink:   0,
          display:      "inline-block",
          transform:    isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition:   "transform 0.25s ease",
          lineHeight:   1,
        }}>
          ▾
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingBottom: 20 }}>
              <Text text={item.answer} size="medio" color="var(--cor-texto-secundario)" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-function props ───────────────────────────────────────────────────────

interface SubProps {
  c:              Required<FAQContent>
  se:             SectionEffects | null
  containerProps: MotionProps
  itemProps:      MotionProps
  accentColor:    string
  items:          FAQItem[]
  openMode:       string
  defaultOpen:    boolean
  showCategories: boolean
}

// ─── FAQ Header (shared) ──────────────────────────────────────────────────────

function FAQHeader({
  c,
  itemProps,
  accentColor,
}: {
  c:           Required<FAQContent>
  itemProps:   MotionProps
  accentColor: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionLabel {...itemProps} text={c.sectionLabel} accentColor={accentColor} />
      <Heading
        {...itemProps}
        as="h2"
        size="grande"
        text={c.headline}
        accentColor={accentColor}
        color="var(--cor-texto)"
      />
    </div>
  )
}

// ─── Accordion type ───────────────────────────────────────────────────────────

function FAQAccordion({ c, containerProps, itemProps, accentColor, items, openMode, defaultOpen }: SubProps) {
  const [openSet, setOpenSet] = useState<Set<number>>(
    () => (defaultOpen ? new Set([0]) : new Set()),
  )

  function toggle(idx: number) {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        if (openMode === "uma-por-vez") next.clear()
        next.add(idx)
      }
      return next
    })
  }

  return (
    <section id="faq" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div
          {...containerProps}
          style={{ display: "flex", flexDirection: "column", gap: 48 }}
        >
          <FAQHeader c={c} itemProps={itemProps} accentColor={accentColor} />
          <motion.div {...itemProps} style={{ display: "flex", flexDirection: "column" }}>
            {items.map((item, idx) => (
              <AccordionItem
                key={idx}
                item={item}
                itemKey={idx}
                isOpen={openSet.has(idx)}
                onToggle={() => toggle(idx)}
                accentColor={accentColor}
                isLast={idx === items.length - 1}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Grid type ────────────────────────────────────────────────────────────────

function FAQGrid({ c, containerProps, itemProps, accentColor, items }: SubProps) {
  return (
    <section id="faq" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div
          {...containerProps}
          style={{ display: "flex", flexDirection: "column", gap: 48 }}
        >
          <FAQHeader c={c} itemProps={itemProps} accentColor={accentColor} />
          <motion.div
            {...itemProps}
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap:                 24,
            }}
          >
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background:    "var(--cor-card)",
                  border:        `1px solid color-mix(in srgb, ${accentColor} 12.55%, transparent)`,
                  borderRadius:  16,
                  padding:       "24px 28px",
                  display:       "flex",
                  flexDirection: "column",
                  gap:           12,
                }}
              >
                <span style={{
                  fontWeight: 600,
                  color:      "var(--cor-texto)",
                  fontSize:   "clamp(14px, 1.8vw, 16px)",
                  lineHeight: 1.5,
                }}>
                  {item.question}
                </span>
                <Text text={item.answer} size="pequeno" color="var(--cor-texto-secundario)" />
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Por-categoria type ───────────────────────────────────────────────────────

function FAQPorCategoria({ c, containerProps, itemProps, accentColor, items, openMode, showCategories }: SubProps) {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set())

  function toggle(groupIdx: number, itemIdx: number) {
    const key = `${groupIdx}-${itemIdx}`
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        if (openMode === "uma-por-vez") {
          for (const k of next) {
            if (k.startsWith(`${groupIdx}-`)) next.delete(k)
          }
        }
        next.add(key)
      }
      return next
    })
  }

  // Group items preserving first-appearance order
  const categoryOrder: string[] = []
  const categoryMap = new Map<string, FAQItem[]>()
  for (const item of items) {
    const cat = item.category || "Geral"
    if (!categoryMap.has(cat)) {
      categoryOrder.push(cat)
      categoryMap.set(cat, [])
    }
    categoryMap.get(cat)!.push(item)
  }
  const groups = categoryOrder.map(cat => ({ cat, items: categoryMap.get(cat)! }))

  return (
    <section id="faq" style={{ padding: "clamp(64px, 8vw, 96px) 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)" }}>
        <motion.div
          {...containerProps}
          style={{ display: "flex", flexDirection: "column", gap: 48 }}
        >
          <FAQHeader c={c} itemProps={itemProps} accentColor={accentColor} />
          <motion.div
            {...itemProps}
            style={{ display: "flex", flexDirection: "column", gap: 40 }}
          >
            {groups.map((group, groupIdx) => (
              <div key={groupIdx}>
                {showCategories && (
                  <div style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           12,
                    marginBottom:  20,
                    paddingBottom: 12,
                    borderBottom:  `2px solid color-mix(in srgb, ${accentColor} 20.78%, transparent)`,
                  }}>
                    <span style={{
                      fontSize:      11,
                      fontWeight:    700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase" as const,
                      color:         accentColor,
                    }}>
                      {group.cat}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {group.items.map((item, itemIdx) => (
                    <AccordionItem
                      key={itemIdx}
                      item={item}
                      itemKey={`${groupIdx}-${itemIdx}`}
                      isOpen={openSet.has(`${groupIdx}-${itemIdx}`)}
                      onToggle={() => toggle(groupIdx, itemIdx)}
                      accentColor={accentColor}
                      isLast={itemIdx === group.items.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FAQProps {
  type?:        "accordion" | "grid" | "por-categoria"
  accentColor?: string
  content?:     FAQContent
  [key: string]: unknown
}

export function FAQ({
  type        = "accordion",
  accentColor = "#D4A017",
  content     = {},
}: FAQProps) {
  const c    = { ...DEFAULT_CONTENT, ...content }
  const se   = useSectionEffects()
  const mode = useEffectsMode()

  const containerProps = buildSectionContainerProps(se?.sectionEntry, mode)
  const itemProps      = buildSectionItemProps(se?.sectionEntry)

  const cv             = content as Record<string, unknown>
  const faqCount       = Math.min(Math.max((cv.faqCount    as number  | undefined) ?? 4, 1), 10)
  const openMode       = (cv.openMode    as string  | undefined) ?? "uma-por-vez"
  const defaultOpen    = (cv.defaultOpen as boolean | undefined) ?? false
  const showCategories = (cv.showCategories as boolean | undefined) ?? true

  const ALL_ITEMS: FAQItem[] = [
    { question: c.faq1Question,  answer: c.faq1Answer,  category: c.faq1Category  },
    { question: c.faq2Question,  answer: c.faq2Answer,  category: c.faq2Category  },
    { question: c.faq3Question,  answer: c.faq3Answer,  category: c.faq3Category  },
    { question: c.faq4Question,  answer: c.faq4Answer,  category: c.faq4Category  },
    { question: c.faq5Question,  answer: c.faq5Answer,  category: c.faq5Category  },
    { question: c.faq6Question,  answer: c.faq6Answer,  category: c.faq6Category  },
    { question: c.faq7Question,  answer: c.faq7Answer,  category: c.faq7Category  },
    { question: c.faq8Question,  answer: c.faq8Answer,  category: c.faq8Category  },
    { question: c.faq9Question,  answer: c.faq9Answer,  category: c.faq9Category  },
    { question: c.faq10Question, answer: c.faq10Answer, category: c.faq10Category },
  ]
  const items = ALL_ITEMS.slice(0, faqCount)

  const subProps: SubProps = {
    c, se, containerProps, itemProps, accentColor, items, openMode, defaultOpen, showCategories,
  }

  if (type === "grid")          return <FAQGrid         {...subProps} />
  if (type === "por-categoria") return <FAQPorCategoria {...subProps} />
  return                               <FAQAccordion    {...subProps} />
}
