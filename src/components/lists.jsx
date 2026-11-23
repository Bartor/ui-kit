import { fmt } from '../core/format'
import { pressable } from '../core/link'
import { Swatch } from './text'

/** A ranking to pick from. items: [{ key, title, sub, value, on, onPick }]. */
export const RankList = ({ items }) => (
  <ol className="kit-rank">
    {items.map((m) => (
      <li key={m.key} className={m.on ? 'on' : ''} {...pressable(m.onPick)}>
        <span>{m.title}</span>
        <em>{m.sub}</em>
        <b>{m.value}</b>
      </li>
    ))}
  </ol>
)

/** Totals, one per line. rows: [{ key, label, color, value }]. */
export const Totals = ({ rows }) => (
  <div className="kit-totals">
    {rows.map((r) => (
      <div key={r.key}>
        <span><Swatch color={r.color} />{r.label}</span>
        <b>{r.value}</b>
      </div>
    ))}
  </div>
)

/** Totals with more than one figure each. columns: [{ label, strong }], the
 *  first the main one; rows: [{ key, label, color, cells }]. */
export const TotalsTable = ({ columns, rows }) => (
  <table className="kit-totals-table">
    <thead>
      <tr><th />{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.key}>
          <td><Swatch color={r.color} />{r.label}</td>
          {columns.map((c, i) => (
            <td key={c.label} className={c.strong ? 'strong' : undefined}>{r.cells[i]}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)

/** Values with a tag saying how good they are. items: [{ key, color, label,
 *  value, tag, tone, title }]; tones: 'good', 'fair', 'weak'. */
export const TaggedList = ({ items }) => (
  <div className="kit-tagged">
    {items.map((e) => (
      <div key={e.key} title={e.title}>
        <Swatch color={e.color} />
        <span>{e.label}</span>
        <b>{e.value}</b>
        <em className={`kit-tag ${e.tone}`}>{e.tag}</em>
      </div>
    ))}
  </div>
)

/** A colour key on one line. items: [{ label, color }]. */
export const LegendRow = ({ items }) => (
  <div className="kit-legend-row">
    {items.map((l) => (
      <span key={l.label}><i style={{ background: l.color }} />{l.label}</span>
    ))}
  </div>
)

/** Parts of a whole as labelled bars, largest first; the `rest` part goes
 *  last, however big. parts: { label: value }. */
export function Breakdown({ title, parts, total, rest }) {
  const rows = Object.entries(parts || {}).filter(([, v]) => v)
    .sort((a, b) => (a[0] === rest) - (b[0] === rest) || b[1] - a[1])
  if (!rows.length) return null
  const sum = total || rows.reduce((a, [, v]) => a + v, 0)
  return (
    <div className="kit-breakdown">
      <h4>{title}</h4>
      {rows.map(([k, v]) => (
        <div key={k} className="bar">
          <span>{k}</span>
          <i style={{ width: `${(100 * v) / sum}%` }} />
          <b>{fmt(v)}</b>
        </div>
      ))}
    </div>
  )
}
