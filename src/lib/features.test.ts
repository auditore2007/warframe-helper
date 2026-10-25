import { describe, it, expect } from 'vitest'
import { EMPTY_PROGRESS, parseProgress } from './progress'
import { addTimer, dueTimers, markNotified, parseDuration, removeTimer } from './foundry'
import { setSellCount, sellTotals } from './sellList'
import { clampBonus, setCollectionInfo, toggleCollected } from './collection'
import { setShardSlot, MAX_SHARDS } from './shards'
import { expectedValue } from './relicValue'
import { dailyCap, rankProgress, daysToRank } from './syndicates'
import { nextArchons, teshinSchedule } from './rotations'
import type { RelicReward } from './types'
import { wtsMessages, priceTrend } from './market'
import { buildPlan } from './planner'
import { rollCycle } from './cycles'
import { gameBuildDate } from './time'
import type { Item, RelicItem } from './types'

const HOUR = 60 * 60 * 1000

describe('foundry timers', () => {
  it('adds, finds due and marks notified timers immutably', () => {
    const a = addTimer(EMPTY_PROGRESS, 'Сарина Прайм', 72 * HOUR, 1000, 't1')
    expect(a.timers).toEqual([{ id: 't1', name: 'Сарина Прайм', endsAt: 1000 + 72 * HOUR, notified: false }])
    expect(EMPTY_PROGRESS.timers).toEqual([])
    expect(dueTimers(a, 1000)).toEqual([])
    expect(dueTimers(a, 1000 + 72 * HOUR).map((t) => t.id)).toEqual(['t1'])
    const b = markNotified(a, ['t1'])
    expect(dueTimers(b, 1000 + 73 * HOUR)).toEqual([])
    expect(removeTimer(b, 't1').timers).toEqual([])
  })
  it('ignores empty names and non-positive durations', () => {
    expect(addTimer(EMPTY_PROGRESS, '  ', HOUR, 0)).toBe(EMPTY_PROGRESS)
    expect(addTimer(EMPTY_PROGRESS, 'Forma', 0, 0)).toBe(EMPTY_PROGRESS)
  })
  it('parses hour and minute fields', () => {
    expect(parseDuration('23', '30')).toBe(23.5 * HOUR)
    expect(parseDuration('', '15')).toBe(15 * 60 * 1000)
    expect(parseDuration('x', '')).toBeNull()
    expect(parseDuration('0', '0')).toBeNull()
    expect(parseDuration('-1', '0')).toBeNull()
  })
})

describe('sell list', () => {
  it('sets and removes counts', () => {
    const a = setSellCount(EMPTY_PROGRESS, 'a_prime_barrel', 3)
    expect(a.sell).toEqual({ a_prime_barrel: 3 })
    expect(setSellCount(a, 'a_prime_barrel', 0).sell).toEqual({})
    expect(setSellCount(a, 'a_prime_barrel', 2.7).sell).toEqual({ a_prime_barrel: 2 })
  })
  it('totals platinum and ducats, counting unpriced items', () => {
    const prices = { a: { median: 10, average: 9, volume: 5 } }
    const ducats = new Map([['a', 45], ['b', 15]])
    expect(sellTotals({ a: 2, b: 1 }, prices, ducats)).toEqual({ platinum: 20, ducats: 105, unpriced: 1 })
  })
})

describe('collections', () => {
  it('toggles ownership and stores lich weapon details', () => {
    const a = toggleCollected(EMPTY_PROGRESS, 'kuva:/W')
    expect(a.collection).toEqual({ 'kuva:/W': { element: null, bonus: null } })
    const b = setCollectionInfo(a, 'kuva:/W', { element: 'Toxin', bonus: 60 })
    expect(b.collection['kuva:/W']).toEqual({ element: 'Toxin', bonus: 60 })
    expect(toggleCollected(b, 'kuva:/W').collection).toEqual({})
    expect(setCollectionInfo(EMPTY_PROGRESS, 'x', { bonus: 30 }).collection.x).toEqual({ element: null, bonus: 30 })
  })
  it('clamps the element bonus to 25–60%', () => {
    expect(clampBonus(70)).toBe(60)
    expect(clampBonus(10)).toBe(25)
    expect(clampBonus(Number.NaN)).toBeNull()
  })
})

describe('archon shards', () => {
  it('sets and clears slots within the five available', () => {
    const slot = { color: 'crimson' as const, bonus: 3, tau: false }
    const a = setShardSlot(EMPTY_PROGRESS, '/Saryn', 0, slot)
    expect(a.shards['/Saryn']).toEqual([slot, null, null, null, null])
    expect(setShardSlot(a, '/Saryn', MAX_SHARDS, slot)).toBe(a)
    expect(setShardSlot(a, '/Saryn', 0, null).shards).toEqual({})
  })
})

