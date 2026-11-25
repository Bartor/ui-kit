/** Widths of table columns, in pixels, by column key. The label column's key is `LABEL_WIDTH_KEY`. */
export type ColumnWidths = Readonly<Record<string, number>>

export const LABEL_WIDTH_KEY = ':label'

/** What a column may be dragged to. The label column is wider than the rest. */
export const WIDTH_LIMITS = {
  label: { min: 80, max: 480 },
  column: { min: 40, max: 320 },
} as const

/** What a column without a width of its own counts as, once others have one. */
export const WIDTH_FALLBACK = { label: 160, column: 64 } as const

/** A step of the arrow keys, and the larger one with Shift. */
export const WIDTH_STEP = 8
export const WIDTH_BIG_STEP = 32

const kind = (key: string): 'label' | 'column' => (key === LABEL_WIDTH_KEY ? 'label' : 'column')

/** The smallest and the largest width of a column. */
export const widthLimits = (key: string): { min: number; max: number } => WIDTH_LIMITS[kind(key)]

/** A width held between the limits of its column, as a whole number of pixels. */
export function clampWidth(key: string, width: number): number {
  const { min, max } = widthLimits(key)
  if (!Number.isFinite(width)) return min
  return Math.min(max, Math.max(min, Math.round(width)))
}

/** The widths with one column set; the others stay as they were. */
export function withWidth(widths: ColumnWidths, key: string, width: number): ColumnWidths {
  return { ...widths, [key]: clampWidth(key, width) }
}

/** A width held between the limits of its column, where a column that starts outside them may stay where it is:
 *  a column laid out wider than the largest width does not jump back the moment it is touched. */
export function clampFrom(key: string, width: number, from: number): number {
  const { min, max } = widthLimits(key)
  if (!Number.isFinite(width)) return clampWidth(key, from)
  const lo = Number.isFinite(from) ? Math.min(min, Math.round(from)) : min
  const hi = Number.isFinite(from) ? Math.max(max, Math.round(from)) : max
  return Math.min(hi, Math.max(lo, Math.round(width)))
}

/** The widths with the ones missing filled from `seen`, the widths the columns have on screen: those are taken as
 *  they are (whole pixels, rounded up: half a pixel less would cut the text of a head that fits exactly), so that
 *  giving one column a width moves no other. The ones set stay as set. */
export function fillWidths(widths: ColumnWidths, seen: ColumnWidths): ColumnWidths {
  const out: Record<string, number> = {}
  for (const key of new Set([...Object.keys(seen), ...Object.keys(widths)])) {
    const own = widths[key]
    const now = seen[key]
    out[key] = own != null ? own : now != null && now > 0 ? Math.ceil(now - 0.01) : WIDTH_FALLBACK[kind(key)]
  }
  return out
}

/** The width a key press gives, or null when the key does not resize. Home and End go to the limits. */
export function widthAfterKey(key: string, current: number, pressed: string, shift = false): number | null {
  const step = shift ? WIDTH_BIG_STEP : WIDTH_STEP
  const { min, max } = widthLimits(key)
  switch (pressed) {
    case 'ArrowRight': case 'ArrowUp': return clampFrom(key, current + step, current)
    case 'ArrowLeft': case 'ArrowDown': return clampFrom(key, current - step, current)
    case 'Home': return min
    case 'End': return max
    default: return null
  }
}

/** The width of the whole table: the columns in order, each at its width or the fallback. */
export function tableWidth(keys: readonly string[], widths: ColumnWidths): number {
  return keys.reduce((sum, key) => sum + (widths[key] ?? WIDTH_FALLBACK[kind(key)]), 0)
}

/** Where widths are kept between visits: the browser's local storage, under this prefix and the table's own key. */
export const WIDTHS_STORE = 'kit-data-widths:'

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const browserStore = (): Store | undefined => {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined        // storage is blocked
  }
}

/** The widths kept under `key`, or none: anything that is not a positive number is dropped. Never throws. */
export function readWidths(key: string, store: Store | undefined = browserStore()): ColumnWidths {
  const out: Record<string, number> = {}
  try {
    const kept: unknown = JSON.parse(store?.getItem(WIDTHS_STORE + key) ?? 'null')
    if (!kept || typeof kept !== 'object' || Array.isArray(kept)) return out
    for (const [k, v] of Object.entries(kept)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = Math.round(v)
    }
  } catch { /* unreadable: start without widths */ }
  return out
}

/** Keeps the widths under `key`; no widths removes the entry. Never throws (a full or blocked storage is ignored). */
export function writeWidths(key: string, widths: ColumnWidths, store: Store | undefined = browserStore()): void {
  try {
    if (Object.keys(widths).length) store?.setItem(WIDTHS_STORE + key, JSON.stringify(widths))
    else store?.removeItem(WIDTHS_STORE + key)
  } catch { /* nothing to do */ }
}
