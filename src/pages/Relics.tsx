import { useMemo, useState } from 'react'
import { useMarketIndex, useRelics, useWorld } from '../hooks/useCatalog'
import { useApi, useMarketPrices } from '../hooks/useApi'
import { expectedValue } from '../lib/relicValue'
import { TTL } from '../lib/api'
import { matchesQuery } from '../lib/text'
import { dropLocationRu, missionRu, pluralRu, rarityRu } from '../lib/i18n'
import type { MarketIndex } from '../lib/market'
import type { DropSearchHit, PriceMap, RelicItem } from '../lib/types'
import { EmptyState, ErrorState, Loading, SearchBox } from '../components/ui'
import { PAGE_SIZE, ShowMore, useQueryParam } from '../components/CatalogBits'
import { PriceTag } from '../components/PriceTag'

const TIERS = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
const MAX_PLACES = 6

function rewardName(index: MarketIndex, slug: string | null, fallback: string): string {
  return (slug && index.bySlug.get(slug)?.ru) || fallback
}

export function RelicPlaces({ relic }: { relic: Pick<RelicItem, 'tier' | 'code' | 'vaulted'> }) {
  const { data, loading, error } = useApi<DropSearchHit[]>(`/drops/search/${encodeURIComponent(`${relic.tier} ${relic.code} Relic`)}`, TTL.drops)
  if (loading && !data) return <Loading rows={2} height={24} />
  if (error) return <p className="small faint">{error}</p>
  const places = (data ?? [])
    .filter((d) => d.item.toLowerCase() === `${relic.tier} ${relic.code} relic`.toLowerCase())
    .sort((a, b) => b.chance - a.chance)
    .slice(0, MAX_PLACES)
  if (places.length === 0) {
    return <p className="small faint">{relic.vaulted ? 'В хранилище: сейчас не выпадает. Ищи у Варзии на Ретрансляторе или покупай у игроков.' : 'Выпадает из наград миссий и заданий.'}</p>
  }
  return (
    <ul className="clean part__drops" style={{ gridColumn: 'auto' }}>
      {places.map((p) => (
        <li key={p.place}><span>{dropLocationRu(p.place)}</span><span className="num">{p.chance}%</span></li>
      ))}
    </ul>
  )
}

