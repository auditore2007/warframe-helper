'use strict'

const { BrowserWindow } = require('electron')
const { accountFromUserInfoCookie } = require('./lib/profile.cjs')

const LOGIN_URL = 'https://www.warframe.com/ru/login'
const COOKIE_NAME = 'user-info'
const POLL_MS = 1500

let pending = null

// после входа сайт кладёт cookie user-info с id и ником, его и ждём
// { account } - нашли id, { loggedInWithoutId } - вошли, но id в cookie нет, null - ещё не вошли
async function readAccount(session) {
  try {
    const cookies = await session.cookies.get({ name: COOKIE_NAME })
    for (const c of cookies) {
      const account = accountFromUserInfoCookie(c.value)
      if (account) return { account }
      if (c.value && c.value !== 'null' && decodeURIComponent(c.value).startsWith('{')) return { loggedInWithoutId: true }
    }
  } catch {
    /* окно уже закрыли */
  }
  return null
}

// окно с обычным входом DE. пароль вводится на их сайте, мы смотрим только cookie с id.
// сессия в памяти, после закрытия всё стирается
function loginViaWarframe(parent) {
  if (pending) {
    pending.win.focus()
    return pending.promise
  }
  const win = new BrowserWindow({
    parent: parent || undefined,
    width: 560,
    height: 800,
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
      const res = await readAccount(session)
      if (res && res.account) finish({ ok: true, ...res.account })
      else if (res && res.loggedInWithoutId) finish({ ok: false, error: 'Вход прошёл, но сайт не отдал ID аккаунта. Попробуй ещё раз чуть позже.' })
    }
    timer = setInterval(check, POLL_MS)
    session.cookies.on('changed', (_e, cookie) => cookie.name === COOKIE_NAME && void check())
    win.on('closed', () => finish({ ok: false, error: 'Окно входа закрыто' }))
  })

  pending = { win, promise }
  win.loadURL(LOGIN_URL)
  return promise
}

module.exports = { loginViaWarframe }
