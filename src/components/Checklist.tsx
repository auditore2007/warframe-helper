import { CHECKLIST, type ChecklistPeriod } from '../data/checklist'
import { useProgress } from '../state/AppState'
import { toggleTask } from '../lib/progress'
import { formatCountdown, nextDailyReset, nextWeeklyReset } from '../lib/time'
import { Check } from './ui'

const TITLES: Record<ChecklistPeriod, string> = { daily: 'Каждый день', weekly: 'Каждую неделю' }

export function Checklist({ now }: { now: number }) {
  const { progress, update } = useProgress()
  const resets: Record<ChecklistPeriod, number> = { daily: nextDailyReset(now), weekly: nextWeeklyReset(now) }

  return (
    <div className="grid grid--2" style={{ gap: 28 }}>
      {(['daily', 'weekly'] as const).map((period) => {
        const tasks = CHECKLIST.filter((t) => t.period === period)
        const done = tasks.filter((t) => progress.checklist.done[t.id]).length
        return (
          <div key={period}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <h3>{TITLES[period]}</h3>
              <span className="small muted num">{done} из {tasks.length}</span>
            </div>
            <div className="small faint" style={{ marginBottom: 6 }}>Сброс через {formatCountdown(resets[period] - now)}</div>
            {tasks.map((t) => (
              <Check
                key={t.id}
                checked={Boolean(progress.checklist.done[t.id])}
                onChange={() => update((s) => toggleTask(s, t.id))}
                title={t.title}
                hint={t.why}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
