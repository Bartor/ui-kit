import { useMemo, useState } from 'react'
import { pressable } from '../core/link'
import { t } from '../core/config'
import { Swatch } from './text'

const cx = (...c) => c.filter(Boolean).join(' ')

/** "?" that reveals an explanation, so caveats stay one click away instead of
 *  burying the controls under paragraphs. */
export function HelpButton({ open, onClick }) {
  return (
    <button type="button" className={open ? 'kit-help-btn on' : 'kit-help-btn'}
      aria-expanded={open} aria-label={t('help')} title={t('help')} onClick={onClick}>
      ?
    </button>
  )
}

/** A titled card of the sidebar, with an optional "?" and folding. */
export function Panel({
  title, help, collapsible = false, defaultOpen = true, badge, onOpen, children,
}) {
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

/**
 * An on/off row with its own optional "?". With a `swatch` colour it is a
 * layer: a checkbox filled with that colour, which doubles as its legend.
 * Without one it is a setting, drawn as a switch.
 */
export function Toggle({ checked, onChange, label, swatch, count, help, children }) {
  const [showHelp, setShowHelp] = useState(false)
  return (
    <div className="kit-toggle">
      <div className="kit-toggle-row">
        <label>
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
            className={swatch ? 'kit-check' : 'kit-switch'}
            style={swatch ? { '--c': swatch } : undefined} />
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

/** Toggles side by side. */
export const Pair = ({ children }) => <div className="kit-pair">{children}</div>

/** A labelled control (select, slider) with its own optional "?". */
export function Field({ label, help, children }) {
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

/** options: [{ value, label, disabled }]. */
export const Select = ({ value, onChange, options, label, disabled }) => (
  <select className="kit-select" value={value} aria-label={label} disabled={disabled}
    onChange={(e) => onChange(e.target.value)}>
    {options.map((o) => (
      <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
    ))}
  </select>
)

/**
 * A styled range input. The filled part of the track is drawn from --pct,
 * since only Firefox can style a range's progress natively. `idle` greys it
 * out for a control that is present but not in effect; `caption` labels it.
 */
export function Slider({
  value, min, max, step, onChange, label, caption, idle, ticks,
}) {
  const lo = Number(min)
  const hi = Number(max)
  const at = hi > lo ? ((Number(value) - lo) / (hi - lo)) * 100 : 0
  const range = (
    <div className={idle ? 'kit-range-wrap idle' : 'kit-range-wrap'}>
      <input type="range" className="kit-range" value={value} min={min} max={max} step={step}
        aria-label={label} style={{ '--pct': `${at}%` }}
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

/** Pills to press. items: [{ key, label, on }]. */
export const Chips = ({ items, onPick, tight }) => (
  <div className={tight ? 'kit-chips tight' : 'kit-chips'}>
    {items.map((c) => (
      <button key={c.key} type="button" className={c.on ? 'kit-chip on' : 'kit-chip'}
        onClick={() => onPick(c.key)}>{c.label}</button>
    ))}
  </div>
)

/**
 * One choice of a few, as cards. options: [{ value, label, sub, color, count }];
 * `color` may be any CSS background, such as a conic gradient for a pie.
 */
export const RadioCards = ({ label, name, value, onChange, options }) => (
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

/**
 * Search as you type, pinned to the top of the sidebar. `search` gets the
 * lower-cased text and returns [{ key, label, sub, color }]; keep it stable
 * (useCallback), since it runs again when it changes.
 */
export function SearchBox({ search, onPick, label, placeholder, min = 2 }) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const ready = needle.length >= min
  const results = useMemo(() => (ready ? search(needle) : []), [ready, needle, search])
  const pick = (r) => {
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
