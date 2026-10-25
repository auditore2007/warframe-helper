// @vitest-environment node
import { describe, it, expect } from 'vitest'
import catalog from './catalog.cjs'
import market from './market.cjs'

const { splitCatalog, buildRelics, refinementOf, parseRelicName } = catalog
const { isMarketSlug, slimMarketItems, summarizeOrders, mapDucatPrices, summarizeHistory, slimRivenWeapons, slimRivenAttributes, rivenAuctionsUrl, slimAuctions } = market

const relic = (suffix, chance, vaulted = true) => ({
  uniqueName: `/Lotus/Types/Game/Projections/T4VoidProjectionE${suffix}`,
  name: 'Реликвия Акси A1',
  category: 'Relics',
  vaulted,
  rewards: [{ chance, rarity: 'Rare', item: { name: 'Saryn Prime Chassis Blueprint', uniqueName: '/X/Chassis', warframeMarket: { urlName: 'saryn_prime_chassis_blueprint' } } }],
})

describe('relics', () => {
  it('reads refinement from the unique name', () => {
    expect(refinementOf('/x/AxiBronze')).toBe('intact')
    expect(refinementOf('/x/AxiPlatinum')).toBe('radiant')
    expect(refinementOf('/x/AxiSilver')).toBe('exceptional')
    expect(refinementOf('/x/Axi')).toBe('intact')
  })
  it('parses tier and code from the localized name', () => {
    expect(parseRelicName('Реликвия Акси A1')).toEqual({ tier: 'Axi', code: 'A1' })
    expect(parseRelicName('Реликвия Лит G5')).toEqual({ tier: 'Lith', code: 'G5' })
    expect(parseRelicName('')).toEqual({ tier: '', code: '' })
  })
  it('merges refinements into intact and radiant chances', () => {
    const [r] = buildRelics([relic('Bronze', 2), relic('Silver', 4), relic('Platinum', 10)])
    expect(r).toMatchObject({ id: '/Lotus/Types/Game/Projections/T4VoidProjectionEBronze', tier: 'Axi', code: 'A1', vaulted: true })
    expect(r.rewards).toEqual([
      { name: 'Saryn Prime Chassis Blueprint', uniqueName: '/X/Chassis', slug: 'saryn_prime_chassis_blueprint', rarity: 'Rare', intact: 2, radiant: 10 },
    ])
  })
  it('drops relics that have no intact entry', () => {
    expect(buildRelics([relic('Platinum', 10)])).toEqual([])
  })
})

describe('splitCatalog', () => {
  it('routes items into datasets and slims them', () => {
    const out = splitCatalog([
      { category: 'Mods', type: 'Primary Mod', name: 'Serration', uniqueName: '/m', levelStats: [{ stats: ['+15%'] }, { stats: ['+165%'] }], drops: [{ location: 'A', chance: 1 }, { location: 'B', chance: 5 }] },
      { category: 'Mods', type: 'Rifle Riven Mod', name: 'Riven' },
      { category: 'Arcanes', type: 'Warframe Arcane', name: 'Energize', levelStats: [{ stats: ['x'] }] },
      { category: 'Arcanes', name: 'No stats' },
      { category: 'Pets', name: 'Smeeta', masterable: true },
      { category: 'Pets', name: 'Egg', masterable: false },
      { category: 'Sentinels', name: 'Carrier' },
      { category: 'Warframes', name: 'Voidrig', uniqueName: '/Lotus/Powersuits/EntratiMech/ThanoTech' },
      { category: 'Warframes', name: 'Saryn', uniqueName: '/Lotus/Powersuits/Saryn/Saryn' },
      { category: 'Mods', type: 'Mod Set Mod', uniqueName: '/Sets/Amar/AmarSetMod' },
      { category: 'Relics', name: 'Void Relic', uniqueName: '/Lotus/Types/Game/Projections/Generic' },
      relic('Bronze', 2),
      null,
    ])
    expect(out.mods).toHaveLength(1)
    expect(out.mods[0].stats).toEqual(['+165%'])
    expect(out.mods[0].drops.map((d) => d.location)).toEqual(['B', 'A'])
    expect(out.arcanes.map((a) => a.name)).toEqual(['Energize'])
    expect(out.companions.map((c) => c.name)).toEqual(['Smeeta', 'Carrier', 'Voidrig'])
    expect(out.companions[2].category).toBe('Necramech')
    expect(out.relics).toHaveLength(1)
    expect(splitCatalog(undefined)).toEqual({ mods: [], arcanes: [], relics: [], companions: [] })
  })
})

