import { describe, it, expect } from 'vitest'
import { formatCountdown, msUntil, formatRelative, gameDayKey, gameWeekKey, nextDailyReset, nextWeeklyReset } from './time'
import { rankFromXp, masteryStatus, maxRankOf, masteryPointsForRank, isFrameLike } from './mastery'
import { componentRu, dropLocationRu, isPrimaryDropLocation, missionRu, factionRu, cycleRu, rarityRu, pluralRu } from './i18n'
import { baseKeyFromWiki, imageUrl, wikiUrl } from './api'
import type { Item } from './types'
import { isResourceComponent } from './parts'
import { buildMarketIndex, marketItemFor, betterForDucats, whisperText } from './market'
import { cleanGameText, matchesQuery, wikiKey } from './text'

describe('time', () => {
  it('formats countdowns at every scale', () => {
    expect(formatCountdown(0)).toBe('обновляется')
    expect(formatCountdown(NaN)).toBe('обновляется')
    expect(formatCountdown(249_000)).toBe('4:09')
    expect(formatCountdown(65 * 60_000)).toBe('1 ч 05 мин')
    expect(formatCountdown(52 * 3_600_000)).toBe('2 д 4 ч')
  })
  it('computes ms until an iso date', () => {
    expect(msUntil('1970-01-01T00:00:01.000Z', 0)).toBe(1000)
    expect(msUntil(undefined, 0)).toBeNaN()
  })
  it('formats relative times', () => {
    expect(formatRelative(undefined, 0)).toBe('никогда')
    expect(formatRelative(1000, 2000)).toBe('только что')
    expect(formatRelative(0, 5 * 60_000)).toBe('5 мин назад')
    expect(formatRelative(0, 3 * 3_600_000)).toBe('3 ч назад')
    expect(formatRelative(0, 2 * 86_400_000)).toBe('2 д назад')
  })
  it('knows daily and weekly reset boundaries in UTC', () => {
    const thu = Date.UTC(2026, 9, 22, 17, 0) // Thursday
    expect(gameDayKey(thu)).toBe('2026-10-22')
    expect(gameWeekKey(thu)).toBe('2026-10-19')
    expect(nextDailyReset(thu)).toBe(Date.UTC(2026, 9, 23))
    expect(nextWeeklyReset(thu)).toBe(Date.UTC(2026, 9, 26))
    expect(gameWeekKey(Date.UTC(2026, 9, 25, 23))).toBe('2026-10-19') // Sunday
  })
})

describe('mastery', () => {
  const frame: Item = { uniqueName: '/F', name: 'F', category: 'Warframes' }
  const gun: Item = { uniqueName: '/G', name: 'G', category: 'Primary' }
  it('uses different affinity curves', () => {
    expect(rankFromXp(900_000, 'Warframes')).toBe(30)
    expect(rankFromXp(450_000, 'Primary')).toBe(30)
    expect(rankFromXp(449_999, 'Primary')).toBe(29)
    expect(rankFromXp(-1, 'Primary')).toBe(0)
    expect(rankFromXp(5_000_000, 'Primary', 40)).toBe(40)
    expect(isFrameLike('Pets')).toBe(true)
  })
  it('reports status from profile xp', () => {
    const xp = new Map([['/F', 900_000], ['/G', 2000]])
    expect(masteryStatus(frame, xp)).toEqual({ rank: 30, maxRank: 30, mastered: true, seen: true })
    expect(masteryStatus(gun, xp).mastered).toBe(false)
    expect(masteryStatus({ ...gun, uniqueName: '/X' }, xp).seen).toBe(false)
    expect(maxRankOf({ maxLevelCap: 40 })).toBe(40)
    expect(masteryPointsForRank(10)).toBe(250_000)
  })
})

describe('i18n', () => {
  it('translates parts and keeps unknown names', () => {
    expect(componentRu('Neuroptics')).toBe('Нейрооптика')
    expect(componentRu('Saryn Prime Systems')).toBe('Система')
    expect(componentRu('Mystery')).toBe('Mystery')
  })
  it('formats drop locations', () => {
    expect(dropLocationRu('Lith S4 Relic (Radiant)')).toBe('Реликвия Lith S4, сияющая')
    expect(dropLocationRu('Axi A1 Relic')).toBe('Реликвия Axi A1')
    expect(dropLocationRu('Mercury/Terminus (Caches), Rot C')).toBe('Mercury/Terminus (тайники), ротация C')
    expect(isPrimaryDropLocation('Lith S4 Relic (Radiant)')).toBe(false)
    expect(isPrimaryDropLocation('Lith S4 Relic')).toBe(true)
  })
  it('translates game vocabulary', () => {
    expect(missionRu('Survival')).toBe('Выживание')
    expect(missionRu('???')).toBe('???')
    expect(factionRu('Grineer')).toBe('Гринир')
    expect(cycleRu('Night')).toBe('Ночь')
    expect(rarityRu('Rare')).toBe('Редкая')
    expect(rarityRu()).toBe('')
  })
  it('pluralises in Russian', () => {
    expect(pluralRu(1, 'предмет', 'предмета', 'предметов')).toBe('предмет')
    expect(pluralRu(3, 'предмет', 'предмета', 'предметов')).toBe('предмета')
    expect(pluralRu(12, 'предмет', 'предмета', 'предметов')).toBe('предметов')
    expect(pluralRu(25, 'предмет', 'предмета', 'предметов')).toBe('предметов')
  })
})

