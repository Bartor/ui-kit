import { Fragment, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { t } from '../core/config.js'
import { firstDir, nextSort, sortItems, sortOrder } from '../core/sort.js'
import type { Better, SortDir, SortState, SortValue } from '../core/sort.js'
import { HelpButton } from './controls.js'

const cx = (...c: (string | false | null | undefined)[]): string => c.filter(Boolean).join(' ')

/** The key of the label column's sort, in column mode. */
export const LABEL_SORT = ':label'

export type DataTableTone = 'best' | 'weak' | 'dim'

/** A sort of a DataTable: `key` is a column's key (`sortBy="column"`), a row's id (`"row"`), or LABEL_SORT. */
export type DataTableSort = SortState

export interface DataTableCell {
  /** What is shown. */
  content: ReactNode
  /** What the cell sorts by, apart from how it looks: the number behind "1 234,5 m". Without one it sorts last. */
  value?: SortValue
  /** `best` is bold, `weak` and `dim` are muted. */
  tone?: DataTableTone
  /** Tooltip, the full figure say. */
  title?: string
}

export interface DataTableColumn {
  /** Unique among the columns; what `hot`, `sort` and `onHot` call it. */
  key: string
  head: ReactNode
  /** Tooltip of the head: the full name. */
  title?: string
  /** Plain-text name for screen readers and tooltips; defaults to `title`, then to `head` when that is text. */
  name?: string
  /** Behind a "?" in the head; unfolds under the heads. Several can be open. */
  help?: ReactNode
  /** Makes the head a button of its own, "open this city" say. */
  onPick?: () => void
  /** A thin column: a rank, say. */
  narrow?: boolean
  /** Figures are right, text is better left. Defaults to right. */
  align?: 'left' | 'right'
  /** With `sortBy="column"`: set to false to leave this column unsortable. */
  sortable?: boolean
  /** With `sortBy="column"`: the way the first click sorts. Defaults to descending. */
  first?: SortDir
}

export interface DataTableRow {
  /** Unique in the whole table (groups included): rows are sorted by it. */
  id: string
  label: ReactNode
  /** Plain-text name for screen readers; defaults to `label` when that is text, else `id`. */
  name?: string
  /** Small print after the label. */
  unit?: ReactNode
  /** Behind a "?" on the row; unfolds under it. Without it there is no "?". */
  help?: ReactNode
  /** A small link-like button under the label. */
  action?: { label: ReactNode; onClick: () => void }
  /** With `sortBy="row"`: which way is better; `lower` makes the first click ascending. Otherwise descending first. */
  better?: Better
  /** With `sortBy="row"`: set to false to leave this row without a sort control. */
  sortable?: boolean
  /** With `sortBy="column"`: what the label column sorts by (a name). Without it for every row, that head is no button. */
  labelValue?: SortValue
  /** One per column, in the order of `columns`; `null` or missing is shown as `empty`, dimmed. */
  cells: readonly (DataTableCell | null | undefined)[]
}

export interface DataTableGroup {
  id: string
  /** The heading row; without it the rows of the group are not set apart. */
  title?: ReactNode
  rows: readonly DataTableRow[]
}

export interface DataTableProps {
  columns: readonly DataTableColumn[]
  /** Rows in groups under headings... */
  groups?: readonly DataTableGroup[]
  /** ...or just rows, without any. */
  rows?: readonly DataTableRow[]
  /** Accessible name of the scrolling region. */
  caption: string
  /** Over the label column. */
  labelHead?: ReactNode
  /** `column`: a click on a column head sorts the rows by it (rows are things: lines, stops).
   *  `row`: a control on a row sorts the COLUMNS by that row's values (rows are measures, columns are cities).
   *  Without it nothing sorts. */
  sortBy?: 'column' | 'row'
  /** The sort, when the caller keeps it (`null` is the original order). Leave it out for an uncontrolled table. */
  sort?: DataTableSort | null
  /** The sort an uncontrolled table starts with. */
  defaultSort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort | null) => void
  /** With `sortBy="column"`: false sorts all rows together, across groups, and drops the headings while it does.
   *  Defaults to true: each group is sorted on its own. */
  sortWithinGroups?: boolean
  /** Key of the column to light, or null. */
  hot?: string | null
  /** Called with a column's key when the pointer or focus enters it, and with null when it leaves. */
  onHot?: (key: string | null) => void
  /** Shown for a cell that is missing. Defaults to "–". */
  empty?: ReactNode
  /** Height at which the table starts scrolling: any CSS length. Defaults to `min(34rem, 70dvh)`. The heads stick
   *  only while the table scrolls inside this bound; "none" removes it, and the heads then move with the page. */
  maxHeight?: string
  className?: string
}

interface SortButtonProps {
  name: string
  dir: SortDir | null
  onClick: () => void
  children?: ReactNode
}

