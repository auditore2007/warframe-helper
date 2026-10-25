import type { IconName } from '../components/Icon'

export interface NavPage {
  to: string
  label: string
}

export interface NavSection {
  id: string
  label: string
  icon: IconName
  pages: NavPage[]
}

// шесть разделов вместо длинного списка; внутри раздела страницы идут вкладками
export const SECTIONS: NavSection[] = [
  { id: 'home', label: 'Главная', icon: 'home', pages: [{ to: '/', label: 'Обзор' }, { to: '/guides', label: 'Гайды' }] },
  {
    id: 'world',
    label: 'Мир',
    icon: 'world',
    pages: [
      { to: '/world', label: 'Сейчас' },
      { to: '/rotations', label: 'Ротации' },
      { to: '/starchart', label: 'Звёздная карта' },
    ],
  },
  {
    id: 'arsenal',
    label: 'Арсенал',
    icon: 'frame',
    pages: [
      { to: '/frames', label: 'Варфреймы' },
      { to: '/weapons', label: 'Оружие' },
      { to: '/companions', label: 'Компаньоны' },
      { to: '/mods', label: 'Моды' },
      { to: '/arcanes', label: 'Мистификаторы' },
      { to: '/shards', label: 'Осколки' },
      { to: '/calculator', label: 'Калькулятор' },
    ],
  },
  {
    id: 'farm',
    label: 'Фарм',
    icon: 'farm',
    pages: [
      { to: '/planner', label: 'Планировщик' },
      { to: '/relics', label: 'Реликвии' },
      { to: '/farm', label: 'Ресурсы' },
      { to: '/mastery', label: 'Мастерство' },
      { to: '/collections', label: 'Коллекции' },
    ],
  },
  {
    id: 'trade',
    label: 'Торговля',
    icon: 'market',
    pages: [
      { to: '/market', label: 'Рынок' },
      { to: '/relic-value', label: 'Ценность реликвий' },
      { to: '/sell', label: 'Что продать' },
      { to: '/baro', label: 'Баро' },
      { to: '/rivens', label: 'Ривены' },
    ],
  },
  {
    id: 'me',
    label: 'Я',
    icon: 'user',
    pages: [
      { to: '/tracker', label: 'Аккаунт и цели' },
      { to: '/foundry', label: 'Литейная' },
      { to: '/syndicates', label: 'Синдикаты' },
      { to: '/settings', label: 'Настройки' },
    ],
  },
]

// раздел по адресу: /frames/123 относится к Арсеналу
export function sectionOf(pathname: string): NavSection {
  const first = '/' + (pathname.split('/')[1] ?? '')
  return SECTIONS.find((s) => s.pages.some((p) => p.to === first)) ?? SECTIONS[0]
}

export const ALL_PAGES: (NavPage & { section: string })[] = SECTIONS.flatMap((s) => s.pages.map((p) => ({ ...p, section: s.label })))
