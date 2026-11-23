import { en } from '../strings/en.js'
import type { Strings } from '../strings/types.js'

// One language per page, set once at start. Module state rather than React
// context, because the canvas cards, the map's HTML icons and the CSV writer
// need it as much as the components do.
const state: { locale: string; strings: Strings } = { locale: 'en-GB', strings: en }

export interface Config {
  /** How numbers are written, as a BCP 47 tag: 'pl-PL'. English (en-GB) unless set. */
  locale?: string
  /** Built-in texts; the ones left out stay English. */
  strings?: Partial<Strings>
}

/**
 * Set the number locale and the built-in texts. Call it before the first
 * render:
 *
 *     import { pl } from '@bartor-net/ui-kit/pl'
 *     configure({ locale: 'pl-PL', strings: pl })
 */
export function configure({ locale: l, strings }: Config = {}): void {
  if (l) state.locale = l
  if (strings) state.strings = { ...en, ...strings }
}

export const locale = (): string => state.locale

type Filled = (...args: never[]) => string
type Args<K extends keyof Strings> = Strings[K] extends (...args: infer A) => string ? A : []
type Text<K extends keyof Strings> = Strings[K] extends Filled ? string : Strings[K]

/** A built-in text, filled in. */
export function t<K extends keyof Strings>(key: K, ...args: Args<K>): Text<K> {
  const s = state.strings[key]
  return (typeof s === 'function' ? (s as Filled)(...(args as never[])) : s) as Text<K>
}
