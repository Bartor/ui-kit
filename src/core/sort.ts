import { locale } from './config.js'

export type SortDir = 'asc' | 'desc'

/** What a cell offers to sort by: a number, a text, or nothing. */
export type SortValue = number | string | null | undefined

/** Which way is better in a row of figures; sets which way its first sort goes. */
export type Better = 'higher' | 'lower' | null

/** A sort: by what (a column's or a row's key) and which way. No sort is `null`. */
export interface SortState {
  key: string
  dir: SortDir
}

/** A missing value: not given, empty, or not a finite number. It is never zero. */
export const isMissing = (v: SortValue): boolean =>
  v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))

let collator: { tag: string; c: Intl.Collator } | null = null
const text = (): Intl.Collator => {
  const tag = locale()
  if (!collator || collator.tag !== tag) {
    collator = { tag, c: new Intl.Collator(tag, { numeric: true, sensitivity: 'base' }) }
  }
  return collator.c
}

/**
 * Orders two values for `dir`. Missing values come after every other one in
 * both directions, numbers come before texts, texts go by the page's locale
 * ("Łódź" after "Lublin" in Polish, "2" before "10").
 */
export function compareValues(a: SortValue, b: SortValue, dir: SortDir): number {
  const ma = isMissing(a)
  const mb = isMissing(b)
  if (ma || mb) return ma === mb ? 0 : ma ? 1 : -1
  let c: number
  if (typeof a === 'number' && typeof b === 'number') c = a - b
  else if (typeof a === 'number') c = -1
  else if (typeof b === 'number') c = 1
  else c = text().compare(String(a), String(b))
  return dir === 'asc' ? c : -c
}

/** The positions 0..n-1 in the order of their values; equal ones keep their own order. */
export function sortOrder(values: readonly SortValue[], dir: SortDir): number[] {
  return values.map((_, i) => i).sort((i, j) => compareValues(values[i], values[j], dir) || i - j)
}

/** The same items, sorted by `valueOf`; the input is not changed. */
export function sortItems<T>(items: readonly T[], valueOf: (item: T) => SortValue, dir: SortDir): T[] {
  return sortOrder(items.map(valueOf), dir).map((i) => items[i]!)
}

/** The way a sort starts: best first, which is high first unless lower is better. */
export const firstDir = (better?: Better): SortDir => (better === 'lower' ? 'asc' : 'desc')

/** What a click on a sort control does: the first way, then the other, then none. */
export function nextSort(current: SortState | null | undefined, key: string, first: SortDir = 'desc'): SortState | null {
  if (!current || current.key !== key) return { key, dir: first }
  if (current.dir === first) return { key, dir: first === 'desc' ? 'asc' : 'desc' }
  return null
}