describe('api helpers', () => {
  it('derives the english base name from the wiki url', () => {
    expect(baseKeyFromWiki('https://wiki.warframe.com/w/Saryn%2FPrime')).toBe('Saryn')
    expect(baseKeyFromWiki('https://wiki.warframe.com/w/Excalibur_Umbra')).toBe('Excalibur')
    expect(baseKeyFromWiki(undefined)).toBeNull()
    expect(baseKeyFromWiki('https://x.com')).toBeNull()
  })
  it('builds image and wiki urls', () => {
    expect(imageUrl('Saryn Prime.png')).toBe('https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/Saryn%20Prime.png')
    expect(imageUrl()).toBeUndefined()
    expect(wikiUrl('Void Relic')).toBe('https://wiki.warframe.com/w/Void_Relic')
  })
})

describe('parts', () => {
  it('separates collectable parts from bulk resources', () => {
    expect(isResourceComponent({ name: 'Chassis', uniqueName: '/Lotus/Types/Recipes/WarframeRecipes/SarynChassis' })).toBe(false)
    expect(isResourceComponent({ name: 'Bronco', uniqueName: '/Lotus/Weapons/Tenno/Pistol/Bronco' })).toBe(false)
    expect(isResourceComponent({ name: 'Cortege Barrel', uniqueName: '/Lotus/Types/Gameplay/InfestedMicroplanet/X' })).toBe(false)
    expect(isResourceComponent({ name: 'Alloy Plate', uniqueName: '/Lotus/Types/Items/MiscItems/AlloyPlate' })).toBe(true)
    expect(isResourceComponent({ name: 'Orokin Cell' })).toBe(true)
    expect(isResourceComponent({ name: 'Blueprint' })).toBe(false)
  })
})

describe('market helpers', () => {
  const items = [
    { slug: 'saryn_prime_chassis_blueprint', gameRef: '/R/SarynPrimeChassisBlueprint', en: 'Saryn Prime Chassis Blueprint', ru: 'Сарина Прайм: Каркас', ducats: 100, tags: [] },
    { slug: 'no_ref', gameRef: null, en: 'X', ru: null, ducats: null, tags: [] },
  ]
  it('indexes and resolves component unique names', () => {
    const idx = buildMarketIndex(items)
    expect(marketItemFor(idx, '/R/SarynPrimeChassisComponent')?.slug).toBe('saryn_prime_chassis_blueprint')
    expect(marketItemFor(idx, '/R/SarynPrimeChassisBlueprint')?.slug).toBe('saryn_prime_chassis_blueprint')
    expect(marketItemFor(idx, undefined)).toBeUndefined()
    expect(idx.bySlug.get('no_ref')?.en).toBe('X')
    expect(buildMarketIndex(undefined).byRef.size).toBe(0)
  })
  it('suggests ducats when platinum is cheap', () => {
    expect(betterForDucats(5, 100)).toBe(true)
    expect(betterForDucats(40, 100)).toBe(false)
    expect(betterForDucats(null, 100)).toBe(false)
    expect(betterForDucats(0, 45)).toBe(true)
  })
  it('builds the in-game whisper', () => {
    expect(whisperText('Tenno', 'Saryn Prime Set', 120)).toBe('/w Tenno Hi! I want to buy: "Saryn Prime Set" for 120 platinum. (warframe.market)')
  })
})

describe('text', () => {
  it('cleans in-game markup', () => {
    expect(cleanGameText('Наносит <DT_FIRE_COLOR>Огневой урон |CHANCE|%')).toBe('Наносит Огневой урон N%')
    expect(cleanGameText(undefined)).toBe('')
    expect(cleanGameText('a\nb')).toBe('a\nb')
  })
  it('matches queries across fields', () => {
    expect(matchesQuery('сар', 'Сарина', null)).toBe(true)
    expect(matchesQuery('', 'x')).toBe(true)
    expect(matchesQuery('zz', 'Сарина', undefined)).toBe(false)
    expect(wikiKey('https://wiki.warframe.com/w/Soma_Prime')).toBe('soma prime')
    expect(wikiKey(undefined)).toBe('')
  })
})
