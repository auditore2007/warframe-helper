export interface ArcanePick {
  // англ. название с вики, маленькими буквами
  en: string
  why: string
}

export const ARCANE_PICKS: ArcanePick[] = [
  { en: 'arcane energize', why: 'Энергия себе и союзникам при подборе сфер - решает проблему энергии навсегда' },
  { en: 'arcane grace', why: 'Регенерация здоровья при получении урона' },
  { en: 'molt augmented', why: 'Сила способностей растёт от убийств способностями - для нюкеров' },
  { en: 'molt efficiency', why: 'Длительность и эффективность после ульты' },
  { en: 'arcane avenger', why: 'Шанс крита при получении урона' },
  { en: 'arcane fury', why: 'Урон ближнего боя при крите' },
  { en: 'primary merciless', why: 'Урон основного оружия растёт с каждым убийством' },
  { en: 'secondary merciless', why: 'То же для пистолетов' },
  { en: 'primary deadhead', why: 'Стаки урона за выстрелы в голову' },
  { en: 'cascadia flare', why: 'Урон основного оружия при наличии сверхзащиты' },
  { en: 'magus elevate', why: 'Оператор лечит фрейм при возвращении - дешёвый и полезный' },
]

export const ARCANE_TYPE_LABEL: Record<string, string> = {
  'Warframe Arcane': 'Варфрейм',
  'Primary Arcane': 'Основное',
  'Secondary Arcane': 'Вторичное',
  'Melee Arcane': 'Ближний бой',
  'Operator Arcane': 'Оператор',
  'Amp Arcane': 'Амп',
  'Zaw Arcane': 'Зо',
  'Kitgun Arcane': 'Китган',
  'Shotgun Arcane': 'Дробовик',
  'Bow Arcane': 'Лук',
  Arcane: 'Разное',
}
