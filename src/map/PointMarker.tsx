import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { CircleMarker, Marker } from 'react-leaflet'
import L from 'leaflet'
import { pieSvg } from '../core/pie.js'
import type { Slice } from '../core/pie.js'

export interface PointMarkerProps {
  lat: number
  lon: number
  /** Radius, px. */
  r: number
  /** Outlined as the selected one. */
  on?: boolean
  /** Makes it a pie. Keep it in a useMemo: new slices make a new element
   *  under the mouse. */
  slices?: readonly Slice[] | null
  /** Colour of the circle, where there are no slices. */
  color?: string
  /** A circle with no value, drawn fainter. */
  empty?: boolean
  onClick?: () => void
  /** A MapTooltip. */
  tip?: ReactNode
}

/** A place on the map, as a pie or a circle. Wrap it in memo() where there
 *  are many. */
export function PointMarker({ lat, lon, r, on, slices, color, empty, onClick, tip }: PointMarkerProps) {
  const icon = useMemo(() => (slices ? L.divIcon({
    className: 'kit-pie', html: pieSvg(slices, r, on),
    iconSize: [2 * r + 6, 2 * r + 6], iconAnchor: [r + 3, r + 3],
  }) : null), [slices, r, on])
  const click = useMemo(() => ({ click: () => onClick?.() }), [onClick])
  if (icon) {
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
