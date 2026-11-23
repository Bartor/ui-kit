import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { isPhone } from '../core/media.js'
import { BASEMAPS, DEFAULT_BASEMAP } from './basemaps.js'
import type { Basemap, BasemapKey } from './basemaps.js'

export interface LatLon {
  lat: number
  lon: number
}

export interface BaseMapProps {
  /** A key of BASEMAPS, or a definition of the same shape. */
  basemap?: BasemapKey | Basemap
  /** Where the map opens. */
  center: [lat: number, lon: number]
  zoom?: number
  /** May be deeper than the basemap's own tiles, which Leaflet then scales
   *  up, for things that stand metres apart. */
  maxZoom?: number
  /** Over the map, outside Leaflet: a MapLegend, say. */
  overlay?: ReactNode
  /** Layers. */
  children?: ReactNode
}

/** A Leaflet map with its tiles. */
export function BaseMap({
  basemap = DEFAULT_BASEMAP, center, zoom = 12, maxZoom = 20, overlay, children,
}: BaseMapProps) {
  const key = typeof basemap === 'string' ? basemap : basemap.url
  const b = typeof basemap === 'string' ? BASEMAPS[basemap] : basemap
  return (
    <div className="kit-map-wrap">
      <MapContainer className={b.dark ? 'kit-map dark' : 'kit-map'}
        center={center} zoom={zoom} maxZoom={maxZoom}>
        <TileLayer key={key} url={b.url} attribution={b.attribution}
          maxZoom={maxZoom} maxNativeZoom={b.maxZoom || 19} />
        {b.labels && (
          <TileLayer key={`${key}-labels`} url={b.labels}
            pane="shadowPane" maxZoom={maxZoom} maxNativeZoom={b.maxZoom || 19} />
        )}
        {children}
      </MapContainer>
      {overlay}
    </div>
  )
}

export interface FlyToProps {
  /** Looked at again whenever it is a new object: keep it in a useMemo. */
  target: LatLon | null
  /** Zoom in at least this far. */
  zoom?: number
}

/** Brings a place into view, but only when it is off screen: recentring on
 *  something already visible is disorienting when comparing places in one
 *  area. */
export function FlyTo({ target, zoom = 15 }: FlyToProps) {
  const map = useMap()
  useEffect(() => {
    if (!target?.lat) return
    // A map with no size (hidden tab, collapsed pane) makes Leaflet's fly
    // animation compute NaN coordinates and throw, which would take the whole
    // app down with it. Nothing to fly to on an invisible map anyway.
    const size = map.getSize()
    if (!size.x || !size.y) return
    // On phones the details sheet covers the bottom of the map, so aim for
    // the middle of the strip above it. The panel may load on its own; when it
    // is not there yet, assume its full 72% height.
    const cover = isPhone()
      ? document.querySelector<HTMLElement>('.kit-details')?.offsetHeight
        || Math.round(window.innerHeight * 0.72)
      : 0
    const at = map.latLngToContainerPoint([target.lat, target.lon])
    const padX = size.x * 0.15
    const padY = (size.y - cover) * 0.15
    if (at.x > padX && at.x < size.x - padX
      && at.y > padY && at.y < size.y - cover - padY) return
    const z = Math.max(map.getZoom(), zoom)
    const center = map.unproject(map.project([target.lat, target.lon], z).add([0, cover / 2]), z)
    try {
      map.flyTo(center, z, { duration: 0.6 })
    } catch {
      map.setView(center, z)
    }
  }, [target, zoom, map])
  return null
}
