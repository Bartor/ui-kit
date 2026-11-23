/**
 * Linked highlighting. Whatever is under the mouse - a tree row, a chart
 * segment, a dot on the map - is one shared value, { kind, id, dir? } or null,
 * kept by the app and passed around as `hot` and `setHot`. Every component
 * that shows a thing lights it up while it is the hot one.
 */
export const isHot = (hot, kind, id) => hot?.kind === kind && hot.id === id

/** Key of a thing in a Set: the pieces left out of a total, say. */
export const pieceKey = (kind, id) => `${kind}:${id}`

/** Handlers that make an element set `hot` - for a mouse only: on touch a tap
 *  would leave it lit. */
export const hoverProps = (setHot, target) => (setHot ? {
  onPointerEnter: (e) => e.pointerType === 'mouse' && setHot(target),
  onPointerLeave: (e) => e.pointerType === 'mouse' && setHot(null),
} : {})

/** Makes a non-button clickable by mouse and by keyboard. */
export const pressable = (fn) => ({
  role: 'button',
  tabIndex: 0,
  onClick: fn,
  onKeyDown: (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() }
  },
})
