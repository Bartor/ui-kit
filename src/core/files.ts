import { locale } from './config.js'

export function downloadBlob(blob: Blob, filename: string): void {
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
/** A cell of a table to export. */
export type CsvCell = string | number | null | undefined

// Excel reads a CSV by the machine's locale: where decimals are commas it
// wants semicolons between cells, elsewhere commas.
const decimal = (): string => (1.5).toLocaleString(locale())[1]

/** A number as a CSV cell, empty when there is none. */
export const csvNumber = (v: number | null | undefined, digits = 0): string =>
  (v == null || Number.isNaN(v) ? ''
    : (digits ? v.toFixed(digits) : String(Math.round(v))).replace('.', decimal()))

/** Rows of cells as CSV text. The BOM tells Excel it is UTF-8. */
export function toCsv(table: readonly (readonly CsvCell[])[]): string {
  const sep = decimal() === ',' ? ';' : ','
  const cell = (v: CsvCell): string => {
    const s = v == null ? '' : String(v)
    return s.includes(sep) || /["\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return `﻿${table.map((r) => r.map(cell).join(sep)).join('\r\n')}\r\n`
}

export const downloadCsv = (table: readonly (readonly CsvCell[])[], filename: string): void =>
  downloadBlob(new Blob([toCsv(table)], { type: 'text/csv;charset=utf-8' }), filename)

// ------------------------------------------------------------------- images
/** Makes an image: renderCard, say. */
export type RenderImage = () => Promise<Blob>

export const downloadImage = async (render: RenderImage, filename: string): Promise<void> =>
  downloadBlob(await render(), filename)

/** Whether the system share sheet accepts image files - true on most phones,
 *  where it is the natural way to post a picture to a messenger. */
export function canShareImage(): boolean {
  try {
    const probe = new File([new Blob()], 'probe.png', { type: 'image/png' })
    return !!(navigator.canShare && navigator.canShare({ files: [probe] }))
  } catch {
    return false
  }
}

export interface ShareText {
  filename: string
  title?: string
  text?: string
}

export async function shareImage(
  render: RenderImage, { filename, title, text }: ShareText,
): Promise<'shared' | 'cancelled'> {
  const file = new File([await render()], filename, { type: 'image/png' })
  try {
    await navigator.share({ files: [file], title, text })
    return 'shared'
  } catch (e) {
    if ((e as Error | null)?.name === 'AbortError') return 'cancelled'   // user closed the sheet
    throw e
  }
}

/** Copies the image. Falls back to a download where the browser will not put
 *  images on the clipboard. */
export async function copyImage(render: RenderImage, filename: string): Promise<'copied' | 'downloaded'> {
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
