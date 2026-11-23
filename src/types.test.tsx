// What the types promise, checked by `npm run typecheck`: each line under an
// expect-error must not compile.
import { describe, expect, it } from 'vitest'
import { configure, Chips, Fact, PieceTree, RadioCards, SearchBox, Select, Slider, SplitTable, t, TaggedList, Toggle } from './index.js'
import type { CardSpec, Hot, SetHot, Strings } from './index.js'
import { StackedHourBars } from './charts.js'
import type { CircleLayerProps, CirclePoint, LegendItem } from './map.js'

const nothing = () => {}
declare const ab: 'a' | 'b'

export const checks = () => [
  // callbacks give values, not events
  <Toggle key="1" label="l" checked onChange={(v) => v satisfies boolean} />,
  <Slider key="2" value={1} min={0} max="10" onChange={(v) => v satisfies number} />,
  // @ts-expect-error a toggle without its state
  <Toggle key="3" label="l" onChange={nothing} />,

  // options keep their own type, all the way to the callback
  <Select key="4" value={ab} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
    onChange={(v) => v satisfies 'a' | 'b'} />,
  <Select key="5" value={ab} onChange={nothing}
    // @ts-expect-error not one of the values
    options={[{ value: 'c', label: 'C' }]} />,
  <RadioCards key="5b" name="n" value={ab} onChange={nothing}
    // @ts-expect-error not one of the values
    options={[{ value: 'c', label: 'C' }]} />,
  <Chips<'am' | 'pm'> key="6" items={[{ key: 'am', label: 'am' }]} onPick={(k) => k satisfies 'am' | 'pm'} />,

  // so do extra fields of things picked
  <SearchBox key="7" search={(q) => [{ key: q, label: q, street: { name: q } }]}
    onPick={(r) => r.street.name satisfies string} />,
  <PieceTree key="8" label="t" groups={[{ kind: 'road', label: 'r', color: 'red',
    items: [{ id: 'a', letter: 'A', label: 'a', record: 7 }] }]}
    onPick={(g, m) => [g.kind satisfies string, m.record satisfies number]} />,
  <StackedHourBars key="9" kind="road" hours={[7]} unit="u"
    pieces={[{ id: 'a', letter: 'A', name: 'a', values: [], fill: 'red', when: new Date() }]}
    onPick={(p) => p.when satisfies Date} />,

  // closed sets are closed
  <Fact key="10" label="l" tone="now" />,
  // @ts-expect-error no such tone
  <Fact key="11" label="l" tone="loud" />,
  // @ts-expect-error no such tone
  <TaggedList key="12" items={[{ key: 1, color: 'red', label: 'l', value: 1, tag: 't', tone: 'bad' }]} />,
  // @ts-expect-error rows need cells
  <SplitTable key="13" columns={[{ label: 'a' }]} rows={[{ key: 'a', label: 'A' }]} />,
]

export const layer: CircleLayerProps<CirclePoint & { signal: { runs: number } }> = {
  points: [], tip: (p) => p.signal.runs satisfies number,
}

export const legend: LegendItem[] = [
  { title: 't' }, { label: 'l', color: 'red', line: true }, { note: 'n' },
  // @ts-expect-error a colour needs its label
  { color: 'red' },
]

// @ts-expect-error a card needs a title
export const card: CardSpec = { kicker: 'k' }
export const hot: Hot = { kind: 'road', id: 'a' }
export const setHot: SetHot = (h) => h?.dir satisfies string | undefined

describe('texts', () => {
  it('are typed by what they need filled in', () => {
    const filled: string = t('treeSome', 1, 2)
    const names: Record<string, string> = t('basemaps')
    // @ts-expect-error two numbers
    t('treeSome', 1)
    // @ts-expect-error no such text
    expect(t('nonsense')).toBeUndefined()
    const some: Partial<Strings> = { total: 'sum' }
    configure({ strings: some })
    expect([filled, t('total'), names.osm]).toEqual(['1 of 2', 'sum', 'OpenStreetMap'])
    // @ts-expect-error not a text
    configure({ strings: { total: 3 } })
    configure({ strings: {} })
  })
})
