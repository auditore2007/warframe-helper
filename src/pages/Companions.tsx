import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCompanions } from '../hooks/useCatalog'
import { openExternal } from '../lib/api'
import { masteryStatus } from '../lib/mastery'
import { matchesQuery, wikiKey, cleanGameText } from '../lib/text'
import { toggleGoal } from '../lib/progress'
import { COMPANION_GROUP_HINT, COMPANION_GROUP_LABEL, COMPANION_NOTES, companionGroup, type CompanionGroup } from '../data/companions'
import { EmptyState, ErrorState, ItemImage, Loading, Orokin, SearchBox } from '../components/ui'
import { ItemParts } from '../components/ItemParts'
import { Icon } from '../components/Icon'
import { usePlayer, useProgress } from '../state/AppState'
import type { Item } from '../lib/types'

const NOTE_BY_KEY = new Map(COMPANION_NOTES.map((n) => [n.en, n]))
const GROUPS = Object.keys(COMPANION_GROUP_LABEL) as CompanionGroup[]

// архвинги приходят как '<ARCHWING> Итзал'
export const displayName = (name: string): string => name.replace(/^<[^>]+>\s*/, '')
const noteFor = (item: Item) => NOTE_BY_KEY.get(wikiKey(item.wikiaUrl).replace(/ prime$/, ''))

export function Companions() {
  const { data, loading, error, refresh } = useCompanions()
  const { profile, xpByUnique } = usePlayer()
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const map = new Map<CompanionGroup, Item[]>()
    for (const c of data ?? []) {
      if (!matchesQuery(query, c.name, wikiKey(c.wikiaUrl))) continue
      const g = companionGroup(c.category, c.uniqueName)
      map.set(g, [...(map.get(g) ?? []), c])
    }
    for (const list of map.values()) list.sort((a, b) => Number(Boolean(noteFor(b)?.best)) - Number(Boolean(noteFor(a)?.best)) || a.name.localeCompare(b.name, 'ru'))
    return map
  }, [data, query])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Компаньоны и техника</h1>
          <p>Стражи, звери, арчвинги и некромехи. Все дают мастерство, некоторые помогают с фармом.</p>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <SearchBox value={query} onChange={setQuery} placeholder="Найти компаньона" />
      </div>
      {loading && !data && <Loading rows={3} height={160} />}
      {error && !data && <ErrorState message={error} onRetry={refresh} />}
      {data && grouped.size === 0 && <EmptyState title="Ничего не нашлось" />}
      {GROUPS.filter((g) => grouped.has(g)).map((g) => (
        <section key={g} className="section" style={{ marginTop: 28 }}>
          <div className="section-head">
            <h2>{COMPANION_GROUP_LABEL[g]}</h2>
            <span className="hint">{COMPANION_GROUP_HINT[g]}</span>
          </div>
          <div className="grid grid--auto">
            {grouped.get(g)!.map((c) => {
              const note = noteFor(c)
              const mastered = profile ? masteryStatus(c, xpByUnique).mastered : false
              return (
                <Link key={c.uniqueName} to={`/companions/${encodeURIComponent(c.uniqueName)}`} className="item-card">
                  <div className="item-card__img">
                    <ItemImage name={c.name} imageName={c.imageName} />
                    {note?.best && <span className="item-card__tier tag tag--gold">Рекомендуем</span>}
                    {mastered && <span className="item-card__mastered tag tag--gold" title="Вкачан"><Icon name="check" size={13} /></span>}
                  </div>
                  <div className="item-card__body">
                    <div className="item-card__name">{displayName(c.name)}</div>
                    {note && <div className="item-card__roles">{note.note}</div>}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export function CompanionDetail() {
  const { id = '' } = useParams()
  const uniqueName = decodeURIComponent(id)
  const { data, loading, error, refresh } = useCompanions()
  const { progress, update } = useProgress()
  const { profile, xpByUnique } = usePlayer()

  if (loading && !data) return <div className="page"><Loading rows={2} height={240} /></div>
  if (error && !data) return <div className="page"><ErrorState message={error} onRetry={refresh} /></div>
  const item = (data ?? []).find((c) => c.uniqueName === uniqueName)
  if (!item) return <div className="page"><EmptyState title="Компаньон не найден" action={<Link to="/companions" className="btn">Ко всем компаньонам</Link>} /></div>

  const note = noteFor(item)
  const group = companionGroup(item.category, item.uniqueName)
  const mastery = profile ? masteryStatus(item, xpByUnique) : null
  const isGoal = progress.goals.includes(item.uniqueName)

  return (
    <div className="page">
      <Link to="/companions" className="back"><Icon name="back" size={16} />Все компаньоны</Link>
      <header className="detail-hero reveal">
        <div className="detail-hero__img"><ItemImage name={item.name} imageName={item.imageName} /></div>
        <div>
          <h1>{displayName(item.name)}</h1>
          <div className="chips" style={{ marginTop: 12 }}>
            <span className="tag tag--gold">{COMPANION_GROUP_LABEL[group]}</span>
            {item.isPrime && <span className="tag">Прайм</span>}
          </div>
          <p className="lede">{note?.note ?? cleanGameText(item.description)}</p>
          <div className="stats">
            {([['Здоровье', item.health], ['Щиты', item.shield], ['Броня', item.armor], ['Энергия', item.power], ['Мастерство', item.masteryReq || undefined]] as const).map(
              ([label, value]) => value !== undefined && <div key={label}><div className="stat__label">{label}</div><div className="stat__value num">{value}</div></div>,
            )}
            {mastery && (
              <div><div className="stat__label">Твой ранг</div><div className="stat__value num" style={{ color: mastery.mastered ? 'var(--gold)' : undefined }}>{mastery.seen ? `${mastery.rank} / ${mastery.maxRank}` : 'не вкачан'}</div></div>
            )}
          </div>
          <div className="row" style={{ marginTop: 22 }}>
            <button className={`btn ${isGoal ? '' : 'btn--gold'}`} onClick={() => update((s) => toggleGoal(s, item.uniqueName))}>
              <Icon name={isGoal ? 'check' : 'star'} size={16} />{isGoal ? 'В целях' : 'Добавить в цели'}
            </button>
            {item.wikiaUrl && <button className="btn btn--ghost" onClick={() => openExternal(item.wikiaUrl!)}><Icon name="external" size={15} />Вики</button>}
          </div>
        </div>
      </header>
      <div className="split section">
        <Orokin>
          <h2 style={{ marginBottom: 6 }}>Где достать</h2>
          <p className="muted small">{COMPANION_GROUP_HINT[group]}</p>
          <ItemParts item={item} />
        </Orokin>
        {item.abilities && item.abilities.length > 0 && (
          <section className="panel">
            <h2 style={{ marginBottom: 6 }}>Способности</h2>
            {item.abilities.map((a) => (
              <div key={a.name} className="ability">
                <div className="ability__name">{a.name}</div>
                <div className="small muted">{cleanGameText(a.description)}</div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
