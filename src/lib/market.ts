import type { MarketItem } from './types'

export interface MarketIndex {
  byRef: Map<string, MarketItem>
  bySlug: Map<string, MarketItem>
}

export const EMPTY_INDEX: MarketIndex = { byRef: new Map(), bySlug: new Map() }

// если дукатов в 10 раз больше чем платины - проще сдать Баро
const DUCATS_PER_PLAT_THRESHOLD = 10

export function buildMarketIndex(items: MarketItem[] | undefined): MarketIndex {
  if (!items?.length) return EMPTY_INDEX
  const byRef = new Map<string, MarketItem>()
  const bySlug = new Map<string, MarketItem>()
  for (const it of items) {
    bySlug.set(it.slug, it)
    if (it.gameRef) byRef.set(it.gameRef, it)
  }
  return { byRef, bySlug }
}

// в игре ...ChassisComponent, на маркете ...ChassisBlueprint
export function marketItemFor(index: MarketIndex, uniqueName: string | undefined): MarketItem | undefined {
  if (!uniqueName) return undefined
  return index.byRef.get(uniqueName) ?? index.byRef.get(uniqueName.replace(/Component$/, 'Blueprint'))
}

export function betterForDucats(platinum: number | null, ducats: number | null): boolean {
  if (platinum === null || !ducats) return false
  return ducats / Math.max(platinum, 1) >= DUCATS_PER_PLAT_THRESHOLD
}

export function whisperText(seller: string, itemName: string, platinum: number): string {
  return `/w ${seller} Hi! I want to buy: "${itemName}" for ${platinum} platinum. (warframe.market)`
}

const MAX_CHAT_MESSAGE = 150

export interface WtsEntry {
  en: string
  platinum: number | null
  count: number
}

// WTS для чата, режем на несколько сообщений если длинно
export function wtsMessages(entries: WtsEntry[]): string[] {
  const chunks = entries.map((e) => [`[${e.en}]`, e.count > 1 ? `x${e.count}` : '', e.platinum !== null ? `${Math.round(e.platinum)}p` : ''].filter(Boolean).join(' '))
  const messages: string[] = []
  let current = 'WTS'
  for (const chunk of chunks) {
    if (current !== 'WTS' && current.length + 1 + chunk.length > MAX_CHAT_MESSAGE) {
      messages.push(current)
      current = 'WTS'
    }
    current += ` ${chunk}`
  }
  if (current !== 'WTS') messages.push(current)
  return messages
}
