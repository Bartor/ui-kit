import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { t } from '../core/config.js'
import { firstDir, nextSort, sortItems, sortOrder } from '../core/sort.js'
import type { Better, SortDir, SortState, SortValue } from '../core/sort.js'
import { clampWidth, fillWidths, LABEL_WIDTH_KEY, tableWidth, widthAfterKey, widthLimits } from '../core/widths.js'
import type { ColumnWidths } from '../core/widths.js'
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
  /** The label column's width: one CSS length (it is then exactly that), or `{ min, max }`. Without it the column is as
   *  wide as the longest label up to a cap (12rem to 20rem): labels wrap on word boundaries, and past two lines they are
   *  cut and show the whole text as a tooltip. */
  labelWidth?: string | { min?: string; max?: string }
  /** Columns the reader can drag wider or narrower: `'label'` the label column, `'all'` every column, `false` none.
   *  Each head gets a separator to drag, to move with the arrow keys (Home and End go to the limits) and to
   *  auto-fit (double click or Enter). Sticky heads and label column keep working. */
  resizable?: false | 'label' | 'all'
  /** The widths in pixels by column key (LABEL_WIDTH_KEY for the label column), when the caller keeps them. Leave it out
   *  for a table that keeps its own. Once any column has a width, every column is held at one: the table stops
   *  adapting to its container until the widths are cleared (`{}`). */
  widths?: ColumnWidths
  onWidthsChange?: (widths: ColumnWidths) => void
  /** `compact` tightens the rows and the cells, for wide comparison tables. Defaults to `regular`. */
  density?: 'regular' | 'compact'
  /** Above the table, outside the region that scrolls, so it never covers the sticky heads. A function gets the sort
   *  that is on and a way to clear it. */
  toolbar?: ReactNode | ((state: DataTableToolbarState) => ReactNode)
  /** Shows "Sorted by X, descending" and a button that restores the original order, above the table (with the toolbar). */
  summary?: boolean
}

/** What a toolbar function gets. */
export interface DataTableToolbarState {
  /** The sort that is in effect; null when none, or when it matches no column or row. */
  sort: DataTableSort | null
  /** Plain-text name of what the table is sorted by, or null. */
  name: string | null
  /** Back to the original order. */
  reset: () => void
}

interface SortButtonProps {
  name: string
  dir: SortDir | null
  onClick: () => void
  children?: ReactNode
  /** A second way to the same sort for the pointer: out of the tab order and hidden from screen readers. */
  decorative?: boolean
}

/** Two triangles; the one the sort points at is lit. */
const SortIcon = ({ dir }: { dir: SortDir | null }) => (
  <svg className={cx('kit-data-icon', dir)} viewBox="0 0 8 12" aria-hidden="true" focusable="false">
    <path className="up" d="M4 .5 7.6 5H.4z" />
    <path className="down" d="M4 11.5 7.6 7H.4z" />
  </svg>
)

/** The sort control of a head: the head itself with the icon after it, or only the icon. */
function SortButton({ name, dir, onClick, children, decorative }: SortButtonProps) {
  return (
    <button type="button" className={cx('kit-data-sort', !children && 'icon', !!children && 'fill', dir && 'on')}
      {...(decorative
        ? { tabIndex: -1, 'aria-hidden': true as const, title: t('sortBy', name) }
        : { 'aria-label': t('sortBy', name), title: t('sortBy', name) })}
      onClick={onClick}>
      {children}
      <SortIcon dir={dir} />
    </button>
  )
}

interface GripProps {
  name: string
  id: string
  width: number | undefined
  onStart: (e: PointerEvent<HTMLElement>) => void
  onMove: (e: PointerEvent<HTMLElement>) => void
  onEnd: (e: PointerEvent<HTMLElement>) => void
  onKey: (e: KeyboardEvent<HTMLElement>) => void
  onFit: () => void
  onFocus: () => void
}

