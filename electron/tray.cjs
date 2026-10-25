'use strict'

const { Tray, Menu, nativeImage } = require('electron')

let tray = null

// actions: open, overlay, scan, settings, quit
function createTray(iconPath, actions) {
  if (tray) return tray
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip('Warframe Helper')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Открыть', click: actions.open },
    { label: 'Оверлей', click: actions.overlay },
    { label: 'Сканировать награды', click: actions.scan },
    { type: 'separator' },
    { label: 'Настройки', click: actions.settings },
    { label: 'Выход', click: actions.quit },
  ]))
  tray.on('click', actions.open)
  return tray
}

function trayNotice(title, content) {
  if (tray && typeof tray.displayBalloon === 'function') tray.displayBalloon({ title, content, iconType: 'info' })
}

module.exports = { createTray, trayNotice }
