"use client"

import { useEffect, useRef } from "react"
import { useSectionEffects } from "@/lib/SectionEffectsContext"
import { migrateBackground } from "@/lib/types"
import type { BackgroundIntensity } from "@/lib/types"

// ── Shared styles ──────────────────────────────────────────────────────────────

const LAYER: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  zIndex: 0,
  pointerEvents: "none",
}

const CANVAS_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h    = hex.replace("#", "")
  const full = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h
  const r    = parseInt(full.slice(0, 2), 16)
  const g    = parseInt(full.slice(2, 4), 16)
  const b    = parseInt(full.slice(4, 6), 16)
  return [isNaN(r) ? 212 : r, isNaN(g) ? 160 : g, isNaN(b) ? 23 : b]
}

// Resolve QUALQUER cor CSS (hex, var(--cor-destaque), color-mix, ...) para [r,g,b].
// O canvas 2D não lê variável CSS: hex vai pelo caminho rápido; o resto é resolvido
// pelo navegador via elemento-sonda (getComputedStyle sempre devolve "rgb(r, g, b)").
// Usa a sonda (e não lê a variável pelo nome) para funcionar uniformemente com hex,
// variável e qualquer cor — sem hardcodar "--cor-destaque" nem detectar o formato.
// Client-only: só é chamado dentro de useEffect (ver Passo 3), nunca no SSR.
//
// B1 (reatividade a tema): a cor é resolvida UMA vez no mount (dep array [accentColor]).
// Se o tema mudar ao vivo, o canvas só repinta no próximo remount — aceitável agora,
// pois o sistema de temas ainda não existe. Para repintar ao trocar tema ao vivo,
// adicionar um gatilho de tema no dep array quando o sistema de temas existir (B2).
function resolveRgb(input: string, probeEl: HTMLElement | null): [number, number, number] {
  if (input.trim().startsWith("#")) return hexToRgb(input)
  if (probeEl) {
    probeEl.style.color = input
    const m = getComputedStyle(probeEl).color.match(/\d+(\.\d+)?/g)
    if (m && m.length >= 3) return [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])]
  }
  return [212, 160, 23]  // fallback: #D4A017
}

// Animation duration multiplier per intensity level
const DUR_MULT: Record<BackgroundIntensity, number> = { suave: 1.7, medio: 1.0, intenso: 0.6 }
// Keyframe name suffix per intensity level
const ANIM_SFX: Record<BackgroundIntensity, string> = { suave: "-s", medio: "",  intenso: "-i" }

// ── Aurora ─────────────────────────────────────────────────────────────────────
// CSS blobs — @keyframes in globals.css. Count: suave 2 · medio 3 · intenso 5.

interface AuroraBlobDef {
  w: string; h: string
  top?: string; bottom?: string; left?: string; right?: string
  op: number
  bgFn: (c: string) => string
  animBase: string
  durMedio: number  // seconds at medio intensity
}

const AURORA_BLOBS: AuroraBlobDef[] = [
  { w:"55%", h:"70%", top:"-10%", left:"-5%",   op:0.45, animBase:"ab-a1", durMedio:7,
    bgFn:(c) => `radial-gradient(circle, color-mix(in srgb, ${c} 33.33%, transparent) 0%, color-mix(in srgb, ${c} 13.33%, transparent) 45%, transparent 70%)` },
  { w:"45%", h:"60%", top:"5%",   right:"-5%",  op:0.40, animBase:"ab-a2", durMedio:9,
    bgFn:(c) => `radial-gradient(circle, color-mix(in srgb, ${c} 20%, transparent) 0%, color-mix(in srgb, ${c} 7.84%, transparent) 50%, transparent 70%)` },
  { w:"50%", h:"55%", bottom:"-10%", left:"25%", op:0.35, animBase:"ab-a3", durMedio:6,
    bgFn:(c) => `radial-gradient(circle, color-mix(in srgb, ${c} 15.69%, transparent) 0%, color-mix(in srgb, ${c} 5.1%, transparent) 40%, transparent 70%)` },
  { w:"40%", h:"50%", top:"20%",  left:"30%",   op:0.28, animBase:"ab-a1", durMedio:8,
    bgFn:(c) => `radial-gradient(circle, color-mix(in srgb, ${c} 24.71%, transparent) 0%, color-mix(in srgb, ${c} 9.41%, transparent) 45%, transparent 70%)` },
  { w:"42%", h:"52%", top:"-5%",  right:"20%",  op:0.25, animBase:"ab-a2", durMedio:7.5,
    bgFn:(c) => `radial-gradient(circle, color-mix(in srgb, ${c} 18.04%, transparent) 0%, color-mix(in srgb, ${c} 6.67%, transparent) 50%, transparent 70%)` },
]

