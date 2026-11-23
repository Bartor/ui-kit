import { useRef } from 'react'
import { hourLabel } from '../core/hours'
import { t } from '../core/config'

// Two thumbs on a 24-hour track, at hour boundaries 0..24. A start after the
// end wraps over midnight, which is how "22-5" is represented: one range,
// drawn as two segments.

const END = 24
const label = (b) => (b === 24 ? '24:00' : hourLabel(b))

const covered = (range, h) => {
  const [a, b] = range
  return a < b ? h >= a && h < b : h >= a || h < b
}

function spanText(cells) {
  const runs = []
  cells.forEach((c, h) => {
    if (c < 1) return
    const last = runs.at(-1)
    if (last && last[1] === h) last[1] = h + 1
    else runs.push([h, h + 1])
  })
  return runs.map(([a, b]) => `${label(a)}–${label(b)}`).join(', ')
}

/**
 * A range of hours of the day, [from, to) as boundaries 0..24.
 *
 * `bands` draws thin bands under the track, one per layer of data, over the
 * hours it was measured in - so a range reaching into unmeasured hours is
 * visible before any number is read: [{ key, color, label, cells, note }],
 * cells being 24 values, 1 measured, 0 not, between partly.
 */
export function HourRange({ range, setRange, bands = [] }) {
  const track = useRef(null)
  const [from, to] = range

  const boundaryAt = (clientX) => {
    const r = track.current.getBoundingClientRect()
    return Math.max(0, Math.min(END, Math.round(((clientX - r.left) / r.width) * END)))
  }

  const move = (which, b) => {
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
  const drag = (which) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.focus()
    const onMove = (ev) => move(which, boundaryAt(ev.clientX))
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
  const jump = (e) => {
    const b = boundaryAt(e.clientX)
    move(Math.abs(b - from) <= Math.abs(b - to) ? 0 : 1, b)
  }

  const keys = (which) => (e) => {
    const cur = which === 0 ? from : to
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]
    if (step) { e.preventDefault(); move(which, Math.max(0, Math.min(END, cur + step))) }
    if (e.key === 'Home') { e.preventDefault(); move(which, 0) }
    if (e.key === 'End') { e.preventDefault(); move(which, END) }
  }

  const segments = from < to ? [[from, to]] : [[from, END], [0, to]]
  const pos = (b) => `${(b / END) * 100}%`

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
