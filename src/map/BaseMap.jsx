import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { isPhone } from '../core/media'
import { BASEMAPS, DEFAULT_BASEMAP } from './basemaps'

/**
 * A Leaflet map on one of the BASEMAPS, or on a definition of the same shape.
 * Layers go in as children; `overlay` sits over the map, outside Leaflet.
 *
 * Zooms past the basemap's own tiles, which Leaflet then scales up, for things
 * that stand metres apart.
 */
export function BaseMap({
  basemap = DEFAULT_BASEMAP, center, zoom = 12, maxZoom = 20, overlay, children,
}) {
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

/**
 * Brings a place into view, but only when it is off screen: recentring on
 * something already visible is disorienting when comparing places in one area.
 * Looks again whenever `target`, { lat, lon } or null, is a new object - keep
 * it in a useMemo.
 */
export function FlyTo({ target, zoom = 15 }) {
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
      ? document.querySelector('.kit-details')?.offsetHeight || Math.round(window.innerHeight * 0.72)
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
