'use strict'

// всё, что ходит в сеть или на диск: кэш, api, маркет, профиль, картинки
const { app } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const { API_BASE, isAllowedApiPath, cacheFileName, isSafeImageName } = require('./lib/apiPath.cjs')
const { extractAccountFromLog, profileUrls, parseProfile, isAccountId } = require('./lib/profile.cjs')
const overframe = require('./lib/overframe.cjs')
const { CATALOG_FIELDS, CATALOG_NAMES, splitCatalog } = require('./lib/catalog.cjs')
const {
  MARKET_API, MARKET_V1_API, isMarketSlug, slimMarketItems, summarizeOrders, mapDucatPrices, summarizeHistory,
  slimRivenWeapons, slimRivenAttributes, rivenAuctionsUrl, slimAuctions,
} = require('./lib/market.cjs')

const REQUEST_TIMEOUT_MS = 20000
const MAX_LOG_BYTES = 12 * 1024 * 1024
const cacheDir = () => path.join(app.getPath('userData'), 'cache')
const IMAGE_SOURCE = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/'
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const CATALOG_TIMEOUT_MS = 120000
const MARKET_PRICE_TTL_MS = 15 * 60 * 1000
const RIVEN_TTL_MS = 10 * 60 * 1000
const MARKET_SPACING_MS = 400
const MARKET_HEADERS = { Language: 'ru', Platform: 'pc', Crossplay: 'true' }

