import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWeapons } from '../hooks/useCatalog'
import { masteryStatus } from '../lib/mastery'
import { pluralRu } from '../lib/i18n'
import { WEAPON_CATEGORY_LABEL, WEAPON_PICKS, weaponKey, type WeaponStage } from '../data/weapons'
import { EmptyState, ErrorState, ItemImage, Loading, SearchBox } from '../components/ui'
import { Icon } from '../components/Icon'
import { usePlayer } from '../state/AppState'
import type { Item } from '../lib/types'

const PAGE_SIZE = 60
const PICK_BY_KEY = new Map(WEAPON_PICKS.map((p) => [p.en.toLowerCase(), p]))
const STAGE_LABEL: Record<WeaponStage, string> = { start: 'Для старта', endgame: 'Для эндгейма' }

function WeaponRow({ item, note }: { item: Item; note?: string }) {
  const { profile, xpByUnique } = usePlayer()
  const mastery = profile ? masteryStatus(item, xpByUnique) : null
  return (
    <Link to={`/weapons/${encodeURIComponent(item.uniqueName)}`} className="list-row">
      <ItemImage name={item.name} imageName={item.imageName} />
      <span>
        <span style={{ display: 'block' }}>{item.name}</span>
        <span className="small muted">{note ?? `${WEAPON_CATEGORY_LABEL[item.category] ?? item.category}${item.type ? `, ${item.type.toLowerCase()}` : ''}`}</span>
      </span>
      <span className="row small faint" style={{ gap: 8 }}>
        {mastery?.mastered && <span className="tag tag--gold" title="Вкачано"><Icon name="check" size={13} /></span>}
        MR {item.masteryReq ?? 0}
      </span>
    </Link>
  )
}

export function Weapons() {
  const { weapons, loading, error, refresh } = useWeapons()
  const { profile, xpByUnique } = usePlayer()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [hideMastered, setHideMastered] = useState(false)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const picks = useMemo(
    () =>
      weapons
        .map((w) => ({ item: w, pick: PICK_BY_KEY.get(weaponKey(w.wikiaUrl)) }))
        .filter((x): x is { item: Item; pick: NonNullable<typeof x.pick> } => Boolean(x.pick)),
    [weapons],
  )

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return weapons
      .filter((w) => !category || w.category === category)
      .filter((w) => !q || w.name.toLowerCase().includes(q) || weaponKey(w.wikiaUrl).includes(q))
      .filter((w) => !hideMastered || !profile || !masteryStatus(w, xpByUnique).mastered)
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [weapons, query, category, hideMastered, profile, xpByUnique])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Оружие</h1>
          <p>Всё оружие с частями и где их брать.</p>
        </div>
      </div>

      {picks.length > 0 && !query && (
        <div className="grid grid--2" style={{ marginBottom: 32 }}>
          {(['start', 'endgame'] as const).map((stage) => (
            <section key={stage} className="panel">
              <h3 style={{ marginBottom: 12 }}>{STAGE_LABEL[stage]}</h3>
              <div className="stack" style={{ gap: 8 }}>
                {picks.filter((p) => p.pick.stage === stage).map(({ item, pick }) => (
                  <WeaponRow key={item.uniqueName} item={item} note={pick.why} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="row" style={{ marginBottom: 18 }}>
        <SearchBox value={query} onChange={(v) => { setQuery(v); setLimit(PAGE_SIZE) }} placeholder="Найти оружие" />
        <div className="chips" role="group" aria-label="Категория">
          <button className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>Все</button>
          {Object.entries(WEAPON_CATEGORY_LABEL).map(([id, label]) => (
            <button key={id} className="chip" aria-pressed={category === id} onClick={() => { setCategory(id); setLimit(PAGE_SIZE) }}>{label}</button>
          ))}
        </div>
        {profile && (
          <button className="chip" aria-pressed={hideMastered} onClick={() => setHideMastered((v) => !v)}>Скрыть вкачанное</button>
        )}
      </div>

      {loading && weapons.length === 0 && <Loading rows={6} height={60} />}
      {error && weapons.length === 0 && <ErrorState message={error} onRetry={refresh} />}
      {weapons.length > 0 && list.length === 0 && <EmptyState title="Ничего не нашлось">Попробуй английское название или другую категорию.</EmptyState>}
      {list.length > 0 && (
        <>
          <p className="small faint">{list.length} {pluralRu(list.length, 'предмет', 'предмета', 'предметов')}</p>
          <div className="grid grid--2" style={{ gap: 8 }}>
            {list.slice(0, limit).map((w) => <WeaponRow key={w.uniqueName} item={w} />)}
          </div>
          {list.length > limit && (
            <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
              <button className="btn" onClick={() => setLimit((l) => l + PAGE_SIZE * 2)}>Показать ещё {Math.min(PAGE_SIZE * 2, list.length - limit)}</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
