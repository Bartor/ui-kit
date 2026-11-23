import { useCallback, useRef, useState } from 'react'
import type { CSSProperties, Key, ReactNode } from 'react'
import { inkOn } from '../core/color.js'
import type { PickState } from './usePick.js'

/** What of a usePick() the parts that are only looked at need. */
export type PickView = Pick<PickState, 'active' | 'on'>

const none: PickView = { active: new Set(), on: () => ({}) }

export interface SplitBodyProps {
  children?: ReactNode
}

/** Puts a Donut above its table. */
export const SplitBody = ({ children }: SplitBodyProps) => <div className="kit-split-body">{children}</div>

export interface DonutRow {
  key: string
  label: string
  color: string
  value: number
}

export interface DonutProps {
  rows: readonly DonutRow[]
  /** From usePick(): picked slices slide out and the rest fade. */
  pick?: PickView
  /** Accessible name. */
  label?: string
}

/**
 * A whole split into parts, as a ring. Drawn by hand rather than with a chart
 * library so the slices can move with a CSS transition.
 */
export function Donut({ rows, pick = none, label }: DonutProps) {
  const R = 60
  const r = 30
  const c = 75
  const total = rows.reduce((a, s) => a + s.value, 0)
  let a0 = -Math.PI / 2
  const pt = (rad: number, a: number) => `${(c + rad * Math.cos(a)).toFixed(2)},${(c + rad * Math.sin(a)).toFixed(2)}`
  return (
    <svg className="kit-donut" width={2 * c} height={2 * c} viewBox={`0 0 ${2 * c} ${2 * c}`}
      role="img" aria-label={label}>
      {rows.filter((s) => s.value > 0).map((s) => {
        const a1 = a0 + (2 * Math.PI * s.value) / total
        const mid = (a0 + a1) / 2
        const large = a1 - a0 > Math.PI ? 1 : 0
        // a whole ring cannot be one arc; stop a hair short
        const end = a1 - a0 >= 2 * Math.PI - 1e-6 ? a1 - 1e-4 : a1
        const d = `M${pt(R, a0)} A${R},${R} 0 ${large} 1 ${pt(R, end)} `
          + `L${pt(r, end)} A${r},${r} 0 ${large} 0 ${pt(r, a0)} Z`
        a0 = a1
        const on = pick.active.has(s.key)
        return (
          <path key={s.key} d={d} fill={s.color} {...pick.on(s.key)}
            className={on ? 'on' : pick.active.size ? 'dim' : undefined}
            style={{ '--dx': `${(6 * Math.cos(mid)).toFixed(2)}px`,
              '--dy': `${(6 * Math.sin(mid)).toFixed(2)}px` } as CSSProperties}>
            <title>{`${s.label}: ${Math.round((100 * s.value) / total)}%`}</title>
          </path>
        )
      })}
    </svg>
  )
}

/** How a column's cells are drawn. */
export type CellTone = 'strong' | 'dim'

export interface SplitColumn {
  label: string
  tone?: CellTone
}

const cellClass = (tone: CellTone | undefined) => (tone === 'dim' ? 'faint' : tone)

export interface SplitTableRow {
  key: string
  label: ReactNode
  /** A dot before the label. */
  color?: string
  /** One per column; more are ignored. */
  cells: readonly ReactNode[]
  /** Closes the table as its total, where rows are not picked. */
  sum?: boolean
}

export interface SplitTableProps {
  columns: readonly SplitColumn[]
  rows: readonly SplitTableRow[]
  /** From usePick(): rows are picked as the Donut's slices are. */
  pick?: PickState
}

/** A table of parts. */
export const SplitTable = ({ columns, rows, pick }: SplitTableProps) => (
  <table className={pick ? 'kit-split-table' : 'kit-split-table static'}>
    <thead>
      <tr><th />{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((s) => {
        const cells = (
          <>
            <td>{s.color && <i style={{ background: s.color }} />}{s.label}</td>
            {columns.map((c, i) => <td key={c.label} className={cellClass(c.tone)}>{s.cells[i]}</td>)}
          </>
        )
        if (!pick) return <tr key={s.key} className={s.sum ? 'sum' : undefined}>{cells}</tr>
        return (
          <tr key={s.key} {...pick.on(s.key)} tabIndex={0} aria-pressed={pick.pinned.has(s.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick.toggle(s.key) }
            }}
            className={pick.active.has(s.key) ? 'on' : pick.active.size ? 'dim' : undefined}>
            {cells}
          </tr>
        )
      })}
    </tbody>
  </table>
)

