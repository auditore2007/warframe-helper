export type ResourceRarity = 'common' | 'uncommon' | 'rare' | 'special'

export interface ResourceGuide {
  id: string
  name: string
  // англ. имя для поиска по дропу
  en: string
  rarity: ResourceRarity
  where: string
  best: string
  tips?: string
}

export const RARITY_LABEL: Record<ResourceRarity, string> = {
  common: 'Обычный',
  uncommon: 'Необычный',
  rare: 'Редкий',
  special: 'Особый',
}

export const RESOURCES: ResourceGuide[] = [
  { id: 'orokin-cell', name: 'Клетка Орокин', en: 'Orokin Cell', rarity: 'rare', where: 'Сатурн, Церера, Деймос, боссы', best: 'Helene (Сатурн, оборона) или Gabii (Церера, выживание)', tips: 'Нужна почти для каждого фрейма и оружия. Боссы Сатурна и Цереры дают её гарантированно чаще.' },
  { id: 'neural-sensors', name: 'Нейронные датчики', en: 'Neural Sensors', rarity: 'rare', where: 'Юпитер, Крепость Кувы', best: 'Io (Юпитер, оборона) или Alad V (Themisto)', tips: 'Нужны для Рино и многих видов оружия.' },
  { id: 'neurodes', name: 'Нейроды', en: 'Neurodes', rarity: 'rare', where: 'Земля, Луна, Эрида, Деймос', best: 'Тайники (Caches) на Земле или Деймос, Камбионский дрейф', tips: 'Найди все тайники в диверсии: на ротации C есть шанс на двойные нейроды.' },
  { id: 'argon', name: 'Аргоновый кристалл', en: 'Argon Crystal', rarity: 'rare', where: 'Бездна, Камбионский дрейф (Деймос)', best: 'Ani (Бездна, выживание)', tips: 'Распадаются: каждый день половина запаса (минимум 1) исчезает. Фарми прямо перед крафтом.' },
  { id: 'control-module', name: 'Модуль управления', en: 'Control Module', rarity: 'uncommon', where: 'Европа, Нептун, Бездна', best: 'Европа - оборона или выживание' },
  { id: 'morphics', name: 'Морфики', en: 'Morphics', rarity: 'uncommon', where: 'Меркурий, Марс, Фобос, Заримань', best: 'Марс - любые миссии с большим количеством врагов' },
  { id: 'gallium', name: 'Галлий', en: 'Gallium', rarity: 'uncommon', where: 'Марс, Уран', best: 'Марс или Ophelia (Уран)' },
  { id: 'tellurium', name: 'Теллур', en: 'Tellurium', rarity: 'rare', where: 'Уран, Марс (архвинг), Крепость Кувы', best: 'Ophelia (Уран, выживание) с Nekros', tips: 'Самый долгий ресурс в раннем крафте. Также добывается в Рейлджеке.' },
  { id: 'plastids', name: 'Пластиды', en: 'Plastids', rarity: 'uncommon', where: 'Фобос, Сатурн, Уран, Эрида', best: 'Ophelia (Уран)' },
  { id: 'rubedo', name: 'Рубедо', en: 'Rubedo', rarity: 'uncommon', where: 'Фобос, Европа, Бездна', best: 'Фобос' },
  { id: 'polymer', name: 'Полимерный пучок', en: 'Polymer Bundle', rarity: 'common', where: 'Меркурий, Венера, Уран', best: 'Ophelia (Уран) - заодно теллур и пластиды' },
  { id: 'alloy', name: 'Сплав', en: 'Alloy Plate', rarity: 'common', where: 'Церера, Марс, Фобос, Сатурн', best: 'Gabii (Церера)' },
  { id: 'circuits', name: 'Схемы', en: 'Circuits', rarity: 'common', where: 'Венера, Церера, Крепость Кувы', best: 'Церера' },
  { id: 'ferrite', name: 'Феррит', en: 'Ferrite', rarity: 'common', where: 'Меркурий, Земля, Нептун, Бездна', best: 'Любая ранняя планета' },
  { id: 'nano-spores', name: 'Наноспоры', en: 'Nano Spores', rarity: 'common', where: 'Сатурн, Нептун, Эрида, Деймос', best: 'Эрида или Деймос - заражённые дают их тысячами' },
  { id: 'salvage', name: 'Утиль', en: 'Salvage', rarity: 'common', where: 'Марс, Юпитер, Седна', best: 'Седна или Юпитер' },
  { id: 'cryotic', name: 'Криотик', en: 'Cryotic', rarity: 'special', where: 'Только миссии раскопок', best: 'Hieracon (Плутон)', tips: 'Каждый экскаватор даёт криотик. Неон и обильные экскаваторы - для чертежей додзё.' },
  { id: 'oxium', name: 'Оксиум', en: 'Oxium', rarity: 'special', where: 'Оксиумные Оспреи Корпуса', best: 'Io (Юпитер, оборона)', tips: 'Оспреи взрываются: подбери ресурс сразу.' },
  { id: 'nitain', name: 'Экстракт нитаина', en: 'Nitain Extract', rarity: 'special', where: 'Предложения Ночной волны', best: 'Магазин Ночной волны за Nightwave Cred', tips: 'Нужен для Вобан Прайма, Хромы и Плиток Сайи.' },
  { id: 'kuva', name: 'Кува', en: 'Kuva', rarity: 'special', where: 'Кува-сифоны и Кува-потоп (отмечены на звёздной карте), Крепость Кувы', best: 'Кува-потоп + бустер ресурсов; Выживание Taveuni (Крепость Кувы)', tips: 'Нужна для перебора ривенов и чертежей Гарруда/Нидуса.' },
  { id: 'endo', name: 'Эндо', en: 'Endo', rarity: 'special', where: 'Арбитраж, Натиск Святилища, скульптуры Аятан, Стальной путь', best: 'Арбитраж с Vitus Essence, Стальной путь (30 000 эндо в магазине Тешин)', tips: 'Продавай скульптуры Аятан со звёздами Маро на Ретранслятор.' },
  { id: 'credits', name: 'Кредиты', en: 'Credits', rarity: 'special', where: 'Индекс (Нептун), Profit-Taker, Стальной путь, тёмные сектора', best: 'Индекс на высокий риск с Mesa или Wisp', tips: 'Credit Booster и Smeeta Kavat удваивают прибыль.' },
  { id: 'forma', name: 'Форма', en: 'Forma Blueprint', rarity: 'special', where: 'Реликвии Бездны, Ночная волна, ежедневный вход', best: 'Открывай реликвии Lith в разломах - чертёж Формы в каждой второй', tips: 'Строй одну форму в день, она стоит недорого.' },
]
