import { Component, useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useSheetDrag } from './useSheetDrag.js'
import { t } from '../core/config.js'

const cx = (...c: (string | false | null | undefined)[]): string => c.filter(Boolean).join(' ')

export interface AppShellProps {
  children?: ReactNode
}

/** The page: a sidebar, a map and a panel side by side; on phones the map
 *  fills it and the other two are sheets over it. */
export const AppShell = ({ children }: AppShellProps) => <div className="kit-app">{children}</div>

export interface AppMessageProps {
  children?: ReactNode
}

/** A line of text instead of the page: loading, or why it cannot load. */
export const AppMessage = ({ children }: AppMessageProps) => <div className="kit-message">{children}</div>

export interface SidebarProps {
  title: ReactNode
  subtitle?: ReactNode
  /** What the closed sheet says under its title, on phones. */
  peek?: ReactNode
  /** Whether the sheet is pulled up, on phones. */
  open: boolean
  setOpen: (open: boolean) => void
  /** Accessible name of the closed sheet's handle. */
  expandLabel?: string
  /** Beside the title: an InfoButton, say. */
  action?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}

/** The settings column; on phones a bottom sheet, dragged or tapped open. */
export function Sidebar({
  title, subtitle, peek, open, setOpen, expandLabel, action, footer, children,
}: SidebarProps) {
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

export interface InfoButtonProps {
  /** Shown on phones, where the title it sits beside is not. */
  label: ReactNode
  /** Its tooltip. */
  title?: string
  onClick?: () => void
}

/** "?" beside a title, opening a Modal. */
export const InfoButton = ({ label, title, onClick }: InfoButtonProps) => (
  <button type="button" className="kit-info-btn" onClick={onClick} aria-haspopup="dialog" title={title}>
    <span aria-hidden="true">?</span><em>{label}</em>
  </button>
)

export interface DetailsPanelProps {
  /** Short id, on the colour. */
  pill?: ReactNode
  title: ReactNode
  color?: string
  /** Without it the panel has no close button. */
  onClose?: () => void
  /** Under the title: ShareButtons, say. */
  actions?: ReactNode
  children?: ReactNode
}

/** Details of one selected thing, beside the map; on phones a bottom sheet,
 *  closed by dragging its header down. */
export function DetailsPanel({ pill, title, color, onClose, actions, children }: DetailsPanelProps) {
  const sheet = useSheetDrag(true, (open) => { if (!open) onClose?.() })
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

export interface ErrorBoundaryProps {
  /** A new one - another selection - gets a fresh attempt. */
  resetKey?: unknown
  onClose?: () => void
  title?: ReactNode
  hint?: ReactNode
  children?: ReactNode
}

/**
 * Keeps one broken panel from blanking the whole page. Without it, any
 * exception while rendering the detail panel unmounts the entire app, leaving
 * an empty page with nothing on screen to say why.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { error: unknown }> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
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
          <p className="kit-warn">{String((error as Error).message || error)}</p>
          <p className="kit-hint">{hint || t('errorHint')}</p>
        </div>
      </div>
    )
  }
}

export interface ModalProps {
  title: ReactNode
  onClose: () => void
  children?: ReactNode
}

/** A modal dialog of text. Esc, the close button and a click beside it close it. */
export function Modal({ title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
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

export interface TextTableProps {
  head: readonly string[]
  /** Rows of cells; a <small> in a cell goes under its text. */
  rows: readonly (readonly ReactNode[])[]
}

/** A table of text for a Modal; on phones each row stacks. */
export const TextTable = ({ head, rows }: TextTableProps) => (
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
