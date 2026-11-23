import { afterEach, describe, expect, it } from 'vitest'
import { configure, t } from './config'
import { axisTick, fixed, fmt, fmtEst, roundEst, slug } from './format'
import { hourRuns, hoursOf, sameRange } from './hours'
import { inkOn, ramp, shade } from './color'
import { bearingOf, cameFrom, dirLabel } from './directions'
import { csvNumber, toCsv } from './files'
import { arrowsSvg, labelHtml, pieSvg } from './pie'
import { en } from '../strings/en'
import { pl } from '../strings/pl'

afterEach(() => configure({ locale: 'en-GB', strings: en }))

describe('configure', () => {
  it('has every text in both languages', () => {
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort())
    for (const k of Object.keys(en)) expect(typeof pl[k]).toBe(typeof en[k])
  })

  it('falls back to English and fills texts in', () => {
    configure({ strings: { total: 'suma' } })
    expect(t('total')).toBe('suma')
    expect(t('close')).toBe('Close')
    expect(t('treeSome', 2, 5)).toBe('2 of 5')
  })
})

describe('numbers', () => {
  it('follow the locale', () => {
    expect(fmt(12345.6)).toBe('12,346')
    expect(fixed(2.5)).toBe('2.5')
    expect(axisTick(3800)).toBe('3.8k')
    configure({ locale: 'pl-PL', strings: pl })
    expect(fmt(12345.6)).toMatch(/^12\s346$/)
    expect(fixed(2.5)).toBe('2,5')
    expect(axisTick(3800)).toBe('3,8 tys.')
    expect(fmt(null)).toBe('—')
  })

  it('round estimates to two figures', () => {
    expect(roundEst(6427)).toBe(6400)
    expect(roundEst(87)).toBe(90)
    expect(fmtEst(184999)).toBe('≈180,000')
  })

  it('make file names', () => {
    expect(slug('Szczyt południowy 7–9, Łódź')).toBe('szczyt-poludniowy-7-9-lodz')
  })
})

describe('hours', () => {
  it('wrap over midnight', () => {
    expect(hoursOf([22, 2])).toEqual([22, 23, 0, 1])
    expect(hoursOf([0, 24])).toHaveLength(24)
    expect(sameRange([7, 9], [7, 9])).toBe(true)
  })

  it('join into runs, in any order', () => {
    expect(hourRuns([16, 15, 7, 8])).toBe('07:00–09:00, 15:00–17:00')
    expect(hourRuns([23])).toBe('23:00–00:00')
    expect(hourRuns([], 'none')).toBe('none')
  })
})

describe('colours', () => {
  it('put dark ink on yellows only', () => {
    expect(inkOn('#c98500')).toBe('#111')
    expect(inkOn('#e4572e')).toBe('#fff')
    expect(inkOn('#777777')).toBe('#fff')
  })

  it('shade, starting from the colour itself', () => {
    expect(shade('#e4572e', 0)).toBe('#e4572e')
    expect(shade('#808080', 1)).toBe('#a6a6a6')
  })

  it('step by value and name the steps', () => {
    const r = ramp([[10, 'a'], [20, 'b'], [Infinity, 'c']])
    expect([9, 10, 25].map(r.color)).toEqual(['a', 'b', 'c'])
    expect(r.legend().map((l) => l.label)).toEqual(['< 10', '10–20', '> 20'])
  })
})

describe('directions', () => {
  it('point where the traffic goes', () => {
    expect(dirLabel('W>E')).toBe('→ W → E')
    expect(cameFrom('E')).toBe('E>W')
    expect(bearingOf('NE>SW')).toBe(225)
    expect(bearingOf('centre')).toBeUndefined()
  })
})

describe('CSV', () => {
  it('uses what Excel expects in the locale', () => {
    expect(toCsv([['a', 'b,c'], [1, null]])).toBe('﻿a,"b,c"\r\n1,\r\n')
    expect(csvNumber(1.25, 1)).toBe('1.3')
    configure({ locale: 'pl-PL' })
    expect(toCsv([['a', 'b,c', 'd;e', 'f"']])).toBe('﻿a;b,c;"d;e";"f"""\r\n')
    expect(csvNumber(12.34, 1)).toBe('12,3')
    expect(csvNumber(null)).toBe('')
  })
})

describe('map icons', () => {
  it('draw a slice per part that has a value', () => {
    const svg = pieSvg([{ color: 'red', value: 1 }, { color: 'blue', value: 3 }, { color: 'lime', value: 0 }], 10)
    expect(svg.match(/<path/g)).toHaveLength(2)
    expect(svg).not.toContain('lime')
    expect(pieSvg([{ color: 'red', value: 0 }], 10)).toContain('#3a3f4b')
  })

  it('escape label text', () => {
    expect(labelHtml([{ text: '<1%' }])).toContain('&lt;1%')
  })

  it('fade the directions not lit', () => {
    expect(arrowsSvg([0, 180], 1).match(/opacity="[\d.]+"/g)).toEqual(['opacity="0.2"', 'opacity="1"'])
    expect(arrowsSvg([0, undefined]).match(/<g /g)).toHaveLength(1)
  })
})
