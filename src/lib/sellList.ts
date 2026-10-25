import type { ProgressState } from './progress'
import type { PriceMap } from './types'

export function setSellCount(state: ProgressState, slug: string, count: number): ProgressState {
  const n = Math.floor(count)
  if (!(n > 0)) {
    const { [slug]: _removed, ...rest } = state.sell
    return { ...state, sell: rest }
  }
  return { ...state, sell: { ...state.sell, [slug]: n } }
}

export interface SellTotals {
  platinum: number
  ducats: number
  // сколько штук без цены
  unpriced: number
}

export function sellTotals(sell: Record<string, number>, prices: PriceMap, ducatsBySlug: Map<string, number>): SellTotals {
  let platinum = 0
  let ducats = 0
  let unpriced = 0
  for (const [slug, count] of Object.entries(sell)) {
    const price = prices[slug]
    if (price) platinum += price.median * count
    else unpriced += 1
    ducats += (ducatsBySlug.get(slug) ?? 0) * count
  }
  return { platinum: Math.round(platinum), ducats, unpriced }
}
