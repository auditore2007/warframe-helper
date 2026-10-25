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

module.exports = { MARKET_API, MARKET_V1_API, isMarketSlug, slimMarketItems, summarizeOrders, mapDucatPrices }
