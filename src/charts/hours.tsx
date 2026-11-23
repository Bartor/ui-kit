import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { axisTick, fmt } from '../core/format.js'
import { hourLabel, hourSpan } from '../core/hours.js'
import type { HotProps } from '../core/link.js'
import { HAS_HOVER } from '../core/media.js'
import { t } from '../core/config.js'

const CURSOR = { fill: 'rgba(255, 255, 255, .06)' }
// Tooltips sit above the chart, pinned to its top edge and lifted by their own
// height in CSS, so they never cover the bars they describe.
const TIP = { position: { y: 0 }, allowEscapeViewBox: { x: false, y: true }, wrapperStyle: { zIndex: 5 } }
const YAX = { tick: { fontSize: 10 }, width: 44, tickFormatter: axisTick as (v: number) => string }
const MARGIN = { top: 4, right: 4, bottom: 0, left: -6 }

// what Recharts hands to a tooltip's content
interface TipContent {
  active?: boolean
  payload?: { dataKey: string; value: number }[]
  label?: number
}

/** The hour and what was counted in it, spelled out: "3 056 passengers". */
function HourTip({ active, payload, label = 0, unit }: TipContent & { unit: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="kit-chart-tip">
      <b>{hourSpan(label)}</b>
      {payload.map((x) => <div key={x.dataKey}>{fmt(x.value)} {unit}</div>)}
    </div>
  )
}

export interface HourBarsProps {
  /** 24 values, one per hour. */
  values: readonly number[]
  /** The hours of the period, drawn at full strength. */
  hours: readonly number[]
  color: string
  /** What is counted, named in the tooltip. */
  unit: string
}

/** 24 hourly values as bars. */
export const HourBars = ({ values, hours, color, unit }: HourBarsProps) => (
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

/** A piece of a stack of hourly bars. */
export interface StackPiece {
  id: string
  /** Short mark of the piece, before its name. */
  letter: string
  name: string
  /** 24 values, one per hour. */
  values: readonly number[]
  fill: string
  /** Left out of the total, and drawn fainter. */
  out?: boolean
}

interface StackTipProps extends TipContent {
  pieces: readonly StackPiece[]
  focus: string | null
  unit: string
}

/** Every piece in an hour, top of the stack first, the pointed one bright. */
function StackTip({ active, payload, label = 0, pieces, focus, unit }: StackTipProps) {
  if (!active || !payload?.length) return null
  const val: Record<string, number> = Object.fromEntries(payload.map((x) => [x.dataKey, x.value]))
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

export interface StackedHourBarsProps<P extends StackPiece> extends HotProps {
  /** The kind of the pieces, as in `hot`. */
  kind: string
  /** Bottom of the stack first. */
  pieces: readonly P[]
  /** The hours of the period, drawn at full strength. */
  hours: readonly number[]
  /** What is counted, named in the tooltip. */
  unit: string
  /** Id of the open piece: its segments stay lit and the rest fade. */
  current?: string | null
  /** A segment was clicked. */
  onPick?: (piece: P) => void
}

/**
 * Hourly bars stacked by the pieces of a whole, so one chart serves the whole
 * and each of its pieces. Hovering a segment names it and sets `hot`, and is
 * lit by it.
 */
export function StackedHourBars<P extends StackPiece>({
  kind, pieces, hours, unit, current, hot, setHot, onPick,
}: StackedHourBarsProps<P>) {
  const [seg, setSeg] = useState<string | null>(null)
  const focus = seg || (hot?.kind === kind ? hot.id : null)
  const lit = (id: string) => (!current && !focus) || id === current || id === focus
  const data = Array.from({ length: 24 }, (_, h): Record<string, number> => Object.fromEntries(
    [['h', h], ...pieces.map((s): [string, number] => [s.id, s.values[h] || 0])]))
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
