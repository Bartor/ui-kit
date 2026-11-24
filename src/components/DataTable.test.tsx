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

describe('DataTable, the row header and where sorting lives', () => {
  const table = (extra = {}) => html(<DataTable caption="T" columns={cities} rows={measures} sortBy="row" {...extra} />)

  it('makes the label a sort button, with the icon as a second target the keyboard and screen readers skip', () => {
    const s = table()
    expect(s).toContain('<button type="button" class="kit-data-labelbtn" aria-label="Sort by Speed">')
    // the icon button: out of the tab order, hidden from assistive technology, still a button for the pointer
    expect(s).toMatch(/<button type="button" class="kit-data-sort icon"[^>]*tabindex="-1"[^>]*aria-hidden="true"/)
    // help and sort share the controls span, which follows the label inside the same cell
    expect(s).toMatch(/kit-data-name"><button[^>]*labelbtn[\s\S]*?<\/button><span class="kit-data-tools">/)
    // a row that does not sort has a plain label
    const dens = s.slice(s.indexOf('Density'))
    expect(dens.slice(0, 80)).not.toContain('labelbtn')
  })

  it('puts the action in the controls beside the label, not under it', () => {
    const s = html(<DataTable caption="T" columns={cities} sortBy="row" rows={[
      { id: 'x', label: 'X', better: 'higher', action: { label: 'on the map', onClick: () => {} }, cells: [cell(1)] }]} />)
    expect(s).toMatch(/<span class="kit-data-tools"><span class="kit-data-actions"><button type="button" class="kit-data-action">on the map<\/button>/)
  })

  it('takes several actions, after the single one, each its own button that does not sort', () => {
    const go = () => {}
    const acts = { action: { label: 'first', onClick: go }, actions: [
      { label: 'second', onClick: go, title: 'Open the second' }, { label: <i>third</i>, onClick: go, title: 'Third thing', key: 't' }] }
    for (const sortBy of ['row', 'column'] as const) {
      const s = html(<DataTable caption="T" columns={cities} sortBy={sortBy} rows={[
        { id: 'x', label: 'X', better: 'higher', cells: [cell(1)], ...acts }]} />)
      const tools = s.slice(s.indexOf('kit-data-actions'))
      expect([...tools.matchAll(/class="kit-data-action"[^>]*>(?:<i>)?(\w+)/g)].map((m) => m[1])).toEqual(['first', 'second', 'third'])
      expect(s).toContain('title="Open the second"')
      expect(s).not.toContain('aria-label="Open the second"')     // plain text names itself
      expect(s).toContain('aria-label="Third thing"')              // markup does not
      // outside the label button, so a click on them cannot reach its sort
      const labelBtn = /<button[^>]*labelbtn[^>]*>.*?<\/button>/.exec(s)
      if (sortBy === 'row') expect(labelBtn![0]).not.toContain('kit-data-action')
    }
    const only = html(<DataTable caption="T" columns={cities} rows={[
      { id: 'y', label: 'Y', cells: [cell(1)], actions: [{ label: 'one', onClick: go }] }]} />)
    expect(only).toContain('>one</button>')
  })

  it('marks the sorted row along its line, and the sorted column in column mode', () => {
    const s = table({ defaultSort: { key: 'speed', dir: 'desc' } })
    expect(s).toContain('<tr class="sorted">')
    expect((s.match(/class="sorted"/g) || []).length).toBe(1)
    expect(table()).not.toContain('class="sorted"')
    const col = html(<DataTable caption="L" columns={props} groups={lines} sortBy="column" defaultSort={{ key: 'n', dir: 'asc' }} />)
    expect(col).toContain('kit-data-col sorted')
  })

  it('keeps the head of a column one button with the icon after the text', () => {
    const s = html(<DataTable caption="L" columns={props} groups={lines} sortBy="column" />)
    expect(s).toMatch(/<button type="button" class="kit-data-sort fill" aria-label="Sort by Count" title="Sort by Count">Count<svg/)
  })
})

describe('DataTable, toolbar, label width, density, resizing', () => {
  const pivot = (extra = {}) => html(<DataTable caption="T" columns={cities} rows={measures} sortBy="row" {...extra} />)

  it('shows the summary with a way back only while a sort is in effect', () => {
    const on = pivot({ summary: true, defaultSort: { key: 'wait', dir: 'asc' } })
    expect(on).toContain('Sorted by Wait, ascending')
    expect(on).toContain('class="kit-data-reset"')
    expect(on).toContain('Original order')
    expect(pivot({ summary: true })).not.toContain('kit-data-bar')
    expect(pivot({ summary: true, sort: { key: 'nothing', dir: 'asc' } })).not.toContain('kit-data-bar')
    expect(pivot({ defaultSort: { key: 'wait', dir: 'asc' } })).not.toContain('kit-data-bar')
  })

  it('takes a toolbar as a node, or as a function of the sort', () => {
    expect(pivot({ toolbar: <i>extra</i> })).toContain('<div class="kit-data-bar"><i>extra</i></div>')
    const seen: unknown[] = []
    pivot({ defaultSort: { key: 'speed', dir: 'desc' }, toolbar: (st: { sort: unknown; name: string | null }) => { seen.push(st.sort, st.name); return 'bar' } })
    expect(seen).toEqual([{ key: 'speed', dir: 'desc' }, 'Speed'])
    // the bar is outside the region that scrolls
    const s = pivot({ toolbar: 'bar' })
    expect(s.indexOf('kit-data-bar')).toBeLessThan(s.indexOf('kit-data-scroll'))
  })

  it('sets the label column width: one length is exact, a pair is the range', () => {
    expect(pivot({ labelWidth: '9rem' })).toContain('--kit-data-label-min:9rem;--kit-data-label-max:9rem')
    const pair = pivot({ labelWidth: { min: '8rem' } })
    expect(pair).toContain('--kit-data-label-min:8rem')
    expect(pair).not.toContain('--kit-data-label-max')
    expect(pivot()).not.toContain('--kit-data-label')
  })

  it('has a compact density, and the regular one by default', () => {
    expect(pivot({ density: 'compact' })).toContain('class="kit-data-table compact"')
    expect(pivot()).toContain('class="kit-data-table"')
  })

  it('draws no handles unless asked, then on the label column, or on every head', () => {
    expect(pivot()).not.toContain('separator')
    const label = pivot({ resizable: 'label' })
    expect((label.match(/role="separator"/g) || []).length).toBe(1)
    const all = pivot({ resizable: 'all' })
    expect((all.match(/role="separator"/g) || []).length).toBe(5)
  })

  it('makes a handle a focusable vertical separator with a name and limits', () => {
    const s = pivot({ resizable: 'all', labelHead: 'Measure' })
    expect(s).toContain('role="separator" aria-orientation="vertical" tabindex="0" class="kit-data-grip"')
    expect(s).toContain('aria-label="Resize Measure"')
    expect(s).toContain('aria-label="Resize City A"')
    expect(s).toMatch(/aria-valuemin="80" aria-valuemax="480"/)
    expect(s).toMatch(/aria-valuemin="40" aria-valuemax="320"/)
    // before anything is measured there is no value to report
    expect(s).not.toContain('aria-valuenow')
  })

  it('holds every column at its width once any has one, with a table as wide as their sum', () => {
    const s = pivot({ resizable: 'all', widths: { ':label': 150, a: 60, b: 70 } })
    expect(s).toContain('kit-data-fixed')
    expect(s).toContain('style="width:408px"')    // 150 + 60 + 70 + 2 columns (64 each) at the fallback of 64
    expect(s).toContain('<colgroup><col style="width:150px"/><col style="width:60px"/><col style="width:70px"/>')
    expect(s).toContain('aria-valuenow="150"')
    expect(s).toContain('aria-valuenow="60"')
    // columns are laid out in the sorted order, and so are their widths
    const sorted = pivot({ resizable: 'all', widths: { ':label': 150, a: 60, b: 70 }, defaultSort: { key: 'speed', dir: 'desc' } })
    expect(sorted).toContain('<col style="width:150px"/><col style="width:70px"/>')
    expect(pivot({ resizable: 'all', widths: {} })).not.toContain('kit-data-fixed')
  })
})