/** The sort control of a head: the head itself, or only the arrows. */
function SortButton({ name, dir, onClick, children }: SortButtonProps) {
  return (
    <button type="button" className={cx('kit-data-sort', !children && 'icon', dir && 'on')}
      aria-label={t('sortBy', name)} title={t('sortBy', name)} onClick={onClick}>
      {children}
      <span className="kit-data-arrow" aria-hidden="true">{dir === 'desc' ? '▼' : dir === 'asc' ? '▲' : '↕'}</span>
    </button>
  )
}

const ariaSort = (dir: SortDir | null | undefined): 'ascending' | 'descending' | undefined =>
  (dir ? (dir === 'asc' ? 'ascending' : 'descending') : undefined)

const colName = (c: DataTableColumn): string => c.name ?? c.title ?? (typeof c.head === 'string' ? c.head : c.key)
const rowName = (r: DataTableRow): string => r.name ?? (typeof r.label === 'string' ? r.label : r.id)

/**
 * A table of figures: sticky heads, sorting, grouped rows, a "?" that unfolds an explanation under a row or a column
 * head, tones for the best and the weak, a column that can be lit from outside. Two shapes:
 *
 *  - rows are things (lines, stops) and columns are their properties: `sortBy="column"`, a click on a head sorts the rows;
 *  - rows are measures and columns are cities or years: `sortBy="row"`, a control on a row orders the columns by it.
 *
 * Sorting goes descending, ascending, original order. Missing values always go last and are never zero. Cells give
 * the value to sort by apart from what they show.
 *
 * Sticky: the table scrolls in ONE region, in both directions, with a bounded height (`maxHeight`). The heads stick to
 * its top and the label column to its left; the corner cell stays over both. That is the structure that works
 * inside DetailsPanel, Modal and Sidebar, which scroll themselves: `position: sticky` sticks to the nearest ancestor
 * that scrolls, so a wrapper with `overflow-x: auto` around a table whose page scrolls vertically (the usual way to
 * make a wide table scroll) leaves the heads behind. Keep it that way: do not wrap the table in your own
 * `overflow` element, and give it a height (the default is fine) - with `maxHeight="none"` the region does not
 * scroll vertically and the heads move with the page.
 */
