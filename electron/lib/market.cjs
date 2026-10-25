'use strict'

const MARKET_API = 'https://api.warframe.market/v2'
const MARKET_V1_API = 'https://api.warframe.market/v1'
const SLUG_RE = /^[a-z0-9_]{1,120}$/
const ACTIVE_STATUSES = new Set(['ingame', 'online'])
const MAX_SELLERS = 5

function isMarketSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug)
}

// v2 /items, только нужное
function slimMarketItems(json) {
  const list = json && Array.isArray(json.data) ? json.data : []
  return list
    .filter((x) => x && isMarketSlug(x.slug))
    .map((x) => ({
      id: typeof x.id === 'string' ? x.id : null,
      slug: x.slug,
      gameRef: x.gameRef || null,
      en: x.i18n && x.i18n.en ? x.i18n.en.name : x.slug,
      ru: x.i18n && x.i18n.ru ? x.i18n.ru.name : null,
      ducats: typeof x.ducats === 'number' ? x.ducats : null,
      tags: Array.isArray(x.tags) ? x.tags : [],
    }))
}

// v2 /orders/.../top -> дешевле всех и лучший покупатель
function summarizeOrders(json) {
  const data = (json && json.data) || {}
  const active = (o) => o && o.user && ACTIVE_STATUSES.has(o.user.status)
  const sells = (Array.isArray(data.sell) ? data.sell : []).filter(active).sort((a, b) => a.platinum - b.platinum)
  const buys = (Array.isArray(data.buy) ? data.buy : []).filter(active).sort((a, b) => b.platinum - a.platinum)
  return {
    sell: sells.length ? sells[0].platinum : null,
    buy: buys.length ? buys[0].platinum : null,
    sellers: sells.slice(0, MAX_SELLERS).map((o) => ({
      name: o.user.ingameName, platinum: o.platinum, quantity: o.quantity, status: o.user.status, rank: o.rank ?? null,
    })),
  }
}

const finite = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

// v1 /tools/ducats - цены всех прайм-частей, там только id, маппим в slug
function mapDucatPrices(json, items) {
  const rows = json && json.payload && Array.isArray(json.payload.previous_day) ? json.payload.previous_day : []
  const slugById = new Map((items || []).filter((i) => i && i.id).map((i) => [i.id, i.slug]))
  const out = {}
  for (const row of rows) {
    const slug = row && slugById.get(row.item)
    const average = finite(row && row.wa_price)
    const median = finite(row && row.median) ?? average
    if (!slug || median === null) continue
    out[slug] = { median, average: average ?? median, volume: finite(row.volume) ?? 0 }
  }
  return out
}

function historyPoints(rows) {
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => ({
      t: r ? Date.parse(r.datetime) : NaN,
      median: finite(r && r.median),
      min: finite(r && r.min_price),
      max: finite(r && r.max_price),
      volume: finite(r && r.volume) ?? 0,
    }))
    .filter((p) => Number.isFinite(p.t) && p.median !== null)
    .sort((a, b) => a.t - b.t)
}

// v1 /items/{slug}/statistics -> только реальные сделки (closed), по дням и по часам
function summarizeHistory(json) {
  const closed = (json && json.payload && json.payload.statistics_closed) || {}
  return { days: historyPoints(closed['90days']), hours: historyPoints(closed['48hours']) }
}

const nameOf = (x, lang) => (x && x.i18n && x.i18n[lang] ? x.i18n[lang].name : null)

function slimRivenWeapons(json) {
  const list = json && Array.isArray(json.data) ? json.data : []
  return list
    .filter((x) => x && isMarketSlug(x.slug))
    .map((x) => ({ slug: x.slug, en: nameOf(x, 'en') || x.slug, ru: nameOf(x, 'ru'), type: x.rivenType || null, disposition: finite(x.disposition) }))
}

function slimRivenAttributes(json) {
  const list = json && Array.isArray(json.data) ? json.data : []
  return list
    .filter((x) => x && isMarketSlug(x.slug))
    .map((x) => ({
      slug: x.slug,
      en: nameOf(x, 'en') || x.slug,
      ru: nameOf(x, 'ru'),
      unit: x.unit || null,
      positiveOnly: Boolean(x.positiveOnly),
      negativeOnly: Boolean(x.negativeOnly),
      exclusiveTo: Array.isArray(x.exclusiveTo) ? x.exclusiveTo : null,
    }))
}

const MAX_POSITIVE = 3

// поиск лотов ривенов: только прямая продажа, дешёвые сверху
function rivenAuctionsUrl({ weapon, positive = [], negative = null } = {}) {
  if (!isMarketSlug(weapon)) throw new Error('Неверное оружие')
  if (!Array.isArray(positive) || positive.length > MAX_POSITIVE || !positive.every(isMarketSlug)) throw new Error('Неверные плюсы')
  if (negative !== null && negative !== undefined && !isMarketSlug(negative)) throw new Error('Неверный минус')
  const params = new URLSearchParams({ type: 'riven', weapon_url_name: weapon, sort_by: 'price_asc', buyout_policy: 'direct' })
  if (positive.length) params.set('positive_stats', positive.join(','))
  if (negative) params.set('negative_stats', negative)
  return `${MARKET_V1_API}/auctions/search?${params.toString()}`
}

function slimAuctions(json) {
  const list = json && json.payload && Array.isArray(json.payload.auctions) ? json.payload.auctions : []
  return list
    .filter((a) => a && !a.closed && a.item && a.owner && finite(a.buyout_price ?? a.starting_price) !== null)
    .map((a) => ({
      id: String(a.id),
      price: finite(a.buyout_price ?? a.starting_price),
      seller: String(a.owner.ingame_name || ''),
      status: String(a.owner.status || 'offline'),
      name: String(a.item.name || ''),
      rerolls: finite(a.item.re_rolls) ?? 0,
      mastery: finite(a.item.mastery_level) ?? 0,
      attributes: (Array.isArray(a.item.attributes) ? a.item.attributes : [])
        .filter((x) => x && isMarketSlug(x.url_name))
        .map((x) => ({ slug: x.url_name, value: finite(x.value) ?? 0, positive: Boolean(x.positive) })),
    }))
    .sort((a, b) => a.price - b.price)
}

module.exports = {
  MARKET_API, MARKET_V1_API, isMarketSlug, slimMarketItems, summarizeOrders, mapDucatPrices, summarizeHistory,
  slimRivenWeapons, slimRivenAttributes, rivenAuctionsUrl, slimAuctions,
}
