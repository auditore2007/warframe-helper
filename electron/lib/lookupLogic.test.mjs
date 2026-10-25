// @vitest-environment node
import { describe, it, expect } from 'vitest'
import logic from './lookupLogic.cjs'

const { isGameTitle, createTrigger } = logic

describe('isGameTitle', () => {
  it('recognises the game window but not this app', () => {
    expect(isGameTitle('Warframe')).toBe(true)
    expect(isGameTitle(' Warframe ')).toBe(true)
    expect(isGameTitle('Warframe Helper')).toBe(false)
    expect(isGameTitle('warframe.market - Opera')).toBe(false)
    expect(isGameTitle('')).toBe(false)
  })
})

describe('createTrigger', () => {
  const at = (x, y) => ({ x, y })
  it('fires once after the cursor rests in hover mode', () => {
    const t = createTrigger()
    const s = { mode: 'hover', delayMs: 700 }
    expect(t.tick(at(100, 100), false, 0, s)).toBe(false)
    expect(t.tick(at(101, 100), false, 400, s)).toBe(false)
    expect(t.tick(at(101, 101), false, 750, s)).toBe(true)
    expect(t.tick(at(101, 101), false, 2000, s)).toBe(false)
    expect(t.tick(at(300, 300), false, 2100, s)).toBe(false)
    expect(t.tick(at(300, 300), false, 2900, s)).toBe(true)
  })
  it('fires on mouse release in click mode', () => {
    const t = createTrigger()
    const s = { mode: 'click', delayMs: 700 }
    expect(t.tick(at(10, 10), true, 0, s)).toBe(false)
    expect(t.tick(at(10, 10), true, 50, s)).toBe(false)
    expect(t.tick(at(10, 10), false, 100, s)).toBe(true)
    expect(t.tick(at(10, 10), false, 5000, s)).toBe(false)
  })
  it('tells when the cursor left the scanned spot', () => {
    const t = createTrigger()
    const s = { mode: 'hover', delayMs: 300 }
    t.tick(at(0, 0), false, 0, s)
    t.tick(at(0, 0), false, 400, s)
    expect(t.movedAway(at(50, 0))).toBe(false)
    expect(t.movedAway(at(400, 0))).toBe(true)
  })
})
