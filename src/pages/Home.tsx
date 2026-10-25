import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useFrames, useWeapons, useWorld } from '../hooks/useCatalog'
import { useNow } from '../hooks/useNow'
import { CycleStrip } from '../components/CycleStrip'
import { Checklist } from '../components/Checklist'
import { ErrorState, Freshness, Loading, Orokin } from '../components/ui'
import { Icon } from '../components/Icon'
import { TimerList } from './Foundry'
import { formatCountdown, msUntil } from '../lib/time'
import { missionRu } from '../lib/i18n'
import { countOwnedParts } from '../lib/progress'
import { isResourceComponent } from '../lib/parts'
import { teshinRu } from '../data/rotations'
import { usePlayer, useProgress } from '../state/AppState'
import type { WorldState } from '../lib/types'

const DATE_FMT = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
const GOALS_SHOWN = 3

function greeting(now: number): string {
  const h = new Date(now).getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export const openSearch = () => window.dispatchEvent(new CustomEvent('wfh:search'))

function Week({ world, now }: { world: WorldState; now: number }) {
  const baro = world.voidTrader
  const baroHere = baro && msUntil(baro.activation, now) <= 0
  const rows = [
    { label: 'Вылазка', value: world.sortie?.variants.map((v) => missionRu(v.missionType)).join(', '), left: world.sortie?.expiry, to: '/world' },
    { label: 'Архонт', value: world.archonHunt?.boss, left: world.archonHunt?.expiry, to: '/rotations' },
    { label: 'Тешин', value: world.steelPath?.currentReward ? teshinRu(world.steelPath.currentReward.name) : undefined, left: world.steelPath?.expiry, to: '/rotations' },
    { label: 'Баро', value: baro ? (baroHere ? `сейчас на ${baro.location}` : 'ещё в пути') : undefined, left: baro ? (baroHere ? baro.expiry : baro.activation) : undefined, to: '/baro', live: baroHere },
  ]
  return (
    <ul className="clean week">
      {rows.map((r) => (
        <li key={r.label}>
          <Link to={r.to} className="week__row">
            <span className="week__label">{r.label}</span>
            <span className="week__value">{r.value ?? '-'}</span>
            <span className={`num week__left ${r.live ? 'is-live' : ''}`}>{r.left ? formatCountdown(msUntil(r.left, now)) : ''}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Goals() {
  const { progress } = useProgress()
  const { frames } = useFrames()
  const { weapons } = useWeapons()
  const items = useMemo(() => new Map([...frames, ...weapons].map((i) => [i.uniqueName, i])), [frames, weapons])
  const goals = progress.goals.map((id) => items.get(id)).filter((i) => i !== undefined).slice(0, GOALS_SHOWN)
  if (progress.goals.length === 0) {
    return <p className="small muted" style={{ margin: 0 }}>Целей нет. Добавь фрейм или оружие в <Link to="/planner">планировщике</Link>, и тут будет видно, сколько осталось собрать.</p>
  }
  return (
    <div className="stack" style={{ gap: 12 }}>
      {goals.map((item) => {
        const parts = (item.components ?? []).filter((c) => !isResourceComponent(c)).map((c) => c.name)
        const owned = countOwnedParts(progress, item.uniqueName, parts)
        return (
          <Link key={item.uniqueName} to="/planner" className="goal">
            <span className="row" style={{ justifyContent: 'space-between' }}>
              <span>{item.name}</span>
              <span className="small num muted">{owned} / {parts.length}</span>
            </span>
            <span className="bar"><i style={{ width: `${parts.length ? (owned / parts.length) * 100 : 0}%` }} /></span>
          </Link>
        )
      })}
      {progress.goals.length > GOALS_SHOWN && <Link to="/planner" className="small">Все цели ({progress.goals.length})</Link>}
    </div>
  )
}

export function Home() {
  const now = useNow(1000)
  const { data: world, loading, error, stale, fetchedAt, refresh } = useWorld()
  const { progress } = useProgress()
  const { profile } = usePlayer()
  const name = profile?.displayName ?? progress.account?.displayName ?? 'Тэнно'

  return (
    <div className="page">
      <header className="home-head">
        <div>
          <h1>{greeting(now)}, {name}</h1>
          <div className="home-head__date">{DATE_FMT.format(now)}{world && <> <Freshness fetchedAt={fetchedAt} stale={stale} now={now} onRefresh={refresh} /></>}</div>
        </div>
        <div className="row">
          <button className="btn" onClick={openSearch}><Icon name="search" size={16} />Найти предмет</button>
          {window.wf && <button className="btn" onClick={() => void window.wf?.scanRewards()} title="То же, что Ctrl+Alt+R в игре"><Icon name="relic" size={16} />Скан наград</button>}
          {window.wf && <button className="btn" onClick={() => void window.wf?.toggleOverlay()}><Icon name="overlay" size={16} />Оверлей</button>}
        </div>
      </header>

      {!progress.account && (
        <Orokin small className="home-link">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Привяжи аккаунт Warframe, чтобы видеть свой MR, репутацию синдикатов и что ещё не вкачано.</span>
            <Link to="/tracker" className="btn btn--gold">Привязать</Link>
          </div>
        </Orokin>
      )}

      {loading && !world && <Loading rows={1} height={150} />}
      {error && !world && <ErrorState message={error} onRetry={refresh} />}
      {world && <CycleStrip world={world} now={now} />}

      <div className="split section">
        <section className="panel" aria-labelledby="today">
          <h2 id="today" style={{ marginBottom: 18 }}>Дела на сегодня</h2>
          <Checklist now={now} />
        </section>
        <div className="stack" style={{ gap: 20 }}>
          {world && (
            <section className="panel">
              <h3 style={{ marginBottom: 6 }}>Эта неделя</h3>
              <Week world={world} now={now} />
            </section>
          )}
          <section className="panel">
            <div className="section-head" style={{ marginBottom: 10 }}>
              <h3>Литейная</h3>
              <Link to="/foundry" className="small">Добавить таймер</Link>
            </div>
            <TimerList compact />
          </section>
          <section className="panel">
            <h3 style={{ marginBottom: 12 }}>Цели</h3>
            <Goals />
          </section>
        </div>
      </div>
    </div>
  )
}
