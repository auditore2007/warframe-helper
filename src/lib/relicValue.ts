import type { PriceMap, RelicReward } from './types'

export type Refinement = 'intact' | 'radiant'

export interface RelicValue {
  value: number
  // сколько наград с известной ценой (форма считается как 0)
  priced: number
  total: number
}

// сумма цена * шанс
export function expectedValue(rewards: RelicReward[], prices: PriceMap, refinement: Refinement): RelicValue {
  let value = 0
  let priced = 0
  for (const r of rewards) {
    if (!r.slug) {
      priced += 1
      continue
    }
    const price = prices[r.slug]
    if (!price) continue
    priced += 1
    value += ((r[refinement] ?? 0) / 100) * price.median
  }
  return { value: Math.round(value * 100) / 100, priced, total: rewards.length }
}
