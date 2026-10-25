const MIN = 60_000

export type CycleKey = 'cetusCycle' | 'vallisCycle' | 'cambionCycle' | 'zarimanCycle' | 'duviriCycle'

// длины фаз, по кругу
const SEQUENCES: Record<CycleKey, { state: string; ms: number }[]> = {
  cetusCycle: [{ state: 'day', ms: 100 * MIN }, { state: 'night', ms: 50 * MIN }],
  cambionCycle: [{ state: 'fass', ms: 100 * MIN }, { state: 'vome', ms: 50 * MIN }],
  vallisCycle: [{ state: 'warm', ms: (20 / 3) * MIN }, { state: 'cold', ms: 20 * MIN }],
  zarimanCycle: [{ state: 'corpus', ms: 150 * MIN }, { state: 'grineer', ms: 150 * MIN }],
  duviriCycle: ['joy', 'anger', 'envy', 'sorrow', 'fear'].map((state) => ({ state, ms: 120 * MIN })),
}

export interface RolledCycle {
  state: string
  expiry: number
  // начало фазы, если досчитали сами
  startedAt?: number
}

// api иногда отстаёт на час, докручиваем циклы сами
export function rollCycle(key: CycleKey, cycle: { state: string; expiry: string }, now: number): RolledCycle {
  let expiry = new Date(cycle.expiry).getTime()
  let state = cycle.state?.toLowerCase() ?? ''
  const seq = SEQUENCES[key]
  let index = seq.findIndex((s) => s.state === state)
  if (index < 0 || !Number.isFinite(expiry)) return { state, expiry }
  if (expiry > now) return { state, expiry }
  while (expiry <= now) {
    index = (index + 1) % seq.length
    state = seq[index].state
    expiry += seq[index].ms
  }
  return { state, expiry, startedAt: expiry - seq[index].ms }
}
