import { useMemo, useState } from 'react'
import { useWorld } from '../hooks/useCatalog'
import { useNow } from '../hooks/useNow'
import { CycleStrip } from '../components/CycleStrip'
import { EmptyState, ErrorState, Freshness, Loading, Orokin } from '../components/ui'
import { formatCountdown, msUntil } from '../lib/time'
import { factionRu, missionRu } from '../lib/i18n'
import type { Fissure, Invasion, WorldState } from '../lib/types'

type FissureMode = 'normal' | 'steel' | 'storm'
const MODES: { id: FissureMode; label: string }[] = [
  { id: 'normal', label: 'Обычные' },
  { id: 'steel', label: 'Стальной путь' },
  { id: 'storm', label: 'Шторм Бездны' },
]
const TIERS = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem', 'Omnia']
const FAST_MISSIONS = new Set(['Capture', 'Exterminate', 'Extermination', 'Sabotage', 'Rescue', 'Spy'])

function Fissures({ fissures, now }: { fissures: Fissure[]; now: number }) {
  const [mode, setMode] = useState<FissureMode>('normal')
  const [tier, setTier] = useState<string | null>(null)
  const list = useMemo(
    () =>
      fissures
        .filter((f) => (mode === 'storm' ? f.isStorm : !f.isStorm && (mode === 'steel') === f.isHard))
        .filter((f) => !tier || f.tier === tier)
        .sort((a, b) => a.tierNum - b.tierNum || a.expiry.localeCompare(b.expiry)),
    [fissures, mode, tier],
  )
  return (
    <section className="section">
      <div className="section-head">
        <h2>Разломы Бездны</h2>
        <span className="hint">Быстрые миссии отмечены золотом - на них удобнее всего открывать реликвии</span>
      </div>
      <div className="row" style={{ marginBottom: 14, justifyContent: 'space-between' }}>
        <div className="chips" role="group" aria-label="Тип разломов">
          {MODES.map((m) => (
            <button key={m.id} className="chip" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Уровень реликвий">
          <button className="chip" aria-pressed={tier === null} onClick={() => setTier(null)}>Все</button>
          {TIERS.map((t) => (
            <button key={t} className="chip" aria-pressed={tier === t} onClick={() => setTier(t)}>{t}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState title="Нет разломов с таким фильтром">Выбери другой уровень реликвий или тип разлома.</EmptyState>
      ) : (
        <div className="panel" style={{ padding: '8px 22px' }}>
          <table className="table">
            <thead>
              <tr><th>Реликвии</th><th>Миссия</th><th>Узел</th><th>Враг</th><th className="right">Осталось</th></tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td><span className="tag tag--gold">{f.tier}</span></td>
                  <td style={{ color: FAST_MISSIONS.has(f.missionType) ? 'var(--gold-pale)' : undefined }}>{missionRu(f.missionType)}</td>
                  <td className="muted">{f.node}</td>
                  <td className="muted">{factionRu(f.enemy)}</td>
                  <td className="right num">{formatCountdown(msUntil(f.expiry, now))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function rewardText(inv: Invasion['attacker']['reward']): string {
  const counted = inv.countedItems.map((c) => (c.count > 1 ? `${c.count}× ${c.type}` : c.type))
  return [...inv.items, ...counted].join(', ') || '-'
}

function Weekly({ world, now }: { world: WorldState; now: number }) {
  const baro = world.voidTrader
  const baroHere = baro && msUntil(baro.activation, now) <= 0
  return (
    <div className="grid grid--3 section">
      <Orokin small>
        <div className="section-head" style={{ marginBottom: 8 }}>
          <h3>Вылазка</h3>
          {world.sortie && <span className="small num muted">{formatCountdown(msUntil(world.sortie.expiry, now))}</span>}
        </div>
        {world.sortie?.boss && <p className="small muted">{world.sortie.boss}, {factionRu(world.sortie.faction ?? '')}</p>}
        <ul className="clean">
          {(world.sortie?.variants ?? []).map((v, i) => (
            <li key={i} className="ability">
              <div>{missionRu(v.missionType)} <span className="muted small">на {v.node}</span></div>
              <div className="small faint">{v.modifier}</div>
            </li>
          ))}
        </ul>
      </Orokin>
      <section className="panel">
        <div className="section-head" style={{ marginBottom: 8 }}>
          <h3>Охота на Архонта</h3>
          {world.archonHunt && <span className="small num muted">{formatCountdown(msUntil(world.archonHunt.expiry, now))}</span>}
        </div>
        {world.archonHunt?.boss && <p className="small muted">{world.archonHunt.boss}</p>}
        <ul className="clean">
          {(world.archonHunt?.missions ?? []).map((m, i) => (
            <li key={i} className="ability">
              {missionRu(m.type)} <span className="muted small">на {m.node}</span>
            </li>
          ))}
        </ul>
        <p className="small faint" style={{ marginTop: 10 }}>Награда - осколок Архонта. Нужен пройденный квест «Покров Завесы».</p>
      </section>
      <section className="panel">
        <div className="section-head" style={{ marginBottom: 8 }}>
          <h3>Баро Ки'Тиир</h3>
          {baro && (
            <span className="small num" style={{ color: baroHere ? 'var(--lotus)' : 'var(--muted)' }}>
              {formatCountdown(msUntil(baroHere ? baro.expiry : baro.activation, now))}
            </span>
          )}
        </div>
        {!baro ? <p className="muted small">Нет данных.</p> : baroHere ? (
          <>
            <p className="small muted">Сейчас на {baro.location}. Улетит через указанное время.</p>
            <ul className="clean" style={{ maxHeight: 260, overflowY: 'auto' }}>
              {baro.inventory.map((it) => (
                <li key={it.item} className="mini-stat small">
                  <span>{it.item}</span>
                  <span className="num muted">{it.ducats} дук.</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="small muted">Прилетит на {baro.location}. Копи дукаты: сдавай лишние прайм-части в Ретрансляторе.</p>
        )}
        {world.steelPath?.currentReward && (
          <div className="mini-stat" style={{ marginTop: 10 }}>
            <span className="small">Тешин на этой неделе</span>
            <span className="small gold">{world.steelPath.currentReward.name}</span>
          </div>
        )}
      </section>
    </div>
  )
}

function Invasions({ invasions }: { invasions: Invasion[] }) {
  const active = invasions.filter((i) => !i.completed)
  if (active.length === 0) return null
  return (
    <section className="section">
      <div className="section-head">
        <h2>Вторжения</h2>
        <span className="hint">Помогай стороне с нужной наградой - три миссии за одну награду</span>
      </div>
      <div className="grid grid--2">
        {active.map((inv) => (
          <div key={inv.id} className="panel">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong style={{ fontWeight: 600 }}>{inv.node}</strong>
              <span className="small muted num">{Math.round(inv.completion)}%</span>
            </div>
            <div className="bar" style={{ margin: '8px 0 10px' }}><i style={{ width: `${inv.completion}%` }} /></div>
            <div className="grid grid--2" style={{ gap: 12 }}>
              {!inv.vsInfestation && (
                <div>
                  <div className="meta-label">За {factionRu(inv.attacker.faction)}</div>
                  <div className="small">{rewardText(inv.attacker.reward)}</div>
                </div>
              )}
              <div>
                <div className="meta-label">За {factionRu(inv.defender.faction)}</div>
                <div className="small">{rewardText(inv.defender.reward)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Nightwave({ world, now }: { world: WorldState; now: number }) {
  const nw = world.nightwave
  if (!nw || nw.activeChallenges.length === 0) return null
  const sorted = [...nw.activeChallenges].sort((a, b) => Number(b.isElite) - Number(a.isElite) || b.reputation - a.reputation)
  return (
    <section className="section">
      <div className="section-head">
        <h2>Ночная волна</h2>
        <span className="hint">Сезон {nw.season}, закончится через {formatCountdown(msUntil(nw.expiry, now))}</span>
      </div>
      <div className="panel" style={{ padding: '8px 22px' }}>
        <table className="table">
          <thead><tr><th>Задание</th><th>Тип</th><th className="right">Репутация</th><th className="right">Осталось</th></tr></thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td><div>{c.title}</div><div className="small muted">{c.desc}</div></td>
                <td>{c.isElite ? <span className="tag tag--gold">Элитное</span> : <span className="tag">{c.isDaily ? 'Ежедневное' : 'Недельное'}</span>}</td>
                <td className="right num">{c.reputation.toLocaleString('ru-RU')}</td>
                <td className="right num muted">{formatCountdown(msUntil(c.expiry, now))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function World() {
  const now = useNow(1000)
  const { data: world, loading, error, stale, fetchedAt, refresh } = useWorld()

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Мир сейчас</h1>
          <p>Циклы, разломы, вылазка, Баро. Обновляется раз в минуту.</p>
        </div>
        {world && <Freshness fetchedAt={fetchedAt} stale={stale} now={now} onRefresh={refresh} />}
      </div>
      {loading && !world && <Loading rows={4} height={90} />}
      {error && !world && <ErrorState message={error} onRetry={refresh} />}
      {world && (
        <>
          <CycleStrip world={world} now={now} />
          <Weekly world={world} now={now} />
          <Fissures fissures={world.fissures ?? []} now={now} />
          <Nightwave world={world} now={now} />
          <Invasions invasions={world.invasions ?? []} />
          {world.events && world.events.length > 0 && (
            <section className="section">
              <h2 style={{ marginBottom: 14 }}>События</h2>
              <div className="grid grid--2">
                {world.events.map((e) => (
                  <div key={e.id} className="panel row" style={{ justifyContent: 'space-between' }}>
                    <span>{e.description}</span>
                    <span className="small num muted">{formatCountdown(msUntil(e.expiry, now))}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
