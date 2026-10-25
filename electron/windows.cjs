'use strict'

const { BrowserWindow, shell, screen } = require('electron')
const path = require('node:path')

const DEV_URL = process.env.VITE_DEV_SERVER_URL
const OVERLAY_SIZE = { width: 380, height: 560 }
const OVERLAY_MARGIN = 24

let mainWindow = null
let overlayWindow = null

const getMainWindow = () => mainWindow
const webPreferences = () => ({
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
})

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
    webPreferences: webPreferences(),
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

// оверлей мог ещё не загрузиться, тогда шлём после загрузки
function sendToOverlay(channel, payload) {
  if (!overlayWindow) createOverlay()
  else if (!overlayWindow.isVisible()) overlayWindow.showInactive()
  const wc = overlayWindow.webContents
  if (wc.isLoading()) wc.once('did-finish-load', () => wc.send(channel, payload))
  else wc.send(channel, payload)
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

const ICON = path.join(__dirname, '..', 'build', 'icon.png')

// hideOnClose() - спросить настройку "сворачивать в трей", startHidden - запуск с автозагрузки
function createWindow({ hideOnClose = () => false, onHidden = () => undefined, startHidden = false } = {}) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0D1117',
    title: 'Warframe Helper',
    icon: ICON,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0D1117', symbolColor: '#C8A44D', height: 36 },
    show: false,
    webPreferences: webPreferences(),
  })
  mainWindow = win
  win.on('close', (e) => {
    if (win.isQuitting || !hideOnClose()) return
    e.preventDefault()
    win.hide()
    onHidden()
  })
  win.on('closed', () => {
    mainWindow = null
    if (overlayWindow) overlayWindow.close()
  })
  win.once('ready-to-show', () => !startHidden && win.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(null, url)
    return { action: 'deny' }
  })
  appUrl(win)
}

module.exports = {
  appUrl, createWindow, getMainWindow, createOverlay, toggleOverlay, sendToOverlay, hideOverlay,
  setOverlayOpacity, focusWindow, openExternal, webPreferences, ICON,
}
