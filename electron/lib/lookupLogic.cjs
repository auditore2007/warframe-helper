'use strict'

// курсор считается неподвижным, если дрожит меньше чем на столько пикселей
const STILL_PX = 5
// повторно на том же месте не сканируем
const SAME_SPOT_PX = 20
// ушёл дальше - прячем подсказку
const AWAY_PX = 180

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// окно игры называется просто "Warframe"
function isGameTitle(title) {
  return typeof title === 'string' && /^warframe$/i.test(title.trim())
}

// решает, когда пора сканировать: hover - курсор постоял delayMs, click - отпустили левую кнопку
function createTrigger() {
  let still = null
  let lastScan = null
  let wasDown = false

  const fire = (pos) => {
    lastScan = pos
    return true
  }

  return {
    tick(pos, mouseDown, now, settings) {
      if (settings.mode === 'click') {
        const released = wasDown && !mouseDown
        wasDown = mouseDown
        return released ? fire(pos) : false
      }
      if (!still || dist(pos, still.pos) > STILL_PX) {
        still = { pos, since: now }
        return false
      }
      if (now - still.since < settings.delayMs) return false
      if (lastScan && dist(pos, lastScan) < SAME_SPOT_PX) return false
      return fire(pos)
    },
    movedAway(pos) {
      return Boolean(lastScan) && dist(pos, lastScan) > AWAY_PX
    },
    reset() {
      lastScan = null
      still = null
    },
  }
}

module.exports = { isGameTitle, createTrigger }
