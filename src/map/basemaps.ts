import { t } from '../core/config.js'
import type { SelectOption } from '../components/controls.js'

export interface Basemap {
  /** Tile address, with {z}, {x}, {y} and optionally {s} and {r}. */
  url: string
  /** Tiles of labels, drawn over the base. */
  labels?: string
  /** HTML. */
  attribution: string
  dark: boolean
  /** The deepest zoom the tiles exist at; deeper ones are scaled up. */
  maxZoom: number
}

export type BasemapKey = 'darkGray' | 'darkGrayPlain' | 'lightGray' | 'black' | 'osm'

// The data layers are the point, so the basemap has to stay quiet and still be
// legible. CARTO's dark styles are near-black (median tile luminance ~9/255),
// which reads as a void behind the data; Esri's Dark Gray Canvas sits around 75
// and is purpose-built for exactly this, with street labels as a separate
// overlay you can switch off.
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
const ESRI_ATTR = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const CARTO_ATTR = `${OSM_ATTR} &copy; <a href="https://carto.com/attributions">CARTO</a>`

export const BASEMAPS: Record<BasemapKey, Basemap> = {
  darkGray: {
    url: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    labels: `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
    attribution: ESRI_ATTR, dark: true, maxZoom: 16,
  },
  darkGrayPlain: {
    url: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    attribution: ESRI_ATTR, dark: true, maxZoom: 16,
  },
  lightGray: {
    url: `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    labels: `${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
    attribution: ESRI_ATTR, dark: false, maxZoom: 16,
  },
  black: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTR, dark: true, maxZoom: 19,
  },
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_ATTR, dark: false, maxZoom: 19,
  },
}

export const DEFAULT_BASEMAP: BasemapKey = 'darkGray'

/** The basemaps as options of a Select. */
export const basemapOptions = (): SelectOption<BasemapKey>[] => (Object.keys(BASEMAPS) as BasemapKey[])
  .map((value) => ({ value, label: t('basemaps')[value] || value }))
