'use strict'

// берём только нужные поля, иначе файл огромный
const CATALOG_FIELDS = [
  'uniqueName', 'name', 'category', 'type', 'rarity', 'levelStats', 'drops', 'rewards', 'vaulted',
  'imageName', 'wikiaUrl', 'masterable', 'tradable', 'polarity', 'baseDrain', 'fusionLimit',
  'compatName', 'description', 'components', 'maxLevelCap', 'isPrime', 'abilities', 'health',
  'shield', 'armor', 'power', 'masteryReq',
]

const CATALOG_NAMES = ['mods', 'arcanes', 'relics', 'companions']
const MAX_DROPS = 6
const SKIPPED_MOD_TYPES = /Riven|Focus Way|Plexus|Tektolyst|Railjack|Transmutation|Peculiar|K-Drive/
const REFINEMENTS = { Bronze: 'intact', Silver: 'exceptional', Gold: 'flawless', Platinum: 'radiant' }
const RELIC_TIERS = { Лит: 'Lith', Мезо: 'Meso', Нео: 'Neo', Акси: 'Axi', Реквием: 'Requiem', Вангард: 'Vanguard' }
const NECRAMECHS = /\/Lotus\/Powersuits\/EntratiMech\//

function topDrops(drops) {
  return (drops || [])
    .slice()
    .sort((a, b) => b.chance - a.chance)
    .slice(0, MAX_DROPS)
    .map((d) => ({ location: d.location, chance: d.chance, rarity: d.rarity }))
}

function lastStats(levelStats) {
  const last = Array.isArray(levelStats) ? levelStats[levelStats.length - 1] : null
  return last && Array.isArray(last.stats) ? last.stats : []
}

function slimMod(m) {
  return {
    uniqueName: m.uniqueName, name: m.name, type: m.type, rarity: m.rarity, polarity: m.polarity,
    baseDrain: m.baseDrain, fusionLimit: m.fusionLimit, compatName: m.compatName, isPrime: Boolean(m.isPrime),
    tradable: Boolean(m.tradable), imageName: m.imageName, wikiaUrl: m.wikiaUrl,
    stats: lastStats(m.levelStats), drops: topDrops(m.drops),
  }
}

function slimArcane(a) {
  return {
    uniqueName: a.uniqueName, name: a.name, type: a.type, rarity: a.rarity, imageName: a.imageName,
    wikiaUrl: a.wikiaUrl, tradable: Boolean(a.tradable), stats: lastStats(a.levelStats), drops: topDrops(a.drops),
  }
}

function refinementOf(uniqueName) {
  const m = /(Bronze|Silver|Gold|Platinum)$/.exec(uniqueName || '')
  return m ? REFINEMENTS[m[1]] : 'intact'
}

// 'Реликвия Акси A1' -> { tier: 'Axi', code: 'A1' }
function parseRelicName(name) {
  const parts = String(name || '').trim().split(/\s+/)
  const code = parts[parts.length - 1] || ''
  const tierRu = parts[parts.length - 2] || ''
  return { tier: RELIC_TIERS[tierRu] || tierRu, code }
}

// 4 улучшения реликвии склеиваем в одну запись
function buildRelics(entries) {
  const byName = new Map()
  for (const r of entries) {
    const refinement = refinementOf(r.uniqueName)
    if (refinement !== 'intact' && refinement !== 'radiant') continue
    const key = r.name
    if (!byName.has(key)) {
      const { tier, code } = parseRelicName(r.name)
      byName.set(key, { id: '', name: r.name, tier, code, vaulted: Boolean(r.vaulted), imageName: r.imageName, rewards: new Map() })
    }
    const relic = byName.get(key)
    if (refinement === 'intact') relic.id = r.uniqueName
    relic.vaulted = relic.vaulted && Boolean(r.vaulted)
    for (const reward of r.rewards || []) {
      const item = reward.item || {}
      const rewardKey = item.uniqueName || item.name
      const existing = relic.rewards.get(rewardKey) || {
        name: item.name, uniqueName: item.uniqueName,
        slug: item.warframeMarket ? item.warframeMarket.urlName : null,
        rarity: reward.rarity, intact: null, radiant: null,
      }
      existing[refinement] = reward.chance
      if (refinement === 'intact') existing.rarity = reward.rarity
      relic.rewards.set(rewardKey, existing)
    }
  }
  return [...byName.values()]
    .filter((r) => r.id)
    .map((r) => ({ ...r, rewards: [...r.rewards.values()].sort((a, b) => (a.intact ?? 0) - (b.intact ?? 0)) }))
}

function slimCompanion(c) {
  return {
    uniqueName: c.uniqueName, name: c.name, category: c.category, type: c.type, description: c.description,
    imageName: c.imageName, wikiaUrl: c.wikiaUrl, isPrime: Boolean(c.isPrime), masteryReq: c.masteryReq,
    maxLevelCap: c.maxLevelCap, health: c.health, shield: c.shield, armor: c.armor, power: c.power,
    abilities: c.abilities, components: c.components,
  }
}

// режем /items на наши списки
function splitCatalog(items) {
  const out = { mods: [], arcanes: [], relics: [], companions: [] }
  const relicEntries = []
  for (const it of Array.isArray(items) ? items : []) {
    // у заголовков сетов нет имени, ломают сортировку
    if (!it || typeof it !== 'object' || typeof it.name !== 'string' || !it.name) continue
    switch (it.category) {
      case 'Mods':
        if (!SKIPPED_MOD_TYPES.test(it.type || '')) out.mods.push(slimMod(it))
        break
      case 'Arcanes':
        if (it.levelStats) out.arcanes.push(slimArcane(it))
        break
      case 'Relics':
        relicEntries.push(it)
        break
      case 'Sentinels':
      case 'Archwing':
        if (it.masterable !== false) out.companions.push(slimCompanion(it))
        break
      case 'Pets':
        if (it.masterable) out.companions.push(slimCompanion(it))
        break
      case 'Warframes':
        if (NECRAMECHS.test(it.uniqueName || '')) out.companions.push({ ...slimCompanion(it), category: 'Necramech', maxLevelCap: 40 })
        break
      default:
        break
    }
  }
  const knownTiers = new Set(Object.values(RELIC_TIERS))
  out.relics = buildRelics(relicEntries).filter((r) => knownTiers.has(r.tier) && r.rewards.length > 0)
  return out
}

module.exports = { CATALOG_FIELDS, CATALOG_NAMES, splitCatalog, buildRelics, refinementOf, parseRelicName }
