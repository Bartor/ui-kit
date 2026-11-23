import { useState } from 'react'
import { hoverProps, isHot, pieceKey } from '../core/link'
import { isPhone } from '../core/media'
import { t } from '../core/config'

const NONE = new Set()

/**
 * A whole and the pieces it is made of, in groups. The tree stays put while
 * moving between the whole and its pieces, lighting up the one on show.
 *
 * Unticking a piece leaves it out of the whole's numbers; that needs a `root`
 * and `onToggle`. Hovering a piece sets `hot`, and is lit by it.
 *
 *   root       { label, onPick } - the whole; null when there is none
 *   groups     [{ kind, label, color, badge, square, keepOne, items }]
 *              items [{ id, letter, label, title, share, ref }], share as text;
 *              badge { bg, on } colours its letters, square shapes them,
 *              keepOne stops the last piece being unticked
 *   current    { kind, id } of the open piece, null with the whole on show
 *   off        Set of pieceKey()s left out
 *   onPick     (group, item)
 *   onToggle   (keys, out) - one key or several
 *   labels     overrides of the tree* texts: include, putBack, leaveOut, last, hint
 */
export function PieceTree({
  label, root, groups, current, off = NONE, onPick, onToggle, hot, setHot, labels = {},
}) {
  // On a phone twelve rows fill the sheet before anything else is in sight, so
  // groups start folded - unless they hold the open piece or a left-out one.
  const [shut, setShut] = useState(() => new Set(isPhone() ? groups
    .filter((g) => current?.kind !== g.kind
      && !g.items.some((m) => off.has(pieceKey(g.kind, m.id))))
    .map((g) => g.kind) : []))
  const fold = (kind) => setShut((s) => {
    const n = new Set(s)
    if (n.has(kind)) n.delete(kind)
    else n.add(kind)
    return n
  })
  // leaving pieces out only means something when they add up to a whole
  const can = !!root && !!onToggle
  const keysOf = (g) => g.items.map((m) => pieceKey(g.kind, m.id))
  const nOff = can ? groups.flatMap(keysOf).filter((k) => off.has(k)).length : 0
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
            style={g.badge ? { '--badge': g.badge.bg, '--badge-on': g.badge.on } : undefined}>
            {(groups.length > 1 || root) && (
              <h5>
                <button type="button" className="fold" aria-expanded={!shut.has(g.kind)}
                  onClick={() => fold(g.kind)}>
                  <i className={shut.has(g.kind) ? 'kit-chevron' : 'kit-chevron open'}>▸</i>
                  {g.label}
                  <em>{left < keys.length ? t('treeSome', left, keys.length) : keys.length}</em>
                </button>
                {can && left < keys.length && (
                  <button type="button" onClick={() => onToggle(keys, false)}>
                    {t('treeIncludeAll')}
                  </button>
                )}
              </h5>
            )}
            {!shut.has(g.kind) && <ul>
              {g.items.map((m, i) => {
                const out = can && off.has(keys[i])
                const last = !out && left === 1 && g.keepOne
                const on = isHot(current, g.kind, m.id)
                return (
                  <li key={m.id} {...hoverProps(setHot, { kind: g.kind, id: m.id })}
                    className={`${on ? 'on' : ''}${out ? ' out' : ''}`
                      + `${isHot(hot, g.kind, m.id) ? ' hot' : ''}`}>
                    {can && (
                      <input type="checkbox" className="kit-check" checked={!out} disabled={last}
                        style={{ '--c': g.color }}
                        aria-label={(labels.include || ((id) => t('treeInclude', id)))(m.id)}
                        title={last ? labels.last || t('treeLast')
                          : out ? labels.putBack || t('treePutBack')
                            : labels.leaveOut || t('treeLeaveOut')}
                        onChange={(e) => onToggle(keys[i], !e.target.checked)} />
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