const AURORA_COUNT: Record<BackgroundIntensity, number> = { suave: 2, medio: 3, intenso: 5 }

function AuroraBg({ accentColor, intensity }: { accentColor: string; intensity: BackgroundIntensity }) {
  const sfx    = ANIM_SFX[intensity]
  const dmult  = DUR_MULT[intensity]
  const blobs  = AURORA_BLOBS.slice(0, AURORA_COUNT[intensity])

  return (
    <div style={LAYER}>
      {blobs.map((b, i) => (
        <div
          key={i}
          data-ab-aurora=""
          style={{
            position: "absolute",
            borderRadius: "50%",
            filter: "blur(55px)",
            width: b.w, height: b.h,
            top: b.top, bottom: b.bottom, left: b.left, right: b.right,
            opacity: b.op,
            background: b.bgFn(accentColor),
            animation: `${b.animBase}${sfx} ${(b.durMedio * dmult).toFixed(1)}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ── Mesh gradient ──────────────────────────────────────────────────────────────
// CSS orbs — @keyframes in globals.css. Count: suave 3 · medio 4 · intenso 6.

interface MeshOrbDef {
  top: string; left: string; size: string
  op: number; animBase: string; durMedio: number; delay: string
}

const MESH_ORBS_ALL: MeshOrbDef[] = [
  { top:"0%",  left:"0%",  size:"40%", op:0.28, animBase:"ab-m1", durMedio:9,  delay:"0s" },
  { top:"0%",  left:"50%", size:"35%", op:0.20, animBase:"ab-m2", durMedio:11, delay:"1s" },
  { top:"50%", left:"0%",  size:"38%", op:0.22, animBase:"ab-m3", durMedio:10, delay:"2s" },
  { top:"50%", left:"55%", size:"36%", op:0.18, animBase:"ab-m4", durMedio:12, delay:"0.5s" },
  { top:"25%", left:"25%", size:"30%", op:0.15, animBase:"ab-m1", durMedio:14, delay:"3s" },
  { top:"20%", left:"65%", size:"28%", op:0.12, animBase:"ab-m2", durMedio:8,  delay:"1.5s" },
]

const MESH_COUNT: Record<BackgroundIntensity, number> = { suave: 3, medio: 4, intenso: 6 }

function MeshBg({ accentColor, intensity }: { accentColor: string; intensity: BackgroundIntensity }) {
  const sfx   = ANIM_SFX[intensity]
  const dmult = DUR_MULT[intensity]
  const orbs  = MESH_ORBS_ALL.slice(0, MESH_COUNT[intensity])

  return (
    <div style={LAYER}>
      {orbs.map((o, i) => (
        <div
          key={i}
          data-ab-mesh=""
          style={{
            position: "absolute",
            borderRadius: "50%",
            filter: "blur(60px)",
            top: o.top, left: o.left,
            width: o.size, height: o.size,
            opacity: o.op,
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
            animation: `${o.animBase}${sfx} ${(o.durMedio * dmult).toFixed(1)}s ease-in-out ${o.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ── Orbs (canvas) ──────────────────────────────────────────────────────────────
// Count: suave 4 · medio 7 · intenso 12. Speed and amplitude scale with intensity.
// Always inits 12 orbs; draw loop renders the active subset via intensityRef.

const ORBS_PARAMS: Record<BackgroundIntensity, { count: number; tSpeed: number }> = {
  suave:   { count: 4,  tSpeed: 0.25 },
  medio:   { count: 7,  tSpeed: 0.5  },
  intenso: { count: 12, tSpeed: 0.9  },
}

function OrbsBg({ accentColor, intensity }: { accentColor: string; intensity: BackgroundIntensity }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number>(0)
  const intensityRef = useRef<BackgroundIntensity>(intensity)

  useEffect(() => { intensityRef.current = intensity }, [intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const [r, g, b] = resolveRgb(accentColor, canvasRef.current)
    const reduced   = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const orbs = Array.from({ length: 12 }, () => ({
      bx:  Math.random(),
      by:  Math.random(),
      rad: 0.08 + Math.random() * 0.14,
      spd: 0.35 + Math.random() * 0.5,
      ph:  Math.random() * Math.PI * 2,
      phy: Math.random() * Math.PI * 2,
      amp: 0.05 + Math.random() * 0.08,
      op:  0.20 + Math.random() * 0.22,
    }))

    let w = 0, h = 0
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const { count } = ORBS_PARAMS[intensityRef.current]
      for (let i = 0; i < count; i++) {
        const o  = orbs[i]
        const cx = (o.bx + Math.sin(t * o.spd + o.ph)       * o.amp) * w
        const cy = (o.by + Math.cos(t * o.spd * 0.7 + o.phy) * o.amp) * h
        const rad = o.rad * Math.min(w, h)
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        grad.addColorStop(0,    `rgba(${r},${g},${b},${o.op})`)
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${o.op * 0.3})`)
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, rad, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (reduced) { draw(0); return () => ro.disconnect() }

    // Accumulate t per-frame so speed changes smoothly when intensity changes
    let t         = 0
    let lastNow: number | null = null
    const frame = (now: number) => {
      const dt = lastNow === null ? 0 : (now - lastNow) / 1000
      lastNow  = now
      t       += dt * ORBS_PARAMS[intensityRef.current].tSpeed
      draw(t)
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [accentColor])

  return <div style={LAYER}><canvas ref={canvasRef} style={CANVAS_STYLE} /></div>
}

// ── Starfield (canvas) ─────────────────────────────────────────────────────────
// Count: suave 60 · medio 150 · intenso 300. Speed scales with intensity.
// Always inits 300 stars; draw loop renders active subset via intensityRef.

const STAR_PARAMS: Record<BackgroundIntensity, { n: number; spd: number }> = {
  suave:   { n: 60,  spd: 1.0 },
  medio:   { n: 150, spd: 2.5 },
  intenso: { n: 300, spd: 5.0 },
}

function StarfieldBg({ accentColor, intensity }: { accentColor: string; intensity: BackgroundIntensity }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number>(0)
  const intensityRef = useRef<BackgroundIntensity>(intensity)

  useEffect(() => { intensityRef.current = intensity }, [intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const [r, g, b] = resolveRgb(accentColor, canvasRef.current)
    const reduced   = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const MAXZ  = 1000
    const stars = Array.from({ length: 300 }, () => {
      const z = Math.random() * MAXZ
      return { x: (Math.random() - 0.5) * MAXZ * 2, y: (Math.random() - 0.5) * MAXZ * 2, z, pz: z }
    })

    let w = 0, h = 0
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const draw = (advance: boolean) => {
      ctx.clearRect(0, 0, w, h)
      const cx    = w * 0.5
      const cy    = h * 0.5
      const focal = w * 0.45
      const { n, spd } = STAR_PARAMS[intensityRef.current]

      for (let i = 0; i < n; i++) {
        const s = stars[i]
        if (advance) {
          s.pz = s.z
          s.z -= spd
          if (s.z <= 0) {
            s.x  = (Math.random() - 0.5) * MAXZ * 2
            s.y  = (Math.random() - 0.5) * MAXZ * 2
            s.z  = MAXZ
            s.pz = MAXZ
          }
        }
        const px  = (s.x / s.z)  * focal + cx
        const py  = (s.y / s.z)  * focal + cy
        const ppx = (s.x / s.pz) * focal + cx
        const ppy = (s.y / s.pz) * focal + cy
        if (px < -4 || px > w + 4 || py < -4 || py > h + 4) continue
        const progress = 1 - s.z / MAXZ
        ctx.strokeStyle = `rgba(${r},${g},${b},${progress * 0.8})`
        ctx.lineWidth   = Math.max(0.4, progress * 2.2)
        ctx.beginPath()
        ctx.moveTo(ppx, ppy)
        ctx.lineTo(px, py)
        ctx.stroke()
      }
    }

    if (reduced) { draw(false); return () => ro.disconnect() }

    const frame = () => { draw(true); rafRef.current = requestAnimationFrame(frame) }
    rafRef.current = requestAnimationFrame(frame)

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [accentColor])

  return <div style={LAYER}><canvas ref={canvasRef} style={CANVAS_STYLE} /></div>
}

// ── Beam (canvas) ──────────────────────────────────────────────────────────────
// Count: suave 1 · medio 2 · intenso 3. Period scales with intensity.
// Beams are evenly phase-spaced (0, ⅓, ⅔) with decreasing alpha.

const BEAM_PARAMS: Record<BackgroundIntensity, { count: number; period: number }> = {
  suave:   { count: 1, period: 9.0 },
  medio:   { count: 2, period: 6.0 },
  intenso: { count: 3, period: 3.5 },
}

const BEAM_ALPHAS = [1.0, 0.6, 0.4]  // per-beam opacity (beam 1 → 2 → 3)
const ANGLE = Math.PI / 5             // 36° from vertical

function BeamBg({ accentColor, intensity }: { accentColor: string; intensity: BackgroundIntensity }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number>(0)
  const intensityRef = useRef<BackgroundIntensity>(intensity)

  useEffect(() => { intensityRef.current = intensity }, [intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const [r, g, b] = resolveRgb(accentColor, canvasRef.current)
    const reduced   = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let w = 0, h = 0
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const drawBeam = (phase: number, alpha: number) => {
      const diag  = Math.sqrt(w * w + h * h)
      const bx    = phase * (w + diag) - diag * 0.5
      const bw    = Math.min(w, h) * 0.22
      ctx.save()
      ctx.translate(bx, h * 0.5)
      ctx.rotate(ANGLE)
      const grad = ctx.createLinearGradient(-bw, 0, bw, 0)
      grad.addColorStop(0,    `rgba(${r},${g},${b},0)`)
      grad.addColorStop(0.35, `rgba(${r},${g},${b},${alpha * 0.06})`)
      grad.addColorStop(0.5,  `rgba(${r},${g},${b},${alpha * 0.11})`)
      grad.addColorStop(0.65, `rgba(${r},${g},${b},${alpha * 0.06})`)
      grad.addColorStop(1,    `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = grad
      ctx.fillRect(-bw, -diag * 0.5, bw * 2, diag)
      ctx.restore()
    }

    if (reduced) {
      // Static: one beam at 30%
      ctx.clearRect(0, 0, w, h)
      const bw   = Math.min(w, h) * 0.22
      const diag = Math.sqrt(w * w + h * h)
      ctx.save()
      ctx.translate(w * 0.3, h * 0.5)
      ctx.rotate(ANGLE)
      const grad = ctx.createLinearGradient(-bw, 0, bw, 0)
      grad.addColorStop(0,   `rgba(${r},${g},${b},0)`)
      grad.addColorStop(0.5, `rgba(${r},${g},${b},0.09)`)
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = grad
      ctx.fillRect(-bw, -diag * 0.5, bw * 2, diag)
      ctx.restore()
      return () => ro.disconnect()
    }

    // Accumulate phase fraction so period changes apply smoothly
    let phase       = 0
    let lastNow: number | null = null
    const frame = (now: number) => {
      const dt  = lastNow === null ? 0 : (now - lastNow) / 1000
      lastNow   = now
      const { count, period } = BEAM_PARAMS[intensityRef.current]
      phase = (phase + dt / period) % 1

      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < count; i++) {
        const beamPhase = (phase + i / 3) % 1  // evenly spaced thirds
        drawBeam(beamPhase, BEAM_ALPHAS[i])
      }
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [accentColor])

  return <div style={LAYER}><canvas ref={canvasRef} style={CANVAS_STYLE} /></div>
}

// ── Main export ───────────────────────────────────────────────────────────────

interface AnimatedBackgroundProps {
  accentColor?: string
}

export function AnimatedBackground({ accentColor = "#D4A017" }: AnimatedBackgroundProps) {
  const se = useSectionEffects()
  const bg = migrateBackground(se?.background)

  if (!bg) return null

  const { type, intensity } = bg

  if (type === "aurora")        return <AuroraBg     accentColor={accentColor} intensity={intensity} />
  if (type === "mesh-gradient") return <MeshBg       accentColor={accentColor} intensity={intensity} />
  if (type === "orbs")          return <OrbsBg       accentColor={accentColor} intensity={intensity} />
  if (type === "starfield")     return <StarfieldBg  accentColor={accentColor} intensity={intensity} />
  if (type === "beam")          return <BeamBg       accentColor={accentColor} intensity={intensity} />

  return null
}
