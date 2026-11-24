import { describe, expect, it } from 'vitest'
import { compareValues, firstDir, isMissing, nextSort, sortItems, sortOrder } from './sort.js'
import { configure } from './config.js'

describe('sorting', () => {
  it('puts missing values last in both directions, and never reads them as zero', () => {
    const v = [3, null, 0, undefined, NaN, 10, '']
    expect(sortOrder(v, 'desc').map((i) => v[i])).toEqual([10, 3, 0, null, undefined, NaN, ''])
    expect(sortOrder(v, 'asc').map((i) => v[i])).toEqual([0, 3, 10, null, undefined, NaN, ''])
    expect(isMissing(0)).toBe(false)
    expect(isMissing(Infinity)).toBe(true)
  })

  it('keeps the original order of equal values, whichever way it goes', () => {
    const v = [2, 1, 2, 1]
    expect(sortOrder(v, 'asc')).toEqual([1, 3, 0, 2])
    expect(sortOrder(v, 'desc')).toEqual([0, 2, 1, 3])
  })

  it('compares texts by the locale, with numbers inside them as numbers; numbers before texts', () => {
    configure({ locale: 'pl-PL' })
    expect(sortItems(['Łódź', 'Zabrze', 'Lublin', 'a10', 'a2'], (x) => x, 'asc')).toEqual(['a2', 'a10', 'Lublin', 'Łódź', 'Zabrze'])
    expect(compareValues(5, 'a', 'asc')).toBeLessThan(0)
    configure({ locale: 'en-GB' })
  })

  it('goes best first, then the other way, then back to none', () => {
    expect(firstDir('higher')).toBe('desc')
    expect(firstDir('lower')).toBe('asc')
    expect(firstDir(null)).toBe('desc')
    expect(firstDir()).toBe('desc')
    const a = nextSort(null, 'x', 'asc')
    expect(a).toEqual({ key: 'x', dir: 'asc' })
    const b = nextSort(a, 'x', 'asc')
    expect(b).toEqual({ key: 'x', dir: 'desc' })
    expect(nextSort(b, 'x', 'asc')).toBeNull()
    // another key starts over
    expect(nextSort(b, 'y', 'desc')).toEqual({ key: 'y', dir: 'desc' })
    expect(nextSort(nextSort(null, 'x', 'desc'), 'x', 'desc')).toEqual({ key: 'x', dir: 'asc' })
  })
})