describe('persisted state with new fields', () => {
  it('keeps valid entries and drops malformed ones', () => {
    const raw = JSON.stringify({
      version: 1,
      timers: [{ id: 'a', name: 'X', endsAt: 5, notified: false }, { id: 3 }],
      sell: { ok: 2, bad: -1, worse: 'x' },
      collection: { k: { element: 'Heat', bonus: 40 }, broken: 5 },
      shards: { '/F': [{ color: 'azure', bonus: 0, tau: true }, null, { color: 'pink', bonus: 1, tau: false }] },
    })
    const p = parseProgress(raw)
    expect(p.timers).toHaveLength(1)
    expect(p.sell).toEqual({ ok: 2 })
    expect(p.collection).toEqual({ k: { element: 'Heat', bonus: 40 } })
    expect(p.shards['/F']).toEqual([{ color: 'azure', bonus: 0, tau: true }, null, null, null, null])
  })
  it('fills defaults for state saved by v1.0', () => {
    const p = parseProgress(JSON.stringify({ version: 1 }))
    expect(p.timers).toEqual([])
    expect(p.sell).toEqual({})
    expect(p.collection).toEqual({})
    expect(p.shards).toEqual({})
  })
})

describe('relic value', () => {
  const reward = (slug: string | null, intact: number, radiant: number): RelicReward => ({ name: slug ?? 'Forma', slug, intact, radiant })
  const rewards = [reward('a', 25.33, 16.67), reward(null, 25.33, 16.67), reward('b', 2, 10)]
  const prices = { a: { median: 10, average: 9, volume: 1 }, b: { median: 100, average: 90, volume: 1 } }
  it('weights each reward price by its chance', () => {
    expect(expectedValue(rewards, prices, 'intact')).toEqual({ value: 4.53, priced: 3, total: 3 })
    expect(expectedValue(rewards, prices, 'radiant').value).toBeCloseTo(11.67, 2)
  })
  it('reports unpriced rewards that have a market slug', () => {
    expect(expectedValue(rewards, {}, 'intact')).toEqual({ value: 0, priced: 1, total: 3 })
  })
})

describe('syndicate standing', () => {
  it('computes the daily cap from mastery rank', () => {
    expect(dailyCap(22)).toBe(27000)
    expect(dailyCap(null)).toBe(16000)
  })
  it('splits cumulative standing into the current rank', () => {
    expect(rankProgress(75166, 3, 5)).toEqual({ inRank: 4166, width: 70000, toNext: 65834 })
    expect(rankProgress(318233, 5, 5)).toEqual({ inRank: 78233, width: 132000, toNext: null })
    expect(rankProgress(0, 0, 5)).toEqual({ inRank: 0, width: 5000, toNext: 5000 })
    expect(rankProgress(-71000, -2, 5)).toEqual({ inRank: 0, width: 5000, toNext: null })
  })
  it('estimates days to the max rank at the daily cap', () => {
    expect(daysToRank(75166, 3, 5, 27000)).toBe(Math.ceil((65834 + 99000) / 27000))
    expect(daysToRank(318233, 5, 5, 27000)).toBe(0)
    expect(daysToRank(-71000, -2, 5, 27000)).toBeNull()
  })
})

describe('rotations', () => {
  const steelPath = {
    activation: '2026-10-19T00:00:00.000Z',
    expiry: '2026-10-25T23:59:59.000Z',
    currentReward: { name: 'B', cost: 2 },
    rotation: [{ name: 'A', cost: 1 }, { name: 'B', cost: 2 }, { name: 'C', cost: 3 }],
  }
  it('lists upcoming Teshin rewards week by week', () => {
    const list = teshinSchedule(steelPath, 3)
    expect(list.map((r) => r.name)).toEqual(['C', 'A', 'B'])
    expect(new Date(list[0].startsAt).toISOString()).toBe('2026-10-26T00:00:00.000Z')
    expect(teshinSchedule({ ...steelPath, rotation: [] }, 3)).toEqual([])
  })
  it('predicts the next archons in the fixed order', () => {
    expect(nextArchons('Archon Amar Narmer', 2)).toEqual(['Nira', 'Boreal'])
    expect(nextArchons('Archon Boreal', 1)).toEqual(['Amar'])
    expect(nextArchons(undefined, 2)).toEqual([])
  })
})

describe('trade chat message', () => {
  it('lists items with price and count and splits long lists', () => {
    expect(wtsMessages([{ en: 'Saryn Prime Chassis Blueprint', platinum: 12, count: 2 }, { en: 'Forma', platinum: null, count: 1 }])).toEqual([
      'WTS [Saryn Prime Chassis Blueprint] x2 12p [Forma]',
    ])
    const many = Array.from({ length: 12 }, (_, i) => ({ en: `Item Number ${i}`, platinum: 10, count: 1 }))
    const msgs = wtsMessages(many)
    expect(msgs.length).toBeGreaterThan(1)
    expect(msgs.every((m) => m.startsWith('WTS ') && m.length <= 150)).toBe(true)
    expect(wtsMessages([])).toEqual([])
  })
})

