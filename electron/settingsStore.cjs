'use strict'

const { app, BrowserWindow, globalShortcut } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { DEFAULT_SETTINGS, sanitizeSettings } = require('./lib/settings.cjs')

const file = () => path.join(app.getPath('userData'), 'settings.json')

let current = DEFAULT_SETTINGS
let hotkeyHandlers = {}

function loadSettings() {
  try {
    current = sanitizeSettings(JSON.parse(fs.readFileSync(file(), 'utf8')))
  } catch {
    current = DEFAULT_SETTINGS
  }
  return current
}

const getSettings = () => current

// перерегистрируем все горячие клавиши, возвращаем те, что заняты другой программой
function applyHotkeys() {
  globalShortcut.unregisterAll()
  const failed = []
  for (const [name, handler] of Object.entries(hotkeyHandlers)) {
    const accel = current.hotkeys[name]
    try {
      if (!accel || !globalShortcut.register(accel, handler)) failed.push(name)
    } catch {
      failed.push(name)
    }
  }
  return failed
}

// в dev режиме не трогаем автозагрузку, там бы прописался голый electron.exe
function applyAutostart() {
  if (!app.isPackaged) return
  app.setLoginItemSettings({
    openAtLogin: current.autostart,
    path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath,
    args: ['--hidden'],
  })
}

function initSettings(handlers) {
  hotkeyHandlers = handlers
  loadSettings()
  applyAutostart()
  return applyHotkeys()
}

// patch мержим по разделам, чтобы можно было менять одно поле
function updateSettings(patch) {
  const p = patch && typeof patch === 'object' ? patch : {}
  const merged = { ...current, ...p }
  for (const key of ['hotkeys', 'rewardArea', 'lookup', 'notify']) {
    if (p[key] && typeof p[key] === 'object') merged[key] = { ...current[key], ...p[key] }
  }
  current = sanitizeSettings(merged)
  try {
    fs.mkdirSync(path.dirname(file()), { recursive: true })
    fs.writeFileSync(file(), JSON.stringify(current, null, 2))
  } catch (err) {
    console.error('[settings] save failed', err.message)
  }
  applyAutostart()
  const failedHotkeys = applyHotkeys()
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('settings:changed', current)
  return { settings: current, failedHotkeys }
}

module.exports = { initSettings, getSettings, updateSettings }
