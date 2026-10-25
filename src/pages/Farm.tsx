import { useMemo, useRef, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useDebounced } from '../hooks/useDebounced'
import { TTL } from '../lib/api'
import { dropLocationRu, rarityRu } from '../lib/i18n'
import { RARITY_LABEL, RESOURCES, type ResourceRarity } from '../data/resources'
import { EmptyState, ErrorState, Loading, Orokin, SearchBox } from '../components/ui'
import type { DropSearchHit } from '../lib/types'

const MIN_QUERY = 3
const MAX_ROWS = 60

function DropSearch({ query, onQuery }: { query: string; onQuery: (q: string) => void }) {
  const debounced = useDebounced(query.trim(), 400)
  const path = debounced.length >= MIN_QUERY ? `/drops/search/${encodeURIComponent(debounced)}` : null
  const { data, loading, error, refresh } = useApi<DropSearchHit[]>(path, TTL.drops)

  const rows = useMemo(() => {
    const seen = new Set<string>()
    return (data ?? [])
      .slice()
      .sort((a, b) => b.chance - a.chance)
      .filter((d) => {
        const key = `${d.place}|${d.item}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, MAX_ROWS)
  }, [data])

  return (
    <Orokin>
      <h2 style={{ marginBottom: 6 }}>Поиск по таблице дропа</h2>
      <p className="muted small">Официальные шансы выпадения для любого предмета, мода или реликвии. Пиши название на английском, как в игре с английской локализацией.</p>
      <div className="row" style={{ marginBottom: 16 }}>
        <SearchBox value={query} onChange={onQuery} placeholder="Например: Orokin Cell, Lith A1, Condition Overload" />
      </div>
      {!path && <p className="small faint">Введи хотя бы {MIN_QUERY} символа.</p>}
      {path && loading && <Loading rows={4} height={36} />}
      {path && error && <ErrorState message={error} onRetry={refresh} />}
      {path && !loading && !error && rows.length === 0 && (
        <EmptyState title="Ничего не выпадает">Проверь написание: таблица дропа хранит английские названия.</EmptyState>
      )}
      {rows.length > 0 && (
        <table className="table">
          <thead><tr><th>Где</th><th>Что</th><th>Редкость</th><th className="right">Шанс</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.place}|${r.item}`}>
                <td>{dropLocationRu(r.place)}</td>
                <td className="muted">{r.item}</td>
                <td className="muted small">{rarityRu(r.rarity)}</td>
                <td className="right num">{r.chance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Orokin>
  )
}

export function Farm() {
  const [query, setQuery] = useState('')
  const [rarity, setRarity] = useState<ResourceRarity | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const resources = RESOURCES.filter((r) => !rarity || r.rarity === rarity)

  const lookUp = (en: string) => {
    setQuery(en)
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Фарм и дроп</h1>
          <p>Где брать ресурсы и как быстрее. Нажми на ресурс, чтобы увидеть шансы.</p>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Редкость ресурса" style={{ marginBottom: 14 }}>
        <button className="chip" aria-pressed={rarity === null} onClick={() => setRarity(null)}>Все</button>
        {(Object.keys(RARITY_LABEL) as ResourceRarity[]).map((r) => (
          <button key={r} className="chip" aria-pressed={rarity === r} onClick={() => setRarity(r)}>{RARITY_LABEL[r]}</button>
        ))}
      </div>

      <div className="panel" style={{ padding: '8px 22px' }}>
        <table className="table">
          <thead><tr><th style={{ width: '20%' }}>Ресурс</th><th style={{ width: '24%' }}>Где встречается</th><th>Лучшее место</th><th /></tr></thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id}>
                <td>
                  <div style={{ color: r.rarity === 'rare' ? 'var(--gold-pale)' : undefined }}>{r.name}</div>
                  <div className="small faint">{r.en}</div>
                </td>
                <td className="muted small">{r.where}</td>
                <td>
                  <div className="small">{r.best}</div>
                  {r.tips && <div className="small faint" style={{ marginTop: 4 }}>{r.tips}</div>}
                </td>
                <td className="right"><button className="btn btn--ghost small" onClick={() => lookUp(r.en)}>Шансы</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section" ref={searchRef}>
        <DropSearch query={query} onQuery={setQuery} />
      </div>
    </div>
  )
}
