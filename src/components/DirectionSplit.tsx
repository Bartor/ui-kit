import type { PointerEvent, ReactNode } from 'react'
import { fmt } from '../core/format.js'
import { dirLabel } from '../core/directions.js'
import type { Direction } from '../core/directions.js'
import { isHot, pressable } from '../core/link.js'
import type { HotProps } from '../core/link.js'

/** One street and its ways. */
export interface DirectionRow {
  /** As in `hot`. */
  kind: string
  id: string
  letter: ReactNode
  name: ReactNode
  /** One for a one-way street. */
  dirs: readonly { key: Direction; v: number }[]
}

export interface DirectionSplitProps extends HotProps {
  title: ReactNode
  /** Those with nothing counted are not listed. */
  rows: readonly DirectionRow[]
  /** A direction was picked, by its segment or its figure. */
  onPick?: (row: DirectionRow, dir: Direction) => void
  /** The open direction. */
  current?: { kind: string; id: string; dir?: Direction } | null
}

/**
 * Directions of travel side by side: one bar per street, split between its
 * two ways. Shows tidal flows - a street busy inbound in the morning and
 * outbound in the afternoon - that a single total hides.
 *
 * Hovering a row sets `hot` to its street, and a direction - its segment or
 * its figure - adds that way as `dir`; PieceDots and HotArrows draw it on the
 * map.
 */
export function DirectionSplit({ title, rows, hot, setHot, onPick, current }: DirectionSplitProps) {
  const shown = rows.filter((r) => r.dirs.some((d) => d.v > 0))
  if (!shown.length) return null
  return (
    <div className="kit-dirsplit">
      <h4>{title}</h4>
      {shown.map((r) => {
        const sum = r.dirs.reduce((a, d) => a + d.v, 0)
        const on = isHot(hot, r.kind, r.id)
        const lit = on ? hot?.dir : undefined
        const cls = (d: { key: Direction }, i: number) => `${i ? 'b' : 'a'}${lit
          ? (lit === d.key ? ' lit' : ' dim') : ''}${isHot(current, r.kind, r.id)
          && current?.dir === d.key ? ' on' : ''}${onPick ? ' pick' : ''}`
        // a mouse only: on touch a tap would leave the row lit
        const hover = setHot ? {
          onPointerOver: (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return
            const way = (e.target as Element).closest<HTMLElement>('[data-dir]')
            setHot({ kind: r.kind, id: r.id, dir: way?.dataset.dir })
          },
          onPointerLeave: (e: PointerEvent) => { if (e.pointerType === 'mouse') setHot(null) },
        } : {}
        return (
          <div key={r.id} className={on ? 'kit-dir-row hot' : 'kit-dir-row'} {...hover}>
            <b>{r.letter}</b>
            <span className="kit-dir-name" title={r.id}>{r.name}</span>
            <div className="kit-dir-bar">
              {r.dirs.map((d, i) => (
                <i key={d.key} data-dir={d.key} className={cls(d, i)} style={{ flexGrow: d.v }}
                  onClick={onPick ? () => onPick(r, d.key) : undefined} />
              ))}
            </div>
            <div className="kit-dir-vals">
              {r.dirs.map((d, i) => (
                <span key={d.key} data-dir={d.key} className={cls(d, i)}
                  {...(onPick ? pressable(() => onPick(r, d.key)) : {})}>
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
