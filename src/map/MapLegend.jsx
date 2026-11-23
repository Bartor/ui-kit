import { useState } from 'react'
import { isPhone } from '../core/media'
import { t } from '../core/config'

/**
 * Colour key in the corner of the map; folds away, and starts folded on a
 * phone, where it would cover the map. items, top to bottom:
 *
 *   { title }                 a heading
 *   { label, color, line }    a colour, as a dot or a line
 *   { note }                  what colour cannot show - what size means, say
 */
export function MapLegend({ items }) {
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
        if (x.title) return <b key={x.title}>{x.title}</b>
        if (x.note) return <span key={x.note} className="kit-legend-note">{x.note}</span>
        return (
          <span key={x.label}>
            <i className={x.line ? 'line' : undefined} style={{ background: x.color }} />{x.label}
          </span>
        )
      })}
    </div>
  )
}
