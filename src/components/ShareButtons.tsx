import { useState } from 'react'
import { canShareImage, copyImage, downloadImage, shareImage } from '../core/files.js'
import type { RenderImage, ShareText } from '../core/files.js'
import { t } from '../core/config.js'

const SHARE_FILES = typeof window !== 'undefined' && canShareImage()

type State = 'busy' | 'copied' | 'downloaded' | 'saved' | 'shared' | 'linked' | 'error'

export interface ShareButtonsProps extends ShareText {
  /** Makes the picture: () => renderCard(...), say. */
  render: RenderImage
}

/** Copy, download or share a picture, and copy the page's address. */
export function ShareButtons({ render, filename, title, text }: ShareButtonsProps) {
  const [state, setState] = useState<State | null>(null)
  const settle = (s: State) => {
    setState(s)
    setTimeout(() => setState(null), 2800)
  }
  const copy = async () => {
    setState('busy')
    try { settle(await copyImage(render, filename)) } catch { settle('error') }
  }
  const download = async () => {
    try { await downloadImage(render, filename); settle('saved') } catch { settle('error') }
  }
  const share = async () => {
    try {
      const r = await shareImage(render, { filename, title, text })
      if (r === 'shared') settle('shared')
    } catch { settle('error') }
  }
  const link = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      settle('linked')
    } catch { settle('error') }
  }
  return (
    <div className="kit-share">
      {SHARE_FILES && (
        <button type="button" className="kit-share-btn primary" onClick={share}>
          {state === 'shared' ? t('shared') : t('share')}
        </button>
      )}
      <button type="button" className="kit-share-btn" onClick={copy} disabled={state === 'busy'}>
        {state === 'copied' ? t('copied') : state === 'busy' ? t('copying') : t('copyImage')}
      </button>
      <button type="button" className="kit-share-btn" onClick={download} title={t('downloadTitle')}>
        {t('download')}
      </button>
      <button type="button" className="kit-share-btn" onClick={link} title={t('linkTitle')}>
        {state === 'linked' ? t('linked') : t('link')}
      </button>
      {state === 'downloaded' && <span className="kit-share-msg">{t('savedInstead')}</span>}
      {state === 'saved' && <span className="kit-share-msg">{t('saved')}</span>}
      {state === 'error' && <span className="kit-share-msg err">{t('failed')}</span>}
    </div>
  )
}
