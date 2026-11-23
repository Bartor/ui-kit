import { useEffect, useMemo, useRef, useState } from 'react'
import { LayerGroup, Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { HAS_HOVER } from '../core/media'
import { isHot, pieceKey } from '../core/link'
import { escapeHtml } from '../core/pie'
import { DirArrows } from './DirArrows'

const DOT = 22 // px

/**
 * Nudge dots, in screen pixels, until none sits under the whole's marker or on
 * another dot: a dot you cannot see or click is worse than one drawn a few
 * metres off. Done in pixels, so it holds at every zoom.
 */
function dodge(map, whole, wholeR, dots) {
  const c = map.latLngToLayerPoint([whole.lat, whole.lon])
  const clear = wholeR + DOT / 2 + 4
  const pts = dots.map((d, i) => {
    const p = map.latLngToLayerPoint([d.lat, d.lon])
    // straight out from the whole; dots right on top of it fan out by index
    let v = p.subtract(c)
    if (v.x * v.x + v.y * v.y < 1) {
      const a = (2 * Math.PI * i) / dots.length - Math.PI / 2
      v = L.point(Math.cos(a), Math.sin(a))
    }
    const len = Math.hypot(v.x, v.y)
    return len < clear ? c.add(v.multiplyBy(clear / len)) : p
  })
  // a few passes pushing overlapping dots apart
  for (let pass = 0; pass < 8; pass++) {
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const v = pts[j].subtract(pts[i])
        const d = Math.hypot(v.x, v.y)
        if (d >= DOT + 2) continue
        const u = d < 0.5 ? L.point(1, 0) : v.multiplyBy(1 / d)
        const push = u.multiplyBy((DOT + 2 - d) / 2)
        pts[i] = pts[i].subtract(push)
        pts[j] = pts[j].add(push)
        moved = true
      }
    }
    if (!moved) break
  }
  return dots.map((d, i) => {
    const ll = map.layerPointToLatLng(pts[i])
    return { ...d, lat: ll.lat, lon: ll.lng }
  })
}

/**
 * The pieces of a selected whole, each at its own place and tied to it by a
 * line. whole { lat, lon }, wholeR its marker's radius in pixels.
 *
 * pieces: [{ kind, id, target, lat, lon, color, letter, square, on, out, dirs,
 * tip }] - `square` shapes the dot, `on` marks the open piece, `out` one left
 * out of the whole, `dirs` are its ways of travel, drawn while it is hot, and
 * `tip` is its tooltip's text. onPick gets { kind, id, ref: target }.
 */
export function PieceDots({ whole, wholeR = 10, pieces, hot, setHot, onPick }) {
  const map = useMap()
  // re-place on zoom: the dodge is in pixels
  const [, setZoom] = useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })
  if (!whole) return null
  return (
    <LayerGroup>
      {dodge(map, whole, wholeR, pieces).map((p) => (
        <PieceDot key={pieceKey(p.kind, p.id)} {...p} whole={whole}
          hot={isHot(hot, p.kind, p.id)} hotDir={hot?.dir}
          onPick={onPick} setHot={setHot} />
      ))}
    </LayerGroup>
  )
}

/** One piece. The icon is kept while only the hover changes: a new icon is a
 *  new element under the mouse, which fires mouseout and mouseover again and
 *  flickers. Hover is a class instead. */
function PieceDot({
  kind, id, target, lat, lon, color, letter, square, on, out, dirs, tip, whole,
  hot, hotDir, onPick, setHot,
}) {
  const icon = useMemo(() => L.divIcon({
    className: 'kit-dot-icon',
    html: `<span class="kit-dot${square ? ' square' : ''}${on ? ' on' : ''}${out ? ' out' : ''}" `
      + `style="--c:${color}">${escapeHtml(letter)}</span>`,
    iconSize: [DOT, DOT], iconAnchor: [DOT / 2, DOT / 2],
  }), [square, on, out, color, letter])
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.getElement()?.querySelector('.kit-dot')?.classList.toggle('hot', hot)
  }, [hot, icon])
  const handlers = useMemo(() => ({
    click: () => onPick({ kind, id, ref: target }),
    ...(HAS_HOVER && setHot ? {
      mouseover: () => setHot({ kind, id }),
      mouseout: () => setHot(null),
    } : {}),
  }), [kind, id, target, onPick, setHot])
  return (
    <>
      <Polyline positions={[[whole.lat, whole.lon], [lat, lon]]} interactive={false}
        pathOptions={{
          color, weight: hot ? 2.5 : 1.5, opacity: hot ? 1 : out ? 0.2 : 0.7, dashArray: '3 4',
        }} />
      <Marker ref={ref} position={[lat, lon]} zIndexOffset={1000} eventHandlers={handlers} icon={icon}>
        {tip && <Tooltip>{tip}</Tooltip>}
      </Marker>
      {hot && dirs && <DirArrows lat={lat} lon={lon} dirs={dirs} lit={hotDir} />}
    </>
  )
}
