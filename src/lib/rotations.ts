const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const ARCHONS = ['Amar', 'Nira', 'Boreal'] as const

export interface TeshinReward {
  name: string
  cost: number
}

export interface SteelPathInfo {
  activation?: string
  currentReward?: TeshinReward
  rotation?: TeshinReward[]
}

export interface ScheduledReward extends TeshinReward {
  startsAt: number
}

// Тешин идёт по кругу, следующие недели по списку
export function teshinSchedule(steelPath: SteelPathInfo, weeks: number): ScheduledReward[] {
  const rotation = steelPath.rotation ?? []
  const current = steelPath.currentReward
  const start = steelPath.activation ? new Date(steelPath.activation).getTime() : NaN
  if (!rotation.length || !current || !Number.isFinite(start)) return []
  const index = rotation.findIndex((r) => r.name === current.name)
  if (index < 0) return []
  return Array.from({ length: weeks }, (_, i) => ({
    ...rotation[(index + i + 1) % rotation.length],
    startsAt: start + WEEK_MS * (i + 1),
  }))
}

// Амар -> Нира -> Бореал
export function nextArchons(currentBoss: string | undefined, weeks: number): string[] {
  const index = ARCHONS.findIndex((a) => currentBoss?.includes(a))
  if (index < 0) return []
  return Array.from({ length: weeks }, (_, i) => ARCHONS[(index + i + 1) % ARCHONS.length])
}