function RelicCard({ relic, index, openFissures, prices }: { relic: RelicItem; index: MarketIndex; openFissures: string[]; prices: PriceMap | undefined }) {
  const [open, setOpen] = useState(false)
  const best = relic.rewards.find((r) => r.rarity === 'Rare')
  return (
    <article className={`relic ${open ? 'relic--open' : ''}`}>
      <button className="relic__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="tag tag--gold">{relic.tier}</span>
        <span className="relic__code">{relic.code}</span>
        <span className="small muted relic__best">{best ? `Редкая: ${rewardName(index, best.slug, best.name)}` : ''}</span>
        {prices && <span className="small num gold" title="В среднем платины за одно открытие целой / сияющей реликвии">≈ {expectedValue(relic.rewards, prices, 'intact').value.toFixed(0)} / {expectedValue(relic.rewards, prices, 'radiant').value.toFixed(0)} пл</span>}
        {relic.vaulted ? <span className="tag tag--kuva">В хранилище</span> : <span className="tag tag--lotus">Выпадает</span>}
      </button>
      {open && (
        <div className="relic__body">
          <table className="table">
            <thead><tr><th>Награда</th><th>Редкость</th><th className="right">Целая</th><th className="right">Сияющая</th><th className="right">Цена</th></tr></thead>
            <tbody>
              {relic.rewards.map((r) => (
                <tr key={r.uniqueName ?? r.name}>
                  <td>{rewardName(index, r.slug, r.name)}</td>
                  <td className="small muted">{rarityRu(r.rarity)}</td>
                  <td className="right num">{r.intact ?? '-'}%</td>
                  <td className="right num">{r.radiant ?? '-'}%</td>
                  <td className="right"><PriceTag slug={r.slug} ducats={r.slug ? index.bySlug.get(r.slug)?.ducats : null} compareDucats /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid--2" style={{ marginTop: 16 }}>
            <div>
              <div className="meta-label">Где выпадает</div>
              <RelicPlaces relic={relic} />
            </div>
            <div>
              <div className="meta-label">Где открыть сейчас</div>
              {openFissures.length > 0
                ? <ul className="dots small">{openFissures.map((f) => <li key={f}>{f}</li>)}</ul>
                : <p className="small faint">Сейчас нет разломов {relic.tier}. Загляни позже: они обновляются каждый час.</p>}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export function Relics() {
  const { data, loading, error, refresh } = useRelics()
  const index = useMarketIndex()
  const { data: world } = useWorld()
  const { data: prices } = useMarketPrices()
  const [query, setQuery] = useQueryParam()
  const [tier, setTier] = useState<string | null>(null)
  const [onlyFarmable, setOnlyFarmable] = useState(true)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const fissuresByTier = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const f of world?.fissures ?? []) {
      const label = `${missionRu(f.missionType)} на ${f.node}${f.isHard ? ' (Стальной путь)' : ''}${f.isStorm ? ' (Шторм Бездны)' : ''}`
      map.set(f.tier, [...(map.get(f.tier) ?? []), label])
    }
    return map
  }, [world])

  const list = useMemo(() => {
    const q = query.trim()
    return (data ?? [])
      .filter((r) => !tier || r.tier === tier)
      .filter((r) => !onlyFarmable || !r.vaulted || q.length > 0)
      .filter((r) => !q || matchesQuery(q, `${r.tier} ${r.code}`, r.name, ...r.rewards.flatMap((x) => [x.name, x.slug ? index.bySlug.get(x.slug)?.ru : null])))
      .sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || a.code.localeCompare(b.code, 'en', { numeric: true }))
  }, [data, tier, onlyFarmable, query, index])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Реликвии</h1>
          <p>Что внутри, где падает и почём награды. Можно искать по части, например «Сарина Прайм» или «Soma Prime».</p>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 20 }}>
        <SearchBox value={query} onChange={(v) => { setQuery(v); setLimit(PAGE_SIZE) }} placeholder="Реликвия или прайм-часть" />
        <div className="chips" role="group" aria-label="Уровень">
          <button className="chip" aria-pressed={tier === null} onClick={() => setTier(null)}>Все</button>
          {TIERS.map((t) => <button key={t} className="chip" aria-pressed={tier === t} onClick={() => setTier(tier === t ? null : t)}>{t}</button>)}
        </div>
        <button className="chip" aria-pressed={onlyFarmable} onClick={() => setOnlyFarmable((v) => !v)} title="При поиске хранимые реликвии показываются всегда">Только фармящиеся</button>
      </div>

      {loading && !data && <><p className="small muted">Первая загрузка каталога занимает до минуты, дальше он хранится на диске.</p><Loading rows={5} height={52} /></>}
      {error && !data && <ErrorState message={error} onRetry={refresh} />}
      {data && list.length === 0 && <EmptyState title="Ничего не нашлось">Проверь название или отключи «Только фармящиеся».</EmptyState>}
      {list.length > 0 && (
        <>
          <p className="small faint">{list.length} {pluralRu(list.length, 'реликвия', 'реликвии', 'реликвий')}</p>
          <div className="stack" style={{ gap: 6 }}>
            {list.slice(0, limit).map((r) => <RelicCard key={r.id} relic={r} index={index} openFissures={fissuresByTier.get(r.tier) ?? []} prices={prices} />)}
          </div>
          <ShowMore shown={limit} total={list.length} onMore={() => setLimit((l) => l + PAGE_SIZE * 2)} />
        </>
      )}
    </div>
  )
}
