import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { hoverProps, isHot, pieceKey } from '../core/link.js'
import type { HotProps } from '../core/link.js'
import { isPhone } from '../core/media.js'
import { t } from '../core/config.js'

const NONE: ReadonlySet<string> = new Set()

/** A piece in the tree. Add your own fields; onPick gets them back. */
export interface PieceTreeItem {
  id: string
  letter: ReactNode
  label: ReactNode
  /** Tooltip. */
  title?: string
  /** Its part of the group, as text; a dash for none. */
  share?: string | null
}

export interface PieceTreeGroup<I extends PieceTreeItem = PieceTreeItem> {
  /** The kind of its pieces, as in `hot`. */
  kind: string
  label: ReactNode
  /** Of the checkboxes. */
  color: string
  /** Colours of the letters, at rest and open. */
  badge?: { bg: string; on: string } | null
  /** Square letters rather than round. */
  square?: boolean
  /** Its last piece cannot be unticked. */
  keepOne?: boolean
  items: readonly I[]
}

/** Overrides of the built-in texts. */
export interface PieceTreeLabels {
  include?: (id: string) => string
  putBack?: string
  leaveOut?: string
  last?: string
  hint?: ReactNode
}

export interface PieceTreeProps<I extends PieceTreeItem = PieceTreeItem> extends HotProps {
  /** Accessible name. */
  label: string
  /** The whole; null when there is none to show. */
  root?: { label: ReactNode; onPick: () => void } | null
  groups: readonly PieceTreeGroup<I>[]
  /** The open piece; null with the whole on show. */
  current?: { kind: string; id: string } | null
  /** Pieces left out of the whole, as pieceKey()s. */
  off?: ReadonlySet<string>
  onPick: (group: PieceTreeGroup<I>, item: I) => void
  /** Pieces were unticked (`out`) or ticked: one key, or all of a group. With
   *  it and a root, the pieces have checkboxes. */
  onToggle?: (keys: string | string[], out: boolean) => void
  labels?: PieceTreeLabels
}

/**
 * A whole and the pieces it is made of, in groups. The tree stays put while
 * moving between the whole and its pieces, lighting up the one on show.
 *
 * Unticking a piece leaves it out of the whole's numbers. Hovering a piece
 * sets `hot`, and is lit by it.
 */
export function PieceTree<I extends PieceTreeItem>({
  label, root, groups, current, off = NONE, onPick, onToggle, hot, setHot, labels = {},
}: PieceTreeProps<I>) {
  // On a phone twelve rows fill the sheet before anything else is in sight, so
  // groups start folded - unless they hold the open piece or a left-out one.
  const [shut, setShut] = useState<ReadonlySet<string>>(() => new Set(isPhone() ? groups
    .filter((g) => current?.kind !== g.kind
      && !g.items.some((m) => off.has(pieceKey(g.kind, m.id))))
    .map((g) => g.kind) : []))
  const fold = (kind: string) => setShut((s) => {
    const n = new Set(s)
    if (n.has(kind)) n.delete(kind)
    else n.add(kind)
    return n
  })
  // leaving pieces out only means something when they add up to a whole
  const toggle = root ? onToggle : undefined
  const keysOf = (g: PieceTreeGroup<I>) => g.items.map((m) => pieceKey(g.kind, m.id))
  const nOff = toggle ? groups.flatMap(keysOf).filter((k) => off.has(k)).length : 0
  return (
    <nav className="kit-tree" aria-label={label}>
      {root && (
        <button type="button" className={current ? 'kit-tree-root' : 'kit-tree-root on'}
          aria-current={current ? undefined : 'true'} onClick={root.onPick}>
          <b>Σ</b>
          <span>{root.label}</span>
          {nOff > 0 && <em>{t('treeLeftOut', nOff)}</em>}
        </button>
      )}
      {groups.map((g) => {
        const keys = keysOf(g)
        const left = keys.filter((k) => !off.has(k)).length
        return (
          <div key={g.kind} className={`kit-tree-group${g.square ? ' square' : ''}${root ? ' nested' : ''}`}
            style={g.badge ? { '--badge': g.badge.bg, '--badge-on': g.badge.on } as CSSProperties : undefined}>
            {(groups.length > 1 || root) && (
              <h5>
                <button type="button" className="fold" aria-expanded={!shut.has(g.kind)}
                  onClick={() => fold(g.kind)}>
                  <i className={shut.has(g.kind) ? 'kit-chevron' : 'kit-chevron open'}>▸</i>
                  {g.label}
                  <em>{left < keys.length ? t('treeSome', left, keys.length) : keys.length}</em>
                </button>
                {toggle && left < keys.length && (
                  <button type="button" onClick={() => toggle(keys, false)}>
                    {t('treeIncludeAll')}
                  </button>
                )}
              </h5>
            )}
            {!shut.has(g.kind) && <ul>
              {g.items.map((m, i) => {
                const out = !!toggle && off.has(keys[i])
                const last = !out && left === 1 && !!g.keepOne
                const on = isHot(current, g.kind, m.id)
                return (
                  <li key={m.id} {...hoverProps(setHot, { kind: g.kind, id: m.id })}
                    className={`${on ? 'on' : ''}${out ? ' out' : ''}`
                      + `${isHot(hot, g.kind, m.id) ? ' hot' : ''}`}>
                    {toggle && (
                      <input type="checkbox" className="kit-check" checked={!out} disabled={last}
                        style={{ '--c': g.color } as CSSProperties}
                        aria-label={labels.include ? labels.include(m.id) : t('treeInclude', m.id)}
                        title={last ? labels.last || t('treeLast')
                          : out ? labels.putBack || t('treePutBack')
                            : labels.leaveOut || t('treeLeaveOut')}
                        onChange={(e) => toggle(keys[i], !e.target.checked)} />
                    )}
                    <button type="button" aria-current={on ? 'true' : undefined}
                      title={m.title} onClick={() => onPick(g, m)}>
                      <b>{m.letter}</b>
                      <span>{m.label}</span>
                      <em>{out ? t('leftOut') : m.share ?? '—'}</em>
                    </button>
                  </li>
                )
              })}
            </ul>}
          </div>
        )
      })}
      {nOff > 0 && <p className="kit-hint">{labels.hint || t('treeHint')}</p>}
    </nav>
  )
}