describe('market', () => {
  it('validates slugs', () => {
    expect(isMarketSlug('saryn_prime_set')).toBe(true)
    expect(isMarketSlug('../x')).toBe(false)
    expect(isMarketSlug(null)).toBe(false)
  })
  it('slims the items list', () => {
    const json = { data: [{ id: 'i1', slug: 'a_set', gameRef: '/A', ducats: 45, tags: ['prime'], i18n: { en: { name: 'A Set' }, ru: { name: 'А' } } }, { slug: 'BAD SLUG' }] }
    expect(slimMarketItems(json)).toEqual([{ id: 'i1', slug: 'a_set', gameRef: '/A', en: 'A Set', ru: 'А', ducats: 45, tags: ['prime'] }])
    expect(slimMarketItems(null)).toEqual([])
  })
  it('summarises only active orders', () => {
    const user = (status, name = 'u') => ({ status, ingameName: name })
    const json = {
      data: {
        sell: [{ platinum: 10, quantity: 1, user: user('offline') }, { platinum: 30, quantity: 2, user: user('ingame', 'b') }, { platinum: 25, quantity: 1, user: user('online', 'a') }],
        buy: [{ platinum: 15, user: user('ingame') }, { platinum: 20, user: user('offline') }],
      },
    }
    const s = summarizeOrders(json)
    expect(s.sell).toBe(25)
    expect(s.buy).toBe(15)
    expect(s.sellers.map((x) => x.name)).toEqual(['a', 'b'])
    expect(summarizeOrders({})).toEqual({ sell: null, buy: null, sellers: [] })
  })
  it('maps daily ducat statistics to slugs', () => {
    const items = [{ id: 'i1', slug: 'a_prime_blueprint' }, { id: 'i2', slug: 'b_prime_barrel' }]
    const json = {
      payload: {
        previous_day: [
          { item: 'i1', median: 12, wa_price: 11.4, volume: 80, ducats: 45 },
          { item: 'i2', median: 'bad', wa_price: 3, volume: 2, ducats: 15 },
          { item: 'unknown', median: 5, wa_price: 5, volume: 1, ducats: 15 },
        ],
      },
    }
    expect(mapDucatPrices(json, items)).toEqual({
      a_prime_blueprint: { median: 12, average: 11.4, volume: 80 },
      b_prime_barrel: { median: 3, average: 3, volume: 2 },
    })
    expect(mapDucatPrices(null, items)).toEqual({})
  })
  it('compresses closed-trade statistics into day and hour points', () => {
    const row = (datetime, median, volume) => ({ datetime, median, volume, min_price: median - 1, max_price: median + 1, wa_price: median })
    const json = {
      payload: {
        statistics_closed: {
          '90days': [row('2026-10-02T00:00:00.000+00:00', 70, 10), row('2026-10-01T00:00:00.000+00:00', 75, 5), { datetime: 'bad' }],
          '48hours': [row('2026-10-25T10:00:00.000+00:00', 68, 2)],
        },
        statistics_live: { '90days': [row('2026-10-01T00:00:00.000+00:00', 999, 1)] },
      },
    }
    const h = summarizeHistory(json)
    expect(h.days).toEqual([
      { t: Date.UTC(2026, 9, 1), median: 75, min: 74, max: 76, volume: 5 },
      { t: Date.UTC(2026, 9, 2), median: 70, min: 69, max: 71, volume: 10 },
    ])
    expect(h.hours).toHaveLength(1)
    expect(summarizeHistory(null)).toEqual({ days: [], hours: [] })
  })
  it('slims riven weapon and attribute lists', () => {
    const w = { data: [{ slug: 'soma', rivenType: 'rifle', disposition: 1.15, i18n: { en: { name: 'Soma' }, ru: { name: 'Сома' } } }, { slug: 'BAD' }] }
    expect(slimRivenWeapons(w)).toEqual([{ slug: 'soma', en: 'Soma', ru: 'Сома', type: 'rifle', disposition: 1.15 }])
    const a = { data: [{ slug: 'critical_chance', unit: 'percent', exclusiveTo: null, positiveOnly: false, i18n: { en: { name: 'Critical Chance' }, ru: { name: 'Шанс крит.' } } }] }
    expect(slimRivenAttributes(a)).toEqual([{ slug: 'critical_chance', en: 'Critical Chance', ru: 'Шанс крит.', unit: 'percent', positiveOnly: false, negativeOnly: false, exclusiveTo: null }])
  })
  it('builds a safe auction search url', () => {
    expect(rivenAuctionsUrl({ weapon: 'soma', positive: ['critical_chance', 'multishot'], negative: 'zoom' })).toBe(
      'https://api.warframe.market/v1/auctions/search?type=riven&weapon_url_name=soma&sort_by=price_asc&buyout_policy=direct&positive_stats=critical_chance%2Cmultishot&negative_stats=zoom')
    expect(rivenAuctionsUrl({ weapon: 'soma' })).toBe('https://api.warframe.market/v1/auctions/search?type=riven&weapon_url_name=soma&sort_by=price_asc&buyout_policy=direct')
    expect(() => rivenAuctionsUrl({ weapon: '../x' })).toThrow()
    expect(() => rivenAuctionsUrl({ weapon: 'soma', positive: ['a', 'b', 'c', 'd'] })).toThrow()
  })
  it('slims auctions and sorts by price', () => {
    const lot = (id, buyout, status) => ({ id, buyout_price: buyout, starting_price: buyout, closed: false, visible: true,
      owner: { ingame_name: 'p' + id, status }, item: { name: 'crita', re_rolls: 2, mastery_level: 12, attributes: [{ url_name: 'critical_chance', value: 24, positive: true }] } })
    const json = { payload: { auctions: [lot('b', 50, 'ingame'), lot('a', 30, 'offline'), { id: 'x', closed: true }] } }
    expect(slimAuctions(json).map((x) => [x.id, x.price, x.status])).toEqual([['a', 30, 'offline'], ['b', 50, 'ingame']])
    expect(slimAuctions(json)[0].attributes).toEqual([{ slug: 'critical_chance', value: 24, positive: true }])
    expect(slimAuctions(null)).toEqual([])
  })
})
