// Every component on one page, on made-up data.
import { StrictMode, useCallback, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as kit from '@bartor-net/ui-kit'
import { pl } from '@bartor-net/ui-kit/pl'
import { HourBars, StackedHourBars } from '@bartor-net/ui-kit/charts'
import * as map from '@bartor-net/ui-kit/map'
import type { Hot, HourBounds } from '@bartor-net/ui-kit'
import type { BasemapKey } from '@bartor-net/ui-kit/map'
import 'leaflet/dist/leaflet.css'
import '@bartor-net/ui-kit/base.css'
import '@bartor-net/ui-kit/styles.css'

if (new URLSearchParams(window.location.search).get('lang') === 'pl') {
  kit.configure({ locale: 'pl-PL', strings: pl })
}

const MODES = [
  { key: 'car', label: 'Cars', color: '#e4572e', value: 5200, extra: 4300 },
  { key: 'bus', label: 'Buses', color: '#c98500', value: 2100, extra: 70 },
  { key: 'tram', label: 'Trams', color: '#3987e5', value: 6400, extra: 90, est: true },
  { key: 'bike', label: 'Bikes', color: '#0ca30c', value: 830, extra: 830 },
]
const profile = (peak: number, seed: number) => Array.from({ length: 24 }, (_, h) => Math.round(
  peak * (0.15 + Math.exp(-((h - 8) ** 2) / 6) + 0.9 * Math.exp(-((h - 16) ** 2) / 8)) * (1 + 0.1 * Math.sin(h * seed))))
const NODE = { lat: 51.1166, lon: 17.0405 }
const PIECES = [
  { id: 'A', name: 'North street', lat: 51.1185, lon: 17.0405, dirs: ['N>S', 'S>N'], split: [740, 380], values: profile(700, 1) },
  { id: 'B', name: 'East street', lat: 51.1166, lon: 17.0445, dirs: ['W>E', 'E>W'], split: [1170, 1600], values: profile(1200, 2) },
  { id: 'C', name: 'South bridge', lat: 51.1145, lon: 17.0395, dirs: ['N>S', 'S>N'], split: [110, 60], values: profile(260, 3) },
]
const COLOR = '#e4572e'
const PLACES = [
  { id: 'P1', name: 'Crossing one', lat: 51.11, lon: 17.02, v: 900 },
  { id: 'P2', name: 'Crossing two', lat: 51.108, lon: 17.06, v: 2500 },
  { id: 'P3', name: 'Nothing counted', lat: 51.122, lon: 17.06, v: 0 },
]
const SPEEDS = kit.ramp([[500, '#3b82f6'], [1500, '#22c55e'], [Infinity, '#ef4444']], kit.fmt)
const LINES: map.MapLine[] = ([
  { key: 1, path: [[51.1166, 17.0405], [51.11, 17.02]], value: 400 },
  { key: 2, path: [[51.1166, 17.0405], [51.108, 17.06]], value: 2400 },
  { key: 3, path: [[51.1166, 17.0405], [51.122, 17.06]], value: 1100 },
] as const).map(({ key, path, value }) => ({ key, path: path.map(([a, b]): [number, number] => [a, b]), value, color: SPEEDS.color(value) }))

type Place = (typeof PLACES)[number]
type Selection = { kind: 'node' } | { kind: 'piece'; id: string } | { kind: 'place'; ref: Place }
const PERIODS: HourBounds[] = [[0, 24], [7, 9], [22, 6]]
const TAGS = [['good', '×1.0'], ['fair', '×1.8'], ['weak', '×2.4']] as const

function Broken(): never { throw new Error('a component that throws') }

function App() {
  const [open, setOpen] = useState(false)
  const [about, setAbout] = useState(false)
  const [range, setRange] = useState<HourBounds>([7, 9])
  const [view, setView] = useState<'nodes' | 'roads'>('nodes')
  const [on, setOn] = useState({ lines: true, labels: true, places: true })
  const [base, setBase] = useState<BasemapKey>(map.DEFAULT_BASEMAP)
  const [min, setMin] = useState(0)
  const [sel, setSel] = useState<Selection | null>({ kind: 'node' })
  const [off, setOff] = useState<ReadonlySet<string>>(new Set())
  const [hot, setHot] = useState<Hot | null>(null)
  const pick = kit.usePick()
  const hours = kit.hoursOf(range)
  const toggle = (k: keyof typeof on) => (v: boolean) => setOn({ ...on, [k]: v })
  const slices = useMemo(() => MODES.map((m) => ({ color: m.color, value: m.value })), [])
  const target = useMemo(() => (sel?.kind === 'place' ? sel.ref : null), [sel])
  const current = sel?.kind === 'piece' ? { kind: 'road', id: sel.id } : null
  const openPiece = ({ id }: { id: string }) => setSel({ kind: 'piece', id })
  const total = MODES.reduce((a, m) => a + m.value, 0)
  const extra = MODES.reduce((a, m) => a + m.extra, 0)
  const search = useCallback((q: string) => PLACES.filter((p) => p.name.toLowerCase().includes(q))
    .map((p) => ({ key: p.id, label: p.name, sub: p.id, color: '#2e86ab', ref: p })), [])
  const shares = [
    { key: 'p', label: 'people', parts: MODES.map((m) => ({ ...m, share: m.value / total })) },
    { key: 'v', label: 'vehicles', parts: MODES.map((m) => ({ ...m, share: m.extra / extra })) },
  ]
  const card = () => kit.renderCard({
    accent: COLOR, kicker: 'Junction · demo', title: 'Gallery junction', subtitle: 'made-up data',
    when: kit.hourRuns(hours),
    blocks: [
      kit.splitBlock({ slices: MODES, unit: 'people',
        columns: { value: 'PEOPLE', share: '%', extra: 'VEHICLES', extraShare: '%' } }),
      kit.sharesBlock({ rows: shares, mark: 'car', caption: 'On the right: cars.' }),
      kit.figureBlock({ figure: { value: kit.fmt(total), unit: 'people' },
        profile: { values: PIECES[0].values, hours, color: COLOR } }),
    ],
    notes: ['None of this was counted.'], source: 'Source: demo/main.jsx', footer: 'ui-kit gallery',
    site: 'github.com/Bartor/ui-kit',
  })

  return (
    <kit.AppShell>
      <kit.Sidebar title="ui-kit" subtitle="Every component, on made-up data" peek="settings"
        open={open} setOpen={setOpen} footer="Gallery of @bartor-net/ui-kit"
        action={<kit.InfoButton label="About" title="About" onClick={() => setAbout(true)} />}>
        {about && (
          <kit.Modal title="About" onClose={() => setAbout(false)}>
            <p>A <b>Modal</b> with a <a href="#x">link</a>.</p>
            <h3>Text table</h3>
            <kit.TextTable head={['What', 'When']} rows={[[<>Roads<small>3.3</small></>, 'May'], ['Stops', 'June']]} />
            <kit.Hint>And a hint.</kit.Hint>
          </kit.Modal>
        )}
        <kit.SearchBox search={search} placeholder="Search: crossing" label="Search"
          onPick={(r) => setSel({ kind: 'place', ref: r.ref })} />
        <kit.Panel title="Period" help={<p>Help text.</p>}>
          <kit.Chips onPick={(k) => setRange(JSON.parse(k))} items={PERIODS.map((r) => (
            { key: JSON.stringify(r), label: `${r[0]}–${r[1]}`, on: kit.sameRange(r, range) }))} />
          <kit.HourRange range={range} setRange={setRange} bands={[
            { key: 'a', color: COLOR, label: 'Roads', cells: Array.from({ length: 24 }, (_, h) => (h > 4 && h < 21 ? 1 : 0.4)) },
            { key: 'b', color: '#2e86ab', label: 'Stops', note: 'peaks only', cells: Array.from({ length: 24 }, (_, h) => ((h > 4 && h < 9) || (h > 13 && h < 18) ? 1 : 0)) },
          ]} />
          <kit.Warn>A warning with a <kit.LinkButton onClick={() => setRange([7, 9])}>link button</kit.LinkButton>.</kit.Warn>
        </kit.Panel>
        <kit.Panel title="View">
          <kit.RadioCards label="View" name="view" value={view} onChange={setView} options={[
            { value: 'nodes', label: 'Junctions', sub: 'a pie', color: 'conic-gradient(#e4572e 0 45%, #3987e5 0)' },
            { value: 'roads', label: 'Roads', sub: 'a circle', color: COLOR, count: 3 },
          ]} />
          <kit.Toggle label="Lines" checked={on.lines} onChange={toggle('lines')} help={<p>A line layer.</p>} />
          <kit.Toggle label="Places" swatch="#2e86ab" count={3} checked={on.places} onChange={toggle('places')} />
          <kit.Divider />
          <kit.Field label="Labels">
            <kit.Pair>
              <kit.Toggle label="Numbers" checked={on.labels} onChange={toggle('labels')} />
              <kit.Toggle label="Idle" checked={false} onChange={() => {}} />
            </kit.Pair>
          </kit.Field>
          <kit.Slider min={0} max={3000} step={100} value={min} onChange={setMin} label="Threshold"
            caption={<>Lines above {kit.fmt(min)}</>} ticks={[0, 1000, 2000, 3000]} />
          <kit.LegendRow items={SPEEDS.legend()} />
          <kit.Field label="Basemap">
            <kit.Select label="Basemap" value={base} onChange={setBase} options={map.basemapOptions()} />
          </kit.Field>
        </kit.Panel>
        <kit.Panel title="Results">
          <kit.TotalsTable columns={[{ label: 'people' }, { label: '%', strong: true }, { label: '% veh.' }]}
            rows={MODES.map((m) => ({ ...m, cells: [kit.fmt(m.value),
              `${Math.round((100 * m.value) / total)}%`, `${Math.round((100 * m.extra) / extra)}%`] }))} />
          <kit.Totals rows={MODES.slice(0, 2).map((m) => ({ ...m, value: kit.fmtEst(m.value) }))} />
          <kit.LinkButton block onClick={() => kit.downloadCsv(
            [['mode', 'people'], ...MODES.map((m) => [m.label, kit.csvNumber(m.value)])], 'modes.csv')}>
            Download CSV
          </kit.LinkButton>
          <h3>Ranking</h3>
          <kit.RankList items={PLACES.map((p) => ({ key: p.id, title: p.name, sub: p.id, value: kit.fmt(p.v),
            on: sel?.kind === 'place' && sel.ref === p, onPick: () => setSel({ kind: 'place', ref: p }) }))} />
        </kit.Panel>
        <kit.Panel title="Folded" collapsible defaultOpen={false} badge="on">
          <kit.TaggedList items={TAGS.map(([tone, value]) => (
            { key: tone, tone, value, tag: tone, label: 'Factor', color: COLOR }))} />
          <kit.Citation quote={[<>“A quoted <b>source</b>”</>, 'in two paragraphs']}>
            Where it is from<br /><kit.CitePlace>row 12</kit.CitePlace>
          </kit.Citation>
        </kit.Panel>
      </kit.Sidebar>

      <map.BaseMap basemap={base} center={[NODE.lat, NODE.lon]} zoom={14} overlay={(
        <map.MapLegend items={[{ title: 'Legend' }, ...MODES.map(({ label, color }) => ({ label, color })),
          ...SPEEDS.legend().map((l) => ({ ...l, line: true })), { note: 'size is the number of people' }]} />
      )}>
        <map.FlyTo target={target} />
        {on.lines && (
          <map.LineLayer lines={LINES.filter((l) => l.value >= min)}
            tip={(l) => <map.MapTooltip sticky>{kit.fmt(l.value)}</map.MapTooltip>} />
        )}
        {on.places && (
          <map.CircleLayer onPick={(p) => setSel({ kind: 'place', ref: p.ref })}
            tip={(p) => <map.MapTooltip>{p.ref.name}<br /><map.TipWarn>a warning</map.TipWarn></map.MapTooltip>}
            points={PLACES.map((p) => ({ key: p.id, lat: p.lat, lon: p.lon, r: kit.sqrtRadius(p.v, 2500), ref: p,
              style: { color: '#1b1e26', weight: 1, fillColor: '#2e86ab', fillOpacity: 0.85 } }))} />
        )}
        <map.Layer>
          <map.PointMarker {...NODE} r={22} on={sel?.kind === 'node'} onClick={() => setSel({ kind: 'node' })}
            slices={view === 'nodes' ? slices : undefined} color={COLOR}
            tip={(
              <map.MapTooltip>
                <b>Junction</b> <map.TipNote>· people</map.TipNote>
                {MODES.map((m) => <map.TipRow key={m.key} color={m.color} label={m.label}
                  value={kit.fmt(m.value)} share={`${Math.round((100 * m.value) / total)}%`} />)}
              </map.MapTooltip>
            )} />
        </map.Layer>
        {sel && sel.kind !== 'place' && (
          <map.PieceDots whole={NODE} wholeR={22} hot={hot} setHot={setHot} onPick={openPiece}
            pieces={PIECES.map((p) => ({ kind: 'road', id: p.id, target: p, lat: p.lat, lon: p.lon,
              color: COLOR, letter: p.id, dirs: p.dirs, tip: p.name,
              on: current?.id === p.id, out: off.has(kit.pieceKey('road', p.id)) }))} />
        )}
        {on.labels && (
          <map.MapLabels declutter entries={PLACES.map((p) => {
            const lines = [{ text: p.name, bold: true }, { text: kit.fmt(p.v), color: '#2e86ab' }]
            return { key: p.id, lat: p.lat, lon: p.lon, r: 10, weight: p.v,
              html: kit.labelHtml(lines), box: kit.labelBox(lines) }
          })} />
        )}
      </map.BaseMap>

      {sel?.kind === 'place' && (
        <kit.ErrorBoundary resetKey={sel.ref.id} onClose={() => setSel(null)}><Broken /></kit.ErrorBoundary>
      )}
      {sel && sel.kind !== 'place' && (
        <kit.DetailsPanel pill="demo" title="Gallery junction" color={COLOR} onClose={() => setSel(null)}
          actions={<kit.ShareButtons render={card} filename="demo.png" title="ui-kit" text="ui-kit" />}>
          <kit.PieceTree label="Pieces" current={current} off={off} hot={hot} setHot={setHot}
            root={{ label: 'The whole junction', onPick: () => setSel({ kind: 'node' }) }}
            groups={[{ kind: 'road', label: 'Streets', color: COLOR, keepOne: true,
              items: PIECES.map((p) => ({ id: p.id, letter: p.id, label: p.name, share: '33%' })) }]}
            onPick={(_, p) => openPiece(p)}
            onToggle={(keys, out) => setOff((s) => {
              const n = new Set(s)
              for (const k of [keys].flat()) {
                if (out) n.add(k)
                else n.delete(k)
              }
              return n
            })} />
          <kit.Block>
            <h4>Modes</h4>
            <kit.SplitBody>
              <kit.Donut rows={MODES} pick={pick} label="Modes" />
              <kit.SplitTable pick={pick} rows={MODES.map((m) => ({ ...m,
                cells: [kit.fmt(m.value), Math.round((100 * m.value) / total), kit.fmt(m.extra)] }))}
                columns={[{ label: 'people' }, { label: '%', tone: 'strong' }, { label: 'vehicles', tone: 'dim' }]} />
            </kit.SplitBody>
            <kit.ShareBars rows={shares} pick={pick} fallback={['car']} label="Shares">
              <kit.Hint>Click a slice, a row or a segment.</kit.Hint>
            </kit.ShareBars>
            <kit.Notes><li>Small print.</li></kit.Notes>
          </kit.Block>
          {current && <kit.Callout title="Open piece"><p>Street <b>{current.id}</b>.</p></kit.Callout>}
          <kit.Facts>
            <kit.Fact label="Where">somewhere</kit.Fact>
            <kit.Fact label="Now" tone="now">{kit.fmt(total)} people<kit.Partial> — 2 of 3 h</kit.Partial></kit.Fact>
            <kit.Fact label="Missing" tone="gap">not counted</kit.Fact>
            <kit.Fact label="Whole day" tone="whole">{kit.fmt(total * 8)}</kit.Fact>
          </kit.Facts>
          <h4>Stacked hours</h4>
          <StackedHourBars kind="road" hours={hours} unit="people" current={current?.id} hot={hot} setHot={setHot}
            onPick={openPiece} pieces={PIECES.map((p, i) => ({ id: p.id, letter: p.id, name: p.name,
              values: p.values, fill: kit.shade(COLOR, i), out: off.has(kit.pieceKey('road', p.id)) }))} />
          <h4>Hours</h4>
          <HourBars values={PIECES[0].values} hours={hours} color={COLOR} unit="people" />
          <kit.DirectionSplit title="Directions" hot={hot} setHot={setHot} rows={PIECES.map((p) => ({
            kind: 'road', id: p.id, letter: p.id, name: p.name, dirs: p.dirs.map((key, i) => ({ key, v: p.split[i] })) }))} />
          <kit.Breakdown title="Breakdown" rest="other" parts={{ other: 80, cars: 300, vans: 40 }} />
          <kit.StatBlock title="Tables">
            <kit.SplitTable columns={[{ label: 'a' }, { label: 'b', tone: 'strong' }]} rows={[
              { key: '1', label: 'Buses', color: '#c98500', cells: [1, 2] }, { key: '2', label: 'Total', sum: true, cells: [1, 2] }]} />
            <kit.GroupedTable corner="stop" groups={MODES.slice(1, 3).map((m) => ({ ...m,
              columns: [{ label: 'n' }, { label: 'load', tone: 'strong' }] }))}
              rows={[{ key: 1, head: <b>A</b>, cells: [[1, 2], [3, 4]] }, { key: 2, head: 'B', out: true, cells: [[1, 2], ['—', '']] }]} />
          </kit.StatBlock>
          <kit.Footnote>📍 a footnote</kit.Footnote>
        </kit.DetailsPanel>
      )}
    </kit.AppShell>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
