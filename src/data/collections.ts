export type LichFamily = 'kuva' | 'tenet' | 'coda'

export interface LichFamilyInfo {
  id: LichFamily
  title: string
  // префикс страницы на вики
  wikiPrefix: string
  source: string
}

export const LICH_FAMILIES: LichFamilyInfo[] = [
  { id: 'kuva', title: 'Оружие Кува', wikiPrefix: 'Kuva_', source: 'Победи Лича Кува - он появляется после убийства Ларвлинга в миссиях гриннир. Нужен квест «Война внутри».' },
  { id: 'tenet', title: 'Оружие Догмат', wikiPrefix: 'Tenet_', source: 'Победи Сестру Парвоса - она появляется после убийства Кандидата в миссиях корпуса.' },
  { id: 'coda', title: 'Оружие Кода', wikiPrefix: 'Coda_', source: 'Победи Лича Заражённых (Техрот) - оружие Кода приходит вместе с ним.' },
]

// бонус стихии 25-60%
export const LICH_ELEMENTS: { id: string; label: string }[] = [
  { id: 'Heat', label: 'Жар' },
  { id: 'Cold', label: 'Холод' },
  { id: 'Electricity', label: 'Электричество' },
  { id: 'Toxin', label: 'Токсин' },
  { id: 'Impact', label: 'Удар' },
  { id: 'Magnetic', label: 'Магнетизм' },
  { id: 'Radiation', label: 'Радиация' },
]

export const ELEMENT_LABEL = new Map(LICH_ELEMENTS.map((e) => [e.id, e.label]))

export type NightmareGroup = 'A' | 'B' | 'C'

// список с вики (Nightmare_Mode)
export const NIGHTMARE_MODS: { name: string; group: NightmareGroup }[] = [
  { name: 'Chilling Reload', group: 'A' },
  { name: 'Ice Storm', group: 'A' },
  { name: 'Stunning Speed', group: 'A' },
  { name: 'Hammer Shot', group: 'A' },
  { name: 'Wildfire', group: 'A' },
  { name: 'Accelerated Blast', group: 'A' },
  { name: 'Blaze', group: 'A' },
  { name: 'Drifting Contact', group: 'B' },
  { name: 'Seeking Fury', group: 'B' },
  { name: 'Armored Agility', group: 'B' },
  { name: 'Shred', group: 'B' },
  { name: 'Rending Strike', group: 'B' },
  { name: 'Fortitude', group: 'B' },
  { name: 'Streamlined Form', group: 'C' },
  { name: 'Animal Instinct', group: 'C' },
  { name: 'Vigor', group: 'C' },
  { name: 'Lethal Torrent', group: 'C' },
  { name: 'Focus Energy', group: 'C' },
  { name: 'Constitution', group: 'C' },
]

export const NIGHTMARE_PLANETS: Record<NightmareGroup, string> = {
  A: 'Меркурий, Венера, Земля, Марс',
  B: 'Фобос, Церера, Юпитер, Европа, Бездна, Луна, Крепость Кувы, Деймос, Сатурн',
  C: 'Уран, Нептун, Плутон, Эрида, Седна',
}

export const NIGHTMARE_HOW = 'Режим Кошмара открывается на планете, когда пройдены все её узлы. На карте такой узел отмечен красным, миссия меняется каждые 8 часов.'
