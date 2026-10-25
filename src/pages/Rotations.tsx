import { useWorld } from '../hooks/useCatalog'
import { useNow } from '../hooks/useNow'
import { usePlayer } from '../state/AppState'
import { nextArchons, teshinSchedule } from '../lib/rotations'
import { formatCountdown, msUntil, nextWeeklyReset } from '../lib/time'
import { teshinRu } from '../data/rotations'
import { SHARDS } from '../data/shards'
import { EmptyState, ErrorState, Freshness, Loading, Orokin } from '../components/ui'
import type { WorldState } from '../lib/types'

const TESHIN_WEEKS_AHEAD = 4
const ARCHONS_AHEAD = 2
const ARCHON_SHARD: Record<string, string> = { Amar: 'crimson', Nira: 'amber', Boreal: 'azure' }

const shortDate = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

function ShardDot({ archon }: { archon: string }) {
  const shard = SHARDS.find((s) => s.color === ARCHON_SHARD[archon])
  if (!shard) return null
  return <span className="tag" style={{ borderColor: shard.hex, color: shard.hex }}>{shard.name} осколок</span>
}

function Teshin({ world, now }: { world: WorldState; now: number }) {
  const sp = world.steelPath
  if (!sp?.currentReward) return <p className="muted">Нет данных о Тешине.</p>
  const upcoming = teshinSchedule(sp, TESHIN_WEEKS_AHEAD)
  return (
    <Orokin>
      <div className="section-head" style={{ marginBottom: 8 }}>
        <h2>Тешин, Стальной путь</h2>
        <span className="small num muted">смена через {formatCountdown(msUntil(sp.expiry, now))}</span>
      </div>
      <p style={{ fontSize: 22, margin: '4px 0' }} className="gold">{teshinRu(sp.currentReward.name)}</p>
      <p className="small muted">{sp.currentReward.cost} эссенции Стали. Тешин стоит в любом Реле.</p>
      {upcoming.length > 0 && (
        <>
          <div className="meta-label" style={{ marginTop: 14 }}>Дальше</div>
          <table className="table">
            <tbody>
              {upcoming.map((r) => (
                <tr key={r.startsAt}>
                  <td className="muted small">с {shortDate(r.startsAt)}</td>
                  <td>{teshinRu(r.name)}</td>
                  <td className="right num muted">{r.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Orokin>
  )
}

function Circuit({ world, now }: { world: WorldState; now: number }) {
  const choices = world.duviriCycle?.choices ?? []
  const normal = choices.find((c) => c.category === 'normal')?.choices ?? []
  const hard = choices.find((c) => c.category === 'hard')?.choices ?? []
  return (
    <section className="panel">
      <div className="section-head" style={{ marginBottom: 8 }}>
        <h3>Цепь Дувири</h3>
        <span className="small num muted">{formatCountdown(nextWeeklyReset(now) - now)}</span>
      </div>
      <div className="meta-label">Обычная цепь - части варфреймов</div>
      <p style={{ marginTop: 0 }}>{normal.join(', ') || '-'}</p>
      <div className="meta-label">Стальная цепь - адаптеры Инкарнонов</div>
      <p style={{ marginTop: 0 }}>{hard.join(', ') || '-'}</p>
      <p className="small faint" style={{ marginBottom: 0 }}>Выбор меняется каждый понедельник в 00:00 UTC.</p>
    </section>
  )
}

function Archons({ world, now }: { world: WorldState; now: number }) {
  const hunt = world.archonHunt
  const current = ['Amar', 'Nira', 'Boreal'].find((a) => hunt?.boss?.includes(a))
  return (
    <section className="panel">
      <div className="section-head" style={{ marginBottom: 8 }}>
        <h3>Охота на Архонта</h3>
        {hunt && <span className="small num muted">{formatCountdown(msUntil(hunt.expiry, now))}</span>}
      </div>
      {current ? <p style={{ margin: '0 0 6px' }}>Сейчас: Архонт {current} <ShardDot archon={current} /></p> : <p className="muted">Нет данных</p>}
      {nextArchons(hunt?.boss, ARCHONS_AHEAD).map((a, i) => (
        <p key={a} className="small muted" style={{ margin: '4px 0' }}>{i === 0 ? 'Следующая неделя' : 'Через неделю'}: {a} <ShardDot archon={a} /></p>
      ))}
      <p className="small faint" style={{ marginBottom: 0 }}>Порядок неизменный: Амар → Нира → Бореал.</p>
    </section>
  )
}

function Nightwave({ world, now }: { world: WorldState; now: number }) {
  const { profile } = usePlayer()
  const nw = world.nightwave
  if (!nw) return <EmptyState title="Ночная волна сейчас не идёт" />
  const tag = nw.tag?.replace(/\s+/g, '')
  const rank = profile?.syndicates?.find((s) => s.tag === tag)?.rank
  const challenges = [...nw.activeChallenges].sort((a, b) => Number(b.isElite) - Number(a.isElite) || Number(a.isDaily) - Number(b.isDaily))
  return (
    <section className="section">
      <div className="section-head">
        <h2>Ночная волна</h2>
        <span className="hint">{rank !== undefined ? `Твой ранг: ${rank}. ` : ''}Сезон закончится через {formatCountdown(msUntil(nw.expiry, now))}</span>
      </div>
      <div className="panel" style={{ padding: '8px 22px' }}>
        <table className="table">
          <thead><tr><th>Задание</th><th>Тип</th><th className="right">Репутация</th><th className="right">Осталось</th></tr></thead>
          <tbody>
            {challenges.map((c) => (
              <tr key={c.id}>
                <td><div>{c.title}</div><div className="small faint">{c.desc}</div></td>
                <td>{c.isElite ? <span className="tag tag--gold">Элитное</span> : c.isDaily ? <span className="tag">Дневное</span> : <span className="tag tag--lotus">Недельное</span>}</td>
                <td className="right num">{c.reputation.toLocaleString('ru-RU')}</td>
                <td className="right num muted">{formatCountdown(msUntil(c.expiry, now))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small faint">Задания приходят из игры на английском.</p>
    </section>
  )
}

export function Rotations() {
  const { data, loading, error, stale, fetchedAt, refresh } = useWorld()
  const now = useNow()
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Ротации</h1>
          <p>Тешин, Цепь Дувири, Архонт недели и Ночная волна.</p>
        </div>
        {data && <Freshness fetchedAt={fetchedAt} stale={stale} now={now} onRefresh={refresh} />}
      </div>
      {loading && !data && <Loading rows={3} height={160} />}
      {error && !data && <ErrorState message={error} onRetry={refresh} />}
      {data && (
        <>
          <div className="grid grid--2 section" style={{ marginTop: 0 }}>
            <Teshin world={data} now={now} />
            <div className="stack">
              <Circuit world={data} now={now} />
              <Archons world={data} now={now} />
            </div>
          </div>
          <Nightwave world={data} now={now} />
        </>
      )}
    </div>
  )
}
