// A self-contained picture of one thing, for pasting into documents and posts.
//
// Drawn straight onto a canvas rather than screenshotting the panel: no extra
// dependency, crisp at 2x, and no map tiles - tiles from another origin would
// taint the canvas and make the copy fail. Light background, because the
// picture ends up in documents and slides, not in a dark interface.
import { fmt, fmtEst } from './format'
import { hourLabel } from './hours'
import { inkOn } from './color'
import { t } from './config'

const W = 1000
const PAD = 56
const SCALE = 2
const MAX_H = 2600
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
const INK = '#14161a'
const DIM = '#5b6270'
const FAINT = '#8a919e'

const font = (size, weight = 400) => `${weight} ${size}px ${FONT}`

function wrap(ctx, text, maxW) {
  const lines = []
  for (const par of String(text).split('\n')) {
    let line = ''
    for (const word of par.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    lines.push(line)
  }
  return lines
}

/** Draws wrapped text and returns the y below it. */
function para(ctx, text, x, y, maxW, size, color, weight = 400, lh = 1.4) {
  ctx.font = font(size, weight)
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  for (const line of wrap(ctx, text, maxW)) {
    ctx.fillText(line, x, y)
    y += size * lh
  }
  return y
}

// ------------------------------------------------------------------- blocks
// A block draws itself at y and returns the y below it: (ctx, y, kit) => y.

/**
 * A donut beside its table. Slices: [{ key, label, color, value, est?, extra? }]
 * in ring order; the table goes largest first, with a second pair of columns
 * when the slices carry an `extra` value.
 */
export const splitBlock = ({ slices, unit, columns }) => (ctx, y) => {
  const total = slices.reduce((a, s) => a + s.value, 0)
  const ring = slices.filter((s) => s.value > 0)
  const rows = [...ring].sort((a, b) => b.value - a.value)
  const extraTotal = slices.reduce((a, s) => a + (s.extra || 0), 0)

  const r = 132
  const cx = PAD + r + 4
  const cy = y + r + 4
  let a0 = -Math.PI / 2
  for (const s of ring) {
    const a1 = a0 + (2 * Math.PI * s.value) / total
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a0, a1)
    ctx.closePath()
    ctx.fillStyle = s.color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    a0 = a1
  }
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.58, 0, 2 * Math.PI)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = INK
  ctx.font = font(30, 700)
  ctx.fillText(fmtEst(total), cx, cy - 10)
  ctx.font = font(15)
  ctx.fillStyle = DIM
  ctx.fillText(unit, cx, cy + 20)
  ctx.textAlign = 'left'

  // without the extra columns the first two move right
  const tx = cx + r + 44
  const right = W - PAD
  const extra = extraTotal > 0
  const col = extra
    ? { value: right - 214, share: right - 150, extra: right - 62, extraShare: right }
    : { value: right - 70, share: right }
  let ty = y + 6
  ctx.font = font(13, 600)
  ctx.fillStyle = FAINT
  ctx.textBaseline = 'top'
  ctx.textAlign = 'right'
  for (const [k, x] of Object.entries(col)) ctx.fillText(columns[k], x, ty)
  ctx.textAlign = 'left'
  ty += 28
  for (const s of rows) {
    ctx.beginPath()
    ctx.arc(tx + 7, ty + 10, 7, 0, 2 * Math.PI)
    ctx.fillStyle = s.color
    ctx.fill()
    ctx.font = font(17)
    ctx.fillStyle = INK
    ctx.fillText(wrap(ctx, s.label, col.value - 90 - (tx + 24))[0], tx + 24, ty)
    ctx.textAlign = 'right'
    ctx.fillText(s.est ? fmtEst(s.value) : fmt(s.value), col.value, ty)
    ctx.font = font(17, 700)
    ctx.fillText(`${Math.round((100 * s.value) / total)}`, col.share, ty)
    if (extra && s.extra != null) {
      ctx.font = font(16)
      ctx.fillStyle = DIM
      ctx.fillText(fmt(s.extra), col.extra, ty)
      ctx.font = font(16, 700)
      ctx.fillText(`${Math.round((100 * s.extra) / extraTotal)}`, col.extraShare, ty)
    }
    ctx.textAlign = 'left'
    ty += 34
  }
  return Math.max(cy + r, ty) + 28
}

/**
 * The same parts as several 100% bars: rows [{ label, parts: [{ key, color,
 * share }] }]. The share of the `mark` part is written beside each bar; a
 * caption says so, and a conclusion may follow.
 */
