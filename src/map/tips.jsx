/** Dimmed text in a map tooltip. */
export const TipNote = ({ children }) => <span className="kit-tip-note">{children}</span>

/** A caveat in a map tooltip. */
export const TipWarn = ({ children }) => <span className="kit-tip-warn">{children}</span>

/** One part of a split in a map tooltip. */
export const TipRow = ({ color, label, value, share }) => (
  <div className="kit-tip-row">
    <i style={{ background: color }} />{label}
    <b>{value}</b>
    <em>{share}</em>
  </div>
)
