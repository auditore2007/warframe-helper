export type WeaponStage = 'start' | 'endgame'

export interface WeaponPick {
  // англ. имя с вики, пробелы вместо _
  en: string
  stage: WeaponStage
  why: string
}

export const WEAPON_PICKS: WeaponPick[] = [
  { en: 'Boltor', stage: 'start', why: 'Доступен рано, позже превращается в инкарнон' },
  { en: 'Hek', stage: 'start', why: 'Мощный дробовик из Маркета для ранней игры' },
  { en: 'Tigris', stage: 'start', why: 'Двуствольный дробовик из додзё с огромным уроном' },
  { en: 'Lex', stage: 'start', why: 'Точный пистолет - переживёт всю раннюю игру' },
  { en: 'Orthos', stage: 'start', why: 'Посох с большой дальностью атаки' },
  { en: 'Galatine', stage: 'start', why: 'Тяжёлый меч из додзё, рубит толпы' },
  { en: 'Kuva Bramma', stage: 'endgame', why: 'Лук с кластерными взрывами - зачистка комнат' },
  { en: 'Kuva Zarr', stage: 'endgame', why: 'Пушка с осколочными снарядами против толп' },
  { en: 'Acceltra', stage: 'endgame', why: 'Ракетница с быстрой перезарядкой при беге' },
  { en: 'Phenmor', stage: 'endgame', why: 'Инкарнон-винтовка из Заримани' },
  { en: 'Felarx', stage: 'endgame', why: 'Инкарнон-дробовик с огромным уроном' },
  { en: 'Laetum', stage: 'endgame', why: 'Инкарнон-пистолет из Заримани' },
  { en: 'Torid', stage: 'endgame', why: 'Инкарнон-форма превращает его в лучевое оружие' },
  { en: 'Epitaph', stage: 'endgame', why: 'Пистолет Стального пути с зарядным выстрелом' },
  { en: 'Kuva Nukor', stage: 'endgame', why: 'Микроволновая цепь - лучший помощник для статуса' },
  { en: 'Nikana Prime', stage: 'endgame', why: 'Быстрая катана под криты' },
  { en: 'Praedos', stage: 'endgame', why: 'Инкарнон-перчатки с огромным уроном' },
  { en: 'Reaper Prime', stage: 'endgame', why: 'Коса с большим уроном по площади' },
]

export const WEAPON_CATEGORY_LABEL: Record<string, string> = {
  Primary: 'Основное',
  Secondary: 'Вторичное',
  Melee: 'Ближний бой',
  'Arch-Gun': 'Арк-пушка',
  'Arch-Melee': 'Арк-ближний',
}

// ссылка на вики -> 'soma prime'
export function weaponKey(wikiaUrl?: string): string {
  const tail = wikiaUrl?.split('/w/')[1]
  return tail ? decodeURIComponent(tail).replace(/[/_]/g, ' ').toLowerCase() : ''
}
