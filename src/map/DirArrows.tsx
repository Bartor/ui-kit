import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { ARROWS_SIZE, arrowsSvg } from '../core/pie.js'
import { bearingOf } from '../core/directions.js'
import type { Direction } from '../core/directions.js'
import type { Hot } from '../core/link.js'
import type { LatLon } from './BaseMap.js'

export interface DirArrowsProps extends LatLon {
  /** Ways of travel, as in DirectionSplit. */
  dirs: readonly Direction[]
  /** One of them, at full strength; the others fade. */
  lit?: Direction
}

/** Ways of travel as arrows around a point, under its marker and out of the
 *  mouse's way. */
export function DirArrows({ lat, lon, dirs, lit }: DirArrowsProps) {
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

export interface HotArrowsProps {
  hot?: Hot | null
  /** Where the hot thing is and which ways it goes; null for none. */
  find: (hot: Hot) => (LatLon & { dirs?: readonly Direction[] }) | null | undefined
}

/** The arrows of the hot thing, where it is drawn as a marker of its own. */
export function HotArrows({ hot, find }: HotArrowsProps) {
  const at = hot && find(hot)
  if (!at?.lat) return null
  return <DirArrows lat={at.lat} lon={at.lon} dirs={at.dirs || []} lit={hot?.dir} />
}
