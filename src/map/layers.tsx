import type { Key, ReactNode } from 'react'
import { CircleMarker, LayerGroup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression, PathOptions } from 'leaflet'
import type { LatLon } from './BaseMap.js'

/** Groups markers, so they can be told apart by React keys. */
export const Layer = LayerGroup

/** A plain circle on the map. Add your own fields; tip and onPick get them back. */
export interface CirclePoint extends LatLon {
  key: Key
  /** Radius, px. */
  r: number
  style?: PathOptions
}

export interface CircleLayerProps<P extends CirclePoint> {
  points: readonly P[]
  /** Returns a MapTooltip. */
  tip?: (point: P) => ReactNode
  onPick?: (point: P) => void
}

export const CircleLayer = <P extends CirclePoint>({ points, tip, onPick }: CircleLayerProps<P>) => (
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
let canvas: L.Canvas | null = null
const sharedCanvas = (): L.Canvas => {
  canvas ||= L.canvas({ padding: 0.4 })
  return canvas
}

/** Flow-map line width: by square root, and wide enough to hit with a mouse,
 *  since the canvas hit-tests on the drawn width. */
const flowWidth = (v: number): number => Math.max(3, Math.min(16, 2 + Math.sqrt(v) / 28))

/** A line of a network. Add your own fields; tip gets them back. */
export interface MapLine {
  key: Key
  /** [lat, lon] pairs. */
  path: LatLngExpression[]
  /** Sets the width. */
  value: number
  color: string
}

export interface LineLayerProps<M extends MapLine> {
  lines: readonly M[]
  /** Returns a MapTooltip. */
  tip?: (line: M) => ReactNode
  opacity?: number
  /** Line width of a value, px. */
  width?: (value: number) => number
}

/** A network of lines coloured and sized by value. */
export const LineLayer = <M extends MapLine>({
  lines, tip, opacity = 0.75, width = flowWidth,
}: LineLayerProps<M>) => (
  <LayerGroup>
    {lines.map((l) => (
      <Polyline key={l.key} positions={l.path} renderer={sharedCanvas()}
        pathOptions={{ color: l.color, weight: width(l.value), opacity }}>
        {tip?.(l)}
      </Polyline>
    ))}
  </LayerGroup>
)
