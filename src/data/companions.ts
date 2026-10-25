export type CompanionGroup = 'sentinel' | 'beast' | 'robotic' | 'archwing' | 'necramech'

export const COMPANION_GROUP_LABEL: Record<CompanionGroup, string> = {
  sentinel: 'Стражи',
  beast: 'Звери',
  robotic: 'МОА и гончие',
  archwing: 'Арчвинги',
  necramech: 'Некромехи',
}

export const COMPANION_GROUP_HINT: Record<CompanionGroup, string> = {
  sentinel: 'Летают рядом и носят своё оружие. Чертежи - в Маркете.',
  beast: 'Кубрау и каваты выводятся в Инкубаторе, вульпафилы и придазиты - у Сына на Деймосе.',
  robotic: 'Собираются из деталей: МОА - у Солярис Вокс в Фортуне, гончие - из Сестёр Парвоса и Захватчика Зануки.',
  archwing: 'Летают в космосе и на открытых мирах. Первый - Одоната из квеста «Архвинг».',
  necramech: 'Боевые мехи Энтрати: собираются из деталей с Деймоса, вкачиваются до 40 ранга.',
}

export interface CompanionNote {
  en: string
  note: string
  best?: boolean
}

export const COMPANION_NOTES: CompanionNote[] = [
  { en: 'smeeta kavat', note: 'Charm даёт шанс удвоить лут и ресурсы. Лучший компаньон для фарма.', best: true },
  { en: 'adarza kavat', note: 'Cat\'s Eye поднимает шанс крита всей команде.' },
  { en: 'panzer vulpaphyla', note: 'Очень живучий, с аугментом Panzer Devolution сам воскресает.', best: true },
  { en: 'sly vulpaphyla', note: 'Невидимость и воскрешение - хороший спутник для соло.' },
  { en: 'carrier', note: 'Ammo Case превращает лишние патроны в нужные.' },
  { en: 'helios', note: 'Сам сканирует врагов для Кодекса - удобно для синдиката Симариса.' },
  { en: 'diriga', note: 'Electro Pulse оглушает врагов электричеством.' },
  { en: 'djinn', note: 'Fatal Attraction стягивает врагов и бьёт токсином.' },
  { en: 'shade', note: 'Ghost даёт невидимость, когда враги рядом.' },
  { en: 'wyrm', note: 'Crowd Dispersion отбрасывает толпу.' },
  { en: 'oxylus', note: 'Помогает рыбалке и добыче на открытых мирах.' },
  { en: 'odonata', note: 'Стартовый арчвинг из квеста «Архвинг».' },
  { en: 'itzal', note: 'Самый быстрый арчвинг, Penumbra даёт невидимость.', best: true },
  { en: 'elytron', note: 'Урон по площади ракетами.' },
  { en: 'amesha', note: 'Поддержка: защищает команду в космосе.' },
  { en: 'voidrig', note: 'Тяжёлый некромех с Arquebex - уничтожает толпы.', best: true },
  { en: 'bonewidow', note: 'Некромех ближнего боя с Exalted Ironbride.' },
]

export function companionGroup(category: string, uniqueName: string): CompanionGroup {
  if (category === 'Sentinels') return 'sentinel'
  if (category === 'Archwing') return 'archwing'
  if (category === 'Necramech') return 'necramech'
  if (/MoaPet|ZanukaPet|Hound/i.test(uniqueName)) return 'robotic'
  return 'beast'
}
