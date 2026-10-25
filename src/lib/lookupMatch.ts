import { componentRu } from './i18n'
import { buildMarketIndex, marketItemFor } from './market'
import { isResourceComponent } from './parts'
import { wikiKey } from './text'
import type { Item, LookupLine, MarketItem } from './types'

const MIN_SCORE = 0.82
// чем дальше строка от курсора, тем меньше ей верим
const DISTANCE_PENALTY = 0.0005
// склеенные две строки чуть важнее: название часто переносится
const JOINED_BONUS = 0.01
const JOIN_MAX_DX = 150
const JOIN_MAX_DY = 45

export type LookupHit =
  | { kind: 'part'; itemId: string; component: string; slug: string | null }
  | { kind: 'item'; itemId: string }
  | { kind: 'resource'; resourceId: string }

interface Entry {
  hit: LookupHit
  names: string[]
  prefixes: Set<string>
}

export interface LookupIndex {
  entries: Entry[]
  byPrefix: Map<string, Entry[]>
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'е').replace(/['’`]/g, '').replace(/[^a-zа-я0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

const sortedTokens = (text: string) => normalize(text).split(' ').filter(Boolean).sort().join(' ')
const prefixesOf = (text: string) => new Set(normalize(text).split(' ').filter((t) => t.length >= 3).map((t) => t.slice(0, 3)))

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[b.length]
}

// порядок слов не важен: 'Нейрооптика Сарина Прайм' == 'Сарина Прайм: Нейрооптика'
export function similarity(a: string, b: string): number {
  const sa = sortedTokens(a)
  const sb = sortedTokens(b)
  const len = Math.max(sa.length, sb.length)
  return len ? 1 - levenshtein(sa, sb) / len : 0
}

export function buildLookupIndex(items: Item[], market: MarketItem[], resources: { id: string; name: string; en: string }[]): LookupIndex {
  const mIndex = buildMarketIndex(market)
  const entries: Entry[] = []
  const add = (hit: LookupHit, names: (string | null | undefined)[]) => {
    const clean = [...new Set(names.filter((n): n is string => Boolean(n && normalize(n))))]
    entries.push({ hit, names: clean.map(sortedTokens), prefixes: new Set(clean.flatMap((n) => [...prefixesOf(n)])) })
  }
  for (const item of items) {
    const en = wikiKey(item.wikiaUrl)
    add({ kind: 'item', itemId: item.uniqueName }, [item.name, en])
    for (const c of item.components ?? []) {
      if (isResourceComponent(c)) continue
      const m = marketItemFor(mIndex, c.uniqueName)
      add({ kind: 'part', itemId: item.uniqueName, component: c.name, slug: m?.slug ?? null }, [
        m?.en, m?.ru, `${item.name} ${componentRu(c.name)}`, en ? `${en} ${c.name}` : null,
      ])
    }
  }
  for (const r of resources) add({ kind: 'resource', resourceId: r.id }, [r.name, r.en])

  const byPrefix = new Map<string, Entry[]>()
  for (const e of entries) for (const p of e.prefixes) byPrefix.set(p, [...(byPrefix.get(p) ?? []), e])
  return { entries, byPrefix }
}

interface Candidate {
  text: string
  dist: number
  joined: boolean
}

// отдельные строки + пары строк одна под другой
function candidatesOf(lines: LookupLine[]): Candidate[] {
  const out: Candidate[] = lines.map((l) => ({ text: l.text, dist: Math.hypot(l.dx, l.dy), joined: false }))
  for (const a of lines) {
    for (const b of lines) {
      const dy = b.dy - a.dy
      if (a === b || dy <= 0 || dy > JOIN_MAX_DY || Math.abs(b.dx - a.dx) > JOIN_MAX_DX) continue
      out.push({ text: `${a.text} ${b.text}`, dist: Math.min(Math.hypot(a.dx, a.dy), Math.hypot(b.dx, b.dy)), joined: true })
    }
  }
  return out
}

export function findLookup(lines: LookupLine[], index: LookupIndex): LookupHit | null {
  let best: { hit: LookupHit; score: number } | null = null
  for (const c of candidatesOf(lines)) {
    const pool = new Set([...prefixesOf(c.text)].flatMap((p) => index.byPrefix.get(p) ?? []))
    for (const e of pool) {
      const raw = Math.max(...e.names.map((n) => similarity(c.text, n)))
      if (raw < MIN_SCORE) continue
      const score = raw - c.dist * DISTANCE_PENALTY + (c.joined ? JOINED_BONUS : 0)
      if (!best || score > best.score) best = { hit: e.hit, score }
    }
  }
  return best?.hit ?? null
}
