import { memo, useMemo, useState } from 'react'
import { Marker, Pane, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { BoxSize } from '../core/pie.js'

/** A permanent label beside a marker. */
export interface MapLabel {
  key: string
  lat: number
  lon: number
  /** Radius of the marker it stands beside, px. */
  r: number
  /** From labelHtml(). */
  html: string
  /** From labelBox(). */
  box: BoxSize
  /** Decides who stays where labels would overlap. */
  weight: number
}

export interface MapLabelsProps {
  entries: readonly MapLabel[]
  /** Skip labels that would overlap a heavier one; zooming in brings them back. */
  declutter?: boolean
}

interface Box extends BoxSize {
  x: number
  y: number
}

/** Permanent labels beside markers. */
export function MapLabels({ entries, declutter }: MapLabelsProps) {
  const map = useMap()
  const [view, setView] = useState(0)
  useMapEvents({ zoomend: () => setView((v) => v + 1), moveend: () => setView((v) => v + 1) })

  const placed = useMemo(() => {
    const size = map.getSize()
    const taken: Box[] = []
    const out: MapLabel[] = []
    const sorted = [...entries].sort((a, b) => b.weight - a.weight)
    for (const e of sorted) {
      const pt = map.latLngToContainerPoint([e.lat, e.lon])
      const box = { x: pt.x + e.r + 5, y: pt.y - e.box.h / 2, w: e.box.w, h: e.box.h }
      if (box.x > size.x || box.x + box.w < 0 || box.y > size.y || box.y + box.h < 0) continue
      if (declutter && taken.some((o) => box.x < o.x + o.w && o.x < box.x + box.w
        && box.y < o.y + o.h && o.y < box.y + box.h)) continue
      taken.push(box)
      out.push(e)
    }
    return out
    // `view` is a dependency on purpose: positions change on every pan and zoom
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, declutter, view, map])

  // Their own pane, above every marker: a label is read on top of the symbols
  // it sits beside, never under them. Below tooltips.
  return (
    <Pane name="kit-labels" style={{ zIndex: 620, pointerEvents: 'none' }}>
      {placed.map((e) => <Label key={e.key} e={e} />)}
    </Pane>
  )
}

/** One label. Its icon is rebuilt only when its text or offset change: a new
 *  icon makes Leaflet replace the element, and every pan would re-place them
 *  all. */
const Label = memo(function Label({ e }: { e: MapLabel }) {
  const icon = useMemo(() => L.divIcon({
    className: 'kit-label', html: e.html,
    iconSize: [e.box.w, e.box.h], iconAnchor: [-(e.r + 5), e.box.h / 2],
  }), [e.html, e.box.w, e.box.h, e.r])
  return (
    <Marker position={[e.lat, e.lon]} interactive={false} keyboard={false}
      pane="kit-labels" icon={icon} />
  )
})
