import { useMemo } from 'react'
import { PLANETS, PLANET_BY_ID, type PlanetGuide } from '../data/starchart'
import { useProgress } from '../state/AppState'
import { togglePlanet } from '../lib/progress'
import { Orokin } from '../components/ui'

// обходим граф переходов от Земли
function routeOrder(): PlanetGuide[] {
  const ordered: PlanetGuide[] = []
  const visit = (id: string) => {
    const planet = PLANET_BY_ID.get(id)
    if (!planet || ordered.includes(planet)) return
    ordered.push(planet)
    planet.leadsTo.forEach(visit)
  }
  visit('earth')
  return ordered
}

function PlanetCard({ planet, index, done, onToggle }: { planet: PlanetGuide; index: number | null; done: boolean; onToggle: () => void }) {
  const parents = PLANETS.filter((p) => p.leadsTo.includes(planet.id)).map((p) => p.name)
  return (
    <div className={`planet ${done ? 'planet--done' : ''}`}>
      <div className="planet__rail">
        <button className="planet__node" onClick={onToggle} aria-pressed={done} aria-label={`${planet.name}: ${done ? 'пройдена' : 'отметить пройденной'}`}>
          <span>{index ?? '◇'}</span>
        </button>
      </div>
      <article className="planet__card">
        <div className="planet__title">
          <h3>{planet.name}</h3>
          <span className="small muted">уровни {planet.levels}</span>
          <span className="tag">{planet.faction}</span>
          {done && <span className="tag tag--gold">Пройдена</span>}
        </div>
        {(parents.length > 0 || planet.unlock) && (
          <div className="small faint" style={{ marginTop: 4 }}>
            {planet.unlock ? `Открывается: ${planet.unlock}` : `Переход с: ${parents.join(', ')}`}
          </div>
        )}
        <div className="planet__meta">
          <div>
            <div className="meta-label">Босс</div>
            <div>{planet.boss ?? '-'}</div>
            {planet.bossDrop && <div className="small" style={{ color: 'var(--gold-pale)' }}>даёт {planet.bossDrop}</div>}
          </div>
          <div>
            <div className="meta-label">Ресурсы</div>
            <div className="small">{planet.resources.join(', ')}</div>
          </div>
          <div>
            <div className="meta-label">Что здесь важно</div>
            <ul className="dots small">{planet.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          </div>
        </div>
        {planet.tip && <div className="callout">{planet.tip}</div>}
      </article>
    </div>
  )
}

export function StarChart() {
  const { progress, update } = useProgress()
  const route = useMemo(routeOrder, [])
  const quests = PLANETS.filter((p) => p.questArea)
  const done = PLANETS.filter((p) => progress.planets[p.id]).length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Звёздная карта</h1>
          <p>Планеты по порядку. Следующая открывается через переход (Junction). Пройденные можно отмечать.</p>
        </div>
      </div>

      <Orokin small className="reveal">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3>Пройдено {done} из {PLANETS.length}</h3>
            <p className="small muted" style={{ margin: '4px 0 0' }}>Все узлы, включая Луну и Крепость Кувы, открывают Стальной путь.</p>
          </div>
        </div>
        <div className="bar" style={{ marginTop: 14 }}><i style={{ width: `${(done / PLANETS.length) * 100}%` }} /></div>
      </Orokin>

      <section className="section">
        <h2 style={{ marginBottom: 18 }}>Основной маршрут</h2>
        <div className="route">
          {route.map((p, i) => (
            <PlanetCard key={p.id} planet={p} index={i + 1} done={Boolean(progress.planets[p.id])} onToggle={() => update((s) => togglePlanet(s, p.id))} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2 style={{ marginBottom: 6 }}>Сюжетные зоны</h2>
        <p className="muted">Открываются квестами, а не переходами. Проходи их, когда дойдёшь до нужного квеста.</p>
        <div className="route">
          {quests.map((p) => (
            <PlanetCard key={p.id} planet={p} index={null} done={Boolean(progress.planets[p.id])} onToggle={() => update((s) => togglePlanet(s, p.id))} />
          ))}
        </div>
      </section>
    </div>
  )
}
