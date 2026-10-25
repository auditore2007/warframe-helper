// @vitest-environment node
import { describe, it, expect } from 'vitest'
import settings from './settings.cjs'

const { DEFAULT_SETTINGS, sanitizeSettings, isAccelerator } = settings

describe('settings', () => {
  it('fills defaults for missing or broken data', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings({ closeToTray: 'yes', hotkeys: 5 })).toEqual(DEFAULT_SETTINGS)
  })
  it('keeps valid values and clamps the reward area', () => {
    const s = sanitizeSettings({
      closeToTray: false,
      autostart: true,
      hotkeys: { overlay: 'Alt+F1', rewards: 'bad key!!' },
      rewardArea: { x: -1, y: 0.2, w: 2, h: 0.3 },
      lookup: { enabled: false, mode: 'click', delayMs: 50 },
      notify: { foundry: false, watchlist: true },
    })
    expect(s.closeToTray).toBe(false)
    expect(s.autostart).toBe(true)
    expect(s.hotkeys).toEqual({ overlay: 'Alt+F1', rewards: DEFAULT_SETTINGS.hotkeys.rewards })
    expect(s.rewardArea).toEqual({ x: 0, y: 0.2, w: 1, h: 0.3 })
    expect(s.lookup).toEqual({ enabled: false, mode: 'click', delayMs: 300 })
    expect(s.notify).toEqual({ foundry: false, watchlist: true })
  })
  it('accepts only simple accelerators', () => {
    expect(isAccelerator('CommandOrControl+Alt+R')).toBe(true)
    expect(isAccelerator('F8')).toBe(true)
    expect(isAccelerator('')).toBe(false)
    expect(isAccelerator('Ctrl+R; rm')).toBe(false)
  })
})
