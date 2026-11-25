import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup as html } from 'react-dom/server'
import * as kit from '../index.js'
import { HourBars, StackedHourBars } from '../charts.js'

const { Breakdown, DirectionSplit, Donut, Fact, PieceTree, SplitTable } = kit

describe('components', () => {
  it('render on a server, without a window', () => {
    expect(html(
      <kit.AppShell>
        <kit.Sidebar title="T" open={false} setOpen={() => {}}>
          <kit.Panel title="P" collapsible>
            <kit.Toggle label="L" checked onChange={() => {}} swatch="#123456" />
            <kit.HourRange range={[22, 6]} setRange={() => {}} />
            <kit.SearchBox search={() => []} onPick={() => {}} />
          </kit.Panel>
        </kit.Sidebar>
        <kit.DetailsPanel title="D" pill="x" color="#fff" onClose={() => {}}>
          <kit.ShareButtons render={async () => new Blob()} filename="x.png" />
          <HourBars values={Array(24).fill(1)} hours={[7]} color="#fff" unit="u" />
          <StackedHourBars kind="k" pieces={[]} hours={[]} unit="u" />
        </kit.DetailsPanel>
      </kit.AppShell>,
    )).toContain('22:00–06:00 (over midnight)')
  })

  it('Breakdown goes largest first, the rest last', () => {
    const out = html(<Breakdown title="t" rest="other" parts={{ other: 9, a: 1, b: 2, none: 0 }} />)
    expect(out.match(/<span>(\w+)/g)).toEqual(['<span>b', '<span>a', '<span>other'])
  })

  it('Fact without a value still leads', () => {
    expect(html(<Fact label="l" tone="gap">none</Fact>)).toBe('<dt class="now">l</dt><dd class="now gap">none</dd>')
  })

  it('Donut draws a whole ring for a single part', () => {
    expect(html(<Donut rows={[{ key: 'a', label: 'A', color: 'red', value: 5 }]} />)).toContain('A: 100%')
  })

  it('SplitTable is only pickable with a pick', () => {
    const rows = [{ key: 'a', label: 'A', cells: [1] }]
    expect(html(<SplitTable columns={[{ label: 'c' }]} rows={rows} />)).not.toContain('tabindex')
  })

  it('DirectionSplit hides streets with nothing counted', () => {
    const row = (id: string, v: number) => ({ kind: 'road', id, letter: id, name: id, dirs: [{ key: 'N>S', v }] })
    const out = html(<DirectionSplit title="t" rows={[row('A', 0), row('B', 4)]} />)
    expect(out).not.toContain('title="A"')
    expect(out).toContain('↓ N → S')
  })

  it('PieceTree keeps the last piece of a group that needs one', () => {
    const tree = (off: string[]) => html(
      <PieceTree label="t" root={{ label: 'all', onPick: () => {} }} off={new Set(off)}
        onToggle={() => {}} onPick={() => {}}
        groups={[{ kind: 'road', label: 'Roads', color: 'red', keepOne: true,
          items: [{ id: 'a', letter: 'A', label: 'a' }, { id: 'b', letter: 'B', label: 'b' }] }]} />,
    )
    expect(tree([])).not.toContain('disabled')
    expect(tree(['road:a']).match(/disabled/g)).toHaveLength(1)
    expect(tree(['road:a'])).toContain('1 of 2')
  })

  it('PieceTree gives each direction a button, and half ticks what is partly out', () => {
    const tree = (dir?: string, out = false) => html(
      <PieceTree label="t" root={{ label: 'all', onPick: () => {} }} onToggle={() => {}} onPick={() => {}}
        onPickWay={() => {}} current={{ kind: 'road', id: 'a', dir }}
        groups={[{ kind: 'road', label: 'Roads', color: 'red', items: [
          { id: 'a', letter: 'A', label: 'a', ways: [{ key: 'W>E', title: 'east' }, { key: 'E>W', title: 'west', out }] },
          { id: 'b', letter: 'B', label: 'b' }] }]} />,
    )
    expect(tree().match(/kit-way"/g)).toHaveLength(2)
    expect(tree()).toContain('<li class="on">')
    expect(tree('W>E')).toContain('<li class="within">')
    expect(tree('W>E')).toContain('aria-current="true" class="kit-way on"')
    expect(tree()).not.toContain('left out')
    expect(tree(undefined, true)).toContain('1 left out')
    expect(tree(undefined, true)).toContain('include all')
  })

  it('DirectionSplit can be picked from, and marks the open direction', () => {
    const rows = [{ kind: 'road', id: 'A', letter: 'A', name: 'a', dirs: [{ key: 'N>S', v: 4 }, { key: 'S>N', v: 2 }] }]
    expect(html(<DirectionSplit title="t" rows={rows} />)).not.toContain('role="button"')
    const out = html(<DirectionSplit title="t" rows={rows} onPick={() => {}}
      current={{ kind: 'road', id: 'A', dir: 'S>N' }} />)
    expect(out.match(/role="button"/g)).toHaveLength(2)
    expect(out).toContain('class="b on pick"')
  })
})
