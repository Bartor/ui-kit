import { locale } from './config'

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ------------------------------------------------------------------- tables
// Excel reads a CSV by the machine's locale: where decimals are commas it
// wants semicolons between cells, elsewhere commas.
const decimal = () => (1.5).toLocaleString(locale())[1]

/** A number as a CSV cell, empty when there is none. */
export const csvNumber = (v, digits = 0) => (v == null || Number.isNaN(v) ? ''
  : (digits ? v.toFixed(digits) : String(Math.round(v))).replace('.', decimal()))

/** Rows of cells as CSV text. The BOM tells Excel it is UTF-8. */
export function toCsv(table) {
  const sep = decimal() === ',' ? ';' : ','
  const cell = (v) => {
    const s = v == null ? '' : String(v)
    return s.includes(sep) || /["\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return `﻿${table.map((r) => r.map(cell).join(sep)).join('\r\n')}\r\n`
}

export const downloadCsv = (table, filename) =>
  downloadBlob(new Blob([toCsv(table)], { type: 'text/csv;charset=utf-8' }), filename)

// ------------------------------------------------------------------- images
// `render` makes the image: () => Promise<Blob>.

export const downloadImage = async (render, filename) => downloadBlob(await render(), filename)

/** Whether the system share sheet accepts image files - true on most phones,
 *  where it is the natural way to post a picture to a messenger. */
export function canShareImage() {
  try {
    const probe = new File([new Blob()], 'probe.png', { type: 'image/png' })
    return !!(navigator.canShare && navigator.canShare({ files: [probe] }))
  } catch {
    return false
  }
}

export async function shareImage(render, { filename, title, text }) {
  const file = new File([await render()], filename, { type: 'image/png' })
  try {
    await navigator.share({ files: [file], title, text })
    return 'shared'
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled'   // user closed the sheet
    throw e
  }
}

/** Copies the image. Falls back to a download where the browser will not put
 *  images on the clipboard. */
export async function copyImage(render, filename) {
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      throw new Error('clipboard images unsupported')
    }
    // A promise inside ClipboardItem keeps the user gesture alive while the
    // canvas renders, which Safari requires.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': render() })])
    return 'copied'
  } catch {
    await downloadImage(render, filename)
    return 'downloaded'
  }
}
