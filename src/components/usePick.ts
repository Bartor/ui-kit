import { useMemo, useState } from 'react'
import { HAS_HOVER } from '../core/media.js'

export interface PickState {
  /** Keys lit now, a hovered one included. */
  active: ReadonlySet<string>
  /** Keys clicked. */
  pinned: ReadonlySet<string>
  /** Add or drop a key. */
  toggle: (key: string) => void
  /** Handlers for the element that stands for a key. */
  on: (key: string) => {
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    onClick?: () => void
  }
}

/**
 * Picking parts of a whole, several at once: a click or tap adds or drops one,
 * and hovering previews what a click would add. Give the same `pick` to a
 * Donut, a SplitTable and ShareBars and they follow one another.
 */
export function usePick(): PickState {
  const [hover, setHover] = useState<string | null>(null)
  const [pinned, setPinned] = useState<ReadonlySet<string>>(() => new Set())
  return useMemo(() => {
    const toggle = (key: string) => setPinned((p) => {
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
