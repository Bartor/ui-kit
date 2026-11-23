// Directions of travel are "from>to" compass keys: "W>E" is heading east.

const ARROW = { N: '↑', S: '↓', E: '→', W: '←', NE: '↗', NW: '↖', SE: '↘', SW: '↙' }
const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E', NE: 'SW', SW: 'NE', NW: 'SE', SE: 'NW' }
const BEARING = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }

/** The key for a record of where people came from: "E" is someone heading west. */
export const cameFrom = (d) => (OPPOSITE[d] ? `${d}>${OPPOSITE[d]}` : d)

/** Where a direction points, in degrees from north; undefined if it has no compass end. */
export const bearingOf = (d) => BEARING[d.split('>')[1]]

/** "W>E" -> "→ W → E". */
export const dirLabel = (d) => {
  const to = d.includes('>') ? d.split('>')[1] : d
  return `${ARROW[to] || ''} ${d.replace('>', ' → ')}`.trim()
}
