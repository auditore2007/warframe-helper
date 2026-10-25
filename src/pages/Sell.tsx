import { useMemo, useState } from 'react'
import { useMarketIndex } from '../hooks/useCatalog'
import { useMarketPrices } from '../hooks/useApi'
import { useProgress } from '../state/AppState'
import { setSellCount, sellTotals } from '../lib/sellList'
import { betterForDucats, wtsMessages } from '../lib/market'
import { matchesQuery } from '../lib/text'
import type { MarketItem, PriceMap } from '../lib/types'
import { EmptyState, Orokin, SearchBox } from '../components/ui'
import { PriceTag } from '../components/PriceTag'
import { Icon } from '../components/Icon'

const MAX_RESULTS = 8

function AddItem({ items }: { items: MarketItem[] }) {
  const { update } = useProgress()
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim()
    if (q.length < 2) return []
    return items.filter((i) => matchesQuery(q, i.ru, i.en)).slice(0, MAX_RESULTS)
  }, [items, query])

  const add = (slug: string) => {
    update((s) => setSellCount(s, slug, (s.sell[slug] ?? 0) + 1))
    setQuery('')
  }

  return (
    <div style={{ position: 'relative', maxWidth: 520 }}>
      <SearchBox value={query} onChange={setQuery} placeholder="Добавить предмет: часть, мод, мистификатор" />
      {results.length > 0 && (
        <div className="panel stack" style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, top: 46, padding: 6, gap: 2 }}>
          {results.map((i) => (
            <button key={i.slug} className="nav__link" onClick={() => add(i.slug)}>
              <Icon name="plus" size={15} />
              <span>{i.ru ?? i.en}{i.ru && <span className="faint small"> · {i.en}</span>}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface RowProps {
  item: MarketItem
  count: number
  prices: PriceMap
}

function SellRow({ item, count, prices }: RowProps) {
  const { update } = useProgress()
  const daily = prices[item.slug]?.median ?? null
  const baro = betterForDucats(daily, item.ducats)
  return (
    <tr>
      <td>
        <div>{item.ru ?? item.en}</div>
        {baro && <span className="tag tag--gold" title="Платины за это дают мало - выгоднее сдать Баро за дукаты">Лучше Баро</span>}
      </td>
      <td>
        <input className="input num" style={{ width: 70 }} type="number" min={0} value={count} aria-label={`Количество ${item.ru ?? item.en}`}
          onChange={(e) => update((s) => setSellCount(s, item.slug, Number(e.target.value)))} />
      </td>
      <td className="right">{daily !== null ? <span className="num">{Math.round(daily)} пл</span> : <PriceTag slug={item.slug} />}</td>
      <td className="right num muted">{item.ducats ? `${item.ducats * count} дук` : '-'}</td>
      <td className="right">
        <button className="btn btn--ghost" onClick={() => update((s) => setSellCount(s, item.slug, 0))} aria-label={`Убрать ${item.ru ?? item.en}`}><Icon name="trash" size={15} /></button>
      </td>
    </tr>
  )
}

export function Sell() {
  const { progress, update } = useProgress()
  const index = useMarketIndex()
  const { data: prices = {}, loading } = useMarketPrices()
  const [copied, setCopied] = useState(false)

  const entries = Object.entries(progress.sell)
    .map(([slug, count]) => ({ item: index.bySlug.get(slug), count }))
    .filter((e): e is { item: MarketItem; count: number } => Boolean(e.item))
  const allItems = useMemo(() => [...index.bySlug.values()], [index])
  const ducats = useMemo(() => new Map(allItems.filter((i) => i.ducats).map((i) => [i.slug, i.ducats as number])), [allItems])
  const totals = sellTotals(progress.sell, prices, ducats)

  const copyWts = async () => {
    const text = wtsMessages(entries.map(({ item, count }) => ({ en: item.en, count, platinum: prices[item.slug]?.median ?? null }))).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Что продать</h1>
          <p>Закинь сюда лишнее и посмотри, сколько за это дадут и что лучше сдать Баро. Прайм-части по медиане за сутки, остальное по лучшей цене онлайн.</p>
        </div>
      </div>
      <AddItem items={allItems} />
      {entries.length === 0 ? (
        <div className="section"><EmptyState title="Список пуст">Найди предмет в поиске выше. Например, «Сарина Прайм» или «Blind Rage».</EmptyState></div>
      ) : (
        <>
          <div className="grid grid--3 section">
            <Orokin small>
              <div className="meta-label">Примерно платины</div>
              <div className="num gold" style={{ fontSize: 28 }}>{loading && !Object.keys(prices).length ? '…' : `${totals.platinum} пл`}</div>
              {totals.unpriced > 0 && <div className="small faint">без {totals.unpriced} {totals.unpriced === 1 ? 'предмета' : 'предметов'} - цена в строке</div>}
            </Orokin>
            <div className="panel">
              <div className="meta-label">Дукатов у Баро</div>
              <div className="num" style={{ fontSize: 28 }}>{totals.ducats}</div>
            </div>
            <div className="panel">
              <div className="meta-label">Торговый чат</div>
              <button className="btn" onClick={copyWts}><Icon name="check" size={15} />{copied ? 'Скопировано' : 'Скопировать WTS'}</button>
              <div className="small faint" style={{ marginTop: 6 }}>Вставь в чат «Торговля» в игре</div>
            </div>
          </div>
          <div className="panel" style={{ padding: '8px 22px' }}>
            <table className="table">
              <thead><tr><th>Предмет</th><th>Сколько</th><th className="right">Цена за шт.</th><th className="right">Дукаты</th><th /></tr></thead>
              <tbody>
                {entries.map(({ item, count }) => <SellRow key={item.slug} item={item} count={count} prices={prices} />)}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn--ghost" onClick={() => window.confirm('Очистить весь список?') && update((s) => ({ ...s, sell: {} }))}>Очистить список</button>
          </div>
        </>
      )}
    </div>
  )
}
