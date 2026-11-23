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
[src/strings/en.js](src/strings/en.js).

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

**Charts** — `HourBars`, `StackedHourBars`

**Map** — `BaseMap`, `FlyTo`, `PointMarker`, `PieceDots`, `DirArrows`, `HotArrows`, `MapLabels`,
`MapLegend`, `CircleLayer`, `LineLayer`, `Layer`, `MapTooltip`, `TipNote`, `TipRow`, `TipWarn`,
`BASEMAPS`, `basemapOptions`

**Sharing** — `ShareButtons`, `renderCard` with `splitBlock`, `sharesBlock`, `figureBlock`,
`downloadCsv`, `csvNumber`

**Helpers** — `fmt`, `fmtEst`, `fixed`, `pct`, `slug`, `sqrtRadius`, `hourRuns`, `hoursOf`,
`ramp`, `shade`, `inkOn`, `useSheetDrag`, `isPhone`, `HAS_HOVER`

Props are described above each component in the source.

### Linked highlighting

The tree, the charts, the direction bars and the map dots light each other up.
They share one value, `{ kind, id, dir? }` or `null`, kept by the app:

```jsx
const [hot, setHot] = useState(null)

<PieceTree hot={hot} setHot={setHot} ... />
<StackedHourBars kind="road" hot={hot} setHot={setHot} ... />
<DirectionSplit hot={hot} setHot={setHot} ... />
<PieceDots hot={hot} setHot={setHot} ... />
```

## Working on it

```sh
npm run dev      # the gallery, on the sources
npm test
npm run build    # dist/
```

To try changes in an app before releasing: `npm pack` here, then
`npm install ../ui-kit/bartor-net-ui-kit-<version>.tgz` there.

To release: `npm version minor`, `git push --follow-tags`, `npm publish`.
