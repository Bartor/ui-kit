// Periods are ranges of hour boundaries [from, to), 0..24; from > to wraps
// over midnight.

export const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`

/** An hour as a span: 7 -> "07:00–08:00". */
export const hourSpan = (h) => `${hourLabel(h)}–${hourLabel((h + 1) % 24)}`

/** The hours in a range. */
export function hoursOf([from, to]) {
  const out = []
  if (from < to) for (let h = from; h < to; h++) out.push(h)
  else {
    for (let h = from; h < 24; h++) out.push(h)
    for (let h = 0; h < to; h++) out.push(h)
  }
  return out
}

export const sameRange = (a, b) => a[0] === b[0] && a[1] === b[1]

/** Hours as runs, so 6-10 and 15-19 do not read as 6-19: "06:00–10:00, 15:00–19:00". */
export function hourRuns(hours, empty = '') {
  if (!hours?.length) return empty
  const runs = []
  for (const h of [...hours].sort((a, b) => a - b)) {
    if (runs.length && runs.at(-1)[1] === h - 1) runs.at(-1)[1] = h
    else runs.push([h, h])
  }
  return runs.map(([a, b]) => `${hourLabel(a)}–${hourLabel((b + 1) % 24)}`).join(', ')
}
