// сколько репы на каждый ранг 0-5
export const RANK_WIDTHS = [5000, 22000, 44000, 70000, 99000, 132000]
const BASE_DAILY_CAP = 16000
const DAILY_CAP_PER_MR = 500

export function dailyCap(masteryRank: number | null): number {
  return BASE_DAILY_CAP + DAILY_CAP_PER_MR * (masteryRank ?? 0)
}

const rankStart = (rank: number): number => RANK_WIDTHS.slice(0, rank).reduce((a, b) => a + b, 0)

export interface RankProgress {
  inRank: number
  width: number
  // null на макс ранге или в минусе
  toNext: number | null
}

// в профиле репа общая за все ранги: 3 ранг начинается с 71 000
export function rankProgress(standing: number, rank: number, maxRank: number): RankProgress {
  if (rank < 0) return { inRank: 0, width: RANK_WIDTHS[0], toNext: null }
  const r = Math.min(rank, RANK_WIDTHS.length - 1)
  const width = RANK_WIDTHS[r]
  const inRank = Math.min(width, Math.max(0, standing - rankStart(r)))
  return { inRank, width, toNext: rank >= maxRank ? null : width - inRank }
}

// дней до макс ранга если выбивать лимит
export function daysToRank(standing: number, rank: number, maxRank: number, cap: number): number | null {
  if (rank < 0 || cap <= 0) return null
  if (rank >= maxRank) return 0
  const needed = rankStart(maxRank) - Math.max(standing, rankStart(rank))
  return Math.ceil(Math.max(0, needed) / cap)
}
