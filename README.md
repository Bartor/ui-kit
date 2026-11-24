# ui-kit

React components for maps of city data, dark by default: a sidebar of controls,
a detail panel, hourly charts, splits of a whole into parts, and Leaflet layers.
Extracted from [wroc-transport-map](https://github.com/Bartor/wroc-transport-map).

```sh
npm install @bartor-net/ui-kit
```

React is the only required peer. `leaflet` and `react-leaflet` are needed for
the map parts, `recharts` for the charts:

| import | what | needs |
|---|---|---|
| `@bartor-net/ui-kit` | layout, controls, lists, splits, formatting, share cards, CSV | react |
| `@bartor-net/ui-kit/map` | map, markers, labels, legend, line and circle layers | leaflet, react-leaflet |
| `@bartor-net/ui-kit/charts` | hourly bar charts | recharts |
| `@bartor-net/ui-kit/pl` | Polish texts | |

## Setting up

```jsx
import { configure } from '@bartor-net/ui-kit'
import { pl } from '@bartor-net/ui-kit/pl'

import 'leaflet/dist/leaflet.css'          // with the map parts
import '@bartor-net/ui-kit/base.css'       // page defaults; skip if you have your own reset
import '@bartor-net/ui-kit/styles.css'

configure({ locale: 'pl-PL', strings: pl })  // English and en-GB without it
```

The locale sets how numbers are written, in CSV files too. Any text can be
replaced: `strings: { ...pl, total: 'suma' }`; the list is in
[src/strings/types.ts](src/strings/types.ts).

Sizes are in rem, drawn for the 14px root that `base.css` sets. Colours are
custom properties, listed at the top of [src/styles.css](src/styles.css):

```css
:root { --kit-accent: #2f8f6b; }
```

## A page

```jsx
import { AppShell, Sidebar, Panel, Toggle, DetailsPanel, Facts, Fact } from '@bartor-net/ui-kit'
import { BaseMap, PointMarker, MapLegend, MapTooltip } from '@bartor-net/ui-kit/map'

<AppShell>
  <Sidebar title="Counts" peek="settings" open={open} setOpen={setOpen}>
    <Panel title="Layers" help={<p>What was counted.</p>}>
      <Toggle label="Bikes" swatch="#3fa34d" checked={bikes} onChange={setBikes} />
    </Panel>
  </Sidebar>

  <BaseMap center={[51.11, 17.03]} overlay={<MapLegend items={[{ label: 'Bikes', color: '#3fa34d' }]} />}>
    {points.map((p) => (
      <PointMarker key={p.id} lat={p.lat} lon={p.lon} r={10} color="#3fa34d"
        on={p === selected} onClick={() => select(p)} tip={<MapTooltip>{p.name}</MapTooltip>} />
    ))}
  </BaseMap>

  {selected && (
    <DetailsPanel pill={selected.id} title={selected.name} color="#3fa34d" onClose={() => select(null)}>
      <Facts><Fact label="Day" tone="now">{selected.total}</Fact></Facts>
    </DetailsPanel>
  )}
</AppShell>
```

On phones the sidebar and the details become bottom sheets by themselves.

## What there is

**Layout** — `AppShell`, `AppMessage`, `Sidebar`, `InfoButton`, `DetailsPanel`, `Modal`,
`TextTable`, `ErrorBoundary`

**Controls** — `Panel`, `Field`, `Toggle`, `Pair`, `Select`, `Slider`, `Chips`, `RadioCards`,
`SearchBox`, `HourRange`, `HelpButton`

**Text** — `Hint`, `Warn`, `Footnote`, `Notes`, `Callout`, `Citation`, `CitePlace`, `Facts`,
`Fact`, `Partial`, `LinkButton`, `Divider`, `Block`, `Swatch`

**Lists** — `RankList`, `Totals`, `TotalsTable`, `TaggedList`, `LegendRow`, `Breakdown`

**Parts of a whole** — `Donut`, `SplitTable`, `ShareBars` (tied together by `usePick`),
`SplitBody`, `GroupedTable`, `StatBlock`, `DirectionSplit`, `PieceTree`

**Tables** — `DataTable`, with `LABEL_SORT`, `compareValues`, `sortOrder`, `sortItems`, `nextSort`, `firstDir`

**Charts** — `HourBars`, `StackedHourBars`

**Map** — `BaseMap`, `FlyTo`, `PointMarker`, `PieceDots`, `DirArrows`, `HotArrows`, `MapLabels`,
`MapLegend`, `CircleLayer`, `LineLayer`, `Layer`, `MapTooltip`, `TipNote`, `TipRow`, `TipWarn`,
`BASEMAPS`, `basemapOptions`

**Sharing** — `ShareButtons`, `renderCard` with `splitBlock`, `sharesBlock`, `figureBlock`,
`downloadCsv`, `csvNumber`

**Helpers** — `fmt`, `fmtEst`, `fixed`, `pct`, `slug`, `sqrtRadius`, `hourRuns`, `hoursOf`,
`ramp`, `shade`, `inkOn`, `useSheetDrag`, `isPhone`, `HAS_HOVER`

Every component's props are typed and described: `Panel` takes `PanelProps`, and
so on, all exported.

### TypeScript

Types are included. The map parts use Leaflet's, so a TypeScript project needs
`@types/leaflet` beside it, and `skipLibCheck` with react-leaflet 4, whose own types do
not check. TypeScript 5.4 or newer.

Values keep their own types through the components, so options, search results,
tree items and map points come back from callbacks as they went in:

```tsx
const [view, setView] = useState<'nodes' | 'roads'>('nodes')

<RadioCards name="view" value={view} onChange={setView} options={[
  { value: 'nodes', label: 'Junctions' },
  { value: 'roads', label: 'Roads' },      // anything else is an error
]} />

<CircleLayer points={signals.map((s) => ({ key: s.id, lat: s.lat, lon: s.lon, r: 8, signal: s }))}
  onPick={(p) => open(p.signal)} />
```

### Tables

`DataTable` is a table of figures with sticky heads, sorting, grouped rows and a "?" that
unfolds an explanation under a row or a column head (several can be open at once). Two shapes:

```tsx
// Rows are things: a click on a head sorts the rows (within each group).
<DataTable caption="Lines" sortBy="column" labelHead="Line"
  columns={[{ key: 'km', head: 'km' }, { key: 'note', head: 'Note', align: 'left', first: 'asc' }]}
  groups={[{ id: 'tram', title: 'Trams', rows: [
    { id: 'T1', label: 'T1', labelValue: 'T1',
      cells: [{ content: '14,2', value: 14.2 }, { content: 'Central loop', value: 'Central loop' }] },
  ] }]} />

// Rows are measures, columns are cities: a control on a row orders the COLUMNS by it.
<DataTable caption="Cities" sortBy="row" labelHead="Measure"
  sort={sort} onSortChange={setSort}            // or leave both out, and it keeps its own
  hot={city} onHot={setCity}                    // the column under the pointer, to link with a map
  columns={cities.map((c) => ({ key: c.id, head: c.short, title: c.name }))}
  rows={[{ id: 'wait', label: 'Waiting', unit: 'min', better: 'lower', help: <p>What it is.</p>,
    cells: cities.map((c) => (c.wait == null ? null : { content: fixed(c.wait), value: c.wait, tone: 'best' })) }]} />
```

Sorting goes descending, ascending, original order (`sort` is `{ key, dir } | null`); a
row says which way is better, so its first click puts the best first (`better: 'lower'`
starts ascending, `'higher'` and `null` descending), and `first` does the same for a column.
Missing values (`null`, `undefined`, `''`, `NaN`) always go last and are never zero. A cell
shows `content` and sorts by `value`, so "1 234,5 m" sorts as 1234.5. Sorted heads carry
`aria-sort`; every control is a button with a name ("Sort by Waiting"), and a status line
tells screen readers what changed. In column mode `sortWithinGroups={false}` sorts all rows
together and hides the headings while it does. Cell tones are `best` (bold), `weak` and `dim`;
a missing cell is a dimmed dash (`empty`). The pure parts, `compareValues` and `sortOrder`,
are exported for sorting your own lists the same way.

**Sticky heads, and what they need.** The table scrolls in one region, in both directions,
at a bounded height (`maxHeight`, default `min(34rem, 70dvh)`; `--kit-data-height` sets it
from CSS). The heads stick to its top, the label column to its left, and the corner cell stays
over both, also inside `DetailsPanel`, `Modal` and `Sidebar`. `position: sticky` follows the
nearest ancestor that scrolls, so the usual way to make a wide table scroll, an
`overflow-x: auto` wrapper around a table that the page scrolls vertically, leaves the heads
behind. Do not wrap a `DataTable` in an element of your own with `overflow`, and do not remove the
height (`maxHeight="none"` is for tables that do not need sticky heads). Sticky cells are painted
with `--kit-data-bg`, which is the panel colour; set it where the table sits on another one.

### Linked highlighting

The tree, the charts, the direction bars and the map dots light each other up.
They share one value, `{ kind, id, dir? }` or `null`, kept by the app:

```tsx
const [hot, setHot] = useState<Hot | null>(null)

<PieceTree hot={hot} setHot={setHot} ... />
<StackedHourBars kind="road" hot={hot} setHot={setHot} ... />
<DirectionSplit hot={hot} setHot={setHot} ... />
<PieceDots hot={hot} setHot={setHot} ... />
```

## Working on it

```sh
npm run dev      # the gallery, on the sources
npm test
npm run typecheck
npm run build    # dist/
```

To try changes in an app before releasing: `npm pack` here, then
`npm install ../ui-kit/bartor-net-ui-kit-<version>.tgz` there.

To release: `npm version minor`, `git push --follow-tags`, `npm publish`.
