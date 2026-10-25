const MISSION_TYPES: Record<string, string> = {
  Assassination: 'Убийство',
  Capture: 'Захват',
  Defense: 'Оборона',
  'Mobile Defense': 'Мобильная оборона',
  Excavation: 'Раскопки',
  Extermination: 'Зачистка',
  Exterminate: 'Зачистка',
  Hijack: 'Угон',
  Interception: 'Перехват',
  Rescue: 'Спасение',
  Sabotage: 'Саботаж',
  Spy: 'Шпионаж',
  Survival: 'Выживание',
  Disruption: 'Сбой',
  Defection: 'Дезертирство',
  'Infested Salvage': 'Утилизация',
  Salvage: 'Утилизация',
  Skirmish: 'Стычка',
  Volatile: 'Нестабильность',
  Orphix: 'Орфикс',
  'Void Flood': 'Затопление Бездны',
  'Void Cascade': 'Каскад Бездны',
  'Void Armageddon': 'Армагеддон Бездны',
  Alchemy: 'Алхимия',
  Netracells: 'Нетраклетки',
  Mirror: 'Зеркальная оборона',
  'Mirror Defense': 'Зеркальная оборона',
  Assault: 'Штурм',
  Pursuit: 'Преследование',
  Rush: 'Гонка',
  Arena: 'Арена',
  'Free Roam': 'Открытый мир',
  Hive: 'Улей',
  Conjunction: 'Конъюнкция',
  'Conjunction Survival': 'Выживание (конъюнкция)',
  'Dark Sector Defense': 'Оборона (Тёмный сектор)',
  'Dark Sector Survival': 'Выживание (Тёмный сектор)',
  'Dark Sector Excavation': 'Раскопки (Тёмный сектор)',
  'Dark Sector Disruption': 'Сбой (Тёмный сектор)',
}

const FACTIONS: Record<string, string> = {
  Grineer: 'Гринир',
  Corpus: 'Корпус',
  Infested: 'Заражённые',
  Infestation: 'Заражённые',
  Orokin: 'Орокин',
  Corrupted: 'Порченые',
  Sentient: 'Сентиенты',
  Narmer: 'Нармер',
  Murmur: 'Шёпот',
  Scaldra: 'Скальдра',
  Techrot: 'Техногниль',
  Tenno: 'Тэнно',
  Crossfire: 'Перекрёстный огонь',
}

const CYCLE_STATES: Record<string, string> = {
  day: 'День',
  night: 'Ночь',
  warm: 'Тепло',
  cold: 'Холод',
  fass: 'Фасс',
  vome: 'Воум',
  corpus: 'Корпус',
  grineer: 'Гринир',
  joy: 'Радость',
  anger: 'Гнев',
  envy: 'Зависть',
  sorrow: 'Печаль',
  fear: 'Страх',
}

const COMPONENTS: Record<string, string> = {
  Blueprint: 'Чертёж',
  Neuroptics: 'Нейрооптика',
  Chassis: 'Каркас',
  Systems: 'Система',
  Barrel: 'Ствол',
  Receiver: 'Приёмник',
  Stock: 'Приклад',
  Blade: 'Клинок',
  Blades: 'Клинки',
  Handle: 'Рукоять',
  Hilt: 'Эфес',
  Head: 'Навершие',
  Grip: 'Хват',
  String: 'Тетива',
  'Upper Limb': 'Верхнее плечо',
  'Lower Limb': 'Нижнее плечо',
  Link: 'Связка',
  Pouch: 'Подсумок',
  Stars: 'Звёзды',
  Guard: 'Гарда',
  Gauntlet: 'Перчатка',
  Boot: 'Ботинок',
  Chain: 'Цепь',
  Disc: 'Диск',
  Carapace: 'Панцирь',
  Cerebrum: 'Мозг',
  'Orokin Cell': 'Клетка Орокин',
  'Argon Crystal': 'Аргоновый кристалл',
  Neurodes: 'Нейроды',
  'Neural Sensors': 'Нейронные датчики',
  'Control Module': 'Модуль управления',
  Gallium: 'Галлий',
  Morphics: 'Морфики',
  Tellurium: 'Теллур',
  Kuva: 'Кува',
  Forma: 'Форма',
  'Nitain Extract': 'Экстракт нитаина',
  Plastids: 'Пластиды',
  Rubedo: 'Рубедо',
  Polymer: 'Полимерный пучок',
  'Polymer Bundle': 'Полимерный пучок',
  'Alloy Plate': 'Сплав',
  Ferrite: 'Феррит',
  Salvage: 'Утиль',
  'Nano Spores': 'Наноспоры',
  Circuits: 'Схемы',
  Cryotic: 'Криотик',
  Oxium: 'Оксиум',
  'Detonite Injector': 'Детонитовый инжектор',
  Fieldron: 'Филдрон',
  'Mutagen Mass': 'Масса мутагена',
  'Day Aspect': 'Дневной аспект',
  'Night Aspect': 'Ночной аспект',
}

const RARITY: Record<string, string> = {
  Common: 'Обычная',
  Uncommon: 'Необычная',
  Rare: 'Редкая',
  Legendary: 'Легендарная',
}

const REFINEMENT: Record<string, string> = {
  Intact: 'Целая',
  Exceptional: 'Исключительная',
  Flawless: 'Безупречная',
  Radiant: 'Сияющая',
}

export const missionRu = (s: string): string => MISSION_TYPES[s] ?? s
export const factionRu = (s: string): string => FACTIONS[s] ?? s
export const cycleRu = (s: string): string => CYCLE_STATES[s?.toLowerCase()] ?? s
export const rarityRu = (s?: string): string => (s ? RARITY[s] ?? s : '')

// 'Saryn Prime Neuroptics' -> 'Нейрооптика'
export function componentRu(name: string): string {
  if (COMPONENTS[name]) return COMPONENTS[name]
  const key = Object.keys(COMPONENTS).find((k) => name.endsWith(' ' + k))
  return key ? COMPONENTS[key] : name
}

// 'Lith S4 Relic (Radiant)' -> 'Реликвия Lith S4 · сияющая'
export function dropLocationRu(location: string): string {
  const relic = /^(Lith|Meso|Neo|Axi|Requiem) (\S+) Relic(?: \((\w+)\))?$/.exec(location)
  if (relic) {
    const ref = relic[3] ? `, ${(REFINEMENT[relic[3]] ?? relic[3]).toLowerCase()}` : ''
    return `Реликвия ${relic[1]} ${relic[2]}${ref}`
  }
  return location
    .replace(/\bRot(?:ation)? ([ABC])\b/, 'ротация $1')
    .replace(/\(Caches\)/, '(тайники)')
    .replace(/\(Extra\)/, '(доп.)')
}

// целая реликвия или вообще не реликвия, чтобы не было дублей
export function isPrimaryDropLocation(location: string): boolean {
  return !/\((Exceptional|Flawless|Radiant)\)$/.test(location)
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
