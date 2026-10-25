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