/** The handle on the right edge of a head: a separator that can be focused, dragged, moved with the keys and fitted. */
function Grip({ name, id, width, onStart, onMove, onEnd, onKey, onFit, onFocus }: GripProps) {
  const { min, max } = widthLimits(id)
  return (
    <span role="separator" aria-orientation="vertical" tabIndex={0} className="kit-data-grip"
      aria-label={t('resizeColumn', name)} aria-valuemin={min} aria-valuemax={max}
      aria-valuenow={width != null ? Math.round(width) : undefined}
      onPointerDown={onStart} onPointerMove={onMove} onPointerUp={onEnd} onPointerCancel={onEnd}
      onKeyDown={onKey} onDoubleClick={onFit} onFocus={onFocus} onClick={(e) => e.stopPropagation()} />
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
  hot = null, onHot, empty = '–', maxHeight, className, labelWidth, resizable = false, widths, onWidthsChange,
  density = 'regular', toolbar, summary = false,
}: DataTableProps) {
  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(() => new Set())
  const [openCols, setOpenCols] = useState<ReadonlySet<string>>(() => new Set())
  const [inner, setInner] = useState<DataTableSort | null>(defaultSort ?? null)
  const [innerWidths, setInnerWidths] = useState<ColumnWidths>({})
  const [note, setNote] = useState('')
  const region = useRef<HTMLDivElement>(null)
  const table = useRef<HTMLTableElement>(null)
  const drag = useRef<{ key: string; x: number; width: number; base: ColumnWidths } | null>(null)

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
  const apply = (next: DataTableSort | null, name: string) => {
    if (sort === undefined) setInner(next)
    setNote(next ? t('sortedBy', name, next.dir) : t('sortCleared'))
    onSortChange?.(next)
  }
  const change = (key: string, name: string, first: SortDir) => apply(nextSort(current, key, first), name)

  // What the sort means here; a key that matches nothing (a stale link, say) sorts nothing.
  const colAt = sortBy === 'column' && current ? columns.findIndex((c) => c.key === current.key && c.sortable !== false) : -1
  const byLabel = sortBy === 'column' && current?.key === LABEL_SORT && allRows.some((r) => r.labelValue != null)
  const sortRow = sortBy === 'row' && current ? allRows.find((r) => r.id === current.key && r.sortable !== false) : undefined
  const dirOf = (key: string): SortDir | null => (current && current.key === key ? current.dir : null)
  const labelName = typeof labelHead === 'string' ? labelHead : t('sortLabel')
  const sortedName = sortRow ? rowName(sortRow) : colAt >= 0 ? colName(columns[colAt]!) : byLabel ? labelName : null
  const inEffect = sortedName != null ? current : null

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

  // Widths: none until a column is dragged, then every column has one and the table is as wide as their sum.
  const widthsKept = widths === undefined
  const sizes: ColumnWidths = widthsKept ? innerWidths : widths
  const fixed = Object.keys(sizes).length > 0
  const keys = [LABEL_WIDTH_KEY, ...order.map((i) => columns[i]!.key)]
  const setSizes = (next: ColumnWidths) => {
    if (widthsKept) setInnerWidths(next)
    onWidthsChange?.(next)
  }
  // The natural width of every head, as the table lays itself out without any widths.
  const measure = (): ColumnWidths => {
    const el = table.current
    const cells = el?.tHead?.rows[0]?.cells
    if (!el || !cells) return {}
    el.classList.add('kit-data-measuring')
    const out: Record<string, number> = {}
    keys.forEach((k, i) => { const c = cells[i]; if (c) out[k] = c.getBoundingClientRect().width })
    el.classList.remove('kit-data-measuring')
    return out
  }
  const complete = () => fillWidths(sizes, measure())
  const fit = (key: string) => setSizes({ ...complete(), [key]: clampWidth(key, measure()[key] ?? 0) })
  const grip = (key: string, name: string) => ({
    name, id: key, width: sizes[key],
    onStart: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      const base = complete()
      drag.current = { key, x: e.clientX, width: base[key]!, base }
      setSizes(base)
    },
    onMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (d && d.key === key) setSizes({ ...d.base, [key]: clampWidth(key, d.width + e.clientX - d.x) })
    },
    onEnd: () => { drag.current = null },
    onKey: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        fit(key)
        return
      }
      const base = complete()
      const next = widthAfterKey(key, base[key]!, e.key, e.shiftKey)
      if (next == null) return
      e.preventDefault()
      e.stopPropagation()
      setSizes({ ...base, [key]: next })
    },
    onFit: () => fit(key),
    onFocus: () => { if (sizes[key] == null) setSizes(complete()) },
  })

  const span = columns.length + 1
  const colClass = (c: DataTableColumn, i: number) => cx('kit-data-col', c.narrow && 'narrow', c.align === 'left' && 'left',
    hot != null && hot === c.key && 'hot', colAt === i && 'sorted')
  const hover = (key: string) => ({ onMouseEnter: () => onHot?.(key), onMouseLeave: () => onHot?.(null) })
  const openHeads = order.map((i) => columns[i]!).filter((c) => c.help && openCols.has(c.key))
  const labelSortable = sortBy === 'column' && allRows.some((r) => r.labelValue != null)

  const lw = typeof labelWidth === 'string' ? { min: labelWidth, max: labelWidth } : labelWidth
  const style: CSSProperties & Record<`--${string}`, string> = {}
  if (maxHeight) style.maxHeight = maxHeight
  if (lw?.min) style['--kit-data-label-min'] = lw.min
  if (lw?.max) style['--kit-data-label-max'] = lw.max

  const reset = () => apply(null, '')
  const bar = typeof toolbar === 'function' ? toolbar({ sort: inEffect, name: sortedName, reset }) : toolbar
  const showSummary = summary && inEffect != null && sortedName != null

  const body = (
    <div ref={region} className={cx('kit-data-scroll', className)} role="region" aria-label={caption} tabIndex={0}
      style={Object.keys(style).length ? style : undefined}>
      <table ref={table} className={cx('kit-data-table', density === 'compact' && 'compact', fixed && 'kit-data-fixed')}
        style={fixed ? { width: tableWidth(keys, sizes) } : undefined}>
        {fixed && (
          <colgroup>
            {keys.map((k) => <col key={k} style={{ width: sizes[k] ?? undefined }} />)}
          </colgroup>
        )}
        <thead>
          <tr>
            <th scope="col" className="kit-data-corner" aria-sort={byLabel ? ariaSort(current?.dir) : undefined}>
              {labelSortable
                ? (
                  <SortButton name={labelName} dir={dirOf(LABEL_SORT)} onClick={() => change(LABEL_SORT, labelName, 'asc')}>
                    {labelHead}
                  </SortButton>
                )
                : labelHead}
              {resizable && <Grip {...grip(LABEL_WIDTH_KEY, labelName)} />}
            </th>
            {order.map((i) => {
              const c = columns[i]!
              const sortable = sortBy === 'column' && c.sortable !== false
              const dir = dirOf(c.key)
              const name = colName(c)
              const sorter = () => change(c.key, name, c.first ?? 'desc')
              return (
                <th key={c.key} scope="col" className={colClass(c, i)} title={c.title}
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
                  {resizable === 'all' && <Grip {...grip(c.key, name)} />}
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
                  {openHeads.map((c) => <div key={c.key}><b className="kit-data-help-title">{c.title || c.head}</b>{c.help}</div>)}
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
                const first = firstDir(r.better)
                const text = (
                  <span className="kit-data-text" onMouseEnter={fullText(name)}>
                    {r.label}{r.unit != null && r.unit !== '' && <small className="kit-data-unit"> {r.unit}</small>}
                  </span>
                )
                const out = [
                  <tr key={k} className={sortRow === r ? 'sorted' : undefined}>
                    <th scope="row" className="kit-data-label" aria-sort={sortRow === r ? ariaSort(current?.dir) : undefined}>
                      <span className="kit-data-name">
                        {rowSortable
                          ? (
                            <button type="button" className="kit-data-labelbtn" aria-label={t('sortBy', name)}
                              onClick={() => change(r.id, name, first)}>{text}</button>
                          )
                          : text}
                        {(rowSortable || r.help || r.action) && (
                          <span className="kit-data-tools">
                            {r.action && (
                              <button type="button" className="kit-data-action" onClick={r.action.onClick}>{r.action.label}</button>
                            )}
                            {r.help && <HelpButton open={open} onClick={() => flip(openRows, setOpenRows, k)} />}
                            {rowSortable && (
                              <SortButton name={name} dir={dirOf(r.id)} onClick={() => change(r.id, name, first)} decorative />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                    {order.map((i) => {
                      const c = columns[i]!
                      const cell = r.cells[i]
                      const tone = cell ? cell.tone : 'dim'
                      return (
                        <td key={c.key} className={cx(colClass(c, i), tone && `kit-data-${tone}`)} title={cell?.title}
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

  if (bar == null && !showSummary) return body
  return (
    <div className="kit-data">
      <div className="kit-data-bar">
        {showSummary && (
          <span className="kit-data-summary">
            {t('sortedBy', sortedName!, inEffect!.dir)}
            <button type="button" className="kit-data-reset" onClick={reset}>{t('sortReset')}</button>
          </span>
        )}
        {bar}
      </div>
      {body}
    </div>
  )
}

/** A mouse-over that gives the label its whole text as a tooltip when it is cut off, and none when it is not. */
const fullText = (text: string) => (e: { currentTarget: HTMLElement }) => {
  const el = e.currentTarget
  if (el.scrollHeight > el.clientHeight + 1) el.title = text
  else el.removeAttribute('title')
}
