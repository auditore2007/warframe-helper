export type Platform = 'pc' | 'ps4' | 'xb1' | 'swi'

export interface FoundryTimer {
  id: string
  name: string
  endsAt: number
  notified: boolean
}

export interface CollectionEntry {
  element: string | null
  bonus: number | null
}

export const SHARD_COLORS = ['crimson', 'amber', 'azure', 'emerald', 'topaz', 'violet'] as const
export type ShardColor = (typeof SHARD_COLORS)[number]

export interface ShardSlot {
  color: ShardColor
  // номер бонуса
  bonus: number
  tau: boolean
}

export interface AccountLink {
  accountId: string
  platform: Platform
  displayName: string | null
}

export interface ProgressState {
  version: 1
  // 'uniqueName::часть' -> есть
  parts: Record<string, true>
  // что хочу собрать
  goals: string[]
  mods: Record<string, true>
  planets: Record<string, true>
  checklist: { day: string; week: string; done: Record<string, true> }
  account: AccountLink | null
  timers: FoundryTimer[]
  // slug -> сколько продаю
  sell: Record<string, number>
  // 'kuva:/Lotus/...', 'nightmare:Blaze' -> есть
  collection: Record<string, CollectionEntry>
  // фрейм -> 5 слотов
  shards: Record<string, (ShardSlot | null)[]>
}

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  parts: {},
  goals: [],
  mods: {},
  planets: {},
  checklist: { day: '', week: '', done: {} },
  account: null,
  timers: [],
  sell: {},
  collection: {},
  shards: {},
}

export const partKey = (uniqueName: string, component: string): string => `${uniqueName}::${component}`

function toggleKey(map: Record<string, true>, key: string): Record<string, true> {
  if (map[key]) {
    const { [key]: _removed, ...rest } = map
    return rest
  }
  return { ...map, [key]: true }
}

export function togglePart(state: ProgressState, uniqueName: string, component: string): ProgressState {
  return { ...state, parts: toggleKey(state.parts, partKey(uniqueName, component)) }
}

export function toggleGoal(state: ProgressState, uniqueName: string): ProgressState {
  const goals = state.goals.includes(uniqueName)
    ? state.goals.filter((g) => g !== uniqueName)
    : [...state.goals, uniqueName]
  return { ...state, goals }
}

export function toggleMod(state: ProgressState, uniqueName: string): ProgressState {
  return { ...state, mods: toggleKey(state.mods, uniqueName) }
}

export function togglePlanet(state: ProgressState, id: string): ProgressState {
  return { ...state, planets: toggleKey(state.planets, id) }
}

// сбрасываем дейлики/недельки после ресета
export function rollChecklist(state: ProgressState, day: string, week: string, dailyIds: Set<string>): ProgressState {
  const { checklist } = state
  if (checklist.day === day && checklist.week === week) return state
  const done = Object.fromEntries(
    Object.keys(checklist.done)
      .filter((id) => (dailyIds.has(id) ? checklist.day === day : checklist.week === week))
      .map((id) => [id, true as const]),
  )
  return { ...state, checklist: { day, week, done } }
}

export function toggleTask(state: ProgressState, id: string): ProgressState {
  return { ...state, checklist: { ...state.checklist, done: toggleKey(state.checklist.done, id) } }
}

export function setAccount(state: ProgressState, account: AccountLink | null): ProgressState {
  return { ...state, account }
}

// если в localStorage мусор - начинаем с пустого
export function parseProgress(raw: string | null): ProgressState {
  if (!raw) return EMPTY_PROGRESS
  try {
    const value = JSON.parse(raw) as Partial<ProgressState>
    if (!value || value.version !== 1) return EMPTY_PROGRESS
    return {
      ...EMPTY_PROGRESS,
      ...value,
      goals: Array.isArray(value.goals) ? value.goals.filter((g) => typeof g === 'string') : [],
      checklist: { ...EMPTY_PROGRESS.checklist, ...(value.checklist ?? {}) },
      timers: parseTimers(value.timers),
      sell: parseSell(value.sell),
      collection: parseCollection(value.collection),
      shards: parseShards(value.shards),
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function parseTimers(raw: unknown): FoundryTimer[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((t): t is FoundryTimer => isObject(t) && typeof t.id === 'string' && typeof t.name === 'string' && Number.isFinite(t.endsAt))
    .map((t) => ({ id: t.id, name: t.name, endsAt: t.endsAt, notified: Boolean(t.notified) }))
}

function parseSell(raw: unknown): Record<string, number> {
  if (!isObject(raw)) return {}
  return Object.fromEntries(Object.entries(raw).filter((e): e is [string, number] => Number.isInteger(e[1]) && (e[1] as number) > 0))
}

function parseCollection(raw: unknown): Record<string, CollectionEntry> {
  if (!isObject(raw)) return {}
  const out: Record<string, CollectionEntry> = {}
  for (const [key, v] of Object.entries(raw)) {
    if (!isObject(v)) continue
    out[key] = { element: typeof v.element === 'string' ? v.element : null, bonus: Number.isFinite(v.bonus) ? (v.bonus as number) : null }
  }
  return out
}

const MAX_SHARD_SLOTS = 5

function parseShardSlot(v: unknown): ShardSlot | null {
  if (!isObject(v) || !SHARD_COLORS.includes(v.color as ShardColor) || !Number.isInteger(v.bonus)) return null
  return { color: v.color as ShardColor, bonus: v.bonus as number, tau: Boolean(v.tau) }
}

function parseShards(raw: unknown): Record<string, (ShardSlot | null)[]> {
  if (!isObject(raw)) return {}
  const out: Record<string, (ShardSlot | null)[]> = {}
  for (const [key, v] of Object.entries(raw)) {
    if (!Array.isArray(v)) continue
    out[key] = Array.from({ length: MAX_SHARD_SLOTS }, (_, i) => parseShardSlot(v[i]))
  }
  return out
}

export function countOwnedParts(state: ProgressState, uniqueName: string, components: string[]): number {
  return components.filter((c) => state.parts[partKey(uniqueName, c)]).length
}
