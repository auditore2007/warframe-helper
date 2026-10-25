import { useMemo, useState } from 'react'
import { useRivenAttributes, useRivenAuctions, useRivenWeapons } from '../hooks/useApi'
import { openExternal } from '../lib/api'
import { matchesQuery } from '../lib/text'
import type { RivenAttribute, RivenAuction, RivenQuery } from '../lib/types'
import { EmptyState, ErrorState, Loading, Orokin, SearchBox } from '../components/ui'
import { Icon } from '../components/Icon'

const MAX_POSITIVE = 3
const MAX_WEAPONS = 10
const SHOWN = 25
const STATUS_LABEL: Record<string, string> = { ingame: 'в игре', online: 'онлайн', offline: 'офлайн' }

function median(values: number[]): number | null {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

// проценты с плюсом, множители (урон по фракциям) как x0.97
function formatStat(value: number, positive: boolean, unit: string | null | undefined): string {
  if (unit === 'multiply') return `x${value}`
  return `${positive && value > 0 ? '+' : ''}${value}${unit === 'percent' ? '%' : unit === 'seconds' ? ' с' : ''}`
}

const attrName = (a: RivenAttribute | undefined, slug: string) => a?.ru ?? a?.en ?? slug

function Lot({ lot, attrs, weaponName }: { lot: RivenAuction; attrs: Map<string, RivenAttribute>; weaponName: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`/w ${lot.seller} Hi! I want to buy your ${weaponName} ${lot.name} riven for ${lot.price} platinum. (warframe.market)`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <tr>
      <td className="num gold">{lot.price} пл</td>
      <td className="small">
        {lot.attributes.map((a) => (
          <div key={a.slug} style={{ color: a.positive ? undefined : 'var(--kuva)' }}>
            {formatStat(a.value, a.positive, attrs.get(a.slug)?.unit)} {attrName(attrs.get(a.slug), a.slug)}
          </div>
        ))}
      </td>
      <td className="small muted">MR {lot.mastery}<br />перекатов {lot.rerolls}</td>
      <td className="small">{lot.seller}<br /><span className={lot.status === 'ingame' ? 'gold' : 'faint'}>{STATUS_LABEL[lot.status] ?? lot.status}</span></td>
      <td className="right">
        <button className="btn btn--ghost small" onClick={copy} title="Скопировать сообщение продавцу">{copied ? 'Готово' : 'Написать'}</button>
        <button className="btn btn--ghost" onClick={() => openExternal(`https://warframe.market/auction/${lot.id}`)} aria-label="Открыть лот"><Icon name="external" size={14} /></button>
      </td>
    </tr>
  )
}

export function Rivens() {
  const weapons = useRivenWeapons()
  const attributes = useRivenAttributes()
  const [search, setSearch] = useState('')
  const [weapon, setWeapon] = useState<string | null>(null)
  const [positive, setPositive] = useState<string[]>([])
  const [negative, setNegative] = useState<string | null>(null)

  const weaponInfo = weapons.data?.find((w) => w.slug === weapon)
  const found = useMemo(() => {
    const q = search.trim()
    if (q.length < 2 || !weapons.data) return []
    return weapons.data.filter((w) => matchesQuery(q, w.ru, w.en)).slice(0, MAX_WEAPONS)
  }, [weapons.data, search])
  const attrs = useMemo(() => new Map((attributes.data ?? []).map((a) => [a.slug, a])), [attributes.data])
  const fits = (a: RivenAttribute) => !a.exclusiveTo || !weaponInfo?.type || a.exclusiveTo.includes(weaponInfo.type)
  const positives = (attributes.data ?? []).filter((a) => fits(a) && !a.negativeOnly)
  const negatives = (attributes.data ?? []).filter((a) => fits(a) && !a.positiveOnly)

  const query: RivenQuery | null = weapon ? { weapon, positive, negative } : null
  const lots = useRivenAuctions(query)
  const online = (lots.data ?? []).filter((l) => l.status !== 'offline')
  const togglePositive = (slug: string) =>
    setPositive((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : list.length >= MAX_POSITIVE ? list : [...list, slug]))

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Цены ривенов</h1>
          <p>Выбери оружие и нужные статы, увидишь лоты с warframe.market и примерную цену.</p>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 14, position: 'relative' }}>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setWeapon(null) }} placeholder="Оружие, например Сома или Rubico" />
        {weaponInfo && <span className="tag tag--gold">{weaponInfo.ru ?? weaponInfo.en}{weaponInfo.disposition ? ` · склонность ${weaponInfo.disposition}` : ''}</span>}
      </div>
      {!weapon && found.length > 0 && (
        <div className="chips" style={{ marginBottom: 16 }}>
          {found.map((w) => <button key={w.slug} className="chip" onClick={() => { setWeapon(w.slug); setSearch(w.ru ?? w.en); setPositive([]); setNegative(null) }}>{w.ru ?? w.en}</button>)}
        </div>
      )}
      {weapons.error && !weapons.data && <ErrorState message={weapons.error} onRetry={weapons.refresh} />}
      {!weapon && <EmptyState title="Оружие не выбрано">Начни вводить название.</EmptyState>}
      {weapon && (
        <>
          <section className="panel" style={{ marginBottom: 16 }}>
            <div className="meta-label">Плюсы (до {MAX_POSITIVE})</div>
            <div className="chips" style={{ marginBottom: 10 }}>
              {positives.map((a) => <button key={a.slug} className="chip" aria-pressed={positive.includes(a.slug)} onClick={() => togglePositive(a.slug)}>{attrName(a, a.slug)}</button>)}
            </div>
            <div className="meta-label">Минус</div>
            <div className="chips">
              <button className="chip" aria-pressed={negative === null} onClick={() => setNegative(null)}>Любой</button>
              {negatives.map((a) => <button key={a.slug} className="chip" aria-pressed={negative === a.slug} onClick={() => setNegative(negative === a.slug ? null : a.slug)}>{attrName(a, a.slug)}</button>)}
            </div>
          </section>
          {lots.loading && !lots.data && <Loading rows={4} height={48} />}
          {lots.error && !lots.data && <ErrorState message={lots.error} onRetry={lots.refresh} />}
          {lots.data && lots.data.length === 0 && <EmptyState title="Таких ривенов сейчас не продают">Убери часть статов.</EmptyState>}
          {lots.data && lots.data.length > 0 && (
            <>
              <Orokin small>
                <div className="row" style={{ gap: 28 }}>
                  <div><div className="meta-label">Дешевле всех</div><div className="num gold" style={{ fontSize: 24 }}>{lots.data[0].price} пл</div></div>
                  <div><div className="meta-label">Медиана</div><div className="num" style={{ fontSize: 24 }}>{median(lots.data.map((l) => l.price))} пл</div></div>
                  <div><div className="meta-label">Медиана у тех, кто онлайн</div><div className="num" style={{ fontSize: 24 }}>{median(online.map((l) => l.price)) ?? '-'} {online.length ? 'пл' : ''}</div></div>
                  <div><div className="meta-label">Лотов</div><div className="num" style={{ fontSize: 24 }}>{lots.data.length}</div></div>
                </div>
              </Orokin>
              <div className="panel section" style={{ padding: '8px 22px' }}>
                <table className="table">
                  <thead><tr><th>Цена</th><th>Статы</th><th>Мод</th><th>Продавец</th><th /></tr></thead>
                  <tbody>{lots.data.slice(0, SHOWN).map((l) => <Lot key={l.id} lot={l} attrs={attrs} weaponName={weaponInfo?.en ?? weapon} />)}</tbody>
                </table>
              </div>
              <p className="small faint">Только лоты с ценой выкупа. Цены ривенов сильно скачут, смотри на тех, кто сейчас в игре.</p>
            </>
          )}
        </>
      )}
    </div>
  )
}
