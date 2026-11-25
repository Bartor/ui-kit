import { useMemo, useState } from 'react'
import type { CSSProperties, Key, ReactNode } from 'react'
import { pressable } from '../core/link.js'
import { t } from '../core/config.js'
import { Swatch } from './text.js'

const cx = (...c: (string | false | null | undefined)[]): string => c.filter(Boolean).join(' ')

/** A custom property, which React's own style type does not know. */
const vars = (v: Record<`--${string}`, string>) => v as CSSProperties

export interface HelpButtonProps {
  open: boolean
  onClick: () => void
}

/** "?" that reveals an explanation, so caveats stay one click away instead of
 *  burying the controls under paragraphs. */
export function HelpButton({ open, onClick }: HelpButtonProps) {
  return (
    <button type="button" className={open ? 'kit-help-btn on' : 'kit-help-btn'}
      aria-expanded={open} aria-label={t('help')} title={t('help')} onClick={onClick}>
      ?
    </button>
  )
}

export interface PanelProps {
  title: ReactNode
  /** Behind a "?"; paragraphs. */
  help?: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  /** Beside the title of a collapsible one. */
  badge?: ReactNode
  /** About to unfold: time to load what is inside. */
  onOpen?: () => void
  children?: ReactNode
}

/** A titled card of the sidebar, with an optional "?" and folding. */
export function Panel({
  title, help, collapsible = false, defaultOpen = true, badge, onOpen, children,
}: PanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [showHelp, setShowHelp] = useState(false)
  return (
    <section className={collapsible ? 'kit-panel collapsible' : 'kit-panel'}>
      <div className="kit-panel-head">
        {collapsible ? (
          <button type="button" className="kit-collapse" aria-expanded={open}
            onClick={() => { if (!open) onOpen?.(); setOpen(!open) }}>
            <span className={open ? 'kit-chevron open' : 'kit-chevron'}>▸</span>
            <h2>{title}</h2>
            {badge != null && <span className="kit-badge">{badge}</span>}
          </button>
        ) : <h2>{title}</h2>}
        {help && <HelpButton open={showHelp} onClick={() => setShowHelp(!showHelp)} />}
      </div>
      {showHelp && <div className="kit-info">{help}</div>}
      {open && <div className="kit-panel-body">{children}</div>}
    </section>
  )
}

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  /** A colour makes it a layer: a checkbox filled with it, which doubles as
   *  its legend. Without one it is a setting, drawn as a switch. */
  swatch?: string
  /** At the end of the row. */
  count?: ReactNode
  /** Behind a "?". */
  help?: ReactNode
  /** Under the row. */
  children?: ReactNode
}

/** An on/off row. */
export function Toggle({ checked, onChange, label, swatch, count, help, children }: ToggleProps) {
  const [showHelp, setShowHelp] = useState(false)
  return (
    <div className="kit-toggle">
      <div className="kit-toggle-row">
        <label>
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
            className={swatch ? 'kit-check' : 'kit-switch'}
            style={swatch ? vars({ '--c': swatch }) : undefined} />
          <span>{label}</span>
          {count != null && <b>{count}</b>}
        </label>
        {help && <HelpButton open={showHelp} onClick={() => setShowHelp(!showHelp)} />}
      </div>
      {showHelp && <div className="kit-info">{help}</div>}
      {children}
    </div>
  )
}

export interface PairProps {
  children?: ReactNode
}

/** Toggles side by side. */
export const Pair = ({ children }: PairProps) => <div className="kit-pair">{children}</div>

export interface FieldProps {
  label: ReactNode
  /** Behind a "?". */
  help?: ReactNode
  children?: ReactNode
}

/** A labelled control (select, slider). */
export function Field({ label, help, children }: FieldProps) {
  const [showHelp, setShowHelp] = useState(false)
  return (
    <div className="kit-field">
      <div className="kit-field-head">
        <span>{label}</span>
        {help && <HelpButton open={showHelp} onClick={() => setShowHelp(!showHelp)} />}
      </div>
      {showHelp && <div className="kit-info">{help}</div>}
      {children}
    </div>
  )
}

export interface SelectOption<V extends string = string> {
  value: V
  label: string
  disabled?: boolean
}

export interface SelectProps<V extends string = string> {
  value: V
  onChange: (value: V) => void
  // the value says what V is; an option that does not fit it is the error
  options: readonly SelectOption<NoInfer<V>>[]
  /** Accessible name. */
  label?: string
  disabled?: boolean
}

export const Select = <V extends string = string>({
  value, onChange, options, label, disabled,
}: SelectProps<V>) => (
  <select className="kit-select" value={value} aria-label={label} disabled={disabled}
    onChange={(e) => onChange(e.target.value as V)}>
    {options.map((o) => (
      <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
    ))}
  </select>
)

export interface SliderProps {
  value: number
  min: number | string
  max: number | string
  step?: number | string
  onChange: (value: number) => void
  /** Accessible name. */
  label?: string
  /** A visible label above it. */
  caption?: ReactNode
  /** Greyed: present but not in effect. */
  idle?: boolean
  /** Values marked under the track. */
  ticks?: readonly number[]
}

