import type { Cycle, WorldState } from '../lib/types'
import { cycleRu } from '../lib/i18n'
import { formatCountdown } from '../lib/time'
import { rollCycle, type RolledCycle } from '../lib/cycles'

interface CycleDef {
  key: keyof Pick<WorldState, 'cetusCycle' | 'vallisCycle' | 'cambionCycle' | 'zarimanCycle' | 'duviriCycle'>
  place: string
  // состояния, которые подсвечиваем (ночь = эйдолоны)
  alt: string[]
  why: Record<string, string>
}

export const CYCLES: CycleDef[] = [
  { key: 'cetusCycle', place: 'Равнины Эйдолона', alt: ['night'], why: { night: 'Эйдолоны и редкая рыба', day: 'Рыбалка и задания' } },
  { key: 'vallisCycle', place: 'Орб Валлис', alt: ['cold'], why: { cold: 'Лучшая рыба и токсины', warm: 'Кустарники и животные' } },
  { key: 'cambionCycle', place: 'Камбионский дрейф', alt: ['vome'], why: { fass: 'Задания Фасса', vome: 'Задания Воума' } },
  { key: 'zarimanCycle', place: 'Заримань', alt: ['corpus'], why: { corpus: 'Против Корпуса', grineer: 'Против Гринир' } },
  { key: 'duviriCycle', place: 'Дувири', alt: ['fear', 'sorrow'], why: {} },
]

const FALLBACK_SPAN_MS = 60 * 60_000

function progressOf(cycle: Cycle, rolled: RolledCycle, now: number): number {
  const end = rolled.expiry
  const start = rolled.startedAt ?? (cycle.activation ? new Date(cycle.activation).getTime() : end - FALLBACK_SPAN_MS)
  const span = Math.max(1, end - start)
  return Math.min(100, Math.max(0, ((now - start) / span) * 100))
}

export function CycleStrip({ world, now }: { world: WorldState; now: number }) {
  return (
    <div className="cycles" role="list">
      {CYCLES.map((def) => {
        const cycle = world[def.key]
        if (!cycle) return null
        const rolled = rollCycle(def.key, cycle, now)
        const state = rolled.state
        const isAlt = def.alt.includes(state)
        const left = rolled.expiry - now
        return (
          <div key={def.key} className="cycle" role="listitem">
            <span className="cycle__place">{def.place}</span>
            <span className={`cycle__state ${isAlt ? 'cycle__state--alt' : ''}`}>{cycleRu(state)}</span>
            <span className="cycle__left num">ещё {formatCountdown(left)}</span>
            <div className={`bar ${isAlt ? 'bar--lotus' : ''}`}>
              <i style={{ width: `${progressOf(cycle, rolled, now)}%` }} />
            </div>
            {def.why[state] && <span className="small faint" style={{ marginTop: 6 }}>{def.why[state]}</span>}
          </div>
        )
      })}
    </div>
  )
}
