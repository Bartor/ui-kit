import { fmt } from '../core/format'
import { dirLabel } from '../core/directions'
import { isHot } from '../core/link'

/**
 * Directions of travel side by side: one bar per street, split between its
 * two ways. Shows tidal flows - a street busy inbound in the morning and
 * outbound in the afternoon - that a single total hides. A one-way street has
 * a single segment. rows: [{ kind, id, letter, name, dirs: [{ key, v }] }],
 * dir keys "W>E".
 *
 * Hovering a row sets `hot` to its street, and a direction - its segment or
 * its figure - adds that way as `dir`; PieceDots and HotArrows draw it on the
 * map.
 */
export function DirectionSplit({ title, rows, hot, setHot }) {
  const shown = rows.filter((r) => r.dirs.some((d) => d.v > 0))
  if (!shown.length) return null
  return (
    <div className="kit-dirsplit">
      <h4>{title}</h4>
      {shown.map((r) => {
        const sum = r.dirs.reduce((a, d) => a + d.v, 0)
        const on = isHot(hot, r.kind, r.id)
        const cls = (d, i) => `${i ? 'b' : 'a'}${on && hot.dir
          ? (hot.dir === d.key ? ' lit' : ' dim') : ''}`
        // a mouse only: on touch a tap would leave the row lit
        const hover = setHot ? {
          onPointerOver: (e) => e.pointerType === 'mouse' && setHot({
            kind: r.kind, id: r.id, dir: e.target.closest('[data-dir]')?.dataset.dir,
          }),
          onPointerLeave: (e) => e.pointerType === 'mouse' && setHot(null),
        } : {}
        return (
          <div key={r.id} className={on ? 'kit-dir-row hot' : 'kit-dir-row'} {...hover}>
            <b>{r.letter}</b>
            <span className="kit-dir-name" title={r.id}>{r.name}</span>
            <div className="kit-dir-bar">
              {r.dirs.map((d, i) => (
                <i key={d.key} data-dir={d.key} className={cls(d, i)} style={{ flexGrow: d.v }} />
              ))}
            </div>
            <div className="kit-dir-vals">
              {r.dirs.map((d, i) => (
                <span key={d.key} data-dir={d.key} className={cls(d, i)}>
                  {dirLabel(d.key)} <b>{fmt(d.v)}</b> · {sum ? Math.round((100 * d.v) / sum) : 0}%
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
