import { locale, t } from './config.js'

/** A whole number in the page's locale; a dash for none. */
export const fmt = (n: number | null | undefined): string =>
  (n == null ? '—' : Math.round(n).toLocaleString(locale()))

/** A fixed number of decimals, in the page's locale. */
export const fixed = (n: number | null | undefined, digits = 1): string =>
  (n == null ? '—' : n.toLocaleString(locale(), {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }))

/** Two significant figures: past them an estimate's digits are noise. */
export function roundEst(n: number): number {
  if (!n || n < 100) return Math.round(n / 10) * 10
  const mag = 10 ** (Math.floor(Math.log10(n)) - 1)
  return Math.round(n / mag) * mag
}

/** An estimate: rounded by roundEst and marked as approximate. */
export const fmtEst = (n: number): string => `≈${fmt(roundEst(n))}`

/** A share as a percentage: 0.257 -> "25.7%". */
export const pct = (n: number | null | undefined): string =>
  (n == null ? '—' : `${(n * 100).toFixed(1)}%`)

/** Axis ticks with the thousands shortened, so "3800" is not clipped to "800". */
export const axisTick = (v: number): string | number => (v >= 1000
  ? t('thousands', (v / 1000).toLocaleString(locale(), { maximumFractionDigits: 1 })) : v)

/** Text as a file name or an address: "Szczyt poranny 7–9" -> szczyt-poranny-7-9. */
export const slug = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Symbol radius: by square root, so the area tracks the value. */
export function sqrtRadius(value: number | null | undefined, max: number, min = 3, cap = 22): number {
  if (!value || !max) return min
  return min + (cap - min) * Math.sqrt(value / max)
}
