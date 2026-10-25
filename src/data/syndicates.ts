export type SyndicateGroup = 'faction' | 'open' | 'other'

export interface SyndicateInfo {
  // тег из профиля
  tag: string
  name: string
  group: SyndicateGroup
  minRank: number
  maxRank: number
  // суффикс DailyAffiliation*, '' = общий лимит фракций
  dailyKey: string
  howToEarn: string
  buys: string[]
}

const FACTION_EARN = 'Носи сигил синдиката и проходи любые миссии; плюс ежедневные задания синдиката в его зале на реле.'
const FACTION_BUYS = ['Набор реликвий - 3 случайные реликвии, хороший способ превратить репутацию в платину', 'Аугменты варфреймов - нужны себе или продаются игрокам']

export const SYNDICATES: SyndicateInfo[] = [
  { tag: 'SteelMeridianSyndicate', name: 'Стальной Меридиан', group: 'faction', minRank: -2, maxRank: 5, dailyKey: '', howToEarn: FACTION_EARN, buys: ['Vaykor Hek, Vaykor Marelok, Vaykor Sydon', ...FACTION_BUYS] },
  { tag: 'ArbitersSyndicate', name: 'Арбитры Гексиса', group: 'faction', minRank: -2, maxRank: 5, dailyKey: '', howToEarn: FACTION_EARN, buys: ['Telos Boltor, Telos Akbolto, Telos Boltace', ...FACTION_BUYS] },
  { tag: 'CephalonSudaSyndicate', name: 'Цефалон Суда', group: 'faction', minRank: -2, maxRank: 5, dailyKey: '', howToEarn: FACTION_EARN, buys: ['Synoid Simulor, Synoid Gammacor, Synoid Heliocor', ...FACTION_BUYS] },
  { tag: 'PerrinSyndicate', name: 'Последовательность Перрина', group: 'faction', minRank: -2, maxRank: 5, dailyKey: '', howToEarn: FACTION_EARN, buys: ['Secura Penta, Secura Dual Cestra, Secura Lecta', ...FACTION_BUYS] },
  { tag: 'RedVeilSyndicate', name: 'Красная Вуаль', group: 'faction', minRank: -2, maxRank: 5, dailyKey: '', howToEarn: FACTION_EARN, buys: ['Rakta Cernos, Rakta Ballistica, Rakta Dark Dagger', ...FACTION_BUYS] },
  { tag: 'NewLokaSyndicate', name: 'Новая Лока', group: 'faction', minRank: -2, maxRank: 5, dailyKey: '', howToEarn: FACTION_EARN, buys: ['Sancti Tigris, Sancti Castanas, Sancti Magistar', ...FACTION_BUYS] },
  { tag: 'CetusSyndicate', name: 'Остроны (Цетус)', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Cetus', howToEarn: 'Баунти Конзу на Равнинах Эйдолона, сдача рыбы, руды и камней.', buys: ['Детали Зо (Zaw) у Хока - сильное оружие ближнего боя своей сборки'] },
  { tag: 'QuillsSyndicate', name: 'Перья (Квиллы)', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Quills', howToEarn: 'Сдача осколков Эйдолонов в убежище Квиллов; нужен квест «Внутренняя война».', buys: ['Детали амплифайеров для оператора', 'Мистификаторы Virtuos для оператора'] },
  { tag: 'SolarisSyndicate', name: 'Солярис Юнайтед', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Solaris', howToEarn: 'Баунти Юди в Долине Сфер, сдача рыбы и руды.', buys: ['Китганы у Руда Зууда', 'МОА-компаньоны у Легса'] },
  { tag: 'VoxSyndicate', name: 'Вокс Солярис', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Vox', howToEarn: 'Сдача тороидов Маленькой Утке в Фортуне.', buys: ['Мистификаторы Magus для оператора'] },
  { tag: 'VentKidsSyndicate', name: 'Вентовые Дети', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Ventkids', howToEarn: 'Гонки и трюки на К-драйве в Фортуне.', buys: ['К-драйвы и моды для них'] },
  { tag: 'EntratiSyndicate', name: 'Энтрати (Деймос)', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Entrati', howToEarn: 'Баунти Матери в Камбионском Дрейфе, сдача рыбы и руды.', buys: ['Хищные компаньоны (предасайты и вулпафилы) у Сына'] },
  { tag: 'NecraloidSyndicate', name: 'Некралоид', group: 'open', minRank: 0, maxRank: 3, dailyKey: 'Necraloid', howToEarn: 'Сдача матриц Орокин из Изолированных хранилищ на Деймосе.', buys: ['Части некромехов Voidrig и Bonewidow и моды для них'] },
  { tag: 'ZarimanSyndicate', name: 'Холдфасты (Зариман)', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Zariman', howToEarn: 'Баунти на Хризалите (Зариман), сдача пустотных перьев.', buys: ['Оружие Заримана (Laetum, Phenmor, Felarx, Praedos, Innodem)'] },
  { tag: 'EntratiLabSyndicate', name: 'Кавия (Святилище)', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Cavia', howToEarn: 'Баунти и активности в Святилище Анатомика.', buys: ['Осколок Архонта по недельной ротации - 30 000 репутации на 5 ранге'] },
  { tag: 'HexSyndicate', name: 'Гекс (1999)', group: 'open', minRank: 0, maxRank: 5, dailyKey: 'Hex', howToEarn: 'Миссии и баунти в Хёльвании, задания Гекса в Маккерсоне.', buys: [] },
  { tag: 'LibrarySyndicate', name: 'Цефалон Симарис', group: 'other', minRank: 0, maxRank: 0, dailyKey: 'Library', howToEarn: 'Сканирование целей Симариса и просто врагов с помощью Синтез-сканера.', buys: ['Energy Conversion и Health Conversion - моды на усиление варфрейма'] },
]

export const SYNDICATE_GROUP_LABEL: Record<SyndicateGroup, string> = {
  faction: 'Фракционные синдикаты',
  open: 'Открытые миры и зоны',
  other: 'Прочие',
}
