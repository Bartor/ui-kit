import { Component, useEffect, useId, useRef } from 'react'
import { useSheetDrag } from './useSheetDrag'
import { t } from '../core/config'

const cx = (...c) => c.filter(Boolean).join(' ')

/** The page: a sidebar, a map and a panel side by side; on phones the map
 *  fills it and the other two are sheets over it. */
export const AppShell = ({ children }) => <div className="kit-app">{children}</div>

/** A line of text instead of the page: loading, or why it cannot load. */
export const AppMessage = ({ children }) => <div className="kit-message">{children}</div>

/**
 * The settings column. On phones it is a bottom sheet that peeks `peek` under
 * its title and is dragged or tapped open; `open` and `setOpen` hold that.
 */
export function Sidebar({
  title, subtitle, peek, open, setOpen, expandLabel, action, footer, children,
}) {
  const sheet = useSheetDrag(open, setOpen)
  return (
    <aside className={cx('kit-sidebar', open && 'open', sheet.dy != null && 'dragging')}
      style={sheet.dy != null ? {
        transform: open ? `translateY(${sheet.dy}px)`
          : `translateY(calc(100% - 62px + ${sheet.dy}px))`,
      } : undefined}>
      {/* On phones the header is the sheet's handle; on desktop the button is
          hidden and the header is just a title. */}
      <header>
        <button type="button" className="kit-sheet-handle" aria-expanded={open}
          aria-label={open ? t('collapsePanel') : expandLabel || t('expandPanel')}
          onClick={() => setOpen(!open)} {...sheet.handlers}>
          <span className="kit-grip" />
          <span className="kit-sheet-title">
            <b>{title}</b>
            <em>{open ? t('collapse') : peek}</em>
          </span>
          <span className={open ? 'kit-chevron open' : 'kit-chevron'}>▴</span>
        </button>
        <div className="kit-title-row">
          <h1>{title}</h1>
          {action}
        </div>
        {subtitle && <p className="kit-sub">{subtitle}</p>}
      </header>
      {children}
      {footer && <footer>{footer}</footer>}
    </aside>
  )
}

/** "?" beside a title. Its label shows on phones, where the title does not. */
export const InfoButton = ({ label, title, onClick }) => (
  <button type="button" className="kit-info-btn" onClick={onClick} aria-haspopup="dialog" title={title}>
    <span aria-hidden="true">?</span><em>{label}</em>
  </button>
)

/**
 * Details of one selected thing, beside the map; on phones a bottom sheet,
 * closed by dragging its header down. `actions` sit under the title.
 */
export function DetailsPanel({ pill, title, color, onClose, actions, children }) {
  const sheet = useSheetDrag(true, (open) => { if (!open) onClose() })
  return (
    <div className={sheet.dy != null ? 'kit-details dragging' : 'kit-details'}
      style={sheet.dy != null ? { transform: `translateY(${sheet.dy}px)` } : undefined}>
      <div className="kit-details-head" style={{ borderColor: color }} {...sheet.handlers}>
        <div>
          {pill != null && <span className="kit-pill" style={{ background: color }}>{pill}</span>}
          <h3>{title}</h3>
          {actions}
        </div>
        {onClose && (
          <button type="button" className="kit-close" aria-label={t('close')} onClick={onClose}>×</button>
        )}
      </div>
      <div className="kit-details-body">{children}</div>
    </div>
  )
}

/**
 * Keeps one broken panel from blanking the whole page. Without it, any
 * exception while rendering the detail panel unmounts the entire app, leaving
 * an empty page with nothing on screen to say why.
 *
 * A new `resetKey` - another selection - gets a fresh attempt.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    const { onClose, title, hint } = this.props
    return (
      <div className="kit-details">
        <div className="kit-details-head" style={{ borderColor: '#c1392b' }}>
          <div><h3>{title || t('errorTitle')}</h3></div>
          {onClose && (
            <button type="button" className="kit-close" aria-label={t('close')} onClick={onClose}>×</button>
          )}
        </div>
        <div className="kit-details-body">
          <p className="kit-warn">{String(this.state.error.message || this.state.error)}</p>
          <p className="kit-hint">{hint || t('errorHint')}</p>
        </div>
      </div>
    )
  }
}

/** A modal dialog of text. Esc, the close button and a click beside it close it. */
export function Modal({ title, onClose, children }) {
  const ref = useRef(null)
  const id = useId()
  // Opened as a modal for focus trapping and Esc. Not closed on unmount:
  // removing it does that, and a close() here fired onClose when React's
  // development mode re-ran the effect, shutting the dialog at once.
  // React 18 does not pass the dialog's own close event (Esc) to onClose,
  // so it is listened for here.
  const closed = useRef(onClose)
  closed.current = onClose
  useEffect(() => {
    const d = ref.current
    if (!d) return undefined
    if (!d.open) d.showModal()
    const done = () => closed.current()
    d.addEventListener('close', done)
    return () => d.removeEventListener('close', done)
  }, [])
  return (
    <dialog ref={ref} className="kit-modal" aria-labelledby={id}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }}
      onClick={(e) => { if (e.target === ref.current) onClose() }}>
      <div className="kit-modal-body">
        <header>
          <h2 id={id}>{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('close')}>×</button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

/** A table of text for a Modal; on phones each row stacks. Cells may be nodes. */
export const TextTable = ({ head, rows }) => (
  <table className="kit-text-table">
    <thead>
      <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((r, i) => (
        <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
      ))}
    </tbody>
  </table>
)