async function readCache(file) {
  try {
    const raw = await fs.readFile(path.join(cacheDir(), file), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function writeCache(file, entry) {
  try {
    await fs.mkdir(cacheDir(), { recursive: true })
    await fs.writeFile(path.join(cacheDir(), file), JSON.stringify(entry))
  } catch (err) {
    console.error('[cache] write failed', file, err)
  }
}

async function fetchJson(url, { headers = {}, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': `WarframeHelper/${app.getVersion()} (desktop)`, ...headers },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// сначала кэш, потом сеть, если сети нет - старый кэш
async function apiGet(_event, apiPath, ttlSeconds = 3600, force = false) {
  if (!isAllowedApiPath(apiPath)) return { ok: false, error: 'Запрос к API отклонён' }
  const file = cacheFileName(apiPath)
  const cached = await readCache(file)
  const ttlMs = Math.max(0, Number(ttlSeconds) || 0) * 1000
  if (!force && cached && Date.now() - cached.fetchedAt < ttlMs) {
    return { ok: true, data: cached.data, fetchedAt: cached.fetchedAt, stale: false }
  }
  try {
    const data = await fetchJson(API_BASE + apiPath)
    const entry = { fetchedAt: Date.now(), data }
    await writeCache(file, entry)
    return { ok: true, data, fetchedAt: entry.fetchedAt, stale: false }
  } catch (err) {
    console.error('[api] fetch failed', apiPath, err.message)
    if (cached) return { ok: true, data: cached.data, fetchedAt: cached.fetchedAt, stale: true }
    return { ok: false, error: 'Нет связи с сервером данных и нет сохранённой копии' }
  }
}

// хвост EE.log, null если игры нет
async function readLogTail() {
  const logPath = path.join(process.env.LOCALAPPDATA || '', 'Warframe', 'EE.log')
  try {
    const handle = await fs.open(logPath, 'r')
    try {
      const { size } = await handle.stat()
      const length = Math.min(size, MAX_LOG_BYTES)
      const buffer = Buffer.alloc(length)
      await handle.read(buffer, 0, length, size - length)
      return buffer.toString('latin1')
    } finally {
      await handle.close()
    }
  } catch {
    return null
  }
}

async function detectAccount() {
  const log = await readLogTail()
  if (log === null) return { ok: false, error: 'Лог игры не найден. Warframe установлен на этом компьютере?' }
  const account = extractAccountFromLog(log)
  if (!account) return { ok: false, error: 'В логе игры нет входа в аккаунт. Запусти Warframe и войди.' }
  if (!account.accountId) {
    return { ok: false, displayName: account.displayName, error: `В логе игры есть только ник «${account.displayName}», ID там больше не пишут. Войди через warframe.com, так быстрее.` }
  }
  return { ok: true, ...account }
}

async function fetchProfile(_event, accountId, platform) {
  if (!isAccountId(accountId)) return { ok: false, error: 'ID аккаунта должен состоять из 24 символов 0-9 и a-f' }
  const file = `profile_${accountId}.json`
  let lastError = null
  for (const url of profileUrls(accountId, platform)) {
    try {
      const profile = parseProfile(await fetchJson(url))
      const entry = { fetchedAt: Date.now(), data: profile }
      await writeCache(file, entry)
      return { ok: true, data: profile, fetchedAt: entry.fetchedAt, stale: false }
    } catch (err) {
      lastError = err
    }
  }
  console.error('[profile] fetch failed', lastError && lastError.message)
  const cached = await readCache(file)
  if (cached) return { ok: true, data: cached.data, fetchedAt: cached.fetchedAt, stale: true }
  return { ok: false, error: 'Сервер профилей Warframe не ответил. Попробуй позже.' }
}

// картинки кэшируем на диск, чтоб работало офлайн
async function serveImage(request) {
  const name = decodeURIComponent(new URL(request.url).pathname.slice(1))
  if (!isSafeImageName(name)) return new Response(null, { status: 400 })
  const file = path.join(cacheDir(), 'img', name)
  const type = name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
  try {
    return new Response(await fs.readFile(file), { headers: { 'Content-Type': type } })
  } catch {
    /* ещё нет в кэше */
  }
  try {
    const res = await fetch(IMAGE_SOURCE + encodeURIComponent(name), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (!res.ok) return new Response(null, { status: res.status })
    const bytes = Buffer.from(await res.arrayBuffer())
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, bytes)
    return new Response(bytes, { headers: { 'Content-Type': type } })
  } catch {
    return new Response(null, { status: 504 })
  }
}

// то же самое для каталога и маркета
async function cached(file, ttlMs, produce, force = false) {
  const entry = await readCache(file)
  if (!force && entry && Date.now() - entry.fetchedAt < ttlMs) {
    return { ok: true, data: entry.data, fetchedAt: entry.fetchedAt, stale: false }
  }
  try {
    const data = await produce()
    const fresh = { fetchedAt: Date.now(), data }
    await writeCache(file, fresh)
    return { ok: true, data, fetchedAt: fresh.fetchedAt, stale: false }
  } catch (err) {
    console.error('[cache] refresh failed', file, err.message)
    if (entry) return { ok: true, data: entry.data, fetchedAt: entry.fetchedAt, stale: true }
    return { ok: false, error: 'Нет связи с сервером данных и нет сохранённой копии' }
  }
}

let catalogDownload = null

// /items качаем раз в день и режем на моды, арканы, реликвии, компаньонов
function downloadCatalog() {
  if (!catalogDownload) {
    const url = `${API_BASE}/items/?language=ru&only=${CATALOG_FIELDS.join(',')}`
    catalogDownload = fetchJson(url, { timeoutMs: CATALOG_TIMEOUT_MS })
      .then(async (items) => {
        const parts = splitCatalog(items)
        const fetchedAt = Date.now()
        await Promise.all(CATALOG_NAMES.map((n) => writeCache(`catalog2_${n}.json`, { fetchedAt, data: parts[n] })))
        return parts
      })
      .finally(() => {
        catalogDownload = null
      })
  }
  return catalogDownload
}

async function catalogGet(_event, name, force = false) {
  if (!CATALOG_NAMES.includes(name)) return { ok: false, error: 'Неизвестный раздел каталога' }
  return cached(`catalog2_${name}.json`, DAY_MS, async () => (await downloadCatalog())[name], force)
}

let marketQueue = Promise.resolve()

// запросы к маркету по одному с паузой, у них лимит
function marketFetch(url) {
  const run = marketQueue.then(() => fetchJson(url, { headers: MARKET_HEADERS }))
  marketQueue = run.catch(() => undefined).then(() => new Promise((r) => setTimeout(r, MARKET_SPACING_MS)))
  return run
}

async function marketItems(_event, force = false) {
  return cached('market_items_v2.json', DAY_MS, async () => slimMarketItems(await marketFetch(`${MARKET_API}/items`)), force)
}

async function marketHistory(_event, slug) {
  if (!isMarketSlug(slug)) return { ok: false, error: 'Неверный идентификатор предмета' }
  return cached(`market_history_${slug}.json`, HOUR_MS, async () => summarizeHistory(await marketFetch(`${MARKET_V1_API}/items/${slug}/statistics`)))
}

// сборки с overframe, кэш на сутки
async function buildsList(_event, itemName) {
  let url
  try {
    url = overframe.listUrl(itemName)
  } catch (err) {
    return { ok: false, error: err.message }
  }
  const file = `builds_${String(itemName).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 60)}.json`
  return cached(file, DAY_MS, async () => overframe.slimBuildList(await fetchJson(url)))
}

async function buildDetail(_event, id) {
  let url
  try {
    url = overframe.detailUrl(id)
  } catch (err) {
    return { ok: false, error: err.message }
  }
  return cached(`build_${id}.json`, DAY_MS, async () => overframe.slimBuild(await fetchJson(url)))
}

// цены всех прайм-частей одним запросом
async function marketPrices(_event, force = false) {
  return cached('market_prices.json', HOUR_MS, async () => {
    const items = await marketItems(null)
    if (!items.ok) throw new Error(items.error)
    return mapDucatPrices(await marketFetch(`${MARKET_V1_API}/tools/ducats`), items.data)
  }, force)
}

async function marketPrice(_event, slug) {
  if (!isMarketSlug(slug)) return { ok: false, error: 'Неверный идентификатор предмета' }
  return cached(`market_price_${slug}.json`, MARKET_PRICE_TTL_MS, async () => summarizeOrders(await marketFetch(`${MARKET_API}/orders/item/${slug}/top`)))
}

async function rivenWeapons() {
  return cached('riven_weapons.json', DAY_MS, async () => slimRivenWeapons(await marketFetch(`${MARKET_API}/riven/weapons`)))
}

async function rivenAttributes() {
  return cached('riven_attributes.json', DAY_MS, async () => slimRivenAttributes(await marketFetch(`${MARKET_API}/riven/attributes`)))
}

// лоты меняются быстро, кэш 10 минут на каждый набор фильтров
async function rivenAuctions(_event, query) {
  let url
  try {
    url = rivenAuctionsUrl(query)
  } catch (err) {
    return { ok: false, error: err.message }
  }
  const key = url.split('?')[1].replace(/[^a-z0-9]+/gi, '_').slice(0, 150)
  return cached(`rivens_${key}.json`, RIVEN_TTL_MS, async () => slimAuctions(await marketFetch(url)))
}

module.exports = {
  rivenWeapons, rivenAttributes, rivenAuctions,
  fetchJson, cached, apiGet, readLogTail, detectAccount, fetchProfile, serveImage, catalogGet,
  marketFetch, marketItems, marketHistory, marketPrices, marketPrice, buildsList, buildDetail,
  MARKET_API, MARKET_V1_API, DAY_MS, HOUR_MS,
}
