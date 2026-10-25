import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketIndex, useRelics } from '../hooks/useCatalog'
import { useMarketPrices } from '../hooks/useApi'
import { useNow } from '../hooks/useNow'
import { expectedValue, type Refinement } from '../lib/relicValue'
import { matchesQuery } from '../lib/text'
import { pluralRu } from '../lib/i18n'
import type { PriceMap, RelicItem } from '../lib/types'
import type { MarketIndex } from '../lib/market'
import { EmptyState, ErrorState, Freshness, Loading, SearchBox } from '../components/ui'
import { PAGE_SIZE, ShowMore } from '../components/CatalogBits'

const TIERS = ['Lith', 'Meso', 'Neo', 'Axi']

interface Row {
  relic: RelicItem
  value: number
  complete: boolean
  best: { name: string; price: number } | null
}

function buildRows(relics: RelicItem[], prices: PriceMap, index: MarketIndex, refinement: Refinement): Row[] {
  return relics.map((relic) => {
    const ev = expectedValue(relic.rewards, prices, refinement)
    const best = relic.rewards
      .filter((r) => r.slug && prices[r.slug])
      .map((r) => ({ name: (r.slug && index.bySlug.get(r.slug)?.ru) || r.name, price: prices[r.slug as string].median }))
      .sort((a, b) => b.price - a.price)[0] ?? null
    return { relic, value: ev.value, complete: ev.priced === ev.total, best }
  })
}

export function RelicValue() {
  const relics = useRelics()
  const prices = useMarketPrices()
  const index = useMarketIndex()
  const now = useNow(30_000)
  const [refinement, setRefinement] = useState<Refinement>('intact')
  const [tier, setTier] = useState<string | null>(null)
  const [onlyFarmable, setOnlyFarmable] = useState(false)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const rows = useMemo(() => {
    if (!relics.data || !prices.data) return []
    const q = query.trim()
    const list = relics.data
      .filter((r) => TIERS.includes(r.tier))
      .filter((r) => !tier || r.tier === tier)
      .filter((r) => !onlyFarmable || !r.vaulted)
      .filter((r) => !q || matchesQuery(q, `${r.tier} ${r.code}`, ...r.rewards.map((x) => (x.slug && index.bySlug.get(x.slug)?.ru) || x.name)))
    return buildRows(list, prices.data, index, refinement).sort((a, b) => b.value - a.value)
  }, [relics.data, prices.data, index, refinement, tier, onlyFarmable, query])

  const loading = (relics.loading && !relics.data) || (prices.loading && !prices.data)
  const error = (!relics.data && relics.error) || (!prices.data && prices.error)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Ценность реликвий</h1>
          <p>Сколько платины в среднем даёт одно открытие (цена награды × шанс). Цены - медиана с warframe.market за сутки.</p>
        </div>
        {prices.data && <Freshness fetchedAt={prices.fetchedAt} stale={prices.stale} now={now} onRefresh={prices.refresh} />}
      </div>

      <div className="row" style={{ marginBottom: 20 }}>
        <SearchBox value={query} onChange={(v) => { setQuery(v); setLimit(PAGE_SIZE) }} placeholder="Реликвия или награда" />
        <div className="chips" role="group" aria-label="Улучшение">
          <button className="chip" aria-pressed={refinement === 'intact'} onClick={() => setRefinement('intact')}>Целая</button>
          <button className="chip" aria-pressed={refinement === 'radiant'} onClick={() => setRefinement('radiant')}>Сияющая</button>
        </div>
        <div className="chips" role="group" aria-label="Уровень">
          <button className="chip" aria-pressed={tier === null} onClick={() => setTier(null)}>Все</button>
          {TIERS.map((t) => <button key={t} className="chip" aria-pressed={tier === t} onClick={() => setTier(tier === t ? null : t)}>{t}</button>)}
        </div>
        <button className="chip" aria-pressed={onlyFarmable} onClick={() => setOnlyFarmable((v) => !v)}>Только фармящиеся</button>
      </div>

      {loading && <Loading rows={6} height={44} />}
      {error && <ErrorState message={error} onRetry={() => { relics.refresh(); prices.refresh() }} />}
      {!loading && !error && rows.length === 0 && <EmptyState title="Ничего не нашлось">Измени фильтры или поиск.</EmptyState>}
      {rows.length > 0 && (
        <>
          <p className="small faint">{rows.length} {pluralRu(rows.length, 'реликвия', 'реликвии', 'реликвий')}. Хранимые реликвии не фармятся, но их можно купить у игроков или получить у Варзии.</p>
          <div className="panel" style={{ padding: '8px 22px' }}>
            <table className="table">
              <thead><tr><th>Реликвия</th><th>Самая дорогая награда</th><th className="right">В среднем за открытие</th></tr></thead>
              <tbody>
                {rows.slice(0, limit).map(({ relic, value, complete, best }) => (
                  <tr key={relic.id}>
                    <td>
                      <Link to={`/relics?q=${encodeURIComponent(`${relic.tier} ${relic.code}`)}`} style={{ color: 'inherit' }}>
                        <span className="tag tag--gold">{relic.tier}</span> {relic.code}
                      </Link>
                      {relic.vaulted && <span className="tag tag--kuva" style={{ marginLeft: 8 }}>В хранилище</span>}
                    </td>
                    <td className="small muted">{best ? `${best.name} - ${Math.round(best.price)} пл` : '-'}</td>
                    <td className="right num" title={complete ? undefined : 'Не у всех наград есть цена - реальная ценность может быть выше'}>
                      <span className="gold">{value.toFixed(1)} пл</span>{!complete && <span className="faint"> *</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ShowMore shown={limit} total={rows.length} onMore={() => setLimit((l) => l + PAGE_SIZE * 2)} />
        </>
      )}
    </div>
  )
}
