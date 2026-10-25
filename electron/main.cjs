'use strict'

const { app, ipcMain, shell, protocol, Notification, globalShortcut } = require('electron')
const path = require('node:path')
const data = require('./data.cjs')
const windows = require('./windows.cjs')
const { loginViaWarframe, USER_DATA_URL } = require('./login.cjs')
const { accountIdFromUserData } = require('./lib/profile.cjs')
const { stopOcr, OCR_DIR } = require('./ocr.cjs')
const { createRewardScanner } = require('./rewardScan.cjs')
const { createLookup } = require('./lookup.cjs')
const { initSettings, getSettings, updateSettings } = require('./settingsStore.cjs')
const { createTray, trayNotice } = require('./tray.cjs')

protocol.registerSchemesAsPrivileged([{ scheme: 'wfimg', privileges: { standard: true, secure: true, supportFetchAPI: true } }])

// второй запуск просто показывает уже открытое окно
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => windows.focusWindow())
}

const startHidden = process.argv.includes('--hidden')
let rewardScanner = null
let lookup = null
let trayHintShown = false
let failedHotkeys = []

async function scanRewards() {
  if (!rewardScanner) {
    rewardScanner = createRewardScanner({
      catalogGet: data.catalogGet,
      marketItems: data.marketItems,
      marketPrices: data.marketPrices,
      readLogTail: data.readLogTail,
      userData: app.getPath('userData'),
      getArea: () => getSettings().rewardArea,
    })
  }
  windows.sendToOverlay('rewards:status', { busy: true })
  const result = await rewardScanner.run()
  windows.sendToOverlay('rewards:result', result)
  return result
}

const openOcrShot = (name) => shell.openPath(path.join(OCR_DIR(app.getPath('userData')), name))

function quitApp() {
  const win = windows.getMainWindow()
  if (win) win.isQuitting = true
  app.quit()
}

function openPage(hash) {
  windows.focusWindow()
  const win = windows.getMainWindow()
  if (win) win.webContents.send('navigate', hash)
}

function onMainHidden() {
  if (trayHintShown) return
  trayHintShown = true
  trayNotice('Warframe Helper работает в трее', 'Таймеры и горячие клавиши продолжают работать. Выйти можно через значок у часов.')
}

function saveSettings(_e, patch) {
  const res = updateSettings(patch)
  failedHotkeys = res.failedHotkeys
  if (res.settings.lookup.enabled) lookup.start()
  else lookup.stop()
  return res
}

// уведомление из окна (литейная, цены). клик открывает нужную страницу
function notify(_e, { title, body, hash, kind }) {
  if (!Notification.isSupported()) return
  if (kind && getSettings().notify[kind] === false) return
  const n = new Notification({ title: String(title).slice(0, 100), body: String(body).slice(0, 300), icon: windows.ICON })
  n.on('click', () => (hash ? openPage(hash) : windows.focusWindow()))
  n.show()
}

function registerIpc() {
  ipcMain.handle('api:get', data.apiGet)
  ipcMain.handle('profile:detect', data.detectAccount)
  ipcMain.handle('profile:fetch', data.fetchProfile)
  ipcMain.handle('open:external', windows.openExternal)
  ipcMain.handle('catalog:get', data.catalogGet)
  ipcMain.handle('market:items', data.marketItems)
  ipcMain.handle('market:price', data.marketPrice)
  ipcMain.handle('market:prices', data.marketPrices)
  ipcMain.handle('market:history', data.marketHistory)
  ipcMain.handle('market:rivenWeapons', data.rivenWeapons)
  ipcMain.handle('market:rivenAttributes', data.rivenAttributes)
  ipcMain.handle('market:rivenAuctions', data.rivenAuctions)
  ipcMain.handle('builds:list', data.buildsList)
  ipcMain.handle('builds:detail', data.buildDetail)
  ipcMain.handle('rewards:scan', scanRewards)
  ipcMain.handle('rewards:lastShot', () => openOcrShot('last-rewards.png'))
  ipcMain.handle('lookup:lastShot', () => openOcrShot('last-lookup.png'))
  ipcMain.handle('lookup:show', (_e, size) => lookup.show(size))
  ipcMain.handle('lookup:hide', () => lookup.hide())
  ipcMain.handle('account:login', () => loginViaWarframe(windows.getMainWindow()))
  ipcMain.handle('account:parse', (_e, text) => accountIdFromUserData(text))
  ipcMain.handle('account:userDataPage', () => shell.openExternal(USER_DATA_URL))
  ipcMain.handle('settings:get', () => ({ settings: getSettings(), failedHotkeys }))
  ipcMain.handle('settings:set', saveSettings)
  ipcMain.handle('notify', notify)
  ipcMain.handle('window:focus', windows.focusWindow)
  ipcMain.handle('overlay:toggle', windows.toggleOverlay)
  ipcMain.handle('overlay:hide', windows.hideOverlay)
  ipcMain.handle('overlay:opacity', windows.setOverlayOpacity)
}

app.setAppUserModelId('com.lenoxolen.warframehelper')

app.whenReady().then(() => {
  protocol.handle('wfimg', data.serveImage)
  registerIpc()
  failedHotkeys = initSettings({ overlay: windows.toggleOverlay, rewards: () => void scanRewards() })
  windows.createWindow({ hideOnClose: () => getSettings().closeToTray, onHidden: onMainHidden, startHidden })
  createTray(windows.ICON, {
    open: windows.focusWindow,
    overlay: windows.toggleOverlay,
    scan: () => void scanRewards(),
    settings: () => openPage('/settings'),
    quit: quitApp,
  })
  lookup = createLookup({ getSettings, readLogTail: data.readLogTail, userData: app.getPath('userData'), webPreferences: windows.webPreferences, appUrl: windows.appUrl })
  if (getSettings().lookup.enabled) lookup.start()
})

app.on('before-quit', () => {
  const win = windows.getMainWindow()
  if (win) win.isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  void stopOcr()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
