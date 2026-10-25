import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFrames, useWeapons } from '../hooks/useCatalog'
import { masteryStatus } from '../lib/mastery'
import { countOwnedParts, toggleGoal } from '../lib/progress'
import { pluralRu } from '../lib/i18n'
import { EmptyState, ItemImage } from '../components/ui'
import { usePlayer, useProgress } from '../state/AppState'
import type { Item } from '../lib/types'
import { isResourceComponent } from '../lib/parts'
import { AccountLinkPanel } from '../components/AccountLink'

function MasterySummary({ frames, weapons }: { frames: Item[]; weapons: Item[] }) {
  const { profile, xpByUnique } = usePlayer()
  if (!profile) return null
  const count = (items: Item[]) => items.filter((i) => masteryStatus(i, xpByUnique).mastered).length
  const rows = [
    { label: 'Варфреймы', done: count(frames), total: frames.length },
    { label: 'Оружие', done: count(weapons), total: weapons.length },
  ]
  return (
    <div className="grid grid--2">
      {rows.map((r) => (
        <div key={r.label} className="panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{r.label}</h3>
            <span className="num">{r.done} <span className="muted">из {r.total}</span></span>
          </div>
          <div className="bar" style={{ marginTop: 12 }}><i style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }} /></div>
          <p className="small faint" style={{ margin: '8px 0 0' }}>Вкачано до максимального ранга</p>
        </div>
      ))}
    </div>
  )
}

function Goals({ catalog }: { catalog: Map<string, Item> }) {
  const { progress, update } = useProgress()
  if (progress.goals.length === 0) {
    return (
      <EmptyState title="Целей пока нет" action={<Link to="/frames" className="btn">Выбрать фрейм</Link>}>
        Открой любой фрейм или оружие и нажми «Добавить в цели» - здесь появится, что ещё осталось собрать.
      </EmptyState>
    )
  }
  return (
    <div className="stack" style={{ gap: 8 }}>
      {progress.goals.map((id) => {
        const item = catalog.get(id)
        if (!item) return null
        const parts = (item.components ?? []).filter((c) => !isResourceComponent(c)).map((c) => c.name)
        const owned = countOwnedParts(progress, id, parts)
        const route = item.category === 'Warframes' ? 'frames' : 'weapons'
        return (
          <div key={id} className="list-row" style={{ gridTemplateColumns: '56px 1fr 180px auto' }}>
            <ItemImage name={item.name} imageName={item.imageName} />
            <Link to={`/${route}/${encodeURIComponent(id)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              <span style={{ display: 'block' }}>{item.name}</span>
              <span className="small muted">{owned === parts.length && parts.length > 0 ? 'Всё собрано - можно строить' : `Осталось ${parts.length - owned} ${pluralRu(parts.length - owned, 'часть', 'части', 'частей')}`}</span>
            </Link>
            <div className="bar"><i style={{ width: `${parts.length ? (owned / parts.length) * 100 : 0}%` }} /></div>
            <button className="btn btn--ghost" onClick={() => update((s) => toggleGoal(s, id))} aria-label={`Убрать ${item.name} из целей`}>Убрать</button>
          </div>
        )
      })}
    </div>
  )
}

function Unmastered({ frames }: { frames: Item[] }) {
  const { profile, xpByUnique } = usePlayer()
  const missing = useMemo(() => frames.filter((f) => !masteryStatus(f, xpByUnique).seen), [frames, xpByUnique])
  if (!profile || missing.length === 0) return null
  return (
    <section className="section">
      <div className="section-head">
        <h2>Фреймы, которых у тебя ещё не было</h2>
        <span className="hint">{missing.length} {pluralRu(missing.length, 'фрейм', 'фрейма', 'фреймов')} - каждый даст мастерство</span>
      </div>
      <div className="grid grid--auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {missing.map((f) => (
          <Link key={f.uniqueName} to={`/frames/${encodeURIComponent(f.uniqueName)}`} className="item-card">
            <div className="item-card__img"><ItemImage name={f.name} imageName={f.imageName} /></div>
            <div className="item-card__body"><div className="item-card__name" style={{ fontSize: 16 }}>{f.name}</div></div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function Tracker() {
  const { frames } = useFrames()
  const { weapons } = useWeapons()
  const catalog = useMemo(() => new Map([...frames, ...weapons].map((i) => [i.uniqueName, i])), [frames, weapons])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Трекер</h1>
          <p>Мастерство берётся из профиля, цели и части хранятся у тебя на компьютере.</p>
        </div>
      </div>
      <AccountLinkPanel />
      <div className="section"><MasterySummary frames={frames} weapons={weapons} /></div>
      <section className="section">
        <h2 style={{ marginBottom: 14 }}>Мои цели</h2>
        <Goals catalog={catalog} />
      </section>
      <Unmastered frames={frames} />
    </div>
  )
}
