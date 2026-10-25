import { Link } from 'react-router-dom'
import { useWorld } from '../hooks/useCatalog'
import { useNow } from '../hooks/useNow'
import { CycleStrip } from '../components/CycleStrip'
import { Checklist } from '../components/Checklist'
import { ErrorState, Freshness, Loading, Orokin } from '../components/ui'
import { formatCountdown, msUntil } from '../lib/time'
import { missionRu, factionRu } from '../lib/i18n'
import { usePlayer, useProgress } from '../state/AppState'
import { GUIDES } from '../data/guides'
import type { WorldState } from '../lib/types'

const DATE_FMT = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

function WeekAtGlance({ world, now }: { world: WorldState; now: number }) {
  const baro = world.voidTrader
  const baroHere = baro && msUntil(baro.activation, now) <= 0
  const rows = [
    {
      label: 'Вылазка',
      value: world.sortie ? world.sortie.variants.map((v) => missionRu(v.missionType)).join(', ') : '-',
      left: world.sortie?.expiry,
    },
    {
      label: 'Охота на Архонта',
      value: world.archonHunt ? world.archonHunt.boss ?? world.archonHunt.missions.map((m) => missionRu(m.type)).join(', ') : '-',
      left: world.archonHunt?.expiry,
    },
    {
      label: 'Магазин Тешина',
      value: world.steelPath?.currentReward?.name ?? '-',
      left: world.steelPath?.expiry,
    },
    {
      label: 'Баро Ки\'Тиир',
      value: baro ? (baroHere ? `Сейчас на ${baro.location}` : `Прилетит на ${baro.location}`) : '-',
      left: baro ? (baroHere ? baro.expiry : baro.activation) : undefined,
      live: baroHere,
    },
  ]
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="mini-stat">
          <span>
            <span style={{ display: 'block' }}>{r.label}</span>
            <span className="small muted">{r.value}</span>
          </span>
          <span className={`num small ${r.live ? '' : 'muted'}`} style={{ whiteSpace: 'nowrap', color: r.live ? 'var(--lotus)' : undefined }}>
            {r.left ? formatCountdown(msUntil(r.left, now)) : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

function PlayerCard() {
  const { progress } = useProgress()
  const { profile, status } = usePlayer()
  if (!progress.account) {
    return (
      <Orokin small>
        <h3 style={{ marginBottom: 8 }}>Твой прогресс</h3>
        <p className="muted small">Привяжи аккаунт Warframe: приложение само найдёт его в логе игры и покажет ранг мастерства и вкачанные предметы.</p>
        <Link to="/tracker" className="btn btn--gold">Привязать аккаунт</Link>
      </Orokin>
    )
  }
  const mastered = profile?.items.length ?? 0
  return (
    <Orokin small>
      <div className="row" style={{ gap: 16 }}>
        <span className="mr-badge"><span>{profile?.masteryRank ?? '–'}</span></span>
        <div>
          <h3>{profile?.displayName ?? progress.account.displayName ?? 'Тэнно'}</h3>
          <span className="small muted">{status === 'loading' ? 'Синхронизация профиля…' : `${mastered} предметов в профиле`}</span>
        </div>
      </div>
      <div className="mini-stat" style={{ marginTop: 10 }}>
        <span>Цели в работе</span>
        <span className="num">{progress.goals.length}</span>
      </div>
      <Link to="/tracker" className="btn" style={{ marginTop: 12 }}>Открыть трекер</Link>
    </Orokin>
  )
}

export function Home() {
  const now = useNow(1000)
  const { data: world, loading, error, stale, fetchedAt, refresh } = useWorld()
  const fissures = world?.fissures?.filter((f) => !f.isStorm) ?? []
  const steel = fissures.filter((f) => f.isHard).length

  return (
    <div className="page">
      <header className="hero reveal">
        <div>
          <h1>Система Origin</h1>
          <div className="hero__date">{DATE_FMT.format(now)}</div>
        </div>
        {world && <Freshness fetchedAt={fetchedAt} stale={stale} now={now} onRefresh={refresh} />}
      </header>

      {loading && !world && <Loading rows={1} height={150} />}
      {error && !world && <ErrorState message={error} onRetry={refresh} />}
      {world && <CycleStrip world={world} now={now} />}

      <div className="split section">
        <section className="panel" aria-labelledby="today">
          <h2 id="today" style={{ marginBottom: 18 }}>Дела на сегодня</h2>
          <Checklist now={now} />
        </section>
        <div className="stack" style={{ gap: 20 }}>
          <PlayerCard />
          {world && (
            <section className="panel">
              <div className="section-head" style={{ marginBottom: 4 }}>
                <h3>Эта неделя</h3>
                <Link to="/world" className="small">Подробнее</Link>
              </div>
              <WeekAtGlance world={world} now={now} />
            </section>
          )}
          {world && (
            <Link to="/world" className="panel" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span>Разломы Бездны</span>
                <span className="num">{fissures.length}</span>
              </div>
              <div className="small muted">Из них {steel} на Стальном пути</div>
              {world.arbitration && !world.arbitration.expired && (
                <div className="small muted">Арбитраж: {missionRu(world.arbitration.type)}, {factionRu(world.arbitration.enemy)}</div>
              )}
            </Link>
          )}
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>С чего начать</h2>
          <Link to="/guides" className="small">Все гайды</Link>
        </div>
        <div className="grid grid--3">
          {GUIDES.slice(0, 3).map((g) => (
            <Link key={g.id} to={`/guides/${g.id}`} className="guide-card">
              <h3>{g.title}</h3>
              <p>{g.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
