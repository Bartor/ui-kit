const matches = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches

/** Narrow enough that the panels are bottom sheets; the stylesheet's own limit. */
export const isPhone = () => matches('(max-width: 760px)')

/** A pointer that can hover. On touch a tap would leave the hover stuck on. */
export const HAS_HOVER = matches('(hover: hover)')
export const IS_TOUCH = matches('(hover: none)')
