import { Link, useParams } from 'react-router-dom'
import { GUIDES, GUIDE_BY_ID, GUIDE_CATEGORY_LABEL, type GuideCategory, type GuideSection } from '../data/guides'
import { EmptyState } from '../components/ui'
import { Icon } from '../components/Icon'

export function Guides() {
  const categories = Object.keys(GUIDE_CATEGORY_LABEL) as GuideCategory[]
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Гайды</h1>
          <p>Короткие гайды по главным темам игры.</p>
        </div>
      </div>
      {categories.map((cat) => (
        <section key={cat} className="section" style={{ marginTop: 28 }}>
          <h2 style={{ marginBottom: 14 }}>{GUIDE_CATEGORY_LABEL[cat]}</h2>
          <div className="grid grid--3">
            {GUIDES.filter((g) => g.category === cat).map((g) => (
              <Link key={g.id} to={`/guides/${g.id}`} className="guide-card">
                <h3>{g.title}</h3>
                <p>{g.summary}</p>
                <p className="small faint" style={{ marginTop: 10 }}>{g.minutes} мин чтения</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Section({ section }: { section: GuideSection }) {
  return (
    <section>
      <h2>{section.heading}</h2>
      {section.body?.map((p) => <p key={p}>{p}</p>)}
      {section.steps && <ol>{section.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
      {section.list && <ul className="dots">{section.list.map((s) => <li key={s}>{s}</li>)}</ul>}
      {section.table && (
        <div className="panel" style={{ padding: '8px 20px', marginTop: 8 }}>
          <table className="table">
            <thead><tr>{section.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row.join('|')}>{row.map((cell, i) => <td key={i} className={i === 0 ? '' : 'muted'}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.note && <div className="callout">{section.note}</div>}
    </section>
  )
}

export function GuideView() {
  const { id = '' } = useParams()
  const guide = GUIDE_BY_ID.get(id)
  if (!guide) {
    return <div className="page"><EmptyState title="Гайд не найден" action={<Link to="/guides" className="btn">Ко всем гайдам</Link>} /></div>
  }
  const index = GUIDES.indexOf(guide)
  const next = GUIDES[index + 1]
  return (
    <div className="page">
      <Link to="/guides" className="back"><Icon name="back" size={16} />Все гайды</Link>
      <article className="article reveal">
        <span className="tag tag--gold">{GUIDE_CATEGORY_LABEL[guide.category]}</span>
        <h1 style={{ marginTop: 14 }}>{guide.title}</h1>
        <p className="lede">{guide.summary}</p>
        {guide.sections.map((s) => <Section key={s.heading} section={s} />)}
        {next && (
          <Link to={`/guides/${next.id}`} className="guide-card" style={{ marginTop: 48 }}>
            <span className="small faint">Следующий гайд</span>
            <h3 style={{ marginTop: 4 }}>{next.title}</h3>
          </Link>
        )}
      </article>
    </div>
  )
}
