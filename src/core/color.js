const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** Text colour for a label inside a fill: white, except near-black on the
 *  yellows and ambers, where white washes out. */
export function inkOn(hex) {
  const [r, g, b] = rgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (!d) return '#fff'
  const h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2)
    : 60 * ((r - g) / d + 4)
  const hue = (h + 360) % 360
  return hue >= 35 && hue <= 70 ? '#111' : '#fff'
}

const SHADES = [0, 0.3, -0.25, 0.5, -0.4]

/** Alternating shades of one colour, for neighbouring pieces of a stack. */
export function shade(hex, i) {
  const s = SHADES[i % SHADES.length]
  const to = s > 0 ? 255 : 0
  const mix = rgb(hex).map((v) => Math.round(v + (to - v) * Math.abs(s)))
  return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/**
 * A stepped colour scale: [[1000, '#3b82f6'], ..., [Infinity, '#ef4444']],
 * each step up to its bound. `color` picks a step; `legend` names them all.
 */
export function ramp(steps, format = String) {
  return {
    color: (v) => steps.find(([bound]) => v < bound)[1],
    legend: () => steps.map(([bound, color], i) => ({
      color,
      label: i === 0 ? `< ${format(bound)}`
        : i === steps.length - 1 ? `> ${format(steps[i - 1][0])}`
          : `${format(steps[i - 1][0])}–${format(bound)}`,
    })),
  }
}
