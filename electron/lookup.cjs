'use strict'

const { BrowserWindow, screen } = require('electron')
const path = require('node:path')
const { readLinesAround, captureScreen, OCR_DIR } = require('./ocr.cjs')
const { isGameTitle, createTrigger } = require('./lib/lookupLogic.cjs')
const { gameLanguageFromLog } = require('./lib/rewards.cjs')

const POLL_MS = 100
// сколько вокруг курсора читать, в точках экрана
const BOX = { left: 320, right: 320, up: 170, down: 110 }
const POPUP = { width: 360, height: 220 }
const POPUP_OFFSET = 26
const VK_LBUTTON = 0x01

let win32 = null

// user32 через koffi: активное окно и состояние левой кнопки. если не загрузилось - подсказки просто молчат
function user32() {
  if (win32 !== null) return win32
  try {
    const koffi = require('koffi')
    const lib = koffi.load('user32.dll')
    win32 = {
      foreground: lib.func('void* __stdcall GetForegroundWindow()'),
      title: lib.func('int __stdcall GetWindowTextW(void* hWnd, _Out_ uint16_t* lpString, int nMaxCount)'),
      key: lib.func('short __stdcall GetAsyncKeyState(int vKey)'),
    }
  } catch (err) {
    console.error('[lookup] user32 unavailable', err.message)
    win32 = false
  }
  return win32
}

const titleBuf = new Uint16Array(256)

function foregroundTitle() {
  const api = user32()
  if (!api) return ''
  const n = api.title(api.foreground(), titleBuf, titleBuf.length)
  return String.fromCharCode(...titleBuf.subarray(0, Math.max(0, n)))
}

const isMouseDown = () => {
  const api = user32()
  return Boolean(api && api.key(VK_LBUTTON) & 0x8000)
}

// для проверки без игры: WFH_LOOKUP_ANY=1 - работать над любым окном
const gameInFront = () => process.env.WFH_LOOKUP_ANY === '1' || isGameTitle(foregroundTitle())

function createLookup({ getSettings, readLogTail, userData, webPreferences, appUrl }) {
  const trigger = createTrigger()
  let popup = null
  let busy = false
  let timer = null
  let anchor = null

  function ensurePopup() {
    if (popup && !popup.isDestroyed()) return popup
    popup = new BrowserWindow({
      ...POPUP,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      focusable: false,
      show: false,
      webPreferences: webPreferences(),
    })
    popup.setAlwaysOnTop(true, 'screen-saver')
    popup.setIgnoreMouseEvents(true)
    popup.on('closed', () => {
      popup = null
    })
    appUrl(popup, '/lookup')
    return popup
  }

  function hide() {
    if (popup && !popup.isDestroyed() && popup.isVisible()) popup.hide()
  }

  // окно подсказки рядом с курсором, но не за краем экрана
  function show(size) {
    if (!anchor) return
    const p = ensurePopup()
    const area = screen.getDisplayNearestPoint(anchor).workArea
    const w = Math.round(size && size.width ? size.width : POPUP.width)
    const h = Math.round(size && size.height ? size.height : POPUP.height)
    let x = anchor.x + POPUP_OFFSET
    let y = anchor.y + POPUP_OFFSET
    if (x + w > area.x + area.width) x = anchor.x - POPUP_OFFSET - w
    if (y + h > area.y + area.height) y = anchor.y - POPUP_OFFSET - h
    p.setBounds({ x: Math.max(area.x, x), y: Math.max(area.y, y), width: w, height: h })
    p.showInactive()
  }

  async function scan(pos) {
    busy = true
    anchor = pos
    try {
      const { image, display } = await captureScreen()
      const sf = display.scaleFactor
      const point = { x: (pos.x - display.bounds.x) * sf, y: (pos.y - display.bounds.y) * sf }
      const box = { left: BOX.left * sf, right: BOX.right * sf, up: BOX.up * sf, down: BOX.down * sf }
      const lang = gameLanguageFromLog(await readLogTail())
      const ocrDir = OCR_DIR(userData)
      const lines = await readLinesAround({ lang, cacheDir: ocrDir, image, point, box, debugFile: path.join(ocrDir, 'last-lookup.png') })
      ensurePopup().webContents.send('lookup:lines', { lines: lines.map((l) => ({ ...l, dx: l.dx / sf, dy: l.dy / sf })) })
    } catch (err) {
      console.error('[lookup] scan failed', err.message)
    } finally {
      busy = false
    }
  }

  function tick() {
    const s = getSettings().lookup
    if (!s.enabled) return hide()
    const pos = screen.getCursorScreenPoint()
    if (trigger.movedAway(pos)) hide()
    if (!gameInFront()) return
    if (trigger.tick(pos, s.mode === 'click' ? isMouseDown() : false, Date.now(), s) && !busy) void scan(pos)
  }

  return {
    start() {
      if (timer) return
      ensurePopup()
      timer = setInterval(tick, POLL_MS)
    },
    stop() {
      clearInterval(timer)
      timer = null
      hide()
    },
    show,
    hide,
  }
}

module.exports = { createLookup }
