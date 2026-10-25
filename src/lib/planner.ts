import { isResourceComponent } from './parts'
import { partKey } from './progress'
import type { Drop, Item, RelicItem } from './types'

const RELIC_LOCATION_RE = /^(Lith|Meso|Neo|Axi|Requiem) (\S+) Relic(?: \((\w+)\))?$/

export interface PlanNeed {
  item: string
  part: string
  rarity?: string
  // шанс из целой, %
  chance: number
}

export interface PlanRelic {
  key: string
  tier: string
  vaulted: boolean
  needs: PlanNeed[]
}

export interface PlanOther {
  item: string
  part: string
  drops: Drop[]
}

export interface Plan {
  relics: PlanRelic[]
  other: PlanOther[]
  done: string[]
}

// берём шанс целой, если её нет - минимальный
function relicChances(drops: Drop[]): Map<string, { tier: string; chance: number; rarity?: string }> {
  const out = new Map<string, { tier: string; chance: number; rarity?: string; intact: boolean }>()
  for (const d of drops) {
    const m = RELIC_LOCATION_RE.exec(d.location)
    if (!m) continue
    const key = `${m[1]} ${m[2]}`
    const intact = !m[3]
    const prev = out.get(key)
    if (!prev || (intact && !prev.intact) || (!intact && !prev.intact && d.chance < prev.chance)) {
      out.set(key, { tier: m[1], chance: d.chance, rarity: d.rarity, intact })
    }
  }
  return out
}

// цели -> какие реликвии открывать и что фармить напрямую
export function buildPlan(goals: Item[], owned: Record<string, true>, relics: RelicItem[]): Plan {
  const relicByKey = new Map(relics.map((r) => [`${r.tier} ${r.code}`, r]))
  const grouped = new Map<string, PlanRelic>()
  const other: PlanOther[] = []
  const done: string[] = []

  for (const goal of goals) {
    const missing = (goal.components ?? []).filter((c) => !isResourceComponent(c) && !owned[partKey(goal.uniqueName, c.name)])
    if (missing.length === 0) {
      done.push(goal.name)
      continue
    }
    for (const part of missing) {
      const chances = relicChances(part.drops ?? [])
      if (chances.size === 0) {
        other.push({ item: goal.name, part: part.name, drops: part.drops ?? [] })
        continue
      }
      for (const [key, c] of chances) {
        const entry = grouped.get(key) ?? { key, tier: c.tier, vaulted: relicByKey.get(key)?.vaulted ?? false, needs: [] }
        grouped.set(key, { ...entry, needs: [...entry.needs, { item: goal.name, part: part.name, rarity: c.rarity, chance: c.chance }] })
      }
    }
  }

  const best = (r: PlanRelic) => Math.max(...r.needs.map((n) => n.chance))
  const sorted = [...grouped.values()].sort(
    (a, b) => Number(a.vaulted) - Number(b.vaulted) || b.needs.length - a.needs.length || best(b) - best(a),
  )
  return { relics: sorted, other, done }
}
