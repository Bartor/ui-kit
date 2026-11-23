import type { Key, ReactNode } from 'react'
import { fmt } from '../core/format.js'
import type { LegendEntry } from '../core/color.js'
import { pressable } from '../core/link.js'
import { Swatch } from './text.js'

export interface RankItem {
  key: Key
  title: ReactNode
  sub?: ReactNode
  value: ReactNode
  /** The selected one. */
  on?: boolean
  onPick: () => void
}

export interface RankListProps {
  items: readonly RankItem[]
}

/** A ranking to pick from. */
export const RankList = ({ items }: RankListProps) => (
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

export interface TotalsRow {
  key: Key
  label: ReactNode
  color: string
  value: ReactNode
}

export interface TotalsProps {
  rows: readonly TotalsRow[]
}

/** Totals, one per line. */
export const Totals = ({ rows }: TotalsProps) => (
  <div className="kit-totals">
    {rows.map((r) => (
      <div key={r.key}>
        <span><Swatch color={r.color} />{r.label}</span>
        <b>{r.value}</b>
      </div>
    ))}
  </div>
)

export interface TotalsColumn {
  label: string
  strong?: boolean
}

export interface TotalsTableRow {
  key: Key
  label: ReactNode
  color: string
  /** One per column; more are ignored. */
  cells: readonly ReactNode[]
}

export interface TotalsTableProps {
  /** The first is the main one. */
  columns: readonly TotalsColumn[]
  rows: readonly TotalsTableRow[]
}

/** Totals with more than one figure each. */
export const TotalsTable = ({ columns, rows }: TotalsTableProps) => (
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

export interface TaggedItem {
  key: Key
  color: string
  label: ReactNode
  value: ReactNode
  tag: ReactNode
  /** Colour of the tag. */
  tone: 'good' | 'fair' | 'weak'
  /** Tooltip. */
  title?: string
}

export interface TaggedListProps {
  items: readonly TaggedItem[]
}

/** Values with a tag saying how good they are. */
export const TaggedList = ({ items }: TaggedListProps) => (
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

export interface LegendRowProps {
  items: readonly LegendEntry[]
}

/** A colour key on one line. */
export const LegendRow = ({ items }: LegendRowProps) => (
  <div className="kit-legend-row">
    {items.map((l) => (
      <span key={l.label}><i style={{ background: l.color }} />{l.label}</span>
    ))}
  </div>
)

export interface BreakdownProps {
  title: ReactNode
  /** Values by label; the empty ones are not listed. */
  parts: Readonly<Record<string, number>> | null | undefined
  /** What the bars are shares of; the sum of the parts unless given. */
  total?: number
  /** Label of the remainder, which goes last, however big. */
  rest?: string
}

/** Parts of a whole as labelled bars, largest first. */
export function Breakdown({ title, parts, total, rest }: BreakdownProps) {
  const rows = Object.entries(parts || {}).filter(([, v]) => v)
    .sort((a, b) => Number(a[0] === rest) - Number(b[0] === rest) || b[1] - a[1])
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
