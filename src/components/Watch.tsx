import { useState } from 'react'
import { useMarketPrice } from '../hooks/useApi'
import { useMarketIndex } from '../hooks/useCatalog'
import { useProgress } from '../state/AppState'
import { removeWatch, setWatch } from '../lib/watchlist'
import type { MarketItem } from '../lib/types'
import { Icon } from './Icon'

// кнопка в карточке предмета: следить за ценой
export function WatchButton({ item, sell }: { item: MarketItem; sell: number | null }) {
  const { progress, update } = useProgress()
  const entry = progress.watch[item.slug]
  const [target, setTarget] = useState(String(entry?.target ?? (sell ? Math.max(1, Math.round(sell * 0.85)) : '')))
  return (
    <div className="row" style={{ gap: 8, marginTop: 14 }}>
      <span className="small muted">Сообщить, когда продают за</span>
      <input className="input num" style={{ width: 80 }} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Цена для уведомления" />
      <span className="small muted">пл или дешевле</span>
      <button className="btn" onClick={() => update((s) => setWatch(s, item.slug, Number(target)))}>{entry ? 'Обновить' : 'Следить'}</button>
      {entry && <button className="btn btn--ghost" onClick={() => update((s) => removeWatch(s, item.slug))}>Не следить</button>}
    </div>
  )
}

function WatchRow({ slug, target, onPick }: { slug: string; target: number; onPick: (item: MarketItem) => void }) {
  const { update } = useProgress()
  const index = useMarketIndex()
  const item = index.bySlug.get(slug)
  const { data } = useMarketPrice(slug)
  const sell = data?.sell ?? null
  const hit = sell !== null && sell <= target
  return (
    <div className="list-row" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
      <button className="btn btn--ghost" style={{ justifyContent: 'flex-start' }} onClick={() => item && onPick(item)}>{item?.ru ?? item?.en ?? slug}</button>
      <span className="small muted num">цель {target} пл</span>
      <span className={`num ${hit ? 'gold' : ''}`}>{sell === null ? '...' : `${sell} пл`}</span>
      <button className="btn btn--ghost" onClick={() => update((s) => removeWatch(s, slug))} aria-label="Не следить"><Icon name="close" size={14} /></button>
    </div>
  )
}

// список слежки: цены обновляются в фоне, уведомление приходит само
export function WatchList({ onPick }: { onPick: (item: MarketItem) => void }) {
  const { progress } = useProgress()
  const entries = Object.entries(progress.watch)
  if (entries.length === 0) return null
  return (
    <section style={{ marginBottom: 18 }}>
      <div className="meta-label">Слежу за ценой</div>
      <div className="stack" style={{ gap: 6 }}>
        {entries.map(([slug, e]) => <WatchRow key={slug} slug={slug} target={e.target} onPick={onPick} />)}
      </div>
      <p className="small faint">Проверка раз в 10 минут, пока приложение запущено (можно в трее).</p>
    </section>
  )
}
