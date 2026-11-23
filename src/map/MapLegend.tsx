import { useState } from 'react'
import { isPhone } from '../core/media.js'
import { t } from '../core/config.js'

/** A row of the legend: a heading, a colour, or a note on what colour cannot
 *  show - what size means, say. */
export type LegendItem =
  | { title: string }
  | { label: string; color: string; /** A line rather than a dot. */ line?: boolean }
  | { note: string }

export interface MapLegendProps {
  /** Top to bottom; with none, there is no legend. */
  items: readonly LegendItem[]
}

/** Colour key in the corner of the map; folds away, and starts folded on a
 *  phone, where it would cover the map. */
export function MapLegend({ items }: MapLegendProps) {
  const [open, setOpen] = useState(() => !isPhone())
  if (!items.length) return null
  if (!open) {
    return (
      <button type="button" className="kit-map-legend closed" onClick={() => setOpen(true)}>
        {t('legend')}
      </button>
    )
  }
  return (
    <div className="kit-map-legend">
      <button type="button" className="kit-legend-close" aria-label={t('foldLegend')}
        onClick={() => setOpen(false)}>×</button>
      {items.map((x) => {
        if ('title' in x) return <b key={x.title}>{x.title}</b>
        if ('note' in x) return <span key={x.note} className="kit-legend-note">{x.note}</span>
        return (
          <span key={x.label}>
            <i className={x.line ? 'line' : undefined} style={{ background: x.color }} />{x.label}
          </span>
        )
      })}
    </div>
  )
}
