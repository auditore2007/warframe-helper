import { useMemo, useState } from 'react'
import { useFrames, useWeapons } from '../hooks/useCatalog'
import { useNow } from '../hooks/useNow'
import { useProgress } from '../state/AppState'
import { addTimer, parseDuration, removeTimer } from '../lib/foundry'
import { formatCountdown } from '../lib/time'
import { FOUNDRY_PRESETS } from '../data/foundry'
import { EmptyState, Orokin } from '../components/ui'
import { Icon } from '../components/Icon'

const SECONDS_PER_HOUR = 3600

// имя -> время крафта в часах
function useBuildTimes(): Map<string, number> {
  const { frames } = useFrames()
  const { weapons } = useWeapons()
  return useMemo(() => {
    const map = new Map<string, number>()
    for (const item of [...frames, ...weapons]) {
      if (item.buildTime) map.set(item.name, item.buildTime / SECONDS_PER_HOUR)
    }
    return map
  }, [frames, weapons])
}

function NewTimer() {
  const { update } = useProgress()
  const buildTimes = useBuildTimes()
  const [name, setName] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const pick = (value: string, h?: number) => {
    setName(value)
    const known = h ?? buildTimes.get(value)
    if (known !== undefined) {
      setHours(String(Math.floor(known)))
      setMinutes(String(Math.round((known % 1) * 60)))
    }
  }

  const start = () => {
    const duration = parseDuration(hours, minutes)
    if (!name.trim()) return setError('Напиши, что строится.')
    if (duration === null) return setError('Укажи, сколько осталось: часы и/или минуты.')
    setError(null)
    update((s) => addTimer(s, name, duration, Date.now()))
    setName('')
    setHours('')
    setMinutes('')
  }

  return (
    <Orokin>
      <h2 style={{ marginBottom: 6 }}>Новый таймер</h2>
      <p className="small muted" style={{ marginTop: 0 }}>Выбери фрейм или оружие - время подставится само. Если крафт уже идёт, впиши, сколько осталось.</p>
      <div className="chips" style={{ marginBottom: 14 }}>
        {FOUNDRY_PRESETS.map((p) => (
          <button key={p.name} className="chip" onClick={() => pick(p.name, p.hours)}>{p.name} · {p.hours} ч</button>
        ))}
      </div>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <label style={{ flex: 1, minWidth: 240 }}>
          <span className="meta-label">Что строится</span>
          <input className="input" list="foundry-items" value={name} onChange={(e) => pick(e.target.value)} placeholder="Например, Сарина Прайм" />
          <datalist id="foundry-items">
            {[...buildTimes.keys()].map((n) => <option key={n} value={n} />)}
          </datalist>
        </label>
        <label style={{ width: 90 }}>
          <span className="meta-label">Часы</span>
          <input className="input num" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" />
        </label>
        <label style={{ width: 90 }}>
          <span className="meta-label">Минуты</span>
          <input className="input num" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" />
        </label>
        <button className="btn btn--gold" onClick={start}><Icon name="plus" size={16} />Запустить</button>
      </div>
      {error && <p className="small" style={{ color: 'var(--kuva)', marginBottom: 0 }}>{error}</p>}
    </Orokin>
  )
}

export function TimerList({ compact = false }: { compact?: boolean }) {
  const { progress, update } = useProgress()
  const now = useNow()
  const timers = [...progress.timers].sort((a, b) => a.endsAt - b.endsAt)
  if (timers.length === 0) {
    return compact ? <p className="small faint">Таймеров нет</p> : <EmptyState title="Ничего не строится">Добавь таймер выше - приложение напомнит, когда крафт будет готов.</EmptyState>
  }
  return (
    <div className="stack" style={{ gap: compact ? 4 : 8 }}>
      {timers.map((t) => {
        const left = t.endsAt - now
        const done = left <= 0
        return (
          <div key={t.id} className="list-row" style={{ gridTemplateColumns: '1fr auto auto', padding: compact ? '6px 10px' : undefined }}>
            <span>{t.name}</span>
            {done ? <span className="tag tag--lotus">Готово</span> : <span className="num muted">{formatCountdown(left)}</span>}
            <button className="btn btn--ghost" onClick={() => update((s) => removeTimer(s, t.id))} aria-label={done ? `Забрал ${t.name}` : `Удалить таймер ${t.name}`} title={done ? 'Забрал' : 'Удалить'}>
              <Icon name={done ? 'check' : 'trash'} size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function Foundry() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Литейная</h1>
          <p>Таймеры крафта. Когда что-то будет готово, придёт уведомление Windows, если приложение запущено (можно свернуть).</p>
        </div>
      </div>
      <NewTimer />
      <section className="section">
        <h2 style={{ marginBottom: 14 }}>В работе</h2>
        <TimerList />
      </section>
    </div>
  )
}
