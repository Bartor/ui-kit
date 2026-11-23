import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { hourLabel } from '../core/hours.js'
import type { HourBounds } from '../core/hours.js'
import { t } from '../core/config.js'

// Two thumbs on a 24-hour track, at hour boundaries 0..24. A start after the
// end wraps over midnight, which is how "22-5" is represented: one range,
// drawn as two segments.

const END = 24
const label = (b: number): string => (b === 24 ? '24:00' : hourLabel(b))

const covered = ([a, b]: HourBounds, h: number): boolean =>
  (a < b ? h >= a && h < b : h >= a || h < b)

function spanText(cells: readonly number[]): string {
  const runs: [number, number][] = []
  cells.forEach((c, h) => {
    if (c < 1) return
    const last = runs.at(-1)
    if (last && last[1] === h) last[1] = h + 1
    else runs.push([h, h + 1])
  })
  return runs.map(([a, b]) => `${label(a)}–${label(b)}`).join(', ')
}

/** The hours one layer of data was measured in. */
export interface HourBand {
  key: string
  color: string
  label: string
  /** 24 values, 1 measured, 0 not, between partly. */
  cells: readonly number[]
  /** Added to the band's tooltip. */
  note?: string
}

export interface HourRangeProps {
  range: HourBounds
  setRange: (range: [from: number, to: number]) => void
  /** Thin bands under the track, so a range reaching into unmeasured hours is
   *  visible before any number is read. */
  bands?: readonly HourBand[]
}

/** A range of hours of the day. */
export function HourRange({ range, setRange, bands = [] }: HourRangeProps) {
  const track = useRef<HTMLDivElement>(null)
  const [from, to] = range

  const boundaryAt = (clientX: number): number => {
    const r = track.current!.getBoundingClientRect()
    return Math.max(0, Math.min(END, Math.round(((clientX - r.left) / r.width) * END)))
  }

  // which: 0 the start, 1 the end
  const move = (which: number, b: number) => {
    let [a, z] = which === 0 ? [b, to] : [from, b]
    // 0 and 24 are the same instant: a start is kept at 0, an end at 24, so
    // the full day is [0, 24] and never an empty wrap-around
    if (a === END) a = 0
    if (z === 0) z = END
    if (a === z) return
    setRange([a, z])
  }

  // Track the drag on window rather than with pointer capture, which some
  // pointer types refuse; the thumb keeps following even off the track.
  const drag = (which: number) => (e: PointerEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.focus()
    const onMove = (ev: globalThis.PointerEvent) => move(which, boundaryAt(ev.clientX))
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  // clicking the track moves whichever thumb is nearer
  const jump = (e: PointerEvent) => {
    const b = boundaryAt(e.clientX)
    move(Math.abs(b - from) <= Math.abs(b - to) ? 0 : 1, b)
  }

  const keys = (which: number) => (e: KeyboardEvent) => {
    const cur = which === 0 ? from : to
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }
    const step = steps[e.key]
    if (step) { e.preventDefault(); move(which, Math.max(0, Math.min(END, cur + step))) }
    if (e.key === 'Home') { e.preventDefault(); move(which, 0) }
    if (e.key === 'End') { e.preventDefault(); move(which, END) }
  }

  const segments = from < to ? [[from, to]] : [[from, END], [0, to]]
  const pos = (b: number): string => `${(b / END) * 100}%`

  return (
    <div className="kit-hours">
      <div className="kit-hours-head">
        <span>{label(from)}–{label(to)}{from > to ? ` (${t('overMidnight')})` : ''}</span>
      </div>
      <div className="kit-hours-body">
        <div className="kit-hours-track" ref={track} onPointerDown={jump}>
          {segments.map(([a, b]) => (
            <i key={`${a}-${b}`} className="kit-hours-fill" style={{ left: pos(a), width: pos(b - a) }} />
          ))}
          {[from, to].map((b, i) => (
            <span key={i} className="kit-hours-thumb" role="slider" tabIndex={0}
              aria-label={i === 0 ? t('rangeStart') : t('rangeEnd')}
              aria-valuemin={0} aria-valuemax={END} aria-valuenow={b}
              aria-valuetext={label(b)} style={{ left: pos(b) }}
              onPointerDown={drag(i)} onKeyDown={keys(i)} />
          ))}
        </div>

        {bands.length > 0 && (
          <div className="kit-hours-bands">
            {bands.map((r) => (
              <div key={r.key} className="kit-hours-band"
                title={t('bandTitle', r.label, spanText(r.cells), r.note)}>
                {r.cells.map((c, h) => (
                  <i key={h} className={covered(range, h) ? 'in' : ''}
                    style={{
                      left: pos(h), width: pos(1),
                      background: c ? r.color : 'transparent',
                      opacity: c > 0 && c < 1 ? 0.45 : undefined,
                    }} />
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="kit-hours-ticks" aria-hidden="true">
          {[0, 6, 12, 18, 24].map((h) => <span key={h} style={{ left: pos(h) }}>{h}</span>)}
        </div>
      </div>
      {bands.length > 0 && <p className="kit-hours-legend">{t('bandsHint')}</p>}
    </div>
  )
}
