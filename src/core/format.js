import { locale, t } from './config'

export const fmt = (n) => (n == null ? '—' : Math.round(n).toLocaleString(locale()))

/** A fixed number of decimals, in the page's locale. */
export const fixed = (n, digits = 1) => (n == null ? '—' : n.toLocaleString(locale(), {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
}))

/** Two significant figures: past them an estimate's digits are noise. */
export function roundEst(n) {
  if (!n || n < 100) return Math.round(n / 10) * 10
  const mag = 10 ** (Math.floor(Math.log10(n)) - 1)
  return Math.round(n / mag) * mag
}

export const fmtEst = (n) => `≈${fmt(roundEst(n))}`

export const pct = (n) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`)

/** Axis ticks with the thousands shortened, so "3800" is not clipped to "800". */
export const axisTick = (v) => (v >= 1000
  ? t('thousands', (v / 1000).toLocaleString(locale(), { maximumFractionDigits: 1 })) : v)

/** Text as a file name or an address: "Szczyt poranny 7–9" -> szczyt-poranny-7-9. */
export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Symbol radius: by square root, so the area tracks the value. */
export function sqrtRadius(value, max, min = 3, cap = 22) {
  if (!value || !max) return min
  return min + (cap - min) * Math.sqrt(value / max)
}
