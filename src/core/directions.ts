/** A direction of travel as a "from>to" compass key: "W>E" is heading east. */
export type Direction = string

const ARROW: Record<string, string> = {
  N: '↑', S: '↓', E: '→', W: '←', NE: '↗', NW: '↖', SE: '↘', SW: '↙',
}
const OPPOSITE: Record<string, string> = {
  N: 'S', S: 'N', E: 'W', W: 'E', NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW',
}
const BEARING: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
}

/** The key for a record of where people came from: "E" is someone heading west. */
export const cameFrom = (side: string): Direction => (OPPOSITE[side] ? `${side}>${OPPOSITE[side]}` : side)

/** Where a direction points, in degrees from north; undefined if it has no compass end. */
export const bearingOf = (d: Direction): number | undefined => BEARING[d.split('>')[1]]

/** "W>E" -> "→"; empty if it has no compass end. */
export const dirArrow = (d: Direction): string => ARROW[d.includes('>') ? d.split('>')[1] : d] || ''

/** "W>E" -> "→ W → E". */
export const dirLabel = (d: Direction): string => `${dirArrow(d)} ${d.replace('>', ' → ')}`.trim()
