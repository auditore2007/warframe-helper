import type { MarketItem, PriceMap, VoidTraderItem } from './types'

export interface DucatDeal {
  item: MarketItem
  median: number
  ducats: number
  perPlat: number
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// какие прайм-части выгоднее всего купить у игроков и сдать Баро. редкие сделки не берём, цена там случайная
export function ducatDeals(prices: PriceMap, items: MarketItem[], minVolume: number, limit: number): DucatDeal[] {
  return items
    .filter((i) => i.ducats && prices[i.slug] && prices[i.slug].volume >= minVolume && prices[i.slug].median > 0)
    .map((i) => {
      const median = prices[i.slug].median
      return { item: i, median, ducats: i.ducats as number, perPlat: Math.round(((i.ducats as number) / median) * 10) / 10 }
    })
    .sort((a, b) => b.perPlat - a.perPlat)
    .slice(0, limit)
}

export interface BaroOffer {
  name: string
  ducats: number
  credits: number
  market: MarketItem | null
}

// товары Баро приходят английскими названиями, ищем их на маркете
export function matchBaroItems(inventory: VoidTraderItem[], items: MarketItem[]): BaroOffer[] {
  const byName = new Map(items.map((i) => [norm(i.en), i]))
  return inventory.map((x) => ({ name: x.item, ducats: x.ducats, credits: x.credits, market: byName.get(norm(x.item)) ?? null }))
}
