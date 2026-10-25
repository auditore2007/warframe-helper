import { useMemo, useState } from 'react'
import { useMods } from '../hooks/useCatalog'
import { matchesQuery, wikiKey } from '../lib/text'
import { pluralRu } from '../lib/i18n'
import { toggleMod } from '../lib/progress'
import { MOD_PICKS, MOD_TYPE_LABEL, POLARITY_LABEL, type ModStage } from '../data/mods'
import { EmptyState, ErrorState, Loading, SearchBox } from '../components/ui'
import { DropList, PAGE_SIZE, ShowMore, StatLines, rarityClass, useQueryParam } from '../components/CatalogBits'
import { useProgress } from '../state/AppState'
import type { ModItem } from '../lib/types'

type View = 'all' | ModStage | 'owned'
const PICK_BY_KEY = new Map(MOD_PICKS.map((p) => [p.en, p]))
const VIEWS: { id: View; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'start', label: 'Обязательные для старта' },
  { id: 'endgame', label: 'Для эндгейма' },
  { id: 'owned', label: 'Мои' },
]

function ModRow({ mod, owned, onToggle, note }: { mod: ModItem; owned: boolean; onToggle: () => void; note?: string }) {
  return (
    <article className={`mod ${rarityClass(mod.rarity)}`}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 className="mod__name">{mod.name}</h3>
          <div className="small muted">
            {MOD_TYPE_LABEL[mod.type] ?? mod.type}
            {mod.compatName && mod.compatName !== 'ANY' ? `, ${mod.compatName.toLowerCase()}` : ''}
          </div>
        </div>
        <label className="check" style={{ border: 0, padding: 0 }} title="Отметить, что мод у тебя есть">
          <input type="checkbox" checked={owned} onChange={onToggle} aria-label={`${mod.name}: есть у меня`} />
        </label>
      </div>
      <div className="chips" style={{ margin: '8px 0' }}>
        {mod.polarity && <span className="tag">{POLARITY_LABEL[mod.polarity] ?? mod.polarity}</span>}
        {mod.baseDrain !== undefined && <span className="tag num">Стоимость {mod.baseDrain + (mod.fusionLimit ?? 0)}</span>}
        {mod.fusionLimit !== undefined && <span className="tag num">Ранг {mod.fusionLimit}</span>}
        {mod.isPrime && <span className="tag tag--gold">Primed</span>}
      </div>
      {note && <p className="small gold" style={{ margin: '0 0 6px' }}>{note}</p>}
      <StatLines stats={mod.stats} />
      <div style={{ marginTop: 10 }}><DropList drops={mod.drops} limit={2} /></div>
    </article>
  )
}

export function Mods() {
  const { data, loading, error, refresh } = useMods()
  const { progress, update } = useProgress()
  const [query, setQuery] = useQueryParam()
  const [type, setType] = useState<string | null>(null)
  const [view, setView] = useState<View>('all')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const list = useMemo(() => {
    const mods = data ?? []
    return mods
      .filter((m) => !type || m.type === type)
      .filter((m) => matchesQuery(query, m.name, wikiKey(m.wikiaUrl)))
      .filter((m) => {
        if (view === 'owned') return progress.mods[m.uniqueName]
        if (view === 'all') return true
        return PICK_BY_KEY.get(wikiKey(m.wikiaUrl))?.stage === view
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [data, type, query, view, progress.mods])

  const ownedCount = Object.keys(progress.mods).length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Моды</h1>
          <p>Моды с эффектом на макс. ранге и где они падают. Отмечай, что уже есть.</p>
        </div>
        {ownedCount > 0 && <span className="small muted num">У тебя {ownedCount} {pluralRu(ownedCount, 'мод', 'мода', 'модов')}</span>}
      </div>

      <div className="stack" style={{ gap: 14, marginBottom: 22 }}>
        <div className="row">
          <SearchBox value={query} onChange={(v) => { setQuery(v); setLimit(PAGE_SIZE) }} placeholder="Найти мод по-русски или по-английски" />
          <div className="chips" role="group" aria-label="Подборка">
            {VIEWS.map((v) => (
              <button key={v.id} className="chip" aria-pressed={view === v.id} onClick={() => { setView(v.id); setLimit(PAGE_SIZE) }}>{v.label}</button>
            ))}
          </div>
        </div>
        <div className="chips" role="group" aria-label="Тип мода">
          <button className="chip" aria-pressed={type === null} onClick={() => setType(null)}>Любой тип</button>
          {Object.entries(MOD_TYPE_LABEL).map(([id, label]) => (
            <button key={id} className="chip" aria-pressed={type === id} onClick={() => { setType(type === id ? null : id); setLimit(PAGE_SIZE) }}>{label}</button>
          ))}
        </div>
      </div>

      {loading && !data && <><p className="small muted">Первая загрузка каталога занимает до минуты, дальше он хранится на диске.</p><Loading rows={4} height={120} /></>}
      {error && !data && <ErrorState message={error} onRetry={refresh} />}
      {data && list.length === 0 && (
        <EmptyState title={view === 'owned' ? 'Отмеченных модов нет' : 'Ничего не нашлось'}>
          {view === 'owned' ? 'Отмечай моды галочкой справа от названия.' : 'Измени запрос или сбрось тип мода.'}
        </EmptyState>
      )}
      {list.length > 0 && (
        <>
          <p className="small faint">{list.length} {pluralRu(list.length, 'мод', 'мода', 'модов')}</p>
          <div className="grid grid--2">
            {list.slice(0, limit).map((m) => (
              <ModRow
                key={m.uniqueName}
                mod={m}
                owned={Boolean(progress.mods[m.uniqueName])}
                onToggle={() => update((s) => toggleMod(s, m.uniqueName))}
                note={PICK_BY_KEY.get(wikiKey(m.wikiaUrl))?.why}
              />
            ))}
          </div>
          <ShowMore shown={limit} total={list.length} onMore={() => setLimit((l) => l + PAGE_SIZE * 2)} />
        </>
      )}
    </div>
  )
}
