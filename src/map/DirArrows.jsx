import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { ARROWS_SIZE, arrowsSvg } from '../core/pie'
import { bearingOf } from '../core/directions'

/** Ways of travel as arrows around a point, under its marker and out of the
 *  mouse's way. `dirs` are keys as in DirectionSplit; with `lit` one of them,
 *  the others fade. */
export function DirArrows({ lat, lon, dirs, lit }) {
  // a string, so that an equal list does not make a new icon
  const keys = dirs.join()
  const icon = useMemo(() => {
    const list = keys.split(',')
    return L.divIcon({
      className: 'kit-arrows', html: arrowsSvg(list.map(bearingOf), lit ? list.indexOf(lit) : -1),
      iconSize: [ARROWS_SIZE, ARROWS_SIZE], iconAnchor: [ARROWS_SIZE / 2, ARROWS_SIZE / 2],
    })
  }, [keys, lit])
  if (!keys) return null
  return <Marker position={[lat, lon]} icon={icon} interactive={false} keyboard={false}
    zIndexOffset={900} />
}

/** The arrows of the hot thing, where it is drawn as a marker of its own.
 *  `find` gets `hot` and returns { lat, lon, dirs }, or null for none. */
export function HotArrows({ hot, find }) {
  const at = hot && find(hot)
  if (!at?.lat) return null
  return <DirArrows lat={at.lat} lon={at.lon} dirs={at.dirs || []} lit={hot.dir} />
}
