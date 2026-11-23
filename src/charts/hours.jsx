import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { axisTick, fmt } from '../core/format'
import { hourLabel, hourSpan } from '../core/hours'
import { HAS_HOVER } from '../core/media'
import { t } from '../core/config'

const CURSOR = { fill: 'rgba(255, 255, 255, .06)' }
// Tooltips sit above the chart, pinned to its top edge and lifted by their own
// height in CSS, so they never cover the bars they describe.
const TIP = { position: { y: 0 }, allowEscapeViewBox: { x: false, y: true }, wrapperStyle: { zIndex: 5 } }
const YAX = { tick: { fontSize: 10 }, width: 44, tickFormatter: axisTick }
const MARGIN = { top: 4, right: 4, bottom: 0, left: -6 }

/** The hour and what was counted in it, spelled out: "3 056 passengers". */
function HourTip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="kit-chart-tip">
      <b>{hourSpan(label)}</b>
      {payload.map((x) => <div key={x.dataKey}>{fmt(x.value)} {unit}</div>)}
    </div>
  )
}

/** 24 hourly values; the hours of the period at full strength. */
export const HourBars = ({ values, hours, color, unit }) => (
  <ResponsiveContainer className="kit-chart" width="100%" height={130}>
    <BarChart data={values.map((v, h) => ({ h, v }))} margin={MARGIN}>
      <XAxis dataKey="h" tickFormatter={hourLabel} interval={3} tick={{ fontSize: 10 }} />
      <YAxis {...YAX} />
      <Tooltip {...TIP} cursor={CURSOR} content={<HourTip unit={unit} />} />
      <Bar dataKey="v">
        {values.map((_, h) => (
          <Cell key={h} fill={color} fillOpacity={hours.includes(h) ? 1 : 0.28} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
)

/** Every piece in an hour, top of the stack first, the pointed one bright. */
function StackTip({ active, payload, label, pieces, focus, unit }) {
  if (!active || !payload?.length) return null
  const val = Object.fromEntries(payload.map((x) => [x.dataKey, x.value]))
  const total = pieces.reduce((a, s) => a + (s.out ? 0 : val[s.id] || 0), 0)
  return (
    <div className="kit-chart-tip stack">
      <b>{hourSpan(label)} · {unit}</b>
      {[...pieces].reverse().map((s) => (
        <div key={s.id} className={focus && focus !== s.id ? 'dim' : undefined}>
          <i style={{ background: s.fill }} />
          <span>{s.letter} {s.name}{s.out ? ` (${t('leftOut')})` : ''}</span>
          <em>{fmt(val[s.id] || 0)}</em>
        </div>
      ))}
      <div className="sum"><span>{t('total')}</span><em>{fmt(total)}</em></div>
    </div>
  )
}

/**
 * The same, stacked by the pieces of a whole, so one chart serves the whole
 * and each of its pieces: with a piece open (`current`, its id), its segments
 * stay lit and the rest fade. Hovering a segment names it and sets `hot`, and
 * is lit by it; a click picks it.
 *
 * pieces: [{ id, letter, name, values, fill, out }], bottom of the stack
 * first; an `out` piece is drawn fainter and left out of the total.
 */
export function StackedHourBars({ kind, pieces, hours, unit, current, hot, setHot, onPick }) {
  const [seg, setSeg] = useState(null)
  const focus = seg || (hot?.kind === kind ? hot.id : null)
  const lit = (id) => (!current && !focus) || id === current || id === focus
  const data = Array.from({ length: 24 }, (_, h) => Object.fromEntries(
    [['h', h], ...pieces.map((s) => [s.id, s.values[h] || 0])]))
  return (
    <ResponsiveContainer className="kit-chart" width="100%" height={140}>
      <BarChart data={data} margin={MARGIN}>
        <XAxis dataKey="h" tickFormatter={hourLabel} interval={3} tick={{ fontSize: 10 }} />
        <YAxis {...YAX} />
        <Tooltip {...TIP} cursor={CURSOR} isAnimationActive={false}
          content={<StackTip pieces={pieces} focus={focus} unit={unit} />} />
        {pieces.map((s) => (
          <Bar key={s.id} dataKey={s.id} stackId="p" isAnimationActive={false} cursor="pointer"
            onMouseEnter={() => { setSeg(s.id); if (HAS_HOVER) setHot?.({ kind, id: s.id }) }}
            onMouseLeave={() => { setSeg(null); if (HAS_HOVER) setHot?.(null) }}
            onClick={() => onPick?.(s)}>
            {data.map((_, h) => (
              <Cell key={h} fill={s.fill} stroke="var(--kit-panel)" strokeWidth={1}
                fillOpacity={(hours.includes(h) ? 1 : 0.32) * (lit(s.id) ? 1 : 0.25)
                  * (s.out ? 0.5 : 1)} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
