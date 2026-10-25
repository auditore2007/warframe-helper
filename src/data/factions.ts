import type { DamageType } from '../lib/damage'

export interface Faction {
  id: string
  name: string
  weak: DamageType[]
  resist: DamageType[]
}

// wiki.warframe.com, Module:DamageTypes/data (урон 2.0): слабость x1.5, сопротивление x0.5
export const FACTIONS: Faction[] = [
  { id: 'grineer', name: 'Гринир', weak: ['impact', 'corrosive'], resist: [] },
  { id: 'kuva', name: 'Гринир Кувы', weak: ['impact', 'corrosive'], resist: ['heat'] },
  { id: 'corpus', name: 'Корпус', weak: ['puncture', 'magnetic'], resist: [] },
  { id: 'amalgam', name: 'Амальгамы Корпуса', weak: ['electricity', 'magnetic'], resist: ['blast'] },
  { id: 'infested', name: 'Заражённые', weak: ['slash', 'heat'], resist: [] },
  { id: 'deimos', name: 'Заражённые Деймоса', weak: ['blast', 'gas'], resist: ['viral'] },
  { id: 'orokin', name: 'Орокин (Осквернённые)', weak: ['puncture', 'viral'], resist: ['radiation'] },
  { id: 'sentient', name: 'Сентиенты', weak: ['cold', 'radiation'], resist: ['corrosive'] },
  { id: 'narmer', name: 'Нармер', weak: ['slash', 'toxin'], resist: ['magnetic'] },
  { id: 'murmur', name: 'Шёпот', weak: ['electricity', 'radiation'], resist: ['viral'] },
  { id: 'zariman', name: 'Зариман', weak: ['void'], resist: [] },
  { id: 'scaldra', name: 'Скальдра', weak: ['impact', 'corrosive'], resist: ['gas'] },
  { id: 'techrot', name: 'Техрот', weak: ['gas', 'magnetic'], resist: ['cold'] },
  { id: 'anarchs', name: 'Анархи', weak: ['impact', 'electricity'], resist: ['radiation'] },
]
