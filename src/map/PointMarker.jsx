import { useMemo } from 'react'
import { CircleMarker, Marker } from 'react-leaflet'
import L from 'leaflet'
import { pieSvg } from '../core/pie'

/**
 * A place on the map: a pie with `slices` [{ color, value }], a circle of
 * `color` otherwise, fainter when it has no value (`empty`). `tip` is its
 * tooltip, a react-leaflet Tooltip.
 *
 * A pie's icon is kept until its slices, size or highlight change, since a new
 * icon replaces the element under the mouse: keep `slices` in a useMemo, and
 * wrap the marker in memo() where there are many.
 */
export function PointMarker({ lat, lon, r, on, slices, color, empty, onClick, tip }) {
  const icon = useMemo(() => (slices ? L.divIcon({
    className: 'kit-pie', html: pieSvg(slices, r, on),
    iconSize: [2 * r + 6, 2 * r + 6], iconAnchor: [r + 3, r + 3],
  }) : null), [slices, r, on])
  const click = useMemo(() => ({ click: () => onClick?.() }), [onClick])
  if (slices) {
    return <Marker position={[lat, lon]} eventHandlers={click} icon={icon}>{tip}</Marker>
  }
  return (
    <CircleMarker
      center={[lat, lon]}
      radius={r}
      pathOptions={{
        color: on ? '#fff' : color,
        weight: on ? 3 : 1,
        fillColor: color,
        fillOpacity: empty ? 0.15 : 0.6,
      }}
      eventHandlers={click}
    >
      {tip}
    </CircleMarker>
  )
}