export interface ColumnGroup {
  key: string
  label: ReactNode
  color: string
  columns: readonly SplitColumn[]
}

export interface GroupedTableRow {
  key: Key
  head: ReactNode
  /** For each group, a cell for each of its columns. */
  cells: readonly (readonly ReactNode[])[]
  /** Greyed. */
  out?: boolean
}

export interface GroupedTableProps {
  /** What the rows are. */
  corner?: ReactNode
  groups: readonly ColumnGroup[]
  rows: readonly GroupedTableRow[]
}

/** A table whose columns come in groups. */
export const GroupedTable = ({ corner, groups, rows }: GroupedTableProps) => (
  <table className="kit-split-table static grouped">
    <thead>
      <tr>
        <th>{corner}</th>
        {groups.map((g) => (
          <th key={g.key} colSpan={g.columns.length}><i style={{ background: g.color }} />{g.label}</th>
        ))}
      </tr>
      <tr>
        <th />
        {groups.flatMap((g) => g.columns.map((c) => <th key={`${g.key} ${c.label}`}>{c.label}</th>))}
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.key} className={r.out ? 'out' : undefined}>
          <td>{r.head}</td>
          {groups.flatMap((g, i) => g.columns.map((c, j) => (
            <td key={`${g.key} ${c.label}`} className={cellClass(c.tone)}>{r.cells[i][j]}</td>
          )))}
        </tr>
      ))}
    </tbody>
  </table>
)

export interface StatBlockProps {
  title: ReactNode
  children?: ReactNode
}

/** A titled block of static tables. */
export const StatBlock = ({ title, children }: StatBlockProps) => (
  <div className="kit-stats">
    <h4>{title}</h4>
    {children}
  </div>
)

export interface SharePart {
  key: string
  label: string
  color: string
  /** 0..1. */
  share: number
}

export interface ShareRow {
  key: string
  label: string
  parts: readonly SharePart[]
}

export interface ShareBarsProps {
  /** The same parts, measured in different things. */
  rows: readonly ShareRow[]
  /** From usePick(): the picked parts are summed beside each bar. */
  pick?: PickView
  /** Keys summed with nothing picked. */
  fallback?: readonly string[]
  /** Accessible name. */
  label?: string
  /** Under the bars. */
  children?: ReactNode
}

/** The same parts as several 100% bars, so "a fifth of the people, four fifths
 *  of the road" reads at a glance. */
export function ShareBars({ rows, pick = none, fallback = [], label, children }: ShareBarsProps) {
  // each segment wide enough for its number carries it; the thin ones have
  // theirs in the tooltip
  const [barW, setBarW] = useState(0)
  const watch = useRef<ResizeObserver | null>(null)
  const measure = useCallback((el: HTMLDivElement | null) => {
    watch.current?.disconnect()
    if (!el) return
    setBarW(el.clientWidth)
    watch.current = new ResizeObserver(([e]) => setBarW(e.contentRect.width))
    watch.current.observe(el)
  }, [])
  const shown: ReadonlySet<string> = pick.active.size ? pick.active : new Set(fallback)
  const dim = (key: string) => pick.active.size > 0 && !pick.active.has(key)
  const fits = (p: SharePart, parts: readonly SharePart[]) => {
    const w = (barW - 2 * (parts.length - 1)) * p.share
    return w >= `${Math.round(p.share * 100)}%`.length * 6.4 + 6
  }
  return (
    <div className="kit-sharebars" role="table" aria-label={label}>
      {rows.map((r, n) => {
        const sel = r.parts.filter((p) => shown.has(p.key))
        const sum = sel.reduce((a, p) => a + p.share, 0)
        return (
          <div key={r.key} className="kit-sharebar" role="row">
            <span role="rowheader">{r.label}</span>
            <div className="bar" ref={n === 0 ? measure : undefined}>
              {r.parts.filter((p) => p.share > 0).map((p, _, parts) => (
                <i key={p.key} role="cell" {...pick.on(p.key)}
                  className={dim(p.key) ? 'dim' : undefined}
                  style={{ flexGrow: p.share, background: p.color, color: inkOn(p.color) }}
                  title={`${p.label}: ${Math.round(p.share * 100)}% (${r.label})`}>
                  {fits(p, parts) ? `${Math.round(p.share * 100)}%` : ''}
                </i>
              ))}
            </div>
            <b>
              {sel.map((p) => <i key={p.key} style={{ background: p.color }} />)}
              {Math.round(sum * 100)}%
            </b>
          </div>
        )
      })}
      {children}
    </div>
  )
}
