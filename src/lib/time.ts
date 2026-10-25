const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const pad = (n: number) => String(n).padStart(2, '0')

// '2 д 4 ч', '1 ч 05 мин', '4:09'
export function formatCountdown(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'обновляется'
  const days = Math.floor(ms / DAY)
  const hours = Math.floor((ms % DAY) / HOUR)
  const minutes = Math.floor((ms % HOUR) / MINUTE)
  const seconds = Math.floor((ms % MINUTE) / 1000)
  if (days > 0) return `${days} д ${hours} ч`
  if (hours > 0) return `${hours} ч ${pad(minutes)} мин`
  return `${minutes}:${pad(seconds)}`
}

export function msUntil(iso: string | undefined, now: number): number {
  if (!iso) return NaN
  return new Date(iso).getTime() - now
}

export function formatRelative(ts: number | undefined, now: number): string {
  if (ts === undefined) return 'никогда'
  const diff = Math.max(0, now - ts)
  if (diff < MINUTE) return 'только что'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} мин назад`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} ч назад`
  return `${Math.floor(diff / DAY)} д назад`
}

// дейлик в 00:00 UTC
export function gameDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

// неделя с понедельника 00:00 UTC
export function gameWeekKey(now: number): string {
  const d = new Date(now)
  const dow = (d.getUTCDay() + 6) % 7
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)
  return new Date(monday).toISOString().slice(0, 10)
}

export function nextDailyReset(now: number): number {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
}

export function nextWeeklyReset(now: number): number {
  return new Date(gameWeekKey(now)).getTime() + 7 * DAY
}

// buildLabel из мира: '2026.10.22.13.12/...' -> '22.10.2026'
export function gameBuildDate(label: string | undefined): string | null {
  const m = /^(\d{4})\.(\d{2})\.(\d{2})/.exec(label ?? '')
  return m ? `${m[3]}.${m[2]}.${m[1]}` : null
}
