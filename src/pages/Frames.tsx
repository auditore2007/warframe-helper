import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFrames } from '../hooks/useCatalog'
import { baseKeyFromWiki } from '../lib/api'
import { masteryStatus } from '../lib/mastery'
import { FRAME_GUIDE_BY_KEY, ROLE_LABEL, ROLE_HINT, type Role, type Tier as TierValue } from '../data/frames'
import { EmptyState, ErrorState, ItemImage, Loading, SearchBox, Tier } from '../components/ui'
import { Icon } from '../components/Icon'
import { usePlayer } from '../state/AppState'
import { pluralRu } from '../lib/i18n'

type Variant = 'all' | 'base' | 'prime'
const TIER_ORDER: Record<TierValue, number> = { S: 0, A: 1, B: 2, C: 3 }

export function Frames() {
  const { frames, loading, error, refresh } = useFrames()
  const { xpByUnique, profile } = usePlayer()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [variant, setVariant] = useState<Variant>('all')
  const [beginner, setBeginner] = useState(false)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return frames
      .map((f) => ({ item: f, guide: FRAME_GUIDE_BY_KEY.get(baseKeyFromWiki(f.wikiaUrl) ?? '') }))
      .filter(({ item }) => !q || item.name.toLowerCase().includes(q) || (item.wikiaUrl ?? '').toLowerCase().includes(q))
      .filter(({ item }) => variant === 'all' || (variant === 'prime') === Boolean(item.isPrime))
      .filter(({ guide }) => !role || guide?.roles.includes(role))
      .filter(({ guide }) => !beginner || guide?.beginner)
      .sort((a, b) => {
        const ta = a.guide ? TIER_ORDER[a.guide.tier] : 9
        const tb = b.guide ? TIER_ORDER[b.guide.tier] : 9
        return ta - tb || a.item.name.localeCompare(b.item.name, 'ru')
      })
  }, [frames, query, role, variant, beginner])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Варфреймы</h1>
          <p>Для чего хорош фрейм и где брать части. Тир - насколько он тянет Стальной путь.</p>
        </div>
      </div>

      <div className="stack" style={{ gap: 14, marginBottom: 24 }}>
        <div className="row">
          <SearchBox value={query} onChange={setQuery} placeholder="Найти фрейм, например «Сарина» или «Saryn»" />
          <div className="chips" role="group" aria-label="Версия">
            {([['all', 'Все'], ['base', 'Обычные'], ['prime', 'Прайм']] as const).map(([id, label]) => (
              <button key={id} className="chip" aria-pressed={variant === id} onClick={() => setVariant(id)}>{label}</button>
            ))}
          </div>
          <button className="chip" aria-pressed={beginner} onClick={() => setBeginner((v) => !v)}>Для новичка</button>
        </div>
        <div className="chips" role="group" aria-label="Роль">
          <button className="chip" aria-pressed={role === null} onClick={() => setRole(null)}>Любая роль</button>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <button key={r} className="chip" aria-pressed={role === r} onClick={() => setRole(role === r ? null : r)} title={ROLE_HINT[r]}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        {role && <p className="small muted" style={{ margin: 0 }}>{ROLE_HINT[role]}</p>}
      </div>

      {loading && frames.length === 0 && <Loading rows={3} height={120} />}
      {error && frames.length === 0 && <ErrorState message={error} onRetry={refresh} />}
      {!loading && frames.length > 0 && list.length === 0 && (
        <EmptyState title="Ничего не нашлось">Сбрось фильтр роли или измени запрос.</EmptyState>
      )}
      {list.length > 0 && (
        <>
          <p className="small faint">{list.length} {pluralRu(list.length, 'фрейм', 'фрейма', 'фреймов')}</p>
          <div className="grid grid--auto">
            {list.map(({ item, guide }) => {
              const mastery = profile ? masteryStatus(item, xpByUnique) : null
              return (
                <Link key={item.uniqueName} to={`/frames/${encodeURIComponent(item.uniqueName)}`} className="item-card">
                  <div className="item-card__img">
                    <ItemImage name={item.name} imageName={item.imageName} />
                    {guide && <span className="item-card__tier"><Tier tier={guide.tier} /></span>}
                    {mastery?.mastered && (
                      <span className="item-card__mastered tag tag--gold" title="Вкачан до максимума"><Icon name="check" size={13} /></span>
                    )}
                  </div>
                  <div className="item-card__body">
                    <div className="item-card__name">{item.name}</div>
                    <div className="item-card__roles">{guide ? guide.roles.slice(0, 2).map((r) => ROLE_LABEL[r]).join(', ') : 'Гайд в работе'}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
