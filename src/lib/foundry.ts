import type { FoundryTimer, ProgressState } from './progress'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

export function addTimer(state: ProgressState, name: string, durationMs: number, now: number, id = `t${now}`): ProgressState {
  const clean = name.trim()
  if (!clean || !(durationMs > 0)) return state
  const timer: FoundryTimer = { id, name: clean, endsAt: now + durationMs, notified: false }
  return { ...state, timers: [...state.timers, timer] }
}

export function removeTimer(state: ProgressState, id: string): ProgressState {
  return { ...state, timers: state.timers.filter((t) => t.id !== id) }
}

export function dueTimers(state: ProgressState, now: number): FoundryTimer[] {
  return state.timers.filter((t) => !t.notified && t.endsAt <= now)
}

export function markNotified(state: ProgressState, ids: string[]): ProgressState {
  const set = new Set(ids)
  return { ...state, timers: state.timers.map((t) => (set.has(t.id) ? { ...t, notified: true } : t)) }
}

// часы + минуты в мс, null если ерунда
export function parseDuration(hours: string, minutes: string): number | null {
  const h = hours.trim() === '' ? 0 : Number(hours)
  const m = minutes.trim() === '' ? 0 : Number(minutes)
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || m < 0) return null
  const total = h * HOUR_MS + m * MINUTE_MS
  return total > 0 ? total : null
}
