export type BaseElement = 'heat' | 'cold' | 'electricity' | 'toxin'
export type CombinedElement = 'blast' | 'radiation' | 'gas' | 'magnetic' | 'viral' | 'corrosive'
export type DamageType = 'impact' | 'puncture' | 'slash' | BaseElement | CombinedElement | 'void' | 'tau'

const PHYSICAL: DamageType[] = ['impact', 'puncture', 'slash']
const BASE_ELEMENTS: BaseElement[] = ['heat', 'cold', 'electricity', 'toxin']

const COMBOS: Record<string, CombinedElement> = {
  'cold+heat': 'blast',
  'electricity+heat': 'radiation',
  'heat+toxin': 'gas',
  'cold+electricity': 'magnetic',
  'cold+toxin': 'viral',
  'electricity+toxin': 'corrosive',
}

export interface WeaponStats {
  damage: Partial<Record<DamageType, number>>
  critChance: number
  critMultiplier: number
  statusChance: number
  fireRate: number
  multishot: number
  magazine: number
  reload: number
}

// все проценты долями: 1.65 = +165%
export interface ModEffect {
  damage?: number
  multishot?: number
  critChance?: number
  critDamage?: number
  status?: number
  fireRate?: number
  element?: BaseElement
  elementValue?: number
}

export interface DamageResult {
  damage: Partial<Record<DamageType, number>>
  total: number
  critChance: number
  critMultiplier: number
  avgCrit: number
  statusChance: number
  multishot: number
  fireRate: number
  perShot: number
  burstDps: number
  sustainedDps: number
}

const sum = (mods: ModEffect[], key: keyof Omit<ModEffect, 'element'>) => mods.reduce((s, m) => s + ((m[key] as number | undefined) ?? 0), 0)

// одинаковые стихии сливаются, потом соседние пары смешиваются: [a, b, c, d] -> a+b, c+d
export function combineElements(list: [BaseElement, number][]): Partial<Record<DamageType, number>> {
  const merged: [BaseElement, number][] = []
  for (const [el, v] of list) {
    const found = merged.find((m) => m[0] === el)
    if (found) found[1] += v
    else merged.push([el, v])
  }
  const out: Partial<Record<DamageType, number>> = {}
  for (let i = 0; i < merged.length; i += 2) {
    const [a, av] = merged[i]
    const next = merged[i + 1]
    if (!next) {
      out[a] = (out[a] ?? 0) + av
      continue
    }
    const combo = COMBOS[[a, next[0]].sort().join('+')]
    out[combo] = (out[combo] ?? 0) + av + next[1]
  }
  return out
}

// упрощённо, как в арсенале: без бонусов от фракций, брони и условных модов
export function calcDamage(weapon: WeaponStats, mods: ModEffect[]): DamageResult {
  const base = weapon.damage
  const baseTotal = Object.values(base).reduce((a, b) => a + (b ?? 0), 0)
  const dmgMult = 1 + sum(mods, 'damage')

  const damage: Partial<Record<DamageType, number>> = {}
  for (const [type, value] of Object.entries(base) as [DamageType, number][]) {
    if (!value || BASE_ELEMENTS.includes(type as BaseElement)) continue
    damage[type] = value * dmgMult
  }
  const elements: [BaseElement, number][] = mods
    .filter((m) => m.element && m.elementValue)
    .map((m) => [m.element!, baseTotal * dmgMult * m.elementValue!])
  for (const el of BASE_ELEMENTS) if (base[el]) elements.push([el, base[el]! * dmgMult])
  for (const [type, value] of Object.entries(combineElements(elements)) as [DamageType, number][]) {
    damage[type] = (damage[type] ?? 0) + value
  }

  const total = Object.values(damage).reduce((a, b) => a + (b ?? 0), 0)
  const critChance = weapon.critChance * (1 + sum(mods, 'critChance'))
  const critMultiplier = weapon.critMultiplier * (1 + sum(mods, 'critDamage'))
  const avgCrit = 1 + critChance * (critMultiplier - 1)
  const multishot = weapon.multishot * (1 + sum(mods, 'multishot'))
  const fireRate = weapon.fireRate * (1 + sum(mods, 'fireRate'))
  const perShot = total * avgCrit * multishot
  const burstDps = perShot * fireRate
  const emptyTime = weapon.magazine > 0 && fireRate > 0 ? weapon.magazine / fireRate : 0
  const sustainedDps = emptyTime > 0 ? burstDps * (emptyTime / (emptyTime + weapon.reload)) : burstDps

  return {
    damage,
    total,
    critChance,
    critMultiplier,
    avgCrit,
    statusChance: weapon.statusChance * (1 + sum(mods, 'status')),
    multishot,
    fireRate,
    perShot,
    burstDps,
    sustainedDps,
  }
}

export interface FactionMods {
  weak: DamageType[]
  resist: DamageType[]
}

// во сколько раз урон по фракции отличается от урона "в вакууме"
export function factionMultiplier(damage: Partial<Record<DamageType, number>>, faction: FactionMods): number {
  let total = 0
  let scaled = 0
  for (const [type, value] of Object.entries(damage) as [DamageType, number][]) {
    if (!value) continue
    const mult = faction.weak.includes(type) ? 1.5 : faction.resist.includes(type) ? 0.5 : 1
    total += value
    scaled += value * mult
  }
  return total ? scaled / total : 1
}

export const isPhysical = (t: DamageType): boolean => PHYSICAL.includes(t)
