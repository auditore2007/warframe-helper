import type { Item } from './types'

const FRAME_LIKE = new Set(['Warframes', 'Archwing', 'Sentinels', 'Pets', 'Necramech'])

export function isFrameLike(category: string): boolean {
  return FRAME_LIKE.has(category)
}

// опыт до ранга r: (фрейм ? 1000 : 500) * r^2
export function rankFromXp(xp: number, category: string, maxRank = 30): number {
  if (!Number.isFinite(xp) || xp <= 0) return 0
  const unit = isFrameLike(category) ? 1000 : 500
  return Math.min(maxRank, Math.floor(Math.sqrt(xp / unit)))
}

export function maxRankOf(item: Pick<Item, 'maxLevelCap'>): number {
  return item.maxLevelCap && item.maxLevelCap > 0 ? item.maxLevelCap : 30
}

export interface MasteryStatus {
  rank: number
  maxRank: number
  mastered: boolean
  seen: boolean
}

export function masteryStatus(item: Item, xpByUnique: Map<string, number>): MasteryStatus {
  const xp = xpByUnique.get(item.uniqueName)
  const maxRank = maxRankOf(item)
  if (xp === undefined) return { rank: 0, maxRank, mastered: false, seen: false }
  const rank = rankFromXp(xp, item.category, maxRank)
  return { rank, maxRank, mastered: rank >= maxRank, seen: true }
}

// MR N = 2500 * N^2 очков
export function masteryPointsForRank(rank: number): number {
  return 2500 * rank * rank
}

// очков мастерства за ранг: фреймы и компаньоны 200, оружие 100
export function masteryPointsOf(item: Pick<Item, 'category' | 'maxLevelCap'>): number {
  return maxRankOf(item) * (isFrameLike(item.category) ? 200 : 100)
}

export type ItemSource = 'credits' | 'drops' | 'prime' | 'vaulted' | 'lich' | 'other'

// от простого к сложному, по этому порядку сортируем список
export const SOURCE_ORDER: ItemSource[] = ['credits', 'drops', 'prime', 'other', 'vaulted', 'lich']

const LICH_WIKI = /\/w\/(Kuva|Tenet|Coda)_/

export function sourceOf(item: Item): ItemSource {
  if (item.wikiaUrl && LICH_WIKI.test(item.wikiaUrl)) return 'lich'
  if (item.isPrime) return item.vaulted ? 'vaulted' : 'prime'
  if (item.bpCost) return 'credits'
  if ((item.components ?? []).some((c) => (c.drops ?? []).length > 0)) return 'drops'
  return 'other'
}

export interface TodoEntry {
  item: Item
  rank: number
  maxRank: number
  pointsLeft: number
  source: ItemSource
}

export interface MasteryTodo {
  leveling: TodoEntry[]
  missing: TodoEntry[]
  pointsDone: number
  pointsLeft: number
}

// что докачать (уже есть) и что ещё не было, с очками
export function masteryTodo(items: Item[], xpByUnique: Map<string, number>): MasteryTodo {
  const leveling: TodoEntry[] = []
  const missing: TodoEntry[] = []
  let pointsDone = 0
  let pointsLeft = 0
  for (const item of items) {
    const st = masteryStatus(item, xpByUnique)
    const perRank = masteryPointsOf(item) / st.maxRank
    pointsDone += st.rank * perRank
    if (st.mastered) continue
    const entry = { item, rank: st.rank, maxRank: st.maxRank, pointsLeft: (st.maxRank - st.rank) * perRank, source: sourceOf(item) }
    pointsLeft += entry.pointsLeft
    ;(st.seen ? leveling : missing).push(entry)
  }
  const bySource = (a: TodoEntry, b: TodoEntry) => SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source) || b.pointsLeft - a.pointsLeft
  leveling.sort((a, b) => b.rank - a.rank)
  missing.sort(bySource)
  return { leveling, missing, pointsDone, pointsLeft }
}
