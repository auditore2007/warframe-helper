'use strict'

const DEFAULT_SETTINGS = {
  closeToTray: true,
  autostart: false,
  hotkeys: {
    overlay: 'CommandOrControl+Shift+O',
    rewards: 'CommandOrControl+Alt+R',
  },
  // где искать названия наград, доли экрана
  rewardArea: { x: 0.18, y: 0.16, w: 0.64, h: 0.4 },
  // подсказка по компоненту в игре: hover - навёл и подержал, click - кликнул
  lookup: { enabled: true, mode: 'hover', delayMs: 700 },
  notify: { foundry: true, watchlist: true },
}

const ACCEL_RE = /^[A-Za-z0-9]+(\+[A-Za-z0-9]+){0,3}$/
const MIN_DELAY = 300
const MAX_DELAY = 3000

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
const bool = (v, d) => (typeof v === 'boolean' ? v : d)
const clamp = (v, lo, hi, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)

function isAccelerator(v) {
  return typeof v === 'string' && v.length <= 60 && ACCEL_RE.test(v)
}

// всё что пришло с диска или из окна проверяем, мусор заменяем дефолтами
function sanitizeSettings(raw) {
  const d = DEFAULT_SETTINGS
  const s = isObject(raw) ? raw : {}
  const hk = isObject(s.hotkeys) ? s.hotkeys : {}
  const area = isObject(s.rewardArea) ? s.rewardArea : {}
  const lookup = isObject(s.lookup) ? s.lookup : {}
  const notify = isObject(s.notify) ? s.notify : {}
  return {
    closeToTray: bool(s.closeToTray, d.closeToTray),
    autostart: bool(s.autostart, d.autostart),
    hotkeys: {
      overlay: isAccelerator(hk.overlay) ? hk.overlay : d.hotkeys.overlay,
      rewards: isAccelerator(hk.rewards) ? hk.rewards : d.hotkeys.rewards,
    },
    rewardArea: {
      x: clamp(area.x, 0, 1, d.rewardArea.x),
      y: clamp(area.y, 0, 1, d.rewardArea.y),
      w: clamp(area.w, 0.05, 1, d.rewardArea.w),
      h: clamp(area.h, 0.05, 1, d.rewardArea.h),
    },
    lookup: {
      enabled: bool(lookup.enabled, d.lookup.enabled),
      mode: lookup.mode === 'click' ? 'click' : 'hover',
      delayMs: clamp(lookup.delayMs, MIN_DELAY, MAX_DELAY, d.lookup.delayMs),
    },
    notify: {
      foundry: bool(notify.foundry, d.notify.foundry),
      watchlist: bool(notify.watchlist, d.notify.watchlist),
    },
  }
}

module.exports = { DEFAULT_SETTINGS, sanitizeSettings, isAccelerator }
