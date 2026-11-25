import { describe, expect, it } from 'vitest'
import {
  clampFrom, clampWidth, fillWidths, LABEL_WIDTH_KEY, readWidths, tableWidth, WIDTH_BIG_STEP, WIDTH_FALLBACK,
  WIDTH_LIMITS, WIDTH_STEP, WIDTHS_STORE, widthAfterKey, widthLimits, withWidth, writeWidths,
} from './widths.js'

describe('column widths', () => {
  it('hold a width between the limits of its kind of column, as whole pixels', () => {
    expect(clampWidth('a', 10)).toBe(WIDTH_LIMITS.column.min)
    expect(clampWidth('a', 5000)).toBe(WIDTH_LIMITS.column.max)
    expect(clampWidth('a', 100.4)).toBe(100)
    expect(clampWidth(LABEL_WIDTH_KEY, 60)).toBe(WIDTH_LIMITS.label.min)
    expect(clampWidth(LABEL_WIDTH_KEY, 400)).toBe(400)
    expect(clampWidth('a', NaN)).toBe(WIDTH_LIMITS.column.min)
    expect(widthLimits(LABEL_WIDTH_KEY).max).toBeGreaterThan(widthLimits('a').max)
  })

  it('set one column and leave the rest, without touching what it was given', () => {
    const was = { a: 80, b: 90 }
    expect(withWidth(was, 'b', 120)).toEqual({ a: 80, b: 120 })
    expect(withWidth(was, 'b', 1)).toEqual({ a: 80, b: WIDTH_LIMITS.column.min })
    expect(was).toEqual({ a: 80, b: 90 })
  })

  it('fill what is missing from the widths on screen, and keep what is set', () => {
    const seen = { [LABEL_WIDTH_KEY]: 200, a: 70, b: 55.6 }
    expect(fillWidths({ a: 100 }, seen)).toEqual({ [LABEL_WIDTH_KEY]: 200, a: 100, b: 56 })
    expect(fillWidths({}, { a: 63.3, b: 63 })).toEqual({ a: 64, b: 63 })      // rounded up, so that no head is cut
    expect(fillWidths({}, {})).toEqual({})
    // a column on screen outside the limits stays where it is: touching one column moves no other
    expect(fillWidths({}, { [LABEL_WIDTH_KEY]: 620, gap: 16, wide: 400 })).toEqual({ [LABEL_WIDTH_KEY]: 620, gap: 16, wide: 400 })
    // a column known to neither has the fallback
    expect(fillWidths({ c: undefined as unknown as number }, {}).c).toBe(WIDTH_FALLBACK.column)
  })

  it('let a column that starts outside the limits move from where it is', () => {
    expect(clampFrom('a', 410, 400)).toBe(400)                       // wider than the largest: may stay, may not grow
    expect(clampFrom('a', 390, 400)).toBe(390)
    expect(clampFrom('a', 10, 16)).toBe(16)                          // narrower than the smallest: the same, mirrored
    expect(clampFrom('a', 30, 16)).toBe(30)
    expect(clampFrom('a', 500, 100)).toBe(WIDTH_LIMITS.column.max)   // inside the limits it is clampWidth
    expect(clampFrom('a', NaN, 100)).toBe(100)
    expect(widthAfterKey('a', 400, 'ArrowRight')).toBe(400)
    expect(widthAfterKey('a', 400, 'ArrowLeft')).toBe(400 - WIDTH_STEP)
  })

  it('keep widths between visits, and survive a storage that is missing, broken or full', () => {
    const data = new Map<string, string>()
    const store = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => { data.set(k, v) },
      removeItem: (k: string) => { data.delete(k) },
    }
    writeWidths('t', { [LABEL_WIDTH_KEY]: 200, a: 70 }, store)
    expect(data.get(WIDTHS_STORE + 't')).toBe('{":label":200,"a":70}')
    expect(readWidths('t', store)).toEqual({ [LABEL_WIDTH_KEY]: 200, a: 70 })
    expect(readWidths('other', store)).toEqual({})
    writeWidths('t', {}, store)
    expect(data.has(WIDTHS_STORE + 't')).toBe(false)
    data.set(WIDTHS_STORE + 'bad', '{"a":"wide","b":-4,"c":80.4,"d":null}')
    expect(readWidths('bad', store)).toEqual({ c: 80 })
    data.set(WIDTHS_STORE + 'worse', '[1,2')
    expect(readWidths('worse', store)).toEqual({})
    expect(readWidths('t', undefined)).toEqual({})
    const full = { ...store, setItem: () => { throw new Error('quota') } }
    expect(() => writeWidths('t', { a: 70 }, full)).not.toThrow()
  })

  it('answer the keys: arrows step, Shift steps further, Home and End go to the limits, others do nothing', () => {
    expect(widthAfterKey('a', 100, 'ArrowRight')).toBe(100 + WIDTH_STEP)
    expect(widthAfterKey('a', 100, 'ArrowLeft')).toBe(100 - WIDTH_STEP)
    expect(widthAfterKey('a', 100, 'ArrowRight', true)).toBe(100 + WIDTH_BIG_STEP)
    expect(widthAfterKey('a', 45, 'ArrowLeft', true)).toBe(WIDTH_LIMITS.column.min)
    expect(widthAfterKey('a', 100, 'Home')).toBe(WIDTH_LIMITS.column.min)
    expect(widthAfterKey('a', 100, 'End')).toBe(WIDTH_LIMITS.column.max)
    expect(widthAfterKey(LABEL_WIDTH_KEY, 100, 'End')).toBe(WIDTH_LIMITS.label.max)
    expect(widthAfterKey('a', 100, 'Tab')).toBeNull()
    expect(widthAfterKey('a', 100, 'a')).toBeNull()
  })

  it('add up to the width of the table, in the order given', () => {
    expect(tableWidth([LABEL_WIDTH_KEY, 'a', 'b'], { [LABEL_WIDTH_KEY]: 150, a: 60, b: 70 })).toBe(280)
    expect(tableWidth(['a', 'b'], { a: 60 })).toBe(60 + WIDTH_FALLBACK.column)
    expect(tableWidth([], {})).toBe(0)
  })
})
