import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFrames, useWeapons } from '../hooks/useCatalog'
import { useNow } from '../hooks/useNow'
import { masteryStatus } from '../lib/mastery'
import { countOwnedParts, setAccount, toggleGoal, type Platform } from '../lib/progress'
import { formatRelative } from '../lib/time'
import { pluralRu } from '../lib/i18n'
import { EmptyState, ItemImage, Orokin } from '../components/ui'
import { Icon } from '../components/Icon'
import { usePlayer, useProgress } from '../state/AppState'
import type { Item } from '../lib/types'
import { isResourceComponent } from '../lib/parts'

const ACCOUNT_ID_RE = /^[0-9a-f]{24}$/
const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'pc', label: 'ПК' },
  { id: 'ps4', label: 'PlayStation' },
  { id: 'xb1', label: 'Xbox' },
  { id: 'swi', label: 'Switch' },
]

function AccountPanel() {
  const { progress, update } = useProgress()
  const { detect, refresh, status, error, fetchedAt, stale, profile } = usePlayer()
  const now = useNow(30_000)
  const [manualId, setManualId] = useState('')
  const [platform, setPlatform] = useState<Platform>('pc')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const runDetect = async () => {
    setBusy(true)
    setMessage(null)
    const res = await detect()
    setBusy(false)
    if (!res.ok) setMessage(res.error ?? 'Аккаунт не найден')
  }

  const saveManual = () => {
    const id = manualId.trim().toLowerCase()
    if (!ACCOUNT_ID_RE.test(id)) {
      setMessage('ID аккаунта - это 24 символа из цифр и букв a–f.')
      return
    }
    setMessage(null)
    update((s) => setAccount(s, { accountId: id, platform, displayName: null }))
  }

  if (progress.account) {
    return (
      <Orokin>
        <div className="row" style={{ gap: 18, alignItems: 'center' }}>
          <span className="mr-badge"><span>{profile?.masteryRank ?? '–'}</span></span>
          <div>
            <h2>{profile?.displayName ?? progress.account.displayName ?? 'Тэнно'}</h2>
            <div className="small muted">
              {status === 'loading' && 'Синхронизация профиля…'}
              {status === 'ready' && `Профиль обновлён ${formatRelative(fetchedAt ?? undefined, now)}${stale ? ', офлайн-копия' : ''}`}
              {status === 'error' && error}
            </div>
          </div>
          <span className="spacer" />
          <button className="btn" onClick={refresh} disabled={status === 'loading'}><Icon name="refresh" size={16} />Обновить</button>
          <button className="btn btn--ghost" onClick={() => update((s) => setAccount(s, null))}>Отвязать</button>
        </div>
        <p className="small faint" style={{ margin: '14px 0 0' }}>
          Ранг мастерства и вкачанные предметы берутся из публичного профиля Warframe. Собранные части отмечай вручную - игра не открывает инвентарь сторонним программам.
        </p>
      </Orokin>
    )
  }

  return (
    <Orokin>
      <h2 style={{ marginBottom: 8 }}>Привяжи аккаунт</h2>
      <p className="muted">Если на этом компьютере есть Warframe, приложение найдёт твой аккаунт в логе игры. Пароль и данные входа не нужны.</p>
      <button className="btn btn--gold" onClick={runDetect} disabled={busy}><Icon name="search" size={16} />{busy ? 'Ищу…' : 'Найти автоматически'}</button>
      <div style={{ marginTop: 22 }}>
        <div className="meta-label">Или введи ID аккаунта вручную</div>
        <div className="row">
          <input className="input" style={{ maxWidth: 320 }} value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="24 символа, например 5e83…" aria-label="ID аккаунта" />
          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} aria-label="Платформа">
            {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button className="btn" onClick={saveManual}>Привязать</button>
        </div>
      </div>
      {message && <p className="small" role="alert" style={{ color: '#e98a82', marginTop: 12 }}>{message}</p>}
    </Orokin>
  )
}

