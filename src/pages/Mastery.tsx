import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompanions, useFrames, useWeapons } from '../hooks/useCatalog'
import { usePlayer } from '../state/AppState'
import { masteryPointsForRank, masteryTodo, SOURCE_ORDER, type ItemSource, type TodoEntry } from '../lib/mastery'
import { pluralRu } from '../lib/i18n'
import { EmptyState, ItemImage, Loading, Orokin } from '../components/ui'

const SOURCE_LABEL: Record<ItemSource, { title: string; hint: string }> = {
  credits: { title: 'Чертёж за кредиты', hint: 'Покупается в Маркете, части обычно с боссов или из ресурсов' },
  drops: { title: 'Части падают в миссиях', hint: 'Боссы, баунти, ротации' },
  prime: { title: 'Праймы, реликвии фармятся', hint: 'Смотри планировщик фарма' },
  other: { title: 'Клан, синдикаты, Баро, квесты', hint: 'Исследования в додзё, магазины синдикатов, события' },
  vaulted: { title: 'Праймы в хранилище', hint: 'Проще купить сет или части у игроков' },
  lich: { title: 'Оружие личей и сестёр', hint: 'Кува, Догмат, Кода' },
}
const SHOW = 12
const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU')

function routeOf(e: TodoEntry): string {
  const c = e.item.category
  if (c === 'Warframes') return `/frames/${encodeURIComponent(e.item.uniqueName)}`
  if (['Sentinels', 'Pets', 'Archwing', 'Necramech'].includes(c)) return `/companions/${encodeURIComponent(e.item.uniqueName)}`
  return `/weapons/${encodeURIComponent(e.item.uniqueName)}`
}

function Row({ e }: { e: TodoEntry }) {
  return (
    <Link to={routeOf(e)} className="list-row" style={{ gridTemplateColumns: '48px 1fr auto', textDecoration: 'none' }}>
      <ItemImage name={e.item.name} imageName={e.item.imageName} />
      <span>
        <span style={{ display: 'block' }}>{e.item.name}</span>
        <span className="small faint">{e.rank > 0 ? `ранг ${e.rank} из ${e.maxRank}` : e.item.masteryReq ? `нужен MR ${e.item.masteryReq}` : 'без требований'}</span>
      </span>
      <span className="num gold small">+{fmt(e.pointsLeft)}</span>
    </Link>
  )
}

function Group({ title, hint, list }: { title: string; hint: string; list: TodoEntry[] }) {
  const [open, setOpen] = useState(false)
  if (list.length === 0) return null
  const points = list.reduce((s, e) => s + e.pointsLeft, 0)
  return (
    <section className="section">
      <div className="section-head">
        <h3>{title} <span className="small muted">· {list.length} {pluralRu(list.length, 'предмет', 'предмета', 'предметов')}, +{fmt(points)} очков</span></h3>
        <span className="hint">{hint}</span>
      </div>
      <div className="grid grid--2" style={{ gap: 6 }}>
        {(open ? list : list.slice(0, SHOW)).map((e) => <Row key={e.item.uniqueName} e={e} />)}
      </div>
      {list.length > SHOW && <button className="btn btn--ghost" style={{ marginTop: 8 }} onClick={() => setOpen((v) => !v)}>{open ? 'Свернуть' : `Показать все ${list.length}`}</button>}
    </section>
  )
}

export function Mastery() {
  const { profile, xpByUnique } = usePlayer()
  const { frames, loading } = useFrames()
  const { weapons } = useWeapons()
  const { data: companions } = useCompanions()
  const items = useMemo(() => [...frames, ...weapons, ...(companions ?? [])].filter((i) => i.masterable !== false), [frames, weapons, companions])
  const todo = useMemo(() => masteryTodo(items, xpByUnique), [items, xpByUnique])

  if (!profile) {
    return (
      <div className="page">
        <EmptyState title="Нужен привязанный аккаунт" action={<Link to="/tracker" className="btn btn--gold">Привязать</Link>}>
          Что ты уже вкачал, берётся из профиля Warframe.
        </EmptyState>
      </div>
    )
  }
  const mr = profile.masteryRank ?? 0
  const next = masteryPointsForRank(mr + 1)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Мастерство</h1>
          <p>Что докачать и что ещё не было. Сначала то, что проще всего достать.</p>
        </div>
      </div>
      {loading && items.length === 0 && <Loading rows={4} height={60} />}
      <Orokin>
        <div className="row" style={{ gap: 24 }}>
          <span className="mr-badge"><span>{mr}</span></span>
          <div className="stack" style={{ gap: 2 }}>
            <span>С предметов уже <span className="num gold">{fmt(todo.pointsDone)}</span> очков. Для MR {mr + 1} всего нужно <span className="num">{fmt(next)}</span>.</span>
            <span className="small muted">Ещё можно получить <span className="num">{fmt(todo.pointsLeft)}</span> с предметов ниже. Звёздная карта и Стальной путь тоже дают очки, их тут нет.</span>
          </div>
        </div>
      </Orokin>
      <Group title="Докачать до максимума" hint="Уже есть у тебя, осталось поднять ранг" list={todo.leveling} />
      {SOURCE_ORDER.map((src) => (
        <Group key={src} title={SOURCE_LABEL[src].title} hint={SOURCE_LABEL[src].hint} list={todo.missing.filter((e) => e.source === src)} />
      ))}
    </div>
  )
}
