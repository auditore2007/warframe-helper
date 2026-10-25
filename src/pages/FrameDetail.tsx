import { Link, useParams } from 'react-router-dom'
import { useFrames } from '../hooks/useCatalog'
import { baseKeyFromWiki, openExternal } from '../lib/api'
import { masteryStatus } from '../lib/mastery'
import { toggleGoal } from '../lib/progress'
import { FRAME_GUIDE_BY_KEY, ROLE_LABEL } from '../data/frames'
import { EmptyState, ErrorState, ItemImage, Loading, Orokin, Tier } from '../components/ui'
import { ItemParts } from '../components/ItemParts'
import { Icon } from '../components/Icon'
import { usePlayer, useProgress } from '../state/AppState'

export function FrameDetail() {
  const { id = '' } = useParams()
  const uniqueName = decodeURIComponent(id)
  const { frames, loading, error, refresh } = useFrames()
  const { progress, update } = useProgress()
  const { profile, xpByUnique } = usePlayer()

  if (loading && frames.length === 0) return <div className="page"><Loading rows={2} height={260} /></div>
  if (error && frames.length === 0) return <div className="page"><ErrorState message={error} onRetry={refresh} /></div>

  const item = frames.find((f) => f.uniqueName === uniqueName)
  if (!item) {
    return (
      <div className="page">
        <EmptyState title="Фрейм не найден" action={<Link to="/frames" className="btn">К списку фреймов</Link>}>
          Возможно, он был переименован в последнем обновлении.
        </EmptyState>
      </div>
    )
  }

  const key = baseKeyFromWiki(item.wikiaUrl) ?? ''
  const guide = FRAME_GUIDE_BY_KEY.get(key)
  const mastery = profile ? masteryStatus(item, xpByUnique) : null
  const isGoal = progress.goals.includes(item.uniqueName)
  const variants = frames.filter((f) => f.uniqueName !== item.uniqueName && baseKeyFromWiki(f.wikiaUrl) === key)

  return (
    <div className="page">
      <Link to="/frames" className="back"><Icon name="back" size={16} />Все варфреймы</Link>
      <header className="detail-hero reveal">
        <div className="detail-hero__img"><ItemImage name={item.name} imageName={item.imageName} /></div>
        <div>
          <div className="row" style={{ gap: 14 }}>
            {guide && <Tier tier={guide.tier} />}
            <h1>{item.name}</h1>
          </div>
          <div className="chips" style={{ marginTop: 12 }}>
            {guide?.roles.map((r) => <span key={r} className="tag tag--gold">{ROLE_LABEL[r]}</span>)}
            {item.isPrime && <span className="tag">Прайм</span>}
            {item.vaulted && <span className="tag tag--kuva" title="Реликвии больше не выпадают - ищи у Варзии или покупай у игроков">В хранилище</span>}
            {guide?.beginner && <span className="tag tag--lotus">Хорош для новичка</span>}
          </div>
          <p className="lede">{guide?.summary ?? item.description}</p>
          <div className="stats">
            {([['Здоровье', item.health], ['Щиты', item.shield], ['Броня', item.armor], ['Энергия', item.power], ['Мастерство', item.masteryReq || undefined]] as const).map(
              ([label, value]) => value !== undefined && (
                <div key={label}><div className="stat__label">{label}</div><div className="stat__value num">{value}</div></div>
              ),
            )}
            {mastery && (
              <div>
                <div className="stat__label">Твой ранг</div>
                <div className="stat__value num" style={{ color: mastery.mastered ? 'var(--gold)' : undefined }}>
                  {mastery.seen ? `${mastery.rank} / ${mastery.maxRank}` : 'не вкачан'}
                </div>
              </div>
            )}
          </div>
          <div className="row" style={{ marginTop: 22 }}>
            <button className={`btn ${isGoal ? '' : 'btn--gold'}`} onClick={() => update((s) => toggleGoal(s, item.uniqueName))}>
              <Icon name={isGoal ? 'check' : 'star'} size={16} />{isGoal ? 'В целях' : 'Добавить в цели'}
            </button>
            {item.wikiaUrl && (
              <button className="btn btn--ghost" onClick={() => openExternal(item.wikiaUrl!)}><Icon name="external" size={15} />Вики</button>
            )}
          </div>
        </div>
      </header>

      <div className="split section">
        <div className="stack" style={{ gap: 20 }}>
          <Orokin>
            <h2 style={{ marginBottom: 6 }}>Где достать</h2>
            {guide?.howToGet && !item.isPrime && <p className="muted">{guide.howToGet}</p>}
            {item.isPrime && <p className="muted">Части выпадают из реликвий Бездны. Открывай их в разломах - список на странице «Мир сейчас».</p>}
            <ItemParts item={item} />
          </Orokin>
          {item.abilities && item.abilities.length > 0 && (
            <section className="panel">
              <h2 style={{ marginBottom: 6 }}>Способности</h2>
              {item.passiveDescription && <p className="small muted">Пассивка: {item.passiveDescription}</p>}
              {item.abilities.map((a) => (
                <div key={a.name} className="ability">
                  <div className="ability__name">{a.name}</div>
                  <div className="small muted">{a.description}</div>
                </div>
              ))}
            </section>
          )}
        </div>
        <div className="stack" style={{ gap: 20 }}>
          {guide && guide.tips.length > 0 && (
            <section className="panel">
              <h3 style={{ marginBottom: 10 }}>Советы по игре</h3>
              <ul className="dots">{guide.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          )}
          {guide?.helminth && (
            <section className="panel">
              <h3 style={{ marginBottom: 8 }}>Гельминт</h3>
              <p className="small" style={{ margin: 0 }}>{guide.helminth}</p>
            </section>
          )}
          {!guide && (
            <section className="panel">
              <h3 style={{ marginBottom: 8 }}>Гайда пока нет</h3>
              <p className="small muted" style={{ margin: 0 }}>Роли и советы для этого фрейма ещё не расписаны. Части и дроп выше - актуальные данные из игры.</p>
            </section>
          )}
          {variants.length > 0 && (
            <section className="panel">
              <h3 style={{ marginBottom: 8 }}>Другие версии</h3>
              <div className="stack" style={{ gap: 8 }}>
                {variants.map((v) => (
                  <Link key={v.uniqueName} to={`/frames/${encodeURIComponent(v.uniqueName)}`} className="list-row">
                    <ItemImage name={v.name} imageName={v.imageName} />
                    <span>{v.name}</span>
                    {v.vaulted ? <span className="tag tag--kuva">В хранилище</span> : <span />}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
