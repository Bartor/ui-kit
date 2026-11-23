// Pies, labels and arrows as HTML strings, for Leaflet's div icons.

const sum = (slices) => slices.reduce((a, s) => a + s.value, 0)

/** SVG pie of [{ color, value }]. `ring` outlines it as selected; a pie of
 *  nothing is a grey disc. */
export function pieSvg(slices, r, ring) {
  const size = 2 * r + 6
  const c = r + 3
  const total = sum(slices)
  const outline = ring
    ? `<circle cx="${c}" cy="${c}" r="${r + 1.5}" fill="none" stroke="#fff" stroke-width="2.5"/>`
    : ''
  if (!total) {
    return `<svg width="${size}" height="${size}"><circle cx="${c}" cy="${c}" r="${r}"
      fill="#3a3f4b" stroke="#14161a" stroke-width="1"/>${outline}</svg>`
  }
  const parts = slices.filter((s) => s.value > 0)
  let body = ''
  if (parts.length === 1) {
    body = `<circle cx="${c}" cy="${c}" r="${r}" fill="${parts[0].color}"/>`
  } else {
    let a0 = -Math.PI / 2
    for (const s of parts) {
      const a1 = a0 + (2 * Math.PI * s.value) / total
      const large = a1 - a0 > Math.PI ? 1 : 0
      const x0 = c + r * Math.cos(a0)
      const y0 = c + r * Math.sin(a0)
      const x1 = c + r * Math.cos(a1)
      const y1 = c + r * Math.sin(a1)
      body += `<path d="M${c},${c} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 `
        + `${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="${s.color}" stroke="#14161a" stroke-width="0.8"/>`
      a0 = a1
    }
  }
  return `<svg width="${size}" height="${size}">${body}`
    + `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#14161a" stroke-width="1"/>`
    + `${outline}</svg>`
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
export const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c])

/** Lines of a label, [{ text, color?, bold? }], as HTML. */
export function labelHtml(lines) {
  return lines.map((l) => (
    `<div class="kit-label-line${l.bold ? ' bold' : ''}">`
    + (l.color ? `<i style="background:${l.color}"></i>` : '')
    + `<span>${escapeHtml(l.text)}</span></div>`
  )).join('')
}

/** Rough box size, so overlap can be tested without measuring the DOM. */
export function labelBox(lines) {
  const chars = Math.max(...lines.map((l) => l.text.length + (l.color ? 2 : 0)))
  return { w: Math.round(chars * 6.4 + 14), h: lines.length * 13 + 6 }
}

// the two ways along a street, coloured as their segments in DirectionSplit
const DIR_COLORS = ['var(--kit-dir-a)', 'var(--kit-dir-b)']
export const ARROWS_SIZE = 84

/**
 * Directions as arrows around a point, each keeping to the right of it as
 * traffic keeps right, so a two-way street reads as two lanes. `bearings` are
 * in degrees, null for a direction with none; with `lit` an index, the others
 * fade.
 */
export function arrowsSvg(bearings, lit = -1) {
  const c = ARROWS_SIZE / 2
  const x = c + 16                      // right of the point, before rotating
  const ink = '#14161a'
  const ways = bearings.map((turn, i) => {
    if (turn == null) return ''
    const col = DIR_COLORS[i] || DIR_COLORS[1]
    return `<g transform="rotate(${turn} ${c} ${c})" opacity="${lit < 0 || lit === i ? 1 : 0.2}">`
      + `<path d="M${x} ${c + 17}V${c - 8}" stroke="${ink}" stroke-width="6" stroke-linecap="round"/>`
      + `<path d="M${x - 7} ${c - 7}L${x} ${c - 20}L${x + 7} ${c - 7}Z" fill="${col}" `
      + `stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M${x} ${c + 17}V${c - 7}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`
      + '</g>'
  }).join('')
  return `<svg width="${ARROWS_SIZE}" height="${ARROWS_SIZE}" fill="none">${ways}</svg>`
}