export const sharesBlock = ({ rows, mark, caption, conclusion }) => (ctx, y) => {
  const bx = PAD + 230
  const bw = W - PAD - 70 - bx
  for (const row of rows) {
    ctx.font = font(15)
    ctx.fillStyle = DIM
    ctx.textBaseline = 'middle'
    ctx.fillText(row.label, PAD, y + 15)
    let x = bx
    const parts = row.parts.filter((p) => p.share > 0)
    const gaps = 2 * (parts.length - 1)
    for (const p of parts) {
      const w = Math.max(2, (bw - gaps) * p.share)
      ctx.fillStyle = p.color
      ctx.fillRect(x, y, w, 30)
      // the number inside when it fits
      const label = `${Math.round(p.share * 100)}%`
      ctx.font = font(14, 700)
      if (w >= ctx.measureText(label).width + 10) {
        ctx.fillStyle = inkOn(p.color)
        ctx.textAlign = 'center'
        ctx.fillText(label, x + w / 2, y + 16)
        ctx.textAlign = 'left'
      }
      x += w + 2
    }
    const marked = row.parts.find((p) => p.key === mark)
    if (marked) {
      ctx.font = font(16, 700)
      ctx.fillStyle = INK
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.round(marked.share * 100)}%`, W - PAD, y + 15)
      ctx.textAlign = 'left'
    }
    ctx.textBaseline = 'top'
    y += 42
  }
  if (caption) {
    ctx.font = font(13)
    ctx.fillStyle = FAINT
    ctx.fillText(caption, PAD, y + 2)
  }
  y += 40
  if (conclusion) y = para(ctx, conclusion, PAD, y - 6, W - 2 * PAD, 21, '#c2410c', 700, 1.3) + 22
  return y
}

/** One big number with its unit, and 24 hourly bars under it if given:
 *  profile { values, hours, color }, the hours of the period at full strength. */
export const figureBlock = ({ figure, profile }) => (ctx, y) => {
  if (figure) {
    ctx.font = font(52, 700)
    ctx.fillStyle = INK
    ctx.textBaseline = 'top'
    ctx.fillText(figure.value, PAD, y)
    const w = ctx.measureText(figure.value).width
    para(ctx, figure.unit, PAD + w + 14, y + 26, W - 2 * PAD - w - 14, 19, DIM)
    y += 72
  }
  if (!profile) return y + 8
  const { values, hours, color } = profile
  const h = 170
  const top = y + 14
  const chartW = W - 2 * PAD
  const bw = chartW / 24
  const max = Math.max(1, ...values)
  ctx.font = font(13)
  ctx.fillStyle = FAINT
  ctx.fillText(t('cardProfile', fmt(max)), PAD, y - 4)
  for (let i = 0; i < 24; i++) {
    const bh = (values[i] / max) * h
    ctx.globalAlpha = hours.includes(i) ? 1 : 0.25
    ctx.fillStyle = color
    ctx.fillRect(PAD + i * bw + 2, top + h - bh, bw - 4, bh)
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#d9dce2'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, top + h + 0.5)
  ctx.lineTo(PAD + chartW, top + h + 0.5)
  ctx.stroke()
  ctx.fillStyle = FAINT
  ctx.font = font(13)
  for (let i = 0; i < 24; i += 3) ctx.fillText(hourLabel(i), PAD + i * bw, top + h + 8)
  return top + h + 40
}

/**
 * Renders the card and resolves to a PNG blob.
 *
 *   accent              colour of the band on top
 *   kicker, title, subtitle, when
 *   blocks              drawing functions, top to bottom
 *   notes               bulleted small print
 *   source              one line under the rule
 *   footer, site        last line: where it came from, so a card shared on its
 *                       own still leads back
 */
export function renderCard(spec) {
  const scratch = document.createElement('canvas')
  scratch.width = W * SCALE
  scratch.height = MAX_H * SCALE
  const ctx = scratch.getContext('2d')
  ctx.scale(SCALE, SCALE)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, MAX_H)
  ctx.fillStyle = spec.accent || '#4a6ea9'
  ctx.fillRect(0, 0, W, 8)

  let y = PAD - 8
  if (spec.kicker) y = para(ctx, spec.kicker.toUpperCase(), PAD, y, W - 2 * PAD, 14, FAINT, 600) + 6
  y = para(ctx, spec.title, PAD, y, W - 2 * PAD, 36, INK, 700, 1.2) + 6
  if (spec.subtitle) y = para(ctx, spec.subtitle, PAD, y, W - 2 * PAD, 18, DIM) + 4
  if (spec.when) y = para(ctx, spec.when, PAD, y + 6, W - 2 * PAD, 17, INK, 600) + 24

  for (const block of spec.blocks || []) {
    y = block(ctx, y, { W, PAD, INK, DIM, FAINT, font, wrap, para })
  }

  for (const n of spec.notes || []) {
    ctx.font = font(15)
    ctx.fillStyle = FAINT
    ctx.fillText('•', PAD, y)
    y = para(ctx, n, PAD + 18, y, W - 2 * PAD - 18, 15, DIM) + 6
  }

  y += 14
  ctx.strokeStyle = '#e6e8ec'
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(W - PAD, y)
  ctx.stroke()
  y += 14
  if (spec.source) y = para(ctx, spec.source, PAD, y, W - 2 * PAD, 14, DIM)
  let siteW = 0
  if (spec.site) {
    ctx.font = font(13, 600)
    ctx.fillStyle = DIM
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(spec.site, W - PAD, y + 2)
    ctx.textAlign = 'left'
    siteW = ctx.measureText(spec.site).width + 24
  }
  y = para(ctx, spec.footer || '', PAD, y + 2, W - 2 * PAD - siteW, 13, FAINT) + PAD - 16

  const out = document.createElement('canvas')
  out.width = W * SCALE
  out.height = Math.ceil(y * SCALE)
  out.getContext('2d').drawImage(scratch, 0, 0)
  return new Promise((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
}
