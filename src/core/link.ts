import type { KeyboardEvent, PointerEvent } from 'react'

/**
 * Linked highlighting. Whatever is under the mouse - a tree row, a chart
 * segment, a dot on the map - is one shared value, kept by the app and passed
 * around as `hot` and `setHot`. Every component that shows a thing lights it
 * up while it is the hot one.
 */
export interface Hot {
  /** What sort of thing it is: 'road', say. */
  kind: string
  id: string
  /** One direction of it, where the thing has directions. */
  dir?: string
}

export type SetHot = (hot: Hot | null) => void

/** The props of a component that takes part in linked highlighting. */
export interface HotProps {
  hot?: Hot | null
  setHot?: SetHot
}

export const isHot = (hot: Pick<Hot, 'kind' | 'id'> | null | undefined, kind: string, id: string): boolean =>
  hot?.kind === kind && hot.id === id

/** Key of a thing in a Set: the pieces left out of a total, say. */
export const pieceKey = (kind: string, id: string): string => `${kind}:${id}`

/** Handlers that make an element set `hot` - for a mouse only: on touch a tap
 *  would leave it lit. */
export const hoverProps = (setHot: SetHot | undefined, target: Hot) => (setHot ? {
  onPointerEnter: (e: PointerEvent) => { if (e.pointerType === 'mouse') setHot(target) },
  onPointerLeave: (e: PointerEvent) => { if (e.pointerType === 'mouse') setHot(null) },
} : {})

/** Makes a non-button clickable by mouse and by keyboard. */
export const pressable = (fn: () => void) => ({
  role: 'button',
  tabIndex: 0,
  onClick: fn,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() }
  },
})
