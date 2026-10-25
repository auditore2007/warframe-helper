import { Link } from 'react-router-dom'
import { usePlayer } from '../state/AppState'
import { useNow } from '../hooks/useNow'
import { dailyCap, daysToRank, rankProgress } from '../lib/syndicates'
import { formatRelative } from '../lib/time'
import { pluralRu } from '../lib/i18n'
import { SYNDICATES, SYNDICATE_GROUP_LABEL, type SyndicateGroup, type SyndicateInfo } from '../data/syndicates'
import type { SyndicateStanding } from '../lib/types'
import { Orokin } from '../components/ui'

const GROUPS: SyndicateGroup[] = ['faction', 'open', 'other']
const fmt = (n: number) => n.toLocaleString('ru-RU')

interface CardProps {
  info: SyndicateInfo
  standing: SyndicateStanding | undefined
  todayLeft: number | undefined
  cap: number
}

function Progress({ info, standing, cap }: { info: SyndicateInfo; standing: SyndicateStanding; cap: number }) {
  if (info.maxRank === 0) return <p className="small muted">Репутация: <span className="num">{fmt(standing.standing)}</span></p>
  if (standing.rank < 0) {
    return <p className="small" style={{ color: 'var(--kuva)' }}>Ранг {standing.rank}: синдикат враждебен. Репутацию с ним поднимают сигилы его союзников: они дают половину своей репутации союзникам.</p>
  }
  const p = rankProgress(standing.standing, standing.rank, info.maxRank)
  const days = daysToRank(standing.standing, standing.rank, info.maxRank, cap)
  return (
    <>
      <div className="row small" style={{ justifyContent: 'space-between' }}>
        <span>Ранг <span className="num">{standing.rank}</span> из {info.maxRank}</span>
        <span className="num muted">{fmt(p.inRank)} / {fmt(p.width)}</span>
      </div>
      <div className="bar" style={{ margin: '6px 0' }}><i style={{ width: `${(p.inRank / p.width) * 100}%` }} /></div>
      <p className="small muted" style={{ margin: 0 }}>
        {p.toNext === null
          ? 'Максимальный ранг - копи репутацию на покупки.'
          : p.toNext === 0
            ? 'Шкала заполнена - повысь ранг у представителя синдиката.'
            : `До следующего ранга ${fmt(p.toNext)}. До максимального - примерно ${days} ${pluralRu(days ?? 0, 'день', 'дня', 'дней')} при полном дневном лимите.`}
      </p>
    </>
  )
}

function SyndicateCard({ info, standing, todayLeft, cap }: CardProps) {
  return (
    <article className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h3>{info.name}</h3>
        {todayLeft !== undefined && <span className="small num muted" title="Сколько репутации ещё можно получить сегодня">сегодня ещё {fmt(todayLeft)}</span>}
      </div>
      {standing ? <Progress info={info} standing={standing} cap={cap} /> : <p className="small faint">Ещё не начат</p>}
      <div className="meta-label" style={{ marginTop: 12 }}>Как качать</div>
      <p className="small" style={{ margin: 0 }}>{info.howToEarn}</p>
      {info.buys.length > 0 && (
        <>
          <div className="meta-label" style={{ marginTop: 12 }}>Что стоит купить</div>
          <ul className="dots small" style={{ margin: 0 }}>{info.buys.map((b) => <li key={b}>{b}</li>)}</ul>
        </>
      )}
    </article>
  )
}

export function Syndicates() {
  const { profile, fetchedAt } = usePlayer()
  const now = useNow(60_000)
  const byTag = new Map((profile?.syndicates ?? []).map((s) => [s.tag, s]))
  const cap = dailyCap(profile?.masteryRank ?? null)
  const linked = Boolean(profile?.syndicates)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Синдикаты</h1>
          <p>Ранги, репутация до следующего ранга, дневной лимит и что покупать. Берётся из твоего профиля.</p>
        </div>
      </div>
      <Orokin small>
        {linked ? (
          <p style={{ margin: 0 }}>
            Дневной лимит репутации: <span className="num gold">{fmt(cap)}</span> на каждый синдикат (16 000 + 500 × ранг мастерства).
            Шесть фракционных синдикатов делят один лимит. <span className="faint small">Профиль обновлён {formatRelative(fetchedAt ?? undefined, now)}.</span>
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Привяжи аккаунт в <Link to="/tracker">Трекере</Link> - здесь появятся твои ранги и остаток дневного лимита. Пока показываю, как качать и что покупать.
          </p>
        )}
      </Orokin>
      {GROUPS.map((group) => (
        <section key={group} className="section">
          <h2 style={{ marginBottom: 12 }}>{SYNDICATE_GROUP_LABEL[group]}</h2>
          <div className="grid grid--2">
            {SYNDICATES.filter((s) => s.group === group).map((info) => (
              <SyndicateCard key={info.tag} info={info} standing={byTag.get(info.tag)} todayLeft={linked ? profile?.dailyStanding?.[info.dailyKey] : undefined} cap={cap} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
