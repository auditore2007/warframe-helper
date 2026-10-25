import { describe, it, expect } from 'vitest'
import {
  EMPTY_PROGRESS, togglePart, toggleGoal, togglePlanet, rollChecklist, toggleTask,
  setAccount, parseProgress, countOwnedParts, partKey, toggleMod,
} from './progress'

describe('progress state', () => {
  it('toggles parts immutably', () => {
    const a = togglePart(EMPTY_PROGRESS, '/X', 'Chassis')
    expect(a.parts[partKey('/X', 'Chassis')]).toBe(true)
    expect(EMPTY_PROGRESS.parts).toEqual({})
    const b = togglePart(a, '/X', 'Chassis')
    expect(b.parts).toEqual({})
    expect(countOwnedParts(a, '/X', ['Chassis', 'Systems'])).toBe(1)
  })
  it('toggles goals and planets', () => {
    const g = toggleGoal(EMPTY_PROGRESS, '/A')
    expect(g.goals).toEqual(['/A'])
    expect(toggleGoal(g, '/A').goals).toEqual([])
    expect(togglePlanet(EMPTY_PROGRESS, 'earth').planets).toEqual({ earth: true })
    expect(toggleMod(EMPTY_PROGRESS, '/mod').mods).toEqual({ '/mod': true })
    expect(toggleMod(toggleMod(EMPTY_PROGRESS, '/mod'), '/mod').mods).toEqual({})
  })
  it('rolls daily marks at day change and weekly at week change', () => {
    const daily = new Set(['d1'])
    let s = rollChecklist(EMPTY_PROGRESS, '2026-10-22', '2026-10-19', daily)
    s = toggleTask(toggleTask(s, 'd1'), 'w1')
    expect(rollChecklist(s, '2026-10-22', '2026-10-19', daily)).toBe(s)
    const nextDay = rollChecklist(s, '2026-10-23', '2026-10-19', daily)
    expect(nextDay.checklist.done).toEqual({ w1: true })
    const nextWeek = rollChecklist(s, '2026-10-26', '2026-10-26', daily)
    expect(nextWeek.checklist.done).toEqual({})
  })
  it('stores the linked account', () => {
    const acc = { accountId: 'a'.repeat(24), platform: 'pc' as const, displayName: 'T' }
    expect(setAccount(EMPTY_PROGRESS, acc).account).toEqual(acc)
  })
  it('parses persisted state defensively', () => {
    expect(parseProgress(null)).toBe(EMPTY_PROGRESS)
    expect(parseProgress('{bad')).toBe(EMPTY_PROGRESS)
    expect(parseProgress('{"version":2}')).toBe(EMPTY_PROGRESS)
    const parsed = parseProgress(JSON.stringify({ version: 1, goals: ['/A', 5], planets: { earth: true } }))
    expect(parsed.goals).toEqual(['/A'])
    expect(parsed.planets).toEqual({ earth: true })
    expect(parsed.checklist.done).toEqual({})
  })
})
