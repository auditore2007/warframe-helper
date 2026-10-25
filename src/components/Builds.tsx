import { useState } from 'react'
import { useBuildDetail, useBuilds } from '../hooks/useApi'
import { openExternal } from '../lib/api'
import { wikiKey } from '../lib/text'
import type { BuildDetail, BuildSummary } from '../lib/types'
import { Loading } from './ui'
import { Icon } from './Icon'

const STAT_LABEL: Record<keyof BuildDetail['stats'], string> = {
  strength: 'Сила',
  duration: 'Длительность',
  range: 'Радиус',
  efficiency: 'Эффективность',
  health: 'Здоровье',
  shield: 'Щиты',
  armor: 'Броня',
  energy: 'Энергия',
}
const PERCENT_STATS = new Set(['strength', 'duration', 'range', 'efficiency'])

const statText = (key: string, v: number) => (PERCENT_STATS.has(key) ? `${Math.round(v * 100)}%` : String(Math.round(v)))

function Detail({ id }: { id: number }) {
  const { data, loading, error } = useBuildDetail(id)
  if (loading && !data) return <Loading rows={1} height={60} />
  if (error || !data) return <p className="small faint">{error ?? 'Не загрузилось'}</p>
  const stats = Object.entries(data.stats)
  return (
    <div style={{ padding: '4px 0 10px' }}>
      {stats.length > 0 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {stats.map(([k, v]) => <span key={k} className="tag num">{STAT_LABEL[k as keyof BuildDetail['stats']]} {statText(k, v as number)}</span>)}
        </div>
      )}
      <p className="small muted" style={{ margin: '0 0 8px' }}>
        {data.platinum > 0 && <>Моды в сборке стоят около {data.platinum} пл на рынке. </>}
        {data.endo > 0 && <>Эндо на прокачку: {data.endo.toLocaleString('ru-RU')}.</>}
      </p>
      {data.description && <p className="small" style={{ whiteSpace: 'pre-line', maxHeight: 220, overflowY: 'auto', margin: 0 }}>{data.description}</p>}
    </div>
  )
}

function Row({ build }: { build: BuildSummary }) {
  const [open, setOpen] = useState(false)
  return (
    <li style={{ borderBottom: '1px solid var(--line)' }}>
      <div className="row" style={{ padding: '8px 0', gap: 10 }}>
        <button className="btn btn--ghost" style={{ flex: 1, justifyContent: 'flex-start', textAlign: 'left' }} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span>{build.title}</span>
        </button>
        <span className="small num muted" title="Рейтинг на Overframe">★ {build.score}</span>
        <span className="small num muted" title="Сколько форм">{build.formas} ф.</span>
        <button className="btn btn--ghost" onClick={() => openExternal(build.url)} aria-label="Открыть на Overframe" title="Открыть на Overframe"><Icon name="external" size={15} /></button>
      </div>
      {open && <Detail id={build.id} />}
    </li>
  )
}

// топ сборок с overframe. моды там внутренними номерами, поэтому полный билд - по ссылке
export function Builds({ wikiaUrl }: { wikiaUrl?: string }) {
  const name = wikiKey(wikiaUrl) || null
  const { data, loading, error } = useBuilds(name)
  if (!name) return null
  return (
    <section className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <h3>Сборки с Overframe</h3>
        <span className="small faint">на английском</span>
      </div>
      {loading && !data && <Loading rows={3} height={36} />}
      {error && !data && <p className="small faint">{error}</p>}
      {data && data.length === 0 && <p className="small faint">Сборок пока нет.</p>}
      {data && data.length > 0 && (
        <>
          <ul className="clean">{data.map((b) => <Row key={b.id} build={b} />)}</ul>
          <p className="small faint" style={{ marginBottom: 0 }}>Нажми на название, чтобы увидеть статы и описание. Раскладка модов открывается по стрелке.</p>
        </>
      )}
    </section>
  )
}
