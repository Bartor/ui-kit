import { describe, expect, it } from 'vitest'
import {
  clampWidth, fillWidths, LABEL_WIDTH_KEY, tableWidth, WIDTH_BIG_STEP, WIDTH_FALLBACK, WIDTH_LIMITS, WIDTH_STEP,
  widthAfterKey, widthLimits, withWidth,
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

  it('fill what is missing from the natural widths, and keep what is set', () => {
    const natural = { [LABEL_WIDTH_KEY]: 200, a: 70, b: 55.6 }
    expect(fillWidths({ a: 100 }, natural)).toEqual({ [LABEL_WIDTH_KEY]: 200, a: 100, b: 56 })
    expect(fillWidths({}, {})).toEqual({})
    // a column known to neither has the fallback
    expect(fillWidths({ c: undefined as unknown as number }, {}).c).toBe(WIDTH_FALLBACK.column)
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
