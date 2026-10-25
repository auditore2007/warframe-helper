import { useMemo, useState } from 'react'
import { useArcanes } from '../hooks/useCatalog'
import { matchesQuery, wikiKey } from '../lib/text'
import { pluralRu, rarityRu } from '../lib/i18n'
import { ARCANE_PICKS, ARCANE_TYPE_LABEL } from '../data/arcanes'
import { EmptyState, ErrorState, Loading, Orokin, SearchBox } from '../components/ui'
import { DropList, StatLines, rarityClass, useQueryParam } from '../components/CatalogBits'
import type { ArcaneItem } from '../lib/types'

const PICK_BY_KEY = new Map(ARCANE_PICKS.map((p) => [p.en, p]))

function ArcaneCard({ arcane, note }: { arcane: ArcaneItem; note?: string }) {
  return (
    <article className={`mod ${rarityClass(arcane.rarity)}`}>
      <h3 className="mod__name">{arcane.name}</h3>
      <div className="small muted" style={{ marginBottom: 8 }}>
        {ARCANE_TYPE_LABEL[arcane.type ?? ''] ?? arcane.type}{arcane.rarity ? `, ${rarityRu(arcane.rarity).toLowerCase()}` : ''}
      </div>
      {note && <p className="small gold" style={{ margin: '0 0 6px' }}>{note}</p>}
      <StatLines stats={arcane.stats} />
      <div style={{ marginTop: 10 }}><DropList drops={arcane.drops} limit={3} /></div>
    </article>
  )
}

export function Arcanes() {
  const { data, loading, error, refresh } = useArcanes()
  const [query, setQuery] = useQueryParam()
  const [type, setType] = useState<string | null>(null)

  const picks = useMemo(
    () => (data ?? []).filter((a) => PICK_BY_KEY.has(wikiKey(a.wikiaUrl))),
    [data],
  )
  const list = useMemo(
    () =>
      (data ?? [])
        .filter((a) => !type || a.type === type)
        .filter((a) => matchesQuery(query, a.name, wikiKey(a.wikiaUrl)))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [data, type, query],
  )

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Арканы</h1>
          <p>Арканы для фрейма, оружия и оператора. Ранг поднимается копиями того же аркана.</p>
        </div>
      </div>

      {loading && !data && <Loading rows={3} height={140} />}
      {error && !data && <ErrorState message={error} onRetry={refresh} />}

      {picks.length > 0 && !query && !type && (
        <Orokin className="reveal">
          <h2 style={{ marginBottom: 6 }}>Что брать в первую очередь</h2>
          <p className="muted small">Эти арканы годятся почти для любого билда. Шансы указаны для лучших мест фарма.</p>
          <div className="grid grid--2" style={{ marginTop: 14 }}>
            {picks.map((a) => <ArcaneCard key={a.uniqueName} arcane={a} note={PICK_BY_KEY.get(wikiKey(a.wikiaUrl))?.why} />)}
          </div>
        </Orokin>
      )}

      {data && (
        <section className="section">
          <div className="row" style={{ marginBottom: 16 }}>
            <SearchBox value={query} onChange={setQuery} placeholder="Найти аркан" />
            <div className="chips" role="group" aria-label="Тип аркана">
              <button className="chip" aria-pressed={type === null} onClick={() => setType(null)}>Все</button>
              {Object.entries(ARCANE_TYPE_LABEL).map(([id, label]) => (
                <button key={id} className="chip" aria-pressed={type === id} onClick={() => setType(type === id ? null : id)}>{label}</button>
              ))}
            </div>
          </div>
          {list.length === 0 ? (
            <EmptyState title="Ничего не нашлось">Измени запрос или тип аркана.</EmptyState>
          ) : (
            <>
              <p className="small faint">{list.length} {pluralRu(list.length, 'аркан', 'аркана', 'арканов')}</p>
              <div className="grid grid--2">
                {list.map((a) => <ArcaneCard key={a.uniqueName} arcane={a} note={PICK_BY_KEY.get(wikiKey(a.wikiaUrl))?.why} />)}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
