export interface PlanetGuide {
  id: string
  name: string
  en: string
  levels: string
  faction: string
  boss?: string
  bossDrop?: string
  // куда ведёт переход
  leadsTo: string[]
  resources: string[]
  highlights: string[]
  tip?: string
  // открывается квестом, а не переходом
  questArea?: boolean
  unlock?: string
}

export const PLANETS: PlanetGuide[] = [
  {
    id: 'earth', name: 'Земля', en: 'Earth', levels: '1–15', faction: 'Гринир',
    boss: 'Советник Вэй Хек (Oro)', bossDrop: 'Гидроид',
    leadsTo: ['venus', 'mars'],
    resources: ['Феррит', 'Рубедо', 'Нейроды', 'Детонитовый инжектор'],
    highlights: ['Цетус и Равнины Эйдолона - рыбалка, добыча, Эйдолоны ночью', 'Первые квесты сюжета проходят по Земле и Меркурию'],
    tip: 'Перед переходом на Венеру собери моды Vitality и Serration - они нужны на всю игру.',
  },
  {
    id: 'venus', name: 'Венера', en: 'Venus', levels: '3–18', faction: 'Корпус',
    boss: 'Шакал (Fossa)', bossDrop: 'Рино',
    leadsTo: ['mercury'],
    resources: ['Схемы', 'Полимерный пучок', 'Сплав'],
    highlights: ['Орб Валлис и Фортуна - Солярис Вокс, Profit-Taker', 'Шакал - первый важный босс: Рино'],
    tip: 'Фарми Рино сразу: это лучший танк для новичка.',
  },
  {
    id: 'mercury', name: 'Меркурий', en: 'Mercury', levels: '6–11', faction: 'Гринир',
    boss: 'Капитан Вор (Tolstoj)',
    leadsTo: [],
    resources: ['Морфики', 'Феррит', 'Полимерный пучок'],
    highlights: ['Короткая планета - закрой все узлы ради мастерства'],
  },
  {
    id: 'mars', name: 'Марс', en: 'Mars', levels: '8–30', faction: 'Гринир',
    boss: 'Лейтенант Лех Крил (War)', bossDrop: 'Экскалибур',
    leadsTo: ['phobos', 'ceres'],
    resources: ['Морфики', 'Галлий', 'Утиль'],
    highlights: ['Базар Маро - торговая площадка и недельная охота за скульптурой Аятан', 'Tyana Pass - Цитрина'],
  },
  {
    id: 'phobos', name: 'Фобос', en: 'Phobos', levels: '10–25', faction: 'Корпус',
    boss: 'Сержант (Iliad)', bossDrop: 'Мэг',
    leadsTo: [],
    resources: ['Морфики', 'Пластиды', 'Рубедо', 'Сплав'],
    highlights: ['Узлы Фобоса нужны для мастерства, но не для прогресса'],
  },
  {
    id: 'ceres', name: 'Церера', en: 'Ceres', levels: '12–25', faction: 'Гринир',
    boss: 'Лех Крил и Капитан Вор (Exta)', bossDrop: 'Фрост',
    leadsTo: ['jupiter'],
    resources: ['Клетка Орокин', 'Сплав', 'Схемы'],
    highlights: ['Gabii (выживание) - фарм клеток Орокин', 'Квест «Обещанный Глаз»'],
  },
  {
    id: 'jupiter', name: 'Юпитер', en: 'Jupiter', levels: '15–30', faction: 'Корпус',
    boss: 'Алад V (Themisto)', bossDrop: 'Валькирия',
    leadsTo: ['europa', 'saturn'],
    resources: ['Нейронные датчики', 'Утиль', 'Оксиум'],
    highlights: ['Ропалолист - босс, дающий Висп', 'Io (оборона) - нейронные датчики и оксиум'],
    tip: 'Обязательно фарми Висп здесь - она полезна до самого конца игры.',
  },
  {
    id: 'europa', name: 'Европа', en: 'Europa', levels: '18–33', faction: 'Корпус',
    boss: 'Рапторы (Naamah)', bossDrop: 'Нова',
    leadsTo: [],
    resources: ['Модуль управления', 'Морфики', 'Рубедо'],
    highlights: ['Нужна для квеста Гренделя'],
  },
  {
    id: 'saturn', name: 'Сатурн', en: 'Saturn', levels: '21–36', faction: 'Гринир',
    boss: 'Генерал Саргас Рук (Tethys)', bossDrop: 'Эмбер',
    leadsTo: ['uranus'],
    resources: ['Клетка Орокин', 'Пластиды', 'Наноспоры'],
    highlights: ['Helene (оборона) - фарм клеток и аффинити', 'Квест «Второй сон» требует Сатурн'],
  },
  {
    id: 'uranus', name: 'Уран', en: 'Uranus', levels: '24–37', faction: 'Гринир',
    boss: 'Тил Регор (Titania)', bossDrop: 'Эквинокс',
    leadsTo: ['neptune'],
    resources: ['Теллур', 'Пластиды', 'Полимерный пучок', 'Галлий'],
    highlights: ['Ophelia (выживание) - лучший фарм теллура', 'Подводные тайники'],
  },
  {
    id: 'neptune', name: 'Нептун', en: 'Neptune', levels: '27–37', faction: 'Корпус',
    boss: 'Стая Гиен (Psamathe)', bossDrop: 'Локи',
    leadsTo: ['pluto'],
    resources: ['Модуль управления', 'Наноспоры', 'Феррит'],
    highlights: ['Индекс - арена кредитов'],
  },
  {
    id: 'pluto', name: 'Плутон', en: 'Pluto', levels: '30–45', faction: 'Корпус',
    boss: 'Амбулас (Hades)', bossDrop: 'Тринити',
    leadsTo: ['sedna', 'eris'],
    resources: ['Морфики', 'Пластиды', 'Сплав', 'Рубедо'],
    highlights: ['Hieracon (раскопки) - криотик', 'Разблокирует Седну и Эриду'],
  },
  {
    id: 'sedna', name: 'Седна', en: 'Sedna', levels: '30–50', faction: 'Гринир',
    boss: 'Кела Де Тайм (Merrow)', bossDrop: 'Сарина',
    leadsTo: [],
    resources: ['Сплав', 'Утиль', 'Рубедо'],
    highlights: ['Hydron (оборона) - классика прокачки оружия', 'Kappa - Гаусс через Сбой'],
  },
  {
    id: 'eris', name: 'Эрида', en: 'Eris', levels: '30–50', faction: 'Заражённые',
    boss: 'Мутировавший Алад V', bossDrop: 'Миса',
    leadsTo: [],
    resources: ['Нейроды', 'Пластиды', 'Наноспоры'],
    highlights: ['Голем Джордас - Атлас через Симариса', 'Oestrus - части Нидуса'],
  },
  {
    id: 'void', name: 'Бездна', en: 'Void', levels: '10–45', faction: 'Порченые',
    leadsTo: [], questArea: true, unlock: 'Ключ из конфигуратора или разломы',
    resources: ['Аргоновый кристалл', 'Модуль управления', 'Феррит', 'Рубедо'],
    highlights: ['Ani (выживание) - аргоновые кристаллы', 'Mot - классика для фарма опыта'],
  },
  {
    id: 'lua', name: 'Луна', en: 'Lua', levels: '25–30', faction: 'Порченые / Гринир / Корпус',
    leadsTo: [], questArea: true, unlock: 'Квест «Второй сон»',
    resources: ['Нейроды', 'Рубедо', 'Схемы'],
    highlights: ['Головоломки Залы Испытаний - моды Primed'],
  },
  {
    id: 'kuva-fortress', name: 'Крепость Кувы', en: 'Kuva Fortress', levels: '25–40', faction: 'Гринир',
    leadsTo: [], questArea: true, unlock: 'Квест «Война внутри»',
    resources: ['Кува', 'Сплав', 'Схемы', 'Нейронные датчики'],
    highlights: ['Taveuni (выживание) - кува каждые 5 минут'],
  },
  {
    id: 'deimos', name: 'Деймос', en: 'Deimos', levels: '15–45', faction: 'Заражённые',
    leadsTo: [], questArea: true, unlock: 'Квест «Сердце Деймоса»',
    resources: ['Нейроды', 'Наноспоры', 'Аргоновый кристалл'],
    highlights: ['Некралиск и Камбионский дрейф', 'Изоляционные хранилища - арканы'],
  },
  {
    id: 'zariman', name: 'Заримань «Ноль Десять»', en: 'Zariman', levels: '50–55', faction: 'Гринир / Корпус',
    leadsTo: [], questArea: true, unlock: 'Квест «Ангелы Заримань»',
    resources: ['Морфики', 'Пластиды'],
    highlights: ['Затопление Бездны и Каскад - быстрый опыт', 'Арканы Заримань и инкарнонное оружие'],
  },
  {
    id: 'duviri', name: 'Дувири', en: 'Duviri', levels: 'зависит от режима', faction: 'Дакса',
    leadsTo: [], questArea: true, unlock: 'Квест «Парадокс Дувири»',
    resources: ['Пафос-зажимы (Pathos Clamp)'],
    highlights: ['Колесо Инкарнон - еженедельные адаптеры', 'Куллерво'],
  },
]

export const PLANET_BY_ID: Map<string, PlanetGuide> = new Map(PLANETS.map((p) => [p.id, p]))