describe('farm planner', () => {
  const frame: Item = {
    uniqueName: '/Saryn', name: 'Сарина Прайм', category: 'Warframes',
    components: [
      { name: 'Chassis', uniqueName: '/Recipes/SarynPrimeChassis', drops: [
        { location: 'Lith S4 Relic', chance: 11, rarity: 'Uncommon' },
        { location: 'Lith S4 Relic (Radiant)', chance: 20, rarity: 'Uncommon' },
        { location: 'Axi V1 Relic', chance: 2, rarity: 'Rare' },
      ] },
      { name: 'Systems', uniqueName: '/Recipes/SarynPrimeSystems', drops: [{ location: 'Lith S4 Relic', chance: 25.33, rarity: 'Common' }] },
      { name: 'Neuroptics', uniqueName: '/Recipes/SarynPrimeHelmet', drops: [{ location: 'Mercury/Apollodorus (Survival), Rotation C', chance: 5 }] },
      { name: 'Orokin Cell', uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCell', itemCount: 3 },
    ],
  }
  const relics: RelicItem[] = [
    { id: 'r1', name: 'Lith S4', tier: 'Lith', code: 'S4', vaulted: false, rewards: [] },
    { id: 'r2', name: 'Axi V1', tier: 'Axi', code: 'V1', vaulted: true, rewards: [] },
  ]
  it('groups missing parts by relic, farmable first, and skips owned parts and resources', () => {
    const plan = buildPlan([frame], { '/Saryn::Systems': true }, relics)
    expect(plan.relics.map((r) => [r.key, r.vaulted, r.needs.map((n) => `${n.part}:${n.chance}`)])).toEqual([
      ['Lith S4', false, ['Chassis:11']],
      ['Axi V1', true, ['Chassis:2']],
    ])
    expect(plan.other.map((o) => o.part)).toEqual(['Neuroptics'])
    expect(plan.done).toEqual([])
  })
  it('reports goals that are fully collected', () => {
    const owned = { '/Saryn::Chassis': true as const, '/Saryn::Systems': true as const, '/Saryn::Neuroptics': true as const }
    const plan = buildPlan([frame], owned, relics)
    expect(plan.relics).toEqual([])
    expect(plan.done).toEqual(['Сарина Прайм'])
  })
})

describe('cycle roll-forward', () => {
  const MIN = 60_000
  const t0 = Date.UTC(2026, 9, 25, 15, 51)
  it('keeps a cycle that has not expired', () => {
    expect(rollCycle('cetusCycle', { state: 'day', expiry: new Date(t0).toISOString() }, t0 - MIN)).toEqual({ state: 'day', expiry: t0 })
  })
  it('steps through the fixed sequence when the API lags', () => {
    expect(rollCycle('cetusCycle', { state: 'day', expiry: new Date(t0).toISOString() }, t0 + 10 * MIN)).toEqual({ state: 'night', expiry: t0 + 50 * MIN, startedAt: t0 })
    expect(rollCycle('cetusCycle', { state: 'day', expiry: new Date(t0).toISOString() }, t0 + 60 * MIN)).toEqual({ state: 'day', expiry: t0 + 150 * MIN, startedAt: t0 + 50 * MIN })
    expect(rollCycle('duviriCycle', { state: 'envy', expiry: new Date(t0).toISOString() }, t0 + MIN)).toEqual({ state: 'sorrow', expiry: t0 + 120 * MIN, startedAt: t0 })
  })
  it('leaves unknown states untouched', () => {
    expect(rollCycle('cetusCycle', { state: 'odd', expiry: new Date(t0).toISOString() }, t0 + MIN)).toEqual({ state: 'odd', expiry: t0 })
  })
})

describe('game build label', () => {
  it('turns the build label into a date', () => {
    expect(gameBuildDate('2026.10.22.13.12/4352xsmAuTuk8KzkemTuFw')).toBe('22.10.2026')
    expect(gameBuildDate(undefined)).toBeNull()
    expect(gameBuildDate('garbage')).toBeNull()
  })
})

describe('price trend', () => {
  const pt = (t: number, median: number, volume = 1) => ({ t, median, min: null, max: null, volume })
  it('compares the last median with the first and finds the range', () => {
    expect(priceTrend([pt(1, 80), pt(2, 60), pt(3, 100)])).toEqual({ last: 100, changePct: 25, low: 60, high: 100, volume: 3 })
  })
  it('handles empty and single-point series', () => {
    expect(priceTrend([])).toBeNull()
    expect(priceTrend([pt(1, 10)])).toEqual({ last: 10, changePct: 0, low: 10, high: 10, volume: 1 })
  })
})
