import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMarketIndex, useWorld } from '../hooks/useCatalog'
import { useMarketPrices } from '../hooks/useApi'
import { useNow } from '../hooks/useNow'
import { useProgress } from '../state/AppState'
import { ducatDeals, matchBaroItems } from '../lib/baro'
import { DUCATS_PER_PLAT_THRESHOLD } from '../lib/market'
import { formatCountdown, msUntil } from '../lib/time'
import { EmptyState, Orokin } from '../components/ui'
import { PriceTag } from '../components/PriceTag'

const DEALS = 20
const MIN_VOLUME = 5

export function Baro() {
  const { data: world } = useWorld()
  const { data: prices = {} } = useMarketPrices()
  const index = useMarketIndex()
  const { progress } = useProgress()
  const now = useNow(30_000)
  const items = useMemo(() => [...index.bySlug.values()], [index])

  const baro = world?.voidTrader
  const here = baro && msUntil(baro.activation, now) <= 0
  const offers = useMemo(() => matchBaroItems(baro?.inventory ?? [], items), [baro, items])
  const deals = useMemo(() => ducatDeals(prices, items, MIN_VOLUME, DEALS), [prices, items])
  const mine = Object.entries(progress.sell)
    .map(([slug, count]) => ({ item: index.bySlug.get(slug), count, median: prices[slug]?.median ?? null }))
    .filter((x) => x.item?.ducats)
    .map((x) => ({ ...x, perPlat: x.median ? (x.item!.ducats as number) / x.median : Infinity }))
    .sort((a, b) => b.perPlat - a.perPlat)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Баро Ки'Тиир</h1>
          <p>Что сдать за дукаты, а что продать за платину, и сколько стоит на рынке то, что он привёз.</p>
        </div>
      </div>

      <Orokin>
        {!baro ? <p style={{ margin: 0 }}>Нет данных о Баро.</p> : here ? (
          <p style={{ margin: 0 }}>Баро на <span className="gold">{baro.location}</span>, улетит через <span className="num">{formatCountdown(msUntil(baro.expiry, now))}</span>.</p>
        ) : (
          <p style={{ margin: 0 }}>Прилетит через <span className="num gold">{formatCountdown(msUntil(baro.activation, now))}</span> на {baro.location}. Список товаров появится, когда прилетит.</p>
        )}
      </Orokin>

      {here && offers.length > 0 && (
        <section className="section">
          <h2 style={{ marginBottom: 10 }}>Что привёз</h2>
          <div className="panel" style={{ padding: '8px 22px' }}>
            <table className="table">
              <thead><tr><th>Товар</th><th className="right">Дукаты</th><th className="right">Кредиты</th><th className="right">На рынке</th></tr></thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.name}>
                    <td>{o.market?.ru ?? o.name}</td>
                    <td className="right num">{o.ducats}</td>
                    <td className="right num muted">{o.credits.toLocaleString('ru-RU')}</td>
                    <td className="right">{o.market ? <PriceTag slug={o.market.slug} /> : <span className="faint">не продаётся</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small faint">Дорогое на рынке можно взять у Баро и перепродать.</p>
        </section>
      )}

      <section className="section">
        <h2 style={{ marginBottom: 10 }}>Из твоего списка «Что продать»</h2>
        {mine.length === 0 ? (
          <EmptyState title="Список пуст" action={<Link to="/sell" className="btn">Открыть список</Link>}>Добавь туда лишние прайм-части, тут будет видно, что лучше сдать Баро.</EmptyState>
        ) : (
          <div className="panel" style={{ padding: '8px 22px' }}>
            <table className="table">
              <thead><tr><th>Предмет</th><th className="right">Шт.</th><th className="right">Платина</th><th className="right">Дукаты</th><th>Совет</th></tr></thead>
              <tbody>
                {mine.map(({ item, count, median, perPlat }) => (
                  <tr key={item!.slug}>
                    <td>{item!.ru ?? item!.en}</td>
                    <td className="right num">{count}</td>
                    <td className="right num">{median !== null ? `${Math.round(median)} пл` : '-'}</td>
                    <td className="right num">{(item!.ducats as number) * count}</td>
                    <td>{perPlat >= DUCATS_PER_PLAT_THRESHOLD ? <span className="tag tag--gold">Баро</span> : <span className="tag tag--lotus">Продать</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Дешёвые дукаты на рынке</h2>
          <span className="hint">Части, за которые игроки просят мало, а Баро даёт много</span>
        </div>
        <div className="panel" style={{ padding: '8px 22px' }}>
          <table className="table">
            <thead><tr><th>Часть</th><th className="right">Цена</th><th className="right">Дукаты</th><th className="right">Дукатов за 1 пл</th></tr></thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.item.slug}>
                  <td>{d.item.ru ?? d.item.en}</td>
                  <td className="right num">{Math.round(d.median)} пл</td>
                  <td className="right num">{d.ducats}</td>
                  <td className="right num gold">{d.perPlat.toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small faint">Медиана сделок за сутки, только части, которые продаются хотя бы {MIN_VOLUME} раз в день.</p>
      </section>
    </div>
  )
}
