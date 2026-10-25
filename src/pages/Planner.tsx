import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFrames, useRelics, useWeapons, useWorld } from '../hooks/useCatalog'
import { useProgress } from '../state/AppState'
import { buildPlan, type PlanRelic } from '../lib/planner'
import { toggleGoal, togglePart, partKey } from '../lib/progress'
import { isResourceComponent } from '../lib/parts'
import { componentRu, dropLocationRu, isPrimaryDropLocation, pluralRu, rarityRu } from '../lib/i18n'
import { matchesQuery } from '../lib/text'
import type { Item } from '../lib/types'
import { EmptyState, Loading, Orokin, SearchBox } from '../components/ui'
import { Icon } from '../components/Icon'
import { RelicPlaces } from './Relics'

const MAX_RESULTS = 8
const MAX_OTHER_DROPS = 3

function AddGoal({ items }: { items: Item[] }) {
  const { progress, update } = useProgress()
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim()
    if (q.length < 2) return []
    return items.filter((i) => !progress.goals.includes(i.uniqueName) && matchesQuery(q, i.name)).slice(0, MAX_RESULTS)
  }, [items, query, progress.goals])
  return (
    <div style={{ position: 'relative', maxWidth: 520 }}>
      <SearchBox value={query} onChange={setQuery} placeholder="Добавить цель: фрейм или оружие" />
      {results.length > 0 && (
        <div className="dropdown">
          {results.map((i) => (
            <button key={i.uniqueName} className="dropdown__item" onClick={() => { update((s) => toggleGoal(s, i.uniqueName)); setQuery('') }}>
              <Icon name="plus" size={15} />{i.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RelicTask({ relic, goalIds, fissures }: { relic: PlanRelic; goalIds: Map<string, string>; fissures: number }) {
  const { progress, update } = useProgress()
  const [code] = relic.key.split(' ').slice(1)
  return (
    <article className="panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3><span className="tag tag--gold">{relic.tier}</span> {code}</h3>
        {relic.vaulted ? <span className="tag tag--kuva">В хранилище - купить у игроков</span> : <span className="tag tag--lotus">Фармится</span>}
      </div>
      <ul className="clean" style={{ margin: '10px 0' }}>
        {relic.needs.map((n) => {
          const id = goalIds.get(n.item) ?? ''
          const key = partKey(id, n.part)
          return (
            <li key={`${n.item}-${n.part}`} className="row small" style={{ justifyContent: 'space-between', padding: '3px 0' }}>
              <label className="row" style={{ gap: 8 }}>
                <input type="checkbox" checked={Boolean(progress.parts[key])} onChange={() => update((s) => togglePart(s, id, n.part))} />
                <span>{n.item}: {componentRu(n.part)}</span>
              </label>
              <span className="muted">{n.rarity ? `${rarityRu(n.rarity).toLowerCase()}, ` : ''}<span className="num">{n.chance}%</span></span>
            </li>
          )
        })}
      </ul>
      <div className="grid grid--2">
        <div>
          <div className="meta-label">Где выпадает</div>
          <RelicPlaces relic={{ tier: relic.tier, code, vaulted: relic.vaulted }} />
        </div>
        <div>
          <div className="meta-label">Открыть сейчас</div>
          <p className="small muted" style={{ margin: 0 }}>
            {fissures > 0 ? `${fissures} ${pluralRu(fissures, 'разлом', 'разлома', 'разломов')} ${relic.tier} открыто` : `Сейчас нет разломов ${relic.tier}`} - <Link to="/world">смотреть</Link>
          </p>
        </div>
      </div>
    </article>
  )
}

export function Planner() {
  const { progress } = useProgress()
  const { frames, loading: framesLoading } = useFrames()
  const { weapons } = useWeapons()
  const { data: relics, loading: relicsLoading } = useRelics()
  const { data: world } = useWorld()

  const items = useMemo(() => [...frames, ...weapons].filter((i) => (i.components ?? []).some((c) => !isResourceComponent(c))), [frames, weapons])
  const goals = useMemo(() => items.filter((i) => progress.goals.includes(i.uniqueName)), [items, progress.goals])
  const goalIds = useMemo(() => new Map(goals.map((g) => [g.name, g.uniqueName])), [goals])
  const plan = useMemo(() => buildPlan(goals, progress.parts, relics ?? []), [goals, progress.parts, relics])
  const fissuresByTier = useMemo(() => {
    const map = new Map<string, number>()
    for (const f of world?.fissures ?? []) if (!f.isStorm) map.set(f.tier, (map.get(f.tier) ?? 0) + 1)
    return map
  }, [world])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Планировщик фарма</h1>
          <p>Добавь, что хочешь собрать. Тут будет список: какие реликвии открывать и что падает прямо с миссий. Собранные части отмечай галочкой.</p>
        </div>
      </div>
      <AddGoal items={items} />
      {framesLoading && goals.length === 0 && progress.goals.length > 0 && <Loading rows={3} height={80} />}
      {progress.goals.length === 0 && (
        <div className="section"><EmptyState title="Целей пока нет">Найди фрейм или оружие в поиске выше. Например, «Сарина Прайм».</EmptyState></div>
      )}
      {goals.length > 0 && (
        <>
          <div className="chips section" style={{ marginTop: 16 }}>
            {goals.map((g) => <span key={g.uniqueName} className={`tag ${plan.done.includes(g.name) ? 'tag--lotus' : ''}`}>{g.name}{plan.done.includes(g.name) ? ' - всё собрано' : ''}</span>)}
          </div>
          {relicsLoading && !relics && <p className="small muted">Загружаю каталог реликвий…</p>}
          {plan.relics.length > 0 && (
            <section className="section">
              <Orokin small>
                <h2 style={{ marginBottom: 4 }}>Реликвии для открытия</h2>
                <p className="small muted" style={{ margin: 0 }}>{plan.relics.length} {pluralRu(plan.relics.length, 'реликвия', 'реликвии', 'реликвий')}. Сначала те, что фармятся и закрывают больше частей сразу. Шанс указан для целой реликвии - сияющая поднимает шанс редких частей до 10%.</p>
              </Orokin>
              <div className="stack" style={{ marginTop: 12 }}>
                {plan.relics.map((r) => <RelicTask key={r.key} relic={r} goalIds={goalIds} fissures={fissuresByTier.get(r.tier) ?? 0} />)}
              </div>
            </section>
          )}
          {plan.other.length > 0 && (
            <section className="section">
              <h2 style={{ marginBottom: 12 }}>Фармится напрямую</h2>
              <div className="panel" style={{ padding: '8px 22px' }}>
                <table className="table">
                  <tbody>
                    {plan.other.map((o) => {
                      const drops = o.drops.filter((d) => isPrimaryDropLocation(d.location)).sort((a, b) => b.chance - a.chance).slice(0, MAX_OTHER_DROPS)
                      return (
                        <tr key={`${o.item}-${o.part}`}>
                          <td>{o.item}: {componentRu(o.part)}</td>
                          <td className="small muted">{drops.length ? drops.map((d) => `${dropLocationRu(d.location)} - ${d.chance}%`).join('; ') : 'Маркет, синдикат или кузница - смотри страницу предмета'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
