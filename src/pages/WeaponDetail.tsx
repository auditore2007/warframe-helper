import { Link, useParams } from 'react-router-dom'
import { useWeapons } from '../hooks/useCatalog'
import { openExternal } from '../lib/api'
import { masteryStatus } from '../lib/mastery'
import { toggleGoal } from '../lib/progress'
import { WEAPON_CATEGORY_LABEL } from '../data/weapons'
import { EmptyState, ErrorState, ItemImage, Loading, Orokin } from '../components/ui'
import { ItemParts } from '../components/ItemParts'
import { Icon } from '../components/Icon'
import { usePlayer, useProgress } from '../state/AppState'

const pct = (v?: number) => (v === undefined ? undefined : `${Math.round(v * 1000) / 10}%`)
const fixed = (v?: number, digits = 1) => (v === undefined ? undefined : (Math.round(v * 10 ** digits) / 10 ** digits).toLocaleString('ru-RU'))

export function WeaponDetail() {
  const { id = '' } = useParams()
  const uniqueName = decodeURIComponent(id)
  const { weapons, loading, error, refresh } = useWeapons()
  const { progress, update } = useProgress()
  const { profile, xpByUnique } = usePlayer()

  if (loading && weapons.length === 0) return <div className="page"><Loading rows={2} height={240} /></div>
  if (error && weapons.length === 0) return <div className="page"><ErrorState message={error} onRetry={refresh} /></div>

  const item = weapons.find((w) => w.uniqueName === uniqueName)
  if (!item) {
    return (
      <div className="page">
        <EmptyState title="Оружие не найдено" action={<Link to="/weapons" className="btn">К списку оружия</Link>} />
      </div>
    )
  }

  const mastery = profile ? masteryStatus(item, xpByUnique) : null
  const isGoal = progress.goals.includes(item.uniqueName)
  const stats: [string, string | number | undefined][] = [
    ['Урон', fixed(item.totalDamage, 0)],
    ['Шанс крита', pct(item.criticalChance)],
    ['Множитель крита', item.criticalMultiplier ? `×${fixed(item.criticalMultiplier)}` : undefined],
    ['Шанс статуса', pct(item.procChance)],
    ['Скорострельность', fixed(item.fireRate, 2)],
    ['Магазин', item.magazineSize],
    ['Перезарядка', item.reloadTime ? `${fixed(item.reloadTime)} с` : undefined],
    ['Мастерство', item.masteryReq],
  ]

  return (
    <div className="page">
      <Link to="/weapons" className="back"><Icon name="back" size={16} />Всё оружие</Link>
      <header className="detail-hero reveal">
        <div className="detail-hero__img"><ItemImage name={item.name} imageName={item.imageName} /></div>
        <div>
          <h1>{item.name}</h1>
          <div className="chips" style={{ marginTop: 12 }}>
            <span className="tag tag--gold">{WEAPON_CATEGORY_LABEL[item.category] ?? item.category}</span>
            {item.type && <span className="tag">{item.type}</span>}
            {item.trigger && <span className="tag">{item.trigger}</span>}
            {item.vaulted && <span className="tag tag--kuva">В хранилище</span>}
          </div>
          {item.description && <p className="lede">{item.description}</p>}
          <div className="stats">
            {stats.map(([label, value]) => value !== undefined && (
              <div key={label}><div className="stat__label">{label}</div><div className="stat__value num">{value}</div></div>
            ))}
            {item.disposition !== undefined && (
              <div title="Сила ривен-модов: чем больше точек, тем сильнее ривен">
                <div className="stat__label">Диспозиция ривена</div>
                <div className="stat__value" style={{ color: 'var(--gold)', letterSpacing: 2 }}>{'◆'.repeat(item.disposition)}<span className="faint">{'◇'.repeat(5 - item.disposition)}</span></div>
              </div>
            )}
            {mastery && (
              <div>
                <div className="stat__label">Твой ранг</div>
                <div className="stat__value num" style={{ color: mastery.mastered ? 'var(--gold)' : undefined }}>{mastery.seen ? `${mastery.rank} / ${mastery.maxRank}` : 'не вкачано'}</div>
              </div>
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
      <div className="section" style={{ maxWidth: 820 }}>
        <Orokin>
          <h2 style={{ marginBottom: 10 }}>Где достать</h2>
          <ItemParts item={item} />
        </Orokin>
      </div>
    </div>
  )
}
