import { en } from '../strings/en'

// One language per page, set once at start. Module state rather than React
// context, because the canvas cards, the map's HTML icons and the CSV writer
// need it as much as the components do.
const state = { locale: 'en-GB', strings: en }

/**
 * Set the number locale and the built-in texts; texts left out stay English.
 * Call it before the first render:
 *
 *   import { pl } from '@bartor-net/ui-kit/pl'
 *   configure({ locale: 'pl-PL', strings: pl })
 */
export function configure({ locale: l, strings } = {}) {
  if (l) state.locale = l
  if (strings) state.strings = { ...en, ...strings }
}

export const locale = () => state.locale

/** A built-in text; the ones with parts to fill in are functions. */
export function t(key, ...args) {
  const s = state.strings[key]
  return typeof s === 'function' ? s(...args) : s
}
