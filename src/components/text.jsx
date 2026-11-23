/** Small print under the thing it is about. */
export const Hint = ({ children }) => <p className="kit-hint">{children}</p>

/** A caveat the reader should not miss. */
export const Warn = ({ children }) => <p className="kit-warn">{children}</p>

export const Footnote = ({ children }) => <p className="kit-footnote">{children}</p>

/** A bulleted list of small print. */
export const Notes = ({ children }) => <ul className="kit-notes">{children}</ul>

/** A button that reads as a link; `block` gives it a line of its own. */
export const LinkButton = ({ block, children, ...rest }) => (
  <button type="button" className={block ? 'kit-link block' : 'kit-link'} {...rest}>{children}</button>
)

export const Divider = () => <div className="kit-divider" />

/** Wraps a group of related content, without a box. */
export const Block = ({ children }) => <div className="kit-block">{children}</div>

/** A box that stands out from the panel around it. */
export const Callout = ({ title, children }) => (
  <div className="kit-callout">
    <h4>{title}</h4>
    {children}
  </div>
)

/** A quoted source: paragraphs of `quote`, with the caption under them. */
export const Citation = ({ quote, children }) => (
  <figure className="kit-cite">
    <blockquote>{quote.map((q, i) => <p key={i}>{q}</p>)}</blockquote>
    <figcaption>{children}</figcaption>
  </figure>
)

/** Where exactly in a cited source, fainter than the rest of the caption. */
export const CitePlace = ({ children }) => <span className="kit-cite-place">{children}</span>

/** A two-column list of Fact. */
export const Facts = ({ children }) => <dl>{children}</dl>

/** One fact. Tone: 'now' is the one that leads, 'whole' sits back, 'gap' is a
 *  leading one that has no value. */
export function Fact({ label, tone, children }) {
  const dt = tone === 'gap' ? 'now' : tone
  return (
    <>
      <dt className={dt}>{label}</dt>
      <dd className={tone === 'gap' ? 'now gap' : tone}>{children}</dd>
    </>
  )
}

/** A qualification of a value: what it does not cover. */
export const Partial = ({ children }) => <span className="kit-partial">{children}</span>

/** Coloured dot. */
export const Swatch = ({ color }) => <i className="kit-swatch" style={{ background: color }} />
