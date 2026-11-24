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

/** The widths with the ones missing filled from `natural`, and every one held between its limits. */
export function fillWidths(widths: ColumnWidths, natural: ColumnWidths): ColumnWidths {
  const out: Record<string, number> = {}
  for (const key of new Set([...Object.keys(natural), ...Object.keys(widths)])) {
    out[key] = clampWidth(key, widths[key] ?? natural[key] ?? WIDTH_FALLBACK[kind(key)])
  }
  return out
}

/** The width a key press gives, or null when the key does not resize. Home and End go to the limits. */
export function widthAfterKey(key: string, current: number, pressed: string, shift = false): number | null {
  const step = shift ? WIDTH_BIG_STEP : WIDTH_STEP
  const { min, max } = widthLimits(key)
  switch (pressed) {
    case 'ArrowRight': case 'ArrowUp': return clampWidth(key, current + step)
    case 'ArrowLeft': case 'ArrowDown': return clampWidth(key, current - step)
    case 'Home': return min
    case 'End': return max
    default: return null
  }
}

/** The width of the whole table: the columns in order, each at its width or the fallback. */
export function tableWidth(keys: readonly string[], widths: ColumnWidths): number {
  return keys.reduce((sum, key) => sum + (widths[key] ?? WIDTH_FALLBACK[kind(key)]), 0)
}
