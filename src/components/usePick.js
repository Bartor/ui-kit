import { useMemo, useState } from 'react'
import { HAS_HOVER } from '../core/media'

/**
 * Picking parts of a whole, several at once: a click or tap adds or drops one,
 * and hovering previews what a click would add. Give the same `pick` to a
 * Donut, a SplitTable and ShareBars and they follow one another.
 *
 *   active   keys lit now, a hovered one included
 *   pinned   keys clicked
 *   toggle   add or drop a key
 *   on       handlers for the element that stands for a key
 */
export function usePick() {
  const [hover, setHover] = useState(null)
  const [pinned, setPinned] = useState(() => new Set())
  return useMemo(() => {
    const toggle = (key) => setPinned((p) => {
      const n = new Set(p)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
    return {
      active: HAS_HOVER && hover && !pinned.has(hover) ? new Set([...pinned, hover]) : pinned,
      pinned,
      toggle,
      on: (key) => ({
        onMouseEnter: HAS_HOVER ? () => setHover(key) : undefined,
        onMouseLeave: HAS_HOVER ? () => setHover(null) : undefined,
        onClick: () => toggle(key),
      }),
    }
  }, [hover, pinned])
}
