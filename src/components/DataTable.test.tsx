import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup as html } from 'react-dom/server'
import { DataTable, LABEL_SORT } from '../index.js'
import type { DataTableColumn, DataTableGroup, DataTableRow } from '../index.js'

const cell = (value: number | null, content = String(value)) => (value == null ? null : { content, value })

// a pivot: rows are measures, columns are cities
const cities: DataTableColumn[] = [
  { key: 'a', head: 'Aa', title: 'City A', help: <p>about A</p> },
  { key: 'b', head: 'Bb' },
  { key: 'c', head: 'Cc' },
  { key: 'd', head: 'Dd' },
]
const measures: DataTableRow[] = [
  { id: 'speed', label: 'Speed', better: 'higher', help: <p>about speed</p>, cells: [cell(20), cell(40), cell(null), cell(30)] },
  { id: 'wait', label: 'Wait', unit: 'min', better: 'lower', cells: [cell(5), cell(2), cell(9), cell(null)] },
  { id: 'dens', label: 'Density', better: null, sortable: false, cells: [cell(1), cell(2), cell(3), cell(4)] },
]
const heads = (s: string) => [...s.matchAll(/<th scope="col" class="kit-data-col[^"]*"[^>]*>.*?<\/th>/g)]
  .map((m) => />([A-D][a-d])</.exec(m[0])?.[1])

describe('DataTable, rows sort the columns', () => {
  const table = (extra = {}) => html(<DataTable caption="T" columns={cities} rows={measures} sortBy="row" {...extra} />)

  it('keeps the order of the columns without a sort, and has a button on the rows that can be sorted', () => {
    const s = table()
    expect(heads(s)).toEqual(['Aa', 'Bb', 'Cc', 'Dd'])
    expect((s.match(/aria-label="Sort by (Speed|Wait)"/g) || []).length).toBe(2)
    expect(s).not.toContain('Sort by Density')
    expect(s).not.toContain('aria-sort')
    expect(s).toContain('role="region"')
  })

  it('orders the columns by the row, best first for "higher" and "lower", with missing ones last', () => {
    // descending for speed: B 40, D 30, A 20, C missing
    const speed = table({ defaultSort: { key: 'speed', dir: 'desc' } })
    expect(heads(speed)).toEqual(['Bb', 'Dd', 'Aa', 'Cc'])
    expect(speed).toContain('<th scope="row" class="kit-data-label" aria-sort="descending">')
    // ascending for wait (lower is better): B 2, A 5, C 9, D missing
    expect(heads(table({ defaultSort: { key: 'wait', dir: 'asc' } }))).toEqual(['Bb', 'Aa', 'Cc', 'Dd'])
    // the other way, missing still last
    expect(heads(table({ defaultSort: { key: 'speed', dir: 'asc' } }))).toEqual(['Aa', 'Dd', 'Bb', 'Cc'])
    // the cells follow their heads
    const cells = [...speed.matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map((m) => m[1]).slice(0, 4)
    expect(cells).toEqual(['40', '30', '20', '–'])
  })

  it('takes a controlled sort, and ignores one that matches nothing', () => {
    expect(heads(table({ sort: { key: 'wait', dir: 'desc' } }))).toEqual(['Cc', 'Aa', 'Bb', 'Dd'])
    expect(heads(table({ sort: null, defaultSort: { key: 'wait', dir: 'desc' } }))).toEqual(['Aa', 'Bb', 'Cc', 'Dd'])
    expect(heads(table({ sort: { key: 'nothing', dir: 'asc' } }))).toEqual(['Aa', 'Bb', 'Cc', 'Dd'])
    expect(heads(table({ sort: { key: 'dens', dir: 'desc' } }))).toEqual(['Aa', 'Bb', 'Cc', 'Dd'])
  })

  it('lights the hot column, shows tones, units and a dash for what is missing', () => {
    const s = table({ hot: 'b' })
    expect(s).toContain('kit-data-col hot')
    expect(s).toContain('<small class="kit-data-unit"> min</small>')
    expect(s).toContain('kit-data-dim')
    expect((s.match(/aria-expanded="false"/g) || []).length).toBe(2)     // the head of A and the row Speed
    expect(s).not.toContain('about speed')
  })
})

// a list of things in groups
const rowOf = (id: string, name: string, n: number | null): DataTableRow => ({
  id, label: name, labelValue: name, cells: [cell(n), { content: name.toLowerCase(), value: name }],
})
const lines: DataTableGroup[] = [
  { id: 'tram', title: 'Trams', rows: [rowOf('t1', 'Tr1', 5), rowOf('t2', 'Tr2', 9), rowOf('t3', 'Tr3', null), rowOf('t4', 'Tr4', 7)] },
  { id: 'bus', title: 'Buses', rows: [rowOf('b1', 'Bu1', 3), rowOf('b2', 'Bu2', 8)] },
]
const props: DataTableColumn[] = [
  { key: 'n', head: 'Count' },
  { key: 'name', head: 'Name', align: 'left', first: 'asc', sortable: false },
]
const order = (s: string) => [...s.matchAll(/<th scope="row"[^>]*>.*?kit-data-text">(\w+)/g)].map((m) => m[1])

describe('DataTable, columns sort the rows', () => {
  const table = (extra = {}) => html(<DataTable caption="L" columns={props} groups={lines} sortBy="column" labelHead="Line" {...extra} />)

  it('sorts within each group, missing last, and marks the sorted head', () => {
    const s = table({ defaultSort: { key: 'n', dir: 'desc' } })
    expect(order(s)).toEqual(['Tr2', 'Tr4', 'Tr1', 'Tr3', 'Bu2', 'Bu1'])
    expect(s).toContain('aria-sort="descending"')
    expect(s).toContain('Trams')
    expect(order(table({ defaultSort: { key: 'n', dir: 'asc' } }))).toEqual(['Tr1', 'Tr4', 'Tr2', 'Tr3', 'Bu1', 'Bu2'])
    expect(order(table())).toEqual(['Tr1', 'Tr2', 'Tr3', 'Tr4', 'Bu1', 'Bu2'])
  })

  it('sorts across groups, without headings, when asked', () => {
    const s = table({ defaultSort: { key: 'n', dir: 'desc' }, sortWithinGroups: false })
    expect(order(s)).toEqual(['Tr2', 'Bu2', 'Tr4', 'Tr1', 'Bu1', 'Tr3'])
    expect(s).not.toContain('Trams')
    // unsorted, the groups are back
    expect(table({ sortWithinGroups: false })).toContain('Trams')
  })

  it('sorts by the label column when the rows give a value for it, and leaves an unsortable column alone', () => {
    const s = table({ defaultSort: { key: LABEL_SORT, dir: 'desc' } })
    expect(order(s)).toEqual(['Tr4', 'Tr3', 'Tr2', 'Tr1', 'Bu2', 'Bu1'])
    expect(s).toContain('aria-label="Sort by Line"')
    expect(order(table({ defaultSort: { key: 'name', dir: 'desc' } }))).toEqual(['Tr1', 'Tr2', 'Tr3', 'Tr4', 'Bu1', 'Bu2'])
    expect(table()).not.toContain('Sort by Name')
  })

  it('has a button with a name on each sortable head, and none when nothing sorts', () => {
    expect(table()).toContain('aria-label="Sort by Count"')
    const plain = html(<DataTable caption="L" columns={props} groups={lines} />)
    expect(plain).not.toContain('kit-data-sort')
    expect(plain).not.toContain('role="status"')
  })

  it('keeps the head as its own button when a click on it means something else', () => {
    const s = html(<DataTable caption="L" sortBy="column" groups={lines}
      columns={[{ key: 'n', head: 'Count', onPick: () => {} }]} />)
    expect(s).toContain('class="kit-data-pick"')
    expect(s).toContain('class="kit-data-sort icon"')
  })
})