function MasterySummary({ frames, weapons }: { frames: Item[]; weapons: Item[] }) {
  const { profile, xpByUnique } = usePlayer()
  if (!profile) return null
  const count = (items: Item[]) => items.filter((i) => masteryStatus(i, xpByUnique).mastered).length
  const rows = [
    { label: 'Варфреймы', done: count(frames), total: frames.length },
    { label: 'Оружие', done: count(weapons), total: weapons.length },
  ]
  return (
    <div className="grid grid--2">
      {rows.map((r) => (
        <div key={r.label} className="panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{r.label}</h3>
            <span className="num">{r.done} <span className="muted">из {r.total}</span></span>
          </div>
          <div className="bar" style={{ marginTop: 12 }}><i style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }} /></div>
          <p className="small faint" style={{ margin: '8px 0 0' }}>Вкачано до максимального ранга</p>
        </div>
      ))}
    </div>
  )
}

function Goals({ catalog }: { catalog: Map<string, Item> }) {
  const { progress, update } = useProgress()
  if (progress.goals.length === 0) {
    return (
      <EmptyState title="Целей пока нет" action={<Link to="/frames" className="btn">Выбрать фрейм</Link>}>
        Открой любой фрейм или оружие и нажми «Добавить в цели» - здесь появится, что ещё осталось собрать.
      </EmptyState>
    )
  }
  return (
    <div className="stack" style={{ gap: 8 }}>
      {progress.goals.map((id) => {
        const item = catalog.get(id)
        if (!item) return null
        const parts = (item.components ?? []).filter((c) => !isResourceComponent(c)).map((c) => c.name)
        const owned = countOwnedParts(progress, id, parts)
        const route = item.category === 'Warframes' ? 'frames' : 'weapons'
        return (
          <div key={id} className="list-row" style={{ gridTemplateColumns: '56px 1fr 180px auto' }}>
            <ItemImage name={item.name} imageName={item.imageName} />
            <Link to={`/${route}/${encodeURIComponent(id)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              <span style={{ display: 'block' }}>{item.name}</span>
              <span className="small muted">{owned === parts.length && parts.length > 0 ? 'Всё собрано - можно строить' : `Осталось ${parts.length - owned} ${pluralRu(parts.length - owned, 'часть', 'части', 'частей')}`}</span>
            </Link>
            <div className="bar"><i style={{ width: `${parts.length ? (owned / parts.length) * 100 : 0}%` }} /></div>
            <button className="btn btn--ghost" onClick={() => update((s) => toggleGoal(s, id))} aria-label={`Убрать ${item.name} из целей`}>Убрать</button>
          </div>
        )
      })}
    </div>
  )
}

function Unmastered({ frames }: { frames: Item[] }) {
  const { profile, xpByUnique } = usePlayer()
  const missing = useMemo(() => frames.filter((f) => !masteryStatus(f, xpByUnique).seen), [frames, xpByUnique])
  if (!profile || missing.length === 0) return null
  return (
    <section className="section">
      <div className="section-head">
        <h2>Фреймы, которых у тебя ещё не было</h2>
        <span className="hint">{missing.length} {pluralRu(missing.length, 'фрейм', 'фрейма', 'фреймов')} - каждый даст мастерство</span>
      </div>
      <div className="grid grid--auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {missing.map((f) => (
          <Link key={f.uniqueName} to={`/frames/${encodeURIComponent(f.uniqueName)}`} className="item-card">
            <div className="item-card__img"><ItemImage name={f.name} imageName={f.imageName} /></div>
            <div className="item-card__body"><div className="item-card__name" style={{ fontSize: 16 }}>{f.name}</div></div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function Tracker() {
  const { frames } = useFrames()
  const { weapons } = useWeapons()
  const catalog = useMemo(() => new Map([...frames, ...weapons].map((i) => [i.uniqueName, i])), [frames, weapons])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Трекер</h1>
          <p>Мастерство берётся из профиля, цели и части хранятся у тебя на компьютере.</p>
        </div>
      </div>
      <AccountPanel />
      <div className="section"><MasterySummary frames={frames} weapons={weapons} /></div>
      <section className="section">
        <h2 style={{ marginBottom: 14 }}>Мои цели</h2>
        <Goals catalog={catalog} />
      </section>
      <Unmastered frames={frames} />
    </div>
  )
}
