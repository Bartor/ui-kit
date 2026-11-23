/** A period as hour boundaries [from, to), 0..24; from > to wraps over midnight. */
export type HourBounds = readonly [from: number, to: number]

/** 7 -> "07:00". */
export const hourLabel = (h: number): string => `${String(h).padStart(2, '0')}:00`

/** An hour as a span: 7 -> "07:00–08:00". */
export const hourSpan = (h: number): string => `${hourLabel(h)}–${hourLabel((h + 1) % 24)}`

/** The hours in a period. */
export function hoursOf([from, to]: HourBounds): number[] {
  const out: number[] = []
  if (from < to) for (let h = from; h < to; h++) out.push(h)
  else {
    for (let h = from; h < 24; h++) out.push(h)
    for (let h = 0; h < to; h++) out.push(h)
  }
  return out
}

export const sameRange = (a: HourBounds, b: HourBounds): boolean => a[0] === b[0] && a[1] === b[1]

/** Hours as runs, so 6-10 and 15-19 do not read as 6-19: "06:00–10:00, 15:00–19:00". */
export function hourRuns(hours: readonly number[] | null | undefined, empty = ''): string {
  if (!hours?.length) return empty
  const runs: [number, number][] = []
  for (const h of [...hours].sort((a, b) => a - b)) {
    const last = runs.at(-1)
    if (last && last[1] === h - 1) last[1] = h
    else runs.push([h, h])
  }
  return runs.map(([a, b]) => `${hourLabel(a)}–${hourLabel((b + 1) % 24)}`).join(', ')
}
