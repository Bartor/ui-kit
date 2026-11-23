import { CircleMarker, LayerGroup, Polyline } from 'react-leaflet'
import L from 'leaflet'

/** Groups markers, so they can be told apart by React keys. */
export const Layer = LayerGroup

/** Plain circles. points: [{ key, lat, lon, r, style, ref }], style as Leaflet
 *  path options; `tip` gets a point and returns a react-leaflet Tooltip. */
export const CircleLayer = ({ points, tip, onPick }) => (
  <LayerGroup>
    {points.map((p) => (
      <CircleMarker key={p.key} center={[p.lat, p.lon]} radius={p.r} pathOptions={p.style}
        eventHandlers={onPick ? { click: () => onPick(p) } : undefined}>
        {tip?.(p)}
      </CircleMarker>
    ))}
  </LayerGroup>
)

// Thousands of polylines: SVG would choke, so lines are drawn on a canvas.
let canvas = null
const sharedCanvas = () => {
  canvas ||= L.canvas({ padding: 0.4 })
  return canvas
}

/** Flow-map line width: by square root, and wide enough to hit with a mouse,
 *  since the canvas hit-tests on the drawn width. */
const flowWidth = (v) => Math.max(3, Math.min(16, 2 + Math.sqrt(v) / 28))

/** A network of lines coloured and sized by value. lines: [{ key, path, value,
 *  color, ref }], path as [[lat, lon], ...]. */
export const LineLayer = ({ lines, tip, opacity = 0.75, width = flowWidth }) => (
  <LayerGroup>
    {lines.map((l) => (
      <Polyline key={l.key} positions={l.path} renderer={sharedCanvas()}
        pathOptions={{ color: l.color, weight: width(l.value), opacity }}>
        {tip?.(l)}
      </Polyline>
    ))}
  </LayerGroup>
)
