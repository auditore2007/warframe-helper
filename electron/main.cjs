'use strict'

const { app, BrowserWindow, ipcMain, shell, protocol, globalShortcut, screen } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const { API_BASE, isAllowedApiPath, cacheFileName, isSafeImageName } = require('./lib/apiPath.cjs')
const { extractAccountFromLog, profileUrls, parseProfile, isAccountId } = require('./lib/profile.cjs')
const { CATALOG_FIELDS, CATALOG_NAMES, splitCatalog } = require('./lib/catalog.cjs')
const { MARKET_API, MARKET_V1_API, isMarketSlug, slimMarketItems, summarizeOrders, mapDucatPrices } = require('./lib/market.cjs')

const REQUEST_TIMEOUT_MS = 20000
const MAX_LOG_BYTES = 12 * 1024 * 1024
const DEV_URL = process.env.VITE_DEV_SERVER_URL
const cacheDir = () => path.join(app.getPath('userData'), 'cache')
const IMAGE_SOURCE = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/'
const DAY_MS = 24 * 60 * 60 * 1000
const CATALOG_TIMEOUT_MS = 120000
const MARKET_PRICE_TTL_MS = 15 * 60 * 1000
const MARKET_SPACING_MS = 400
const MARKET_HEADERS = { Language: 'ru', Platform: 'pc', Crossplay: 'true' }
const HOUR_MS = 60 * 60 * 1000
const OVERLAY_SHORTCUT = 'CommandOrControl+Shift+O'
const OVERLAY_SIZE = { width: 380, height: 560 }
const OVERLAY_MARGIN = 24

protocol.registerSchemesAsPrivileged([{ scheme: 'wfimg', privileges: { standard: true, secure: true, supportFetchAPI: true } }])

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
    headers: { 'User-Agent': 'WarframeHelper/1.0 (desktop)', ...headers },
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

async function detectAccount() {
  const logPath = path.join(process.env.LOCALAPPDATA || '', 'Warframe', 'EE.log')
  try {
    const handle = await fs.open(logPath, 'r')
    try {
      const { size } = await handle.stat()
      const length = Math.min(size, MAX_LOG_BYTES)
      const buffer = Buffer.alloc(length)
      await handle.read(buffer, 0, length, size - length)
      const account = extractAccountFromLog(buffer.toString('latin1'))
      if (!account) return { ok: false, error: 'В логе игры нет входа в аккаунт. Запусти Warframe и войди.' }
      if (!account.accountId) {
        return { ok: false, error: `Игра записала в лог только ник «${account.displayName}», без ID аккаунта. Введи ID вручную ниже.` }
      }
      return { ok: true, ...account }
    } finally {
      await handle.close()
    }
  } catch {
    return { ok: false, error: 'Лог игры не найден. Warframe установлен на этом компьютере?' }
  }
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

let mainWindow = null
let overlayWindow = null

function appUrl(win, hash = '') {
  if (DEV_URL) win.loadURL(DEV_URL + (hash ? `#${hash}` : ''))
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), hash ? { hash } : undefined)
}

// окно поверх игры (работает если игра в оконном без рамки)
function createOverlay() {
  const { workArea } = screen.getPrimaryDisplay()
  overlayWindow = new BrowserWindow({
    ...OVERLAY_SIZE,
    x: workArea.x + workArea.width - OVERLAY_SIZE.width - OVERLAY_MARGIN,
    y: workArea.y + OVERLAY_MARGIN,
    minWidth: 300,
    minHeight: 240,
    frame: false,
    transparent: true,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    title: 'Warframe Helper - оверлей',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setVisibleOnAllWorkspaces(true)
  overlayWindow.once('ready-to-show', () => overlayWindow && overlayWindow.showInactive())
  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
  appUrl(overlayWindow, '/overlay')
}

function toggleOverlay() {
  if (!overlayWindow) return createOverlay()
  if (overlayWindow.isVisible()) overlayWindow.hide()
  else overlayWindow.showInactive()
}

function hideOverlay() {
  if (overlayWindow) overlayWindow.hide()
}

function setOverlayOpacity(_event, value) {
  const opacity = Number(value)
  if (overlayWindow && Number.isFinite(opacity)) overlayWindow.setOpacity(Math.min(1, Math.max(0.3, opacity)))
}

function focusWindow() {
  const win = mainWindow
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

function openExternal(_event, url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:') shell.openExternal(parsed.toString())
  } catch {
    /* кривой url - игнор */
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0D1117',
    title: 'Warframe Helper',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0D1117', symbolColor: '#C8A44D', height: 36 },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow = win
  win.on('closed', () => {
    mainWindow = null
    if (overlayWindow) overlayWindow.close()
  })
  win.once('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(null, url)
    return { action: 'deny' }
  })
  appUrl(win)
}

app.setAppUserModelId('com.lenoxolen.warframehelper')

app.whenReady().then(() => {
  protocol.handle('wfimg', serveImage)
  ipcMain.handle('api:get', apiGet)
  ipcMain.handle('profile:detect', detectAccount)
  ipcMain.handle('profile:fetch', fetchProfile)
  ipcMain.handle('open:external', openExternal)
  ipcMain.handle('catalog:get', catalogGet)
  ipcMain.handle('market:items', marketItems)
  ipcMain.handle('market:price', marketPrice)
  ipcMain.handle('market:prices', marketPrices)
  ipcMain.handle('window:focus', focusWindow)
  ipcMain.handle('overlay:toggle', toggleOverlay)
  ipcMain.handle('overlay:hide', hideOverlay)
  ipcMain.handle('overlay:opacity', setOverlayOpacity)
  if (!globalShortcut.register(OVERLAY_SHORTCUT, toggleOverlay)) console.error('[overlay] shortcut is taken', OVERLAY_SHORTCUT)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
