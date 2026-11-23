import type { ComponentPropsWithoutRef, ReactNode } from 'react'

/** Props of the parts that only wrap text. */
export interface TextProps {
  children?: ReactNode
}

/** Small print under the thing it is about. */
export const Hint = ({ children }: TextProps) => <p className="kit-hint">{children}</p>

/** A caveat the reader should not miss. */
export const Warn = ({ children }: TextProps) => <p className="kit-warn">{children}</p>

export const Footnote = ({ children }: TextProps) => <p className="kit-footnote">{children}</p>

/** A bulleted list of small print, as <li>. */
export const Notes = ({ children }: TextProps) => <ul className="kit-notes">{children}</ul>

export interface LinkButtonProps extends ComponentPropsWithoutRef<'button'> {
  /** On a line of its own. */
  block?: boolean
}

/** A button that reads as a link. */
export const LinkButton = ({ block, children, ...rest }: LinkButtonProps) => (
  <button type="button" className={block ? 'kit-link block' : 'kit-link'} {...rest}>{children}</button>
)

export const Divider = () => <div className="kit-divider" />

/** Wraps a group of related content, without a box. */
export const Block = ({ children }: TextProps) => <div className="kit-block">{children}</div>

export interface CalloutProps extends TextProps {
  title: ReactNode
}

/** A box that stands out from the panel around it. */
export const Callout = ({ title, children }: CalloutProps) => (
  <div className="kit-callout">
    <h4>{title}</h4>
    {children}
  </div>
)

export interface CitationProps {
  /** Paragraphs of the quotation. */
  quote: readonly ReactNode[]
  /** The caption under it. */
  children?: ReactNode
}

/** A quoted source. */
export const Citation = ({ quote, children }: CitationProps) => (
  <figure className="kit-cite">
    <blockquote>{quote.map((q, i) => <p key={i}>{q}</p>)}</blockquote>
    <figcaption>{children}</figcaption>
  </figure>
)

/** Where exactly in a cited source, fainter than the rest of the caption. */
export const CitePlace = ({ children }: TextProps) => <span className="kit-cite-place">{children}</span>

/** A two-column list of Fact. */
export const Facts = ({ children }: TextProps) => <dl>{children}</dl>

export interface FactProps extends TextProps {
  label: ReactNode
  /** 'now' is the one that leads, 'whole' sits back, 'gap' is a leading one
   *  that has no value. */
  tone?: 'now' | 'whole' | 'gap'
}

/** One fact. */
export function Fact({ label, tone, children }: FactProps) {
  const dt = tone === 'gap' ? 'now' : tone
  return (
    <>
      <dt className={dt}>{label}</dt>
      <dd className={tone === 'gap' ? 'now gap' : tone}>{children}</dd>
    </>
  )
}

/** A qualification of a value: what it does not cover. */
export const Partial = ({ children }: TextProps) => <span className="kit-partial">{children}</span>

export interface SwatchProps {
  color: string
}

/** Coloured dot. */
export const Swatch = ({ color }: SwatchProps) => <i className="kit-swatch" style={{ background: color }} />
