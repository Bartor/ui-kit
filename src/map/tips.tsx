import type { ReactNode } from 'react'

export interface TipProps {
  children?: ReactNode
}

/** Dimmed text in a map tooltip. */
export const TipNote = ({ children }: TipProps) => <span className="kit-tip-note">{children}</span>

/** A caveat in a map tooltip. */
export const TipWarn = ({ children }: TipProps) => <span className="kit-tip-warn">{children}</span>

export interface TipRowProps {
  color: string
  label: ReactNode
  value: ReactNode
  share?: ReactNode
}

/** One part of a split in a map tooltip. */
export const TipRow = ({ color, label, value, share }: TipRowProps) => (
  <div className="kit-tip-row">
    <i style={{ background: color }} />{label}
    <b>{value}</b>
    <em>{share}</em>
  </div>
)
