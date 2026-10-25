export type ModStage = 'start' | 'endgame'

export interface ModPick {
  // англ. название с вики, маленькими буквами
  en: string
  stage: ModStage
  why: string
}

export const MOD_PICKS: ModPick[] = [
  { en: 'serration', stage: 'start', why: 'Основной урон винтовок - вкачивай первым' },
  { en: 'split chamber', stage: 'start', why: 'Мультивыстрел: каждая пуля может стать двумя' },
  { en: 'point strike', stage: 'start', why: 'Шанс крита для основного оружия' },
  { en: 'vital sense', stage: 'start', why: 'Урон крита для основного оружия' },
  { en: 'hornet strike', stage: 'start', why: 'Основной урон пистолетов' },
  { en: 'barrel diffusion', stage: 'start', why: 'Мультивыстрел пистолетов' },
  { en: 'point blank', stage: 'start', why: 'Основной урон дробовиков' },
  { en: 'pressure point', stage: 'start', why: 'Основной урон ближнего боя' },
  { en: 'vitality', stage: 'start', why: 'Здоровье фрейма - первый мод защиты' },
  { en: 'redirection', stage: 'start', why: 'Щиты фрейма' },
  { en: 'streamline', stage: 'start', why: 'Дешевле способности - меньше проблем с энергией' },
  { en: 'flow', stage: 'start', why: 'Больше энергии для способностей' },
  { en: 'intensify', stage: 'start', why: 'Сила способностей' },
  { en: 'continuity', stage: 'start', why: 'Длительность способностей' },
  { en: 'stretch', stage: 'start', why: 'Радиус способностей' },
  { en: 'primed continuity', stage: 'endgame', why: 'Длительность - продаёт Баро Ки\'Тиир' },
  { en: 'transient fortitude', stage: 'endgame', why: 'Большой прирост силы за счёт длительности' },
  { en: 'blind rage', stage: 'endgame', why: 'Сила способностей ценой эффективности' },
  { en: 'narrow minded', stage: 'endgame', why: 'Длительность ценой радиуса' },
  { en: 'overextended', stage: 'endgame', why: 'Огромный радиус ценой силы' },
  { en: 'umbral intensify', stage: 'endgame', why: 'Сила и усиление сета Умбры' },
  { en: 'umbral vitality', stage: 'endgame', why: 'Здоровье с бонусом сета Умбры' },
  { en: 'adaptation', stage: 'endgame', why: 'Копит сопротивление к получаемому урону - для Стального пути' },
  { en: 'rolling guard', stage: 'endgame', why: 'Перекат снимает статусы и даёт неуязвимость' },
  { en: 'primed flow', stage: 'endgame', why: 'Энергия - продаёт Баро' },
  { en: 'galvanized chamber', stage: 'endgame', why: 'Мультивыстрел, растущий от убийств - Арбитраж' },
  { en: 'galvanized aptitude', stage: 'endgame', why: 'Урон за каждый статус на враге - Арбитраж' },
  { en: 'primed pressure point', stage: 'endgame', why: 'Урон ближнего боя - Баро' },
  { en: 'blood rush', stage: 'endgame', why: 'Шанс крита от комбо ближнего боя' },
  { en: 'weeping wounds', stage: 'endgame', why: 'Шанс статуса от комбо ближнего боя' },
  { en: 'condition overload', stage: 'endgame', why: 'Урон за каждый тип статуса на враге' },
  { en: 'organ shatter', stage: 'endgame', why: 'Урон крита ближнего боя' },
  { en: 'corrosive projection', stage: 'endgame', why: 'Аура: снимает броню у всех врагов' },
  { en: 'growing power', stage: 'endgame', why: 'Аура: сила способностей при статусах' },
]

export const MOD_TYPE_LABEL: Record<string, string> = {
  'Warframe Mod': 'Варфрейм',
  'Primary Mod': 'Основное',
  'Shotgun Mod': 'Дробовик',
  'Secondary Mod': 'Вторичное',
  'Melee Mod': 'Ближний бой',
  'Stance Mod': 'Стойки',
  'Companion Mod': 'Компаньон',
  'Archwing Mod': 'Арчвинг',
  'Arch-Gun Mod': 'Арк-пушка',
  'Arch-Melee Mod': 'Арк-ближний',
  'Necramech Mod': 'Некромех',
  'Parazon Mod': 'Паразон',
  'Mod Set Mod': 'Сеты',
  'Posture Mod': 'Позы',
}

export const POLARITY_LABEL: Record<string, string> = {
  madurai: 'Мадурай',
  vazarin: 'Вазарин',
  naramon: 'Нарамон',
  zenurik: 'Зенурик',
  unairu: 'Унайру',
  penjaga: 'Пенджага',
  umbra: 'Умбра',
  universal: 'Любая',
  any: 'Любая',
}
