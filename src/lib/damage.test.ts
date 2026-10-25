import { describe, it, expect } from 'vitest'
import { calcDamage, combineElements, factionMultiplier, type WeaponStats } from './damage'
import { FACTIONS } from '../data/factions'

const soma: WeaponStats = {
  damage: { impact: 1.2, puncture: 4.8, slash: 6 },
  critChance: 0.3, critMultiplier: 3, statusChance: 0.1,
  fireRate: 15, multishot: 1, magazine: 200, reload: 3,
}

describe('combineElements', () => {
  it('combines base elements pairwise in mod order', () => {
    expect(combineElements([['heat', 10], ['electricity', 5]])).toEqual({ radiation: 15 })
    expect(combineElements([['cold', 1], ['toxin', 2], ['heat', 3]])).toEqual({ viral: 3, heat: 3 })
    expect(combineElements([['toxin', 1], ['electricity', 1], ['heat', 1], ['cold', 1]])).toEqual({ corrosive: 2, blast: 2 })
  })
  it('merges repeats of the same element before combining', () => {
    expect(combineElements([['heat', 1], ['heat', 2], ['cold', 3]])).toEqual({ blast: 6 })
  })
})

describe('calcDamage', () => {
  it('returns base numbers without mods', () => {
    const r = calcDamage(soma, [])
    expect(r.total).toBeCloseTo(12, 5)
    expect(r.avgCrit).toBeCloseTo(1.6, 5)
    expect(r.burstDps).toBeCloseTo(12 * 1.6 * 15, 5)
  })
  it('applies damage, multishot, crit and elemental mods', () => {
    const r = calcDamage(soma, [
      { damage: 1.65 }, { multishot: 0.9 }, { critChance: 1.5 }, { critDamage: 1.2 },
      { element: 'heat', elementValue: 0.9 }, { element: 'electricity', elementValue: 0.9 },
    ])
    expect(r.damage.radiation).toBeCloseTo(57.24, 2)
    expect(r.damage.slash).toBeCloseTo(15.9, 2)
    expect(r.total).toBeCloseTo(89.04, 2)
    expect(r.critChance).toBeCloseTo(0.75, 5)
    expect(r.critMultiplier).toBeCloseTo(6.6, 5)
    expect(r.perShot).toBeCloseTo(879.7152, 2)
    expect(r.burstDps).toBeCloseTo(13195.728, 1)
    expect(r.sustainedDps).toBeCloseTo(13195.728 * (200 / 15) / (200 / 15 + 3), 1)
  })
  it('combines innate elements after the mod elements', () => {
    const nukor: WeaponStats = { ...soma, damage: { radiation: 21 } }
    const r = calcDamage(nukor, [{ element: 'toxin', elementValue: 0.9 }])
    expect(r.damage).toEqual({ radiation: 21, toxin: 21 * 0.9 })
    const innateCold: WeaponStats = { ...soma, damage: { impact: 10, cold: 10 } }
    expect(calcDamage(innateCold, [{ element: 'toxin', elementValue: 1 }]).damage).toEqual({ impact: 10, viral: 30 })
  })
  it('applies fire rate and status mods', () => {
    const r = calcDamage(soma, [{ fireRate: 0.6 }, { status: 0.9 }, { fireRate: -0.2 }])
    expect(r.fireRate).toBeCloseTo(21, 5)
    expect(r.statusChance).toBeCloseTo(0.19, 5)
  })
})

describe('factionMultiplier', () => {
  const grineer = FACTIONS.find((f) => f.id === 'grineer')!
  const kuva = FACTIONS.find((f) => f.id === 'kuva')!
  it('weights each damage type by the faction weakness', () => {
    expect(factionMultiplier({ impact: 10, slash: 10 }, grineer)).toBeCloseTo(1.25, 5)
    expect(factionMultiplier({ heat: 10 }, kuva)).toBeCloseTo(0.5, 5)
    expect(factionMultiplier({ corrosive: 30, heat: 10 }, kuva)).toBeCloseTo((45 + 5) / 40, 5)
    expect(factionMultiplier({}, grineer)).toBe(1)
  })
})
