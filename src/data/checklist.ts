export type ChecklistPeriod = 'daily' | 'weekly'

export interface ChecklistTask {
  id: string
  period: ChecklistPeriod
  title: string
  why: string
}

export const CHECKLIST: ChecklistTask[] = [
  { id: 'd-sortie', period: 'daily', title: 'Вылазка', why: 'Ривены, эндо, катализаторы и арканы' },
  { id: 'd-steel', period: 'daily', title: 'Вторжения Стального пути', why: '25 Стальной эссенции за 5 миссий' },
  { id: 'd-nightwave', period: 'daily', title: 'Задания Ночной волны', why: 'Репутация сезона, сгорают через 3 дня' },
  { id: 'd-syndicate', period: 'daily', title: 'Репутация синдиката', why: 'Дневной лимит восстанавливается в 03:00 по Москве' },
  { id: 'd-forma', period: 'daily', title: 'Построить Форму', why: 'Строится сутки - запускай каждый день' },
  { id: 'd-focus', period: 'daily', title: 'Фокус', why: 'Ежедневный лимит опыта Фокуса' },
  { id: 'w-archon', period: 'weekly', title: 'Охота на Архонта', why: 'Осколок Архонта' },
  { id: 'w-circuit', period: 'weekly', title: 'Circuit (Дувири)', why: 'Адаптеры Генезиса для инкарнонов' },
  { id: 'w-netracells', period: 'weekly', title: 'Нетраклетки', why: 'Арканы и осколки Архонтов' },
  { id: 'w-ayatan', period: 'weekly', title: 'Охота за Аятан у Маро', why: 'Скульптура Аятан - эндо' },
  { id: 'w-teshin', period: 'weekly', title: 'Магазин Тешина', why: 'Умбра-форма, кува, эндо - по очереди' },
  { id: 'w-nightwave', period: 'weekly', title: 'Недельные задания Ночной волны', why: 'Больше всего репутации' },
  { id: 'w-kahl', period: 'weekly', title: 'Гарнизон Кала', why: 'Части Стинакса и шейдеры' },
]