export function DataTable({
  columns, groups, rows, caption, labelHead, sortBy, sort, defaultSort, onSortChange, sortWithinGroups = true,
  hot = null, onHot, empty = '–', maxHeight, className,
}: DataTableProps) {
  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(() => new Set())
  const [openCols, setOpenCols] = useState<ReadonlySet<string>>(() => new Set())
  const [inner, setInner] = useState<DataTableSort | null>(defaultSort ?? null)
  const [note, setNote] = useState('')
  const region = useRef<HTMLDivElement>(null)

  // The width the help blocks stay within while the table scrolls sideways.
  useEffect(() => {
    const el = region.current
    if (!el) return undefined
    const set = () => el.style.setProperty('--kit-data-view', `${el.clientWidth}px`)
    set()
    if (typeof ResizeObserver === 'undefined') return undefined
    const watch = new ResizeObserver(set)
    watch.observe(el)
    return () => watch.disconnect()
  }, [])

  const flip = (set: ReadonlySet<string>, put: (s: ReadonlySet<string>) => void, k: string) => {
    const next = new Set(set)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    put(next)
  }

  const all: readonly DataTableGroup[] = groups ?? (rows ? [{ id: '', rows }] : [])
  const allRows = all.flatMap((g) => g.rows)
  const current = sort !== undefined ? sort : inner
  const change = (key: string, name: string, first: SortDir) => {
    const next = nextSort(current, key, first)
    if (sort === undefined) setInner(next)
    setNote(next ? t('sortedBy', name, next.dir) : t('sortCleared'))
    onSortChange?.(next)
  }

  // What the sort means here; a key that matches nothing (a stale link, say) sorts nothing.
  const colAt = sortBy === 'column' && current ? columns.findIndex((c) => c.key === current.key && c.sortable !== false) : -1
  const byLabel = sortBy === 'column' && current?.key === LABEL_SORT && allRows.some((r) => r.labelValue != null)
  const sortRow = sortBy === 'row' && current ? allRows.find((r) => r.id === current.key && r.sortable !== false) : undefined
  const dirOf = (key: string): SortDir | null => (current && current.key === key ? current.dir : null)

  // Columns by the sorted row; rows by the sorted column.
  const order = sortRow && current
    ? sortOrder(columns.map((_, i) => sortRow.cells[i]?.value), current.dir)
    : columns.map((_, i) => i)
  let shown = all
  if (current && (colAt >= 0 || byLabel)) {
    const by = (r: DataTableRow): SortValue => (byLabel ? r.labelValue : r.cells[colAt]?.value)
    shown = sortWithinGroups
      ? all.map((g) => ({ ...g, rows: sortItems(g.rows, by, current.dir) }))
      : [{ id: ':sorted', rows: sortItems(allRows, by, current.dir) }]
  }

  const span = columns.length + 1
  const colClass = (c: DataTableColumn) => cx('kit-data-col', c.narrow && 'narrow', c.align === 'left' && 'left',
    hot != null && hot === c.key && 'hot')
  const hover = (key: string) => ({ onMouseEnter: () => onHot?.(key), onMouseLeave: () => onHot?.(null) })
  const openHeads = order.map((i) => columns[i]!).filter((c) => c.help && openCols.has(c.key))
  const labelSortable = sortBy === 'column' && allRows.some((r) => r.labelValue != null)

  return (
    <div ref={region} className={cx('kit-data-scroll', className)} role="region" aria-label={caption} tabIndex={0}
      style={maxHeight ? { maxHeight } : undefined}>
      <table className="kit-data-table">
        <thead>
          <tr>
            <th scope="col" className="kit-data-corner" aria-sort={byLabel ? ariaSort(current?.dir) : undefined}>
              {labelSortable
                ? (
                  <SortButton name={typeof labelHead === 'string' ? labelHead : t('sortLabel')}
                    dir={dirOf(LABEL_SORT)} onClick={() => change(LABEL_SORT, typeof labelHead === 'string' ? labelHead : t('sortLabel'), 'asc')}>
                    {labelHead}
                  </SortButton>
                )
                : labelHead}
            </th>
            {order.map((i) => {
              const c = columns[i]!
              const sortable = sortBy === 'column' && c.sortable !== false
              const dir = dirOf(c.key)
              const name = colName(c)
              const sorter = () => change(c.key, name, c.first ?? 'desc')
              return (
                <th key={c.key} scope="col" className={colClass(c)} title={c.title}
                  aria-sort={colAt === i ? ariaSort(dir) : undefined} {...hover(c.key)}>
                  <span className="kit-data-head">
                    {c.onPick
                      ? (
                        <button type="button" className="kit-data-pick" onClick={c.onPick}
                          onFocus={() => onHot?.(c.key)} onBlur={() => onHot?.(null)}>{c.head}</button>
                      )
                      : sortable
                        ? (
                          <SortButton name={name} dir={dir} onClick={sorter}>{c.head}</SortButton>
                        )
                        : c.head}
                    {c.onPick && sortable && <SortButton name={name} dir={dir} onClick={sorter} />}
                    {c.help && (
                      <HelpButton open={openCols.has(c.key)} onClick={() => flip(openCols, setOpenCols, c.key)} />
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {openHeads.length > 0 && (
            <tr className="kit-data-help-row">
              <td colSpan={span}>
                <div className="kit-data-help">
                  {openHeads.map((c) => <div key={c.key}><b>{c.title || c.head}</b>{c.help}</div>)}
                </div>
              </td>
            </tr>
          )}
          {shown.map((g) => (
            <Fragment key={g.id}>
              {g.title != null && (
                <tr key={`${g.id}:h`} className="kit-data-group">
                  <th scope="colgroup" colSpan={span}><span>{g.title}</span></th>
                </tr>
              )}
              {g.rows.flatMap((r) => {
                const k = `${g.id}/${r.id}`
                const open = !!r.help && openRows.has(k)
                const rowSortable = sortBy === 'row' && r.sortable !== false
                const name = rowName(r)
                const out = [
                  <tr key={k}>
                    <th scope="row" className="kit-data-label" aria-sort={sortRow === r ? ariaSort(current?.dir) : undefined}>
                      <span className="kit-data-name">
                        <span className="kit-data-text">
                          {r.label}{r.unit != null && r.unit !== '' && <small className="kit-data-unit"> {r.unit}</small>}
                        </span>
                        {(rowSortable || r.help) && (
                          <span className="kit-data-tools">
                            {rowSortable && (
                              <SortButton name={name} dir={dirOf(r.id)}
                                onClick={() => change(r.id, name, firstDir(r.better))} />
                            )}
                            {r.help && <HelpButton open={open} onClick={() => flip(openRows, setOpenRows, k)} />}
                          </span>
                        )}
                      </span>
                      {r.action && (
                        <button type="button" className="kit-data-action" onClick={r.action.onClick}>{r.action.label}</button>
                      )}
                    </th>
                    {order.map((i) => {
                      const c = columns[i]!
                      const cell = r.cells[i]
                      const tone = cell ? cell.tone : 'dim'
                      return (
                        <td key={c.key} className={cx(colClass(c), tone && `kit-data-${tone}`)} title={cell?.title}
                          {...hover(c.key)}>{cell ? cell.content : empty}</td>
                      )
                    })}
                  </tr>,
                ]
                if (open) {
                  out.push(
                    <tr key={`${k}:help`} className="kit-data-help-row">
                      <td colSpan={span}><div className="kit-data-help">{r.help}</div></td>
                    </tr>,
                  )
                }
                return out
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
      {sortBy && <span className="kit-data-sr" role="status" aria-live="polite">{note}</span>}
    </div>
  )
}
