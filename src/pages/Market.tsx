import { useMemo, useState } from 'react'
import { useMarketHistory, useMarketItems, useMarketPrice } from '../hooks/useApi'
import { openExternal } from '../lib/api'
import { betterForDucats, priceTrend, whisperText } from '../lib/market'
import { matchesQuery } from '../lib/text'
import type { MarketItem } from '../lib/types'
import { EmptyState, ErrorState, Loading, Orokin, SearchBox } from '../components/ui'
import { Icon } from '../components/Icon'
import { useQueryParam } from '../components/CatalogBits'
import { PriceChart } from '../components/PriceChart'
import { WatchButton, WatchList } from '../components/Watch'

const MAX_RESULTS = 40
const STATUS_LABEL: Record<string, string> = { ingame: 'в игре', online: 'онлайн' }

function History({ slug }: { slug: string }) {
  const { data, loading, error } = useMarketHistory(slug)
  const [range, setRange] = useState<'days' | 'hours'>('days')
  const points = data?.[range] ?? []
  const trend = priceTrend(points)
  return (
    <div style={{ marginTop: 22 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h3>Цена по сделкам</h3>
        <div className="chips" role="group" aria-label="Период">
          <button className="chip" aria-pressed={range === 'days'} onClick={() => setRange('days')}>90 дней</button>
          <button className="chip" aria-pressed={range === 'hours'} onClick={() => setRange('hours')}>48 часов</button>
        </div>
      </div>
      {loading && !data && <Loading rows={1} height={170} />}
      {error && !data && <p className="small faint">{error}</p>}
      {trend && (
        <p className="small muted" style={{ margin: '0 0 6px' }}>
          Сейчас около <span className="num gold">{trend.last} пл</span>,{' '}
          <span className="num" style={{ color: trend.changePct > 0 ? 'var(--lotus)' : trend.changePct < 0 ? 'var(--kuva)' : undefined }}>
            {trend.changePct > 0 ? '+' : ''}{trend.changePct}%
          </span>{' '}за период. Было от {trend.low} до {trend.high}, сделок {trend.volume}.
        </p>
      )}
      {data && <PriceChart points={points} unit={range === 'days' ? 'day' : 'hour'} />}
    </div>
  )
}

function PricePanel({ item }: { item: MarketItem }) {
  const { data, loading, error, refresh } = useMarketPrice(item.slug)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (seller: string, platinum: number) => {
    try {
      await navigator.clipboard.writeText(whisperText(seller, item.en, platinum))
      setCopied(seller)
    } catch {
      setCopied(null)
    }
  }

  return (
    <Orokin>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>{item.ru ?? item.en}</h2>
          {item.ru && <div className="small faint">{item.en}</div>}
        </div>
        <button className="btn btn--ghost" onClick={() => openExternal(`https://warframe.market/items/${item.slug}`)}><Icon name="external" size={15} />warframe.market</button>
      </div>
      {loading && !data && <div style={{ marginTop: 16 }}><Loading rows={2} height={40} /></div>}
      {error && !data && <ErrorState message={error} onRetry={refresh} />}
      {data && (
        <>
          <div className="stats">
            <div><div className="stat__label">Продают от</div><div className="stat__value num gold">{data.sell ?? '-'} пл</div></div>
            <div><div className="stat__label">Покупают до</div><div className="stat__value num">{data.buy ?? '-'} пл</div></div>
            {item.ducats !== null && <div><div className="stat__label">Дукаты</div><div className="stat__value num">{item.ducats}</div></div>}
          </div>
          {betterForDucats(data.sell, item.ducats) && (
            <div className="callout">Платины за этот предмет дают мало - выгоднее сдать его Баро за {item.ducats} дукатов.</div>
          )}
          <WatchButton key={item.slug} item={item} sell={data.sell} />
          <History slug={item.slug} />
          <h3 style={{ margin: '22px 0 8px' }}>Продавцы онлайн</h3>
          {data.sellers.length === 0 ? (
            <p className="small muted">Сейчас никто не продаёт этот предмет в игре.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Игрок</th><th>Статус</th><th className="right">Шт.</th><th className="right">Цена</th><th /></tr></thead>
              <tbody>
                {data.sellers.map((s) => (
                  <tr key={s.name + s.platinum}>
                    <td>{s.name}</td>
                    <td className="small muted">{STATUS_LABEL[s.status] ?? s.status}</td>
                    <td className="right num">{s.quantity}</td>
                    <td className="right num">{s.platinum} пл</td>
                    <td className="right">
                      <button className="btn btn--ghost small" title="Скопировать сообщение продавцу" onClick={() => copy(s.name, s.platinum)}>
                        {copied === s.name ? 'Готово' : 'Написать'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="small faint" style={{ marginTop: 12 }}>Вставь сообщение в чат игры - продавец получит его в личку.</p>
        </>
      )}
    </Orokin>
  )
}

export function Market() {
  const { data, loading, error, refresh } = useMarketItems()
  const [query, setQuery] = useQueryParam()
  const [selected, setSelected] = useState<MarketItem | null>(null)

  const results = useMemo(() => {
    const q = query.trim()
    if (q.length < 2) return []
    return (data ?? [])
      .filter((it) => matchesQuery(q, it.ru, it.en))
      .sort((a, b) => Number(b.tags.includes('set')) - Number(a.tags.includes('set')) || (a.ru ?? a.en).localeCompare(b.ru ?? b.en, 'ru'))
      .slice(0, MAX_RESULTS)
  }, [data, query])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Рынок</h1>
          <p>Цены с warframe.market и кто продаёт прямо сейчас.</p>
        </div>
      </div>
      <div className="split">
        <div>
          <div className="row" style={{ marginBottom: 14 }}>
            <SearchBox value={query} onChange={setQuery} placeholder="Например: Сарина Прайм или Primed Flow" />
          </div>
          <WatchList onPick={setSelected} />
          {loading && !data && <Loading rows={4} height={44} />}
          {error && !data && <ErrorState message={error} onRetry={refresh} />}
          {data && query.trim().length < 2 && <p className="small muted">Введи хотя бы 2 буквы названия.</p>}
          {data && query.trim().length >= 2 && results.length === 0 && <EmptyState title="На рынке такого нет">Проверь название - на рынке торгуют только обмениваемыми предметами.</EmptyState>}
          <div className="stack" style={{ gap: 6 }}>
            {results.map((it) => (
              <button key={it.slug} className={`list-row market-row ${selected?.slug === it.slug ? 'market-row--active' : ''}`} onClick={() => setSelected(it)}>
                <span>
                  <span style={{ display: 'block' }}>{it.ru ?? it.en}</span>
                  {it.ru && <span className="small faint">{it.en}</span>}
                </span>
                {it.ducats ? <span className="small muted num">{it.ducats} дук</span> : <span />}
              </button>
            ))}
          </div>
        </div>
        <div style={{ position: 'sticky', top: 56 }}>
          {selected ? <PricePanel item={selected} /> : <EmptyState title="Выбери предмет">Цена и продавцы появятся здесь.</EmptyState>}
        </div>
      </div>
    </div>
  )
}
