'use strict'

const { BrowserWindow } = require('electron')
const { accountIdFromUserData } = require('./lib/profile.cjs')

const LOGIN_URL = 'https://www.warframe.com/login'
const USER_DATA_URL = 'https://www.warframe.com/api/user-data'
const POLL_MS = 2000

let pending = null

// после входа сайт отдаёт user_id на /api/user-data, его и ждём
async function readAccountId(session) {
  try {
    const res = await session.fetch(USER_DATA_URL, { cache: 'no-store' })
    if (!res.ok) return null
    return accountIdFromUserData(await res.text())
  } catch {
    return null
  }
}

// окно с официальным входом DE. пароль вводится на их сайте, мы видим только id.
// сессия в памяти, после закрытия всё стирается
function loginViaWarframe(parent) {
  if (pending) {
    pending.win.focus()
    return pending.promise
  }
  const win = new BrowserWindow({
    parent: parent || undefined,
    width: 520,
    height: 760,
    title: 'Вход на warframe.com',
    autoHideMenuBar: true,
    backgroundColor: '#0D1117',
    webPreferences: {
      partition: `wflogin-${Date.now()}`,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  const { session } = win.webContents
  let timer = null
  let done = false

  const promise = new Promise((resolve) => {
    const finish = (result) => {
      if (done) return
      done = true
      clearInterval(timer)
      pending = null
      session.clearStorageData().catch(() => undefined)
      if (!win.isDestroyed()) win.close()
      resolve(result)
    }
    const check = async () => {
      const id = await readAccountId(session)
      if (id) finish({ ok: true, accountId: id })
    }
    timer = setInterval(check, POLL_MS)
    win.webContents.on('did-navigate', check)
    win.on('closed', () => finish({ ok: false, error: 'Окно входа закрыто' }))
  })

  pending = { win, promise }
  win.loadURL(LOGIN_URL)
  return promise
}

module.exports = { loginViaWarframe, USER_DATA_URL }