/** A range input. */
export function Slider({
  value, min, max, step, onChange, label, caption, idle, ticks,
}: SliderProps) {
  const lo = Number(min)
  const hi = Number(max)
  // the filled part is drawn from --pct, since only Firefox can style a
  // range's progress natively
  const at = hi > lo ? ((Number(value) - lo) / (hi - lo)) * 100 : 0
  const range = (
    <div className={idle ? 'kit-range-wrap idle' : 'kit-range-wrap'}>
      <input type="range" className="kit-range" value={value} min={min} max={max} step={step}
        aria-label={label} style={vars({ '--pct': `${at}%` })}
        onChange={(e) => onChange(Number(e.target.value))} />
      {ticks && (
        <div className="kit-range-ticks" aria-hidden="true">
          {ticks.map((v) => (
            // thumb centres travel between 9px and (width - 9px)
            <span key={v} style={{ left: `calc(9px + (100% - 18px) * ${(v - lo) / (hi - lo)})` }}>
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  )
  if (!caption) return range
  return <label className="kit-slider"><span>{caption}</span>{range}</label>
}

export interface ChipItem<K extends string = string> {
  key: K
  label: ReactNode
  on?: boolean
  /** A dot before the label. */
  color?: string
  /** Tooltip. */
  title?: string
}

export interface ChipsProps<K extends string = string> {
  items: readonly ChipItem<K>[]
  onPick: (key: K) => void
  /** Closer to what is above. */
  tight?: boolean
  /** Smaller pills, for a panel. */
  small?: boolean
  /** Accessible name of the group. */
  label?: string
}

/** Pills to press. */
export const Chips = <K extends string = string>({ items, onPick, tight, small, label }: ChipsProps<K>) => (
  <div className={cx('kit-chips', tight && 'tight', small && 'small')}
    role={label ? 'group' : undefined} aria-label={label}>
    {items.map((c) => (
      <button key={c.key} type="button" className={c.on ? 'kit-chip on' : 'kit-chip'}
        aria-pressed={!!c.on} title={c.title} onClick={() => onPick(c.key)}>
        {c.color && <i style={{ background: c.color }} />}
        {c.label}
      </button>
    ))}
  </div>
)

export interface SettingProps {
  label: ReactNode
  children?: ReactNode
}

/** A control with its label beside it, for a panel. */
export const Setting = ({ label, children }: SettingProps) => (
  <div className="kit-setting">
    <span>{label}</span>
    {children}
  </div>
)

export interface RadioCard<V extends string = string> {
  value: V
  label: ReactNode
  sub?: ReactNode
  /** Any CSS background: a colour, or a conic gradient for a pie. */
  color?: string
  count?: ReactNode
}

export interface RadioCardsProps<V extends string = string> {
  /** Accessible name of the group. */
  label?: string
  /** Name of the inputs, unique on the page. */
  name: string
  value: V
  onChange: (value: V) => void
  options: readonly RadioCard<NoInfer<V>>[]
}

/** One choice of a few, as cards. */
export const RadioCards = <V extends string = string>({
  label, name, value, onChange, options,
}: RadioCardsProps<V>) => (
  <div className="kit-cards" role="radiogroup" aria-label={label}>
    {options.map((o) => (
      <label key={o.value} className={cx('kit-card', value === o.value && 'on')}>
        <input type="radio" name={name} checked={value === o.value}
          onChange={() => onChange(o.value)} />
        <i className="kit-card-mark" style={{ background: o.color }} />
        <span className="kit-card-text">
          <b>{o.label}</b>
          <em>{o.sub}</em>
        </span>
        {o.count != null && <small>{o.count}</small>}
      </label>
    ))}
  </div>
)

/** Something found. Add your own fields; onPick gets them back. */
export interface SearchResult {
  key: Key
  label: ReactNode
  sub?: ReactNode
  color?: string
}

export interface SearchBoxProps<R extends SearchResult> {
  /** Gets the lower-cased text. Keep it stable (useCallback): it runs again
   *  when it changes. */
  search: (text: string) => readonly R[]
  onPick: (result: R) => void
  /** Accessible name. */
  label?: string
  placeholder?: string
  /** Characters before it searches. */
  min?: number
}

/** Search as you type, pinned to the top of the sidebar. */
export function SearchBox<R extends SearchResult>({
  search, onPick, label, placeholder, min = 2,
}: SearchBoxProps<R>) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const ready = needle.length >= min
  const results = useMemo<readonly R[]>(() => (ready ? search(needle) : []), [ready, needle, search])
  const pick = (r: R) => {
    onPick(r)
    setQ('')
  }
  return (
    <div className="kit-search">
      <input type="text" value={q} aria-label={label} placeholder={placeholder}
        onChange={(e) => setQ(e.target.value)} />
      {results.length > 0 && (
        <ul className="kit-search-results">
          {results.map((r) => (
            <li key={r.key} {...pressable(() => pick(r))}>
              {r.color && <Swatch color={r.color} />}
              <span>{r.label}</span><em>{r.sub}</em>
            </li>
          ))}
        </ul>
      )}
      {ready && !results.length && <p className="kit-hint">{t('noMatches')}</p>}
    </div>
  )
}
